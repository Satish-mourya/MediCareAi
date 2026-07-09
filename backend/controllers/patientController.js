const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');
const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const Notification = require('../models/Notification');
const AIAnalysis = require('../models/AIAnalysis');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get own patient profile (merged user + patient details)
// @route   GET /api/patients/me
const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate(
    'user',
    'name email phone avatar gender dateOfBirth'
  );
  if (!patient) throw new ApiError(404, 'Patient profile not found');
  res.status(200).json(new ApiResponse(200, { patient }));
});

// @desc    Update own patient profile + linked user fields
// @route   PUT /api/patients/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, bloodGroup, height, weight, allergies, chronicConditions, emergencyContact, address } =
    req.body;

  if (name || phone || avatar) {
    await User.findByIdAndUpdate(req.user._id, {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(avatar && { avatar }),
    });
  }

  const patient = await Patient.findOneAndUpdate(
    { user: req.user._id },
    { bloodGroup, height, weight, allergies, chronicConditions, emergencyContact, address },
    { new: true, runValidators: true }
  ).populate('user', 'name email phone avatar gender dateOfBirth');

  res.status(200).json(new ApiResponse(200, { patient }, 'Profile updated'));
});

// @desc    Get patient's medical history timeline
// @route   GET /api/patients/me/medical-history
const getMedicalHistory = asyncHandler(async (req, res) => {
  const history = await MedicalHistory.find({ patient: req.user._id })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .sort({ recordDate: -1 });
  res.status(200).json(new ApiResponse(200, { history }));
});

// @desc    Get patient's past AI symptom-check analyses
// @route   GET /api/patients/me/ai-history
const getAIHistory = asyncHandler(async (req, res) => {
  const history = await AIAnalysis.find({ patient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.status(200).json(new ApiResponse(200, { history }));
});

// @desc    Get notifications for logged-in user (any role)
// @route   GET /api/patients/me/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.status(200).json(new ApiResponse(200, { notifications }));
});

// @desc    Mark notification(s) as read
// @route   PUT /api/patients/me/notifications/read
const markNotificationsRead = asyncHandler(async (req, res) => {
  const { ids } = req.body; // array of notification ids, or omit to mark all
  const filter = { user: req.user._id };
  if (ids && ids.length) filter._id = { $in: ids };

  await Notification.updateMany(filter, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, 'Notifications marked as read'));
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMedicalHistory,
  getAIHistory,
  getNotifications,
  markNotificationsRead,
};
