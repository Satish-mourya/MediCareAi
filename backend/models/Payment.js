const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    amount: { type: Number, required: true }, // stored in whole currency units (e.g. rupees), not paise
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['created', 'succeeded', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
