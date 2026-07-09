const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const MedicalHistory = require('../models/MedicalHistory');
const { createOrder, verifyPaymentSignature } = require('../services/razorpayService');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Initiate a booking: locks the slot, creates a pending appointment + Razorpay order
// @route   POST /api/appointments
// body: { doctorId, slotId, reasonForVisit, aiAnalysisId }
const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, slotId, reasonForVisit, aiAnalysisId } = req.body;

  const doctor = await Doctor.findById(doctorId).populate('user', 'name');
  if (!doctor || doctor.status !== 'approved') throw new ApiError(404, 'Doctor not available');

  const slot = await TimeSlot.findById(slotId);
  if (!slot || slot.isBooked) throw new ApiError(409, 'This time slot is no longer available');

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctor._id,
    timeSlot: slot._id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    reasonForVisit,
    aiAnalysis: aiAnalysisId || undefined,
    status: 'pending_payment',
  });

  slot.isBooked = true;
  slot.appointment = appointment._id;
  await slot.save();

  const order = await createOrder({
    appointmentId: appointment._id,
    fee: doctor.consultationFee,
  });

  const payment = await Payment.create({
    patient: req.user._id,
    doctor: doctor._id,
    appointment: appointment._id,
    amount: doctor.consultationFee,
    razorpayOrderId: order.id,
    status: 'created',
  });

  appointment.payment = payment._id;
  await appointment.save();

  // Frontend uses these to open the Razorpay Checkout widget client-side
  res.status(201).json(
    new ApiResponse(
      201,
      {
        appointment,
        razorpayOrderId: order.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        doctorName: doctor.user.name,
        patientName: req.user.name,
        patientEmail: req.user.email,
        patientPhone: req.user.phone,
      },
      'Proceed to payment'
    )
  );
});

// @desc    Verify Razorpay payment signature after the Checkout widget succeeds, then confirm appointment
// @route   POST /api/appointments/:id/verify-payment
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const appointment = await Appointment.findById(req.params.id).populate('doctor');
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.patient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    await Payment.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
    throw new ApiError(400, 'Payment verification failed. Signature mismatch.');
  }

  appointment.status = 'confirmed';
  await appointment.save();

  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      status: 'succeeded',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    }
  );

  await Doctor.findByIdAndUpdate(appointment.doctor._id, { $inc: { totalAppointments: 1 } });

  await Notification.create({
    user: appointment.doctor.user,
    title: 'New Appointment Booked',
    message: `A new appointment has been confirmed for ${appointment.date.toDateString()} at ${appointment.startTime}`,
    type: 'appointment',
  });

  res.status(200).json(new ApiResponse(200, { appointment }, 'Payment verified, appointment confirmed'));
});

// @desc    Get logged-in patient's appointments (upcoming/history split via query)
// @route   GET /api/appointments/my?status=upcoming|history
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { patient: req.user._id };

  if (status === 'upcoming') {
    filter.date = { $gte: new Date().setHours(0, 0, 0, 0) };
    filter.status = { $in: ['confirmed', 'pending_payment'] };
  } else if (status === 'history') {
    filter.status = { $in: ['completed', 'cancelled', 'no_show'] };
  }

  const appointments = await Appointment.find(filter)
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
    .populate('payment')
    .sort({ date: -1 });

  res.status(200).json(new ApiResponse(200, { appointments }));
});

// @desc    Get logged-in doctor's appointments
// @route   GET /api/appointments/doctor?date=2026-07-10&status=confirmed
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const filter = { doctor: doctor._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) {
    const start = new Date(req.query.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(req.query.date);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name avatar phone gender dateOfBirth')
    .sort({ date: 1, startTime: 1 });

  res.status(200).json(new ApiResponse(200, { appointments }));
});

// @desc    Get single appointment detail (patient, doctor, or admin)
// @route   GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
    .populate('patient', 'name avatar phone gender dateOfBirth')
    .populate('aiAnalysis')
    .populate('payment');

  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const isOwnerPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isOwnerDoctor = appointment.doctor.user._id.toString() === req.user._id.toString();
  if (!isOwnerPatient && !isOwnerDoctor && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this appointment');
  }

  res.status(200).json(new ApiResponse(200, { appointment }));
});

// @desc    Cancel an appointment (patient or doctor)
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('doctor');
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (['completed', 'cancelled'].includes(appointment.status)) {
    throw new ApiError(400, `Cannot cancel an appointment that is already ${appointment.status}`);
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = reason;
  appointment.cancelledBy = req.user.role;
  await appointment.save();

  await TimeSlot.findByIdAndUpdate(appointment.timeSlot, { isBooked: false, appointment: null });

  const notifyUserId =
    req.user.role === 'patient' ? appointment.doctor.user : appointment.patient;
  await Notification.create({
    user: notifyUserId,
    title: 'Appointment Cancelled',
    message: `The appointment on ${appointment.date.toDateString()} at ${appointment.startTime} was cancelled. Reason: ${reason || 'Not specified'}`,
    type: 'appointment',
  });

  res.status(200).json(new ApiResponse(200, { appointment }, 'Appointment cancelled'));
});

// @desc    Doctor marks appointment completed and adds consultation notes
// @route   PUT /api/appointments/:id/complete
const completeAppointment = asyncHandler(async (req, res) => {
  const { diagnosis, prescription, notes, followUpDate } = req.body;
  const doctor = await Doctor.findOne({ user: req.user._id });
  const appointment = await Appointment.findOne({ _id: req.params.id, doctor: doctor._id });

  if (!appointment) throw new ApiError(404, 'Appointment not found');

  appointment.status = 'completed';
  appointment.consultationNotes = { diagnosis, prescription, notes, followUpDate, addedAt: new Date() };
  await appointment.save();

  await MedicalHistory.create({
    patient: appointment.patient,
    appointment: appointment._id,
    doctor: doctor._id,
    diagnosis,
    prescription,
    notes,
  });

  res.status(200).json(new ApiResponse(200, { appointment }, 'Appointment marked as completed'));
});

module.exports = {
  createAppointment,
  verifyPayment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointmentById,
  cancelAppointment,
  completeAppointment,
};
