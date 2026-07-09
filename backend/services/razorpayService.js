const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a Razorpay Order for a doctor consultation payment.
 * Razorpay's Checkout widget (loaded client-side) opens against this order id.
 * Amount must be in the smallest currency unit (paise for INR).
 */
async function createOrder({ appointmentId, fee }) {
  const order = await razorpay.orders.create({
    amount: Math.round(fee * 100), // paise
    currency: 'INR',
    receipt: `appt_${appointmentId}`,
    notes: { appointmentId: appointmentId.toString() },
  });
  return order;
}

/**
 * Verifies the signature Razorpay's Checkout widget returns after a successful
 * payment, using HMAC-SHA256 with the key secret. This MUST be done server-side
 * before trusting that a payment actually succeeded - never trust the client alone.
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verifies the signature on an incoming Razorpay webhook payload (optional,
 * used only if you configure a webhook URL in the Razorpay dashboard for
 * extra server-to-server confirmation in addition to client-side verification).
 */
function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

module.exports = { razorpay, createOrder, verifyPaymentSignature, verifyWebhookSignature };
