const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    symptomText: { type: String, required: true },
    possibleCauses: [{ type: String }],
    urgencyLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'emergency'],
      required: true,
    },
    selfCareTips: [{ type: String }],
    precautions: [{ type: String }],
    recommendedSpecialization: { type: String, required: true },
    disclaimer: { type: String, required: true },
    rawModelResponse: { type: mongoose.Schema.Types.Mixed },
    linkedAppointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ recommendedSpecialization: 1 });
aiAnalysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
