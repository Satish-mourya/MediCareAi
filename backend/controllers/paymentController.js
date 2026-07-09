const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get logged-in patient's payment history
// @route   GET /api/payments/my
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ patient: req.user._id })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .populate('appointment', 'date startTime status')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { payments }));
});

module.exports = { getMyPayments };
