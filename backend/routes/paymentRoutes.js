const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyPayments } = require('../controllers/paymentController');

const router = express.Router();

router.get('/my', protect, authorize('patient'), getMyPayments);

module.exports = router;
