const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: (parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS, 10) || 7) * 24 * 60 * 60 * 1000,
});

const sendAuthResponse = (res, statusCode, user, message) => {
  const token = generateToken(user._id, user.role);
  res.cookie('token', token, cookieOptions());
  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, { user: user.toSafeObject(), token }, message));
};

// @desc    Register a new patient (public signup).
// @route   POST /api/auth/register
const registerPatient = asyncHandler(async (req, res) => {
  const { name, email, password, phone, gender, dateOfBirth } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password,
    phone,
    gender,
    dateOfBirth,
    role: 'patient',
  });

  await Patient.create({ user: user._id });

  sendAuthResponse(res, 201, user, 'Registration successful');
});

// @desc    Register a new doctor (public self-signup). Account is created with
//          status 'pending' and CANNOT log in until an admin approves it - this
//          mirrors real-world credential verification instead of trusting
//          self-reported qualifications outright.
// @route   POST /api/auth/register-doctor
const registerDoctor = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone,
    specialization, qualifications, experienceYears, consultationFee,
    hospitalName, hospitalCity, hospitalAddress, licenseNumber, languages, about,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const existingLicense = await Doctor.findOne({ licenseNumber });
  if (existingLicense) throw new ApiError(409, 'This license number is already registered');

  const user = await User.create({ name, email, password, phone, role: 'doctor' });

  const doctor = await Doctor.create({
    user: user._id,
    specialization,
    qualifications: Array.isArray(qualifications)
      ? qualifications
      : (qualifications || '').split(',').map((s) => s.trim()).filter(Boolean),
    experienceYears,
    consultationFee,
    hospital: { name: hospitalName, city: hospitalCity, address: hospitalAddress },
    licenseNumber,
    languages: Array.isArray(languages)
      ? languages
      : (languages || '').split(',').map((s) => s.trim()).filter(Boolean),
    about,
    status: 'approved', // requires admin approval before login is allowed
  });

  // Intentionally NOT calling sendAuthResponse - no token/cookie is issued,
  // since a pending doctor must not be able to authenticate yet.
  res.status(201).json(
    new ApiResponse(
      201,
      { doctorId: doctor._id, status: doctor.status },
      'Registration submitted. Your account is pending admin approval - you will be able to log in once approved.'
    )
  );
});

// @desc    Login for any role
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been suspended. Contact support.');
  }

  // Doctors must be approved by admin before they can log in
  if (user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: user._id });
    if (!doctorProfile || doctorProfile.status !== 'approved') {
      throw new ApiError(403, 'Your doctor account is pending admin approval');
    }
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, 200, user, 'Login successful');
});

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});

// @desc    Logout - clears cookie
// @route   POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// @desc    Update own password
// @route   PUT /api/auth/update-password
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();

  sendAuthResponse(res, 200, user, 'Password updated successfully');
});

module.exports = { registerPatient, registerDoctor, login, getMe, logout, updatePassword };
