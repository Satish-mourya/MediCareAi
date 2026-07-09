const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const AIAnalysis = require('../models/AIAnalysis');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ---------- DOCTOR MANAGEMENT ----------

// @desc    Admin creates a new doctor account directly
// @route   POST /api/admin/doctors
const createDoctor = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone,
    specialization, qualifications, experienceYears, consultationFee,
    hospital, about, licenseNumber, languages,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const user = await User.create({ name, email, password, phone, role: 'doctor' });
  const doctor = await Doctor.create({
    user: user._id,
    specialization,
    qualifications,
    experienceYears,
    consultationFee,
    hospital,
    about,
    licenseNumber,
    languages,
    status: 'approved', // admin-created doctors are auto-approved
  });

  res.status(201).json(new ApiResponse(201, { doctor }, 'Doctor account created'));
});

// @desc    List all doctors (any status) with filters
// @route   GET /api/admin/doctors?status=pending
const getAllDoctors = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const doctors = await Doctor.find(filter).populate('user', 'name email phone isActive avatar').sort({
    createdAt: -1,
  });
  res.status(200).json(new ApiResponse(200, { doctors }));
});

// @desc    Approve / suspend / reject a doctor
// @route   PUT /api/admin/doctors/:id/status
// body: { status: 'approved' | 'suspended' | 'rejected' }
const updateDoctorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'suspended', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate(
    'user',
    'name email'
  );
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  await Notification.create({
    user: doctor.user._id,
    title: 'Account Status Updated',
    message: `Your doctor account status has been changed to "${status}" by the admin.`,
    type: 'account',
  });

  res.status(200).json(new ApiResponse(200, { doctor }, `Doctor ${status}`));
});

// @desc    Edit doctor details (admin override)
// @route   PUT /api/admin/doctors/:id
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.status(200).json(new ApiResponse(200, { doctor }, 'Doctor updated'));
});

// @desc    Remove a doctor account entirely
// @route   DELETE /api/admin/doctors/:id
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  await User.findByIdAndDelete(doctor.user);
  await doctor.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Doctor removed'));
});

// ---------- PATIENT MANAGEMENT ----------

// @desc    List all patients
// @route   GET /api/admin/patients
const getAllPatients = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'patient' }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, { patients: users }));
});

// @desc    Suspend/activate a patient account
// @route   PUT /api/admin/patients/:id/status
// body: { isActive: boolean }
const updatePatientStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'patient' },
    { isActive },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'Patient not found');

  res.status(200).json(new ApiResponse(200, { user }, `Patient ${isActive ? 'activated' : 'suspended'}`));
});

// @desc    Remove a patient account
// @route   DELETE /api/admin/patients/:id
const deletePatient = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ _id: req.params.id, role: 'patient' });
  if (!user) throw new ApiError(404, 'Patient not found');
  await Patient.findOneAndDelete({ user: user._id });
  res.status(200).json(new ApiResponse(200, null, 'Patient removed'));
});

// ---------- APPOINTMENTS & PAYMENTS OVERSIGHT ----------

// @desc    View every appointment system-wide with filters
// @route   GET /api/admin/appointments?status=confirmed&from=&to=
const getAllAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name email')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .sort({ date: -1 })
    .limit(500);

  res.status(200).json(new ApiResponse(200, { appointments }));
});

// @desc    View all payments system-wide
// @route   GET /api/admin/payments
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('patient', 'name email')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(500);
  res.status(200).json(new ApiResponse(200, { payments }));
});

// ---------- ANALYTICS ----------

// @desc    Comprehensive analytics dashboard data
// @route   GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalPatients,
    totalDoctors,
    pendingDoctors,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    revenueAgg,
    aiUsageCount,
    mostSearchedSpecializations,
    topSpecializationsBooked,
    doctorPerformance,
    monthlyRevenue,
    appointmentsByStatus,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ status: 'approved' }),
    Doctor.countDocuments({ status: 'pending' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' }),
    Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    AIAnalysis.countDocuments(),
    AIAnalysis.aggregate([
      { $group: { _id: '$recommendedSpecialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Appointment.aggregate([
      {
        $lookup: { from: 'doctors', localField: 'doctor', foreignField: '_id', as: 'doctorInfo' },
      },
      { $unwind: '$doctorInfo' },
      { $group: { _id: '$doctorInfo.specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Doctor.find({ status: 'approved' })
      .populate('user', 'name')
      .sort({ totalAppointments: -1, ratingAverage: -1 })
      .limit(5)
      .select('specialization totalAppointments ratingAverage ratingCount user'),
    Payment.aggregate([
      { $match: { status: 'succeeded' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totals: {
        patients: totalPatients,
        doctors: totalDoctors,
        pendingDoctorApprovals: pendingDoctors,
        appointments: totalAppointments,
        completedAppointments,
        cancelledAppointments,
        revenue: revenueAgg[0]?.total || 0,
        aiAnalysesRun: aiUsageCount,
      },
      mostSearchedSymptomsSpecializations: mostSearchedSpecializations,
      mostBookedSpecializations: topSpecializationsBooked,
      topPerformingDoctors: doctorPerformance,
      monthlyRevenue,
      appointmentsByStatus,
    })
  );
});

module.exports = {
  createDoctor,
  getAllDoctors,
  updateDoctorStatus,
  updateDoctor,
  deleteDoctor,
  getAllPatients,
  updatePatientStatus,
  deletePatient,
  getAllAppointments,
  getAllPayments,
  getAnalytics,
};
