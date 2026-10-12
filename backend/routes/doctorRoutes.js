const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  createSlots,
  updateSlot,
  deleteSlot,
  addHoliday,
  setRecurringSchedule,
  getSpecializations,
} = require('../controllers/doctorController');

const router = express.Router();

// Doctor self-management (must precede /:id routes to avoid collision)
router.get('/me/profile', protect, authorize('doctor'), getMyDoctorProfile);
router.put('/me/profile', protect, authorize('doctor'), updateMyDoctorProfile);
router.post('/me/slots', protect, authorize('doctor'), createSlots);
router.put('/me/slots/:slotId', protect, authorize('doctor'), updateSlot);
router.delete('/me/slots/:slotId', protect, authorize('doctor'), deleteSlot);
router.post('/me/holidays', protect, authorize('doctor'), addHoliday);
router.put('/me/recurring-schedule', protect, authorize('doctor'), setRecurringSchedule);

// Public
router.get('/specializations/list', getSpecializations);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

module.exports = router;
