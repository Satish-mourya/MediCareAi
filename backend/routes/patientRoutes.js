const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  updateMyProfile,
  getMedicalHistory,
  getAIHistory,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/patientController');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('patient'), getMyProfile);
router.put('/me', authorize('patient'), updateMyProfile);
router.get('/me/medical-history', authorize('patient'), getMedicalHistory);
router.get('/me/ai-history', authorize('patient'), getAIHistory);

// Notifications available to any authenticated role
router.get('/me/notifications', getNotifications);
router.put('/me/notifications/read', markNotificationsRead);

module.exports = router;
