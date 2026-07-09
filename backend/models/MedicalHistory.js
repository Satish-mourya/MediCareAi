const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    diagnosis: { type: String },
    prescription: { type: String },
    notes: { type: String },
    attachments: [{ url: String, name: String }],
    recordDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
