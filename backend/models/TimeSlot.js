const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    date: { type: Date, required: true }, // date only (midnight normalized)
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "09:30"
    isBooked: { type: Boolean, default: false },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  },
  { timestamps: true }
);

timeSlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
