const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: {
      type: String,
      required: true,
      enum: [
        'General Physician',
        'Cardiologist',
        'Dermatologist',
        'Neurologist',
        'Pediatrician',
        'Orthopedic',
        'Gynecologist',
        'ENT Specialist',
        'Psychiatrist',
        'Gastroenterologist',
        'Pulmonologist',
        'Endocrinologist',
        'Ophthalmologist',
        'Dentist',
        'Urologist',
        'Oncologist',
        'Nephrologist',
        'Rheumatologist',
      ],
      index: true,
    },
    qualifications: [{ type: String, trim: true }], // e.g. ["MBBS", "MD (Medicine)"]
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    hospital: {
      name: { type: String, required: true },
      address: { type: String },
      city: { type: String },
    },
    about: { type: String, maxlength: 2000 },
    licenseNumber: { type: String, required: true },
    languages: [{ type: String }],
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    // Recurring weekly availability template, e.g. Mon-Fri 9-5 in 30 min slots
    recurringSchedule: [
      {
        day: {
          type: String,
          enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        startTime: String, // "09:00"
        endTime: String, // "17:00"
        slotDurationMinutes: { type: Number, default: 30 },
        isActive: { type: Boolean, default: true },
      },
    ],
    holidays: [{ type: Date }], // dates doctor is unavailable
  },
  { timestamps: true }
);

doctorSchema.index({ specialization: 1, status: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
