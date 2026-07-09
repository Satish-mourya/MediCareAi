const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const {
  registerPatient,
  registerDoctor,
  login,
  getMe,
  logout,
  updatePassword,
} = require('../controllers/authController');

const router = express.Router();

const VALID_SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician',
  'Orthopedic', 'Gynecologist', 'ENT Specialist', 'Psychiatrist', 'Gastroenterologist',
  'Pulmonologist', 'Endocrinologist', 'Ophthalmologist', 'Dentist', 'Urologist',
  'Oncologist', 'Nephrologist', 'Rheumatologist',
];

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  registerPatient
);

router.post(
  '/register-doctor',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('specialization')
      .isIn(VALID_SPECIALIZATIONS)
      .withMessage('Please select a valid specialization'),
    body('licenseNumber').trim().notEmpty().withMessage('Medical license number is required'),
    body('experienceYears').isInt({ min: 0 }).withMessage('Experience years must be a non-negative number'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a non-negative number'),
    body('hospitalName').trim().notEmpty().withMessage('Hospital/clinic name is required'),
  ],
  validate,
  registerDoctor
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  login
);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put(
  '/update-password',
  protect,
  [body('newPassword').isLength({ min: 6 })],
  validate,
  updatePassword
);

module.exports = router;

