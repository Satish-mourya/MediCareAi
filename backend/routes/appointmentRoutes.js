const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createAppointment,
  verifyPayment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointmentById,
  cancelAppointment,
  completeAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', protect, authorize('patient'), createAppointment);
router.post('/:id/verify-payment', protect, authorize('patient'), verifyPayment);
router.get('/my', protect, authorize('patient'), getMyAppointments);
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/cancel', protect, authorize('patient', 'doctor', 'admin'), cancelAppointment);
router.put('/:id/complete', protect, authorize('doctor'), completeAppointment);

module.exports = router;
