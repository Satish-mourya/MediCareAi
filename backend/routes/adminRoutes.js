const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/doctors', createDoctor);
router.get('/doctors', getAllDoctors);
router.put('/doctors/:id/status', updateDoctorStatus);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

router.get('/patients', getAllPatients);
router.put('/patients/:id/status', updatePatientStatus);
router.delete('/patients/:id', deletePatient);

router.get('/appointments', getAllAppointments);
router.get('/payments', getAllPayments);
router.get('/analytics', getAnalytics);

module.exports = router;
