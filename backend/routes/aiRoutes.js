const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSymptoms, getDoctorSummary } = require('../controllers/aiController');

const router = express.Router();

router.post('/symptom-check', protect, authorize('patient'), checkSymptoms);
router.get('/doctor-summary/:appointmentId', protect, authorize('doctor'), getDoctorSummary);

module.exports = router;
