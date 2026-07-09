const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Submit a review after a completed appointment
// @route   POST /api/reviews
// body: { appointmentId, rating, comment }
const createReview = asyncHandler(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.patient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  if (appointment.status !== 'completed') {
    throw new ApiError(400, 'You can only review completed appointments');
  }

  const existing = await Review.findOne({ appointment: appointmentId });
  if (existing) throw new ApiError(409, 'You have already reviewed this appointment');

  const review = await Review.create({
    doctor: appointment.doctor,
    patient: req.user._id,
    appointment: appointmentId,
    rating,
    comment,
  });

  // Recalculate doctor's rating average
  const stats = await Review.aggregate([
    { $match: { doctor: appointment.doctor } },
    { $group: { _id: '$doctor', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(appointment.doctor, {
      ratingAverage: Math.round(stats[0].avg * 10) / 10,
      ratingCount: stats[0].count,
    });
  }

  res.status(201).json(new ApiResponse(201, { review }, 'Review submitted'));
});

// @desc    Get reviews for a doctor
// @route   GET /api/reviews/doctor/:doctorId
const getDoctorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.doctorId })
    .populate('patient', 'name avatar')
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { reviews }));
});

module.exports = { createReview, getDoctorReviews };
