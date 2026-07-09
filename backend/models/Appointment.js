const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending_payment',
      index: true,
    },
    reasonForVisit: { type: String, maxlength: 1000 },
    aiAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'AIAnalysis' },
    aiDoctorSummary: {
      possibleConditions: [String],
      urgencyLevel: { type: String, enum: ['low', 'moderate', 'high', 'emergency', ''] },
      keySymptoms: [String],
      suggestedQuestions: [String],
      possibleTests: [String],
      generatedAt: Date,
    },
    consultationNotes: {
      diagnosis: String,
      prescription: String,
      notes: String,
      followUpDate: Date,
      addedAt: Date,
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin', null], default: null },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
