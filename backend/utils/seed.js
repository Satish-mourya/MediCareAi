require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const sampleDoctors = [
  {
    name: 'Dr. Sarah Mitchell', specialization: 'Cardiologist', experienceYears: 12,
    consultationFee: 800, hospital: { name: 'Heartcare Clinic', city: 'Mumbai' },
    qualifications: ['MBBS', 'MD (Cardiology)'], licenseNumber: 'LIC-1001',
  },
  {
    name: 'Dr. James Okafor', specialization: 'General Physician', experienceYears: 8,
    consultationFee: 400, hospital: { name: 'City Health Center', city: 'Bengaluru' },
    qualifications: ['MBBS'], licenseNumber: 'LIC-1002',
  },
  {
    name: 'Dr. Priya Nair', specialization: 'Dermatologist', experienceYears: 10,
    consultationFee: 600, hospital: { name: 'GlowSkin Clinic', city: 'Delhi' },
    qualifications: ['MBBS', 'MD (Dermatology)'], licenseNumber: 'LIC-1003',
  },
  {
    name: 'Dr. Michael Chen', specialization: 'Neurologist', experienceYears: 15,
    consultationFee: 950, hospital: { name: 'NeuroWell Institute', city: 'Pune' },
    qualifications: ['MBBS', 'DM (Neurology)'], licenseNumber: 'LIC-1004',
  },
  {
    name: 'Dr. Emily Davis', specialization: 'Pediatrician', experienceYears: 9,
    consultationFee: 500, hospital: { name: 'Little Stars Clinic', city: 'Hyderabad' },
    qualifications: ['MBBS', 'MD (Pediatrics)'], licenseNumber: 'LIC-1005',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@medicare.ai';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    });
    console.log(`Admin created: ${adminEmail}`);
  }

  for (const d of sampleDoctors) {
    const email = d.name.toLowerCase().replace(/[^a-z]/g, '.') + '@medicare.ai';
    const existing = await User.findOne({ email });
    if (existing) continue;

    const user = await User.create({ name: d.name, email, password: 'Doctor@12345', role: 'doctor' });
    await Doctor.create({
      user: user._id,
      specialization: d.specialization,
      qualifications: d.qualifications,
      experienceYears: d.experienceYears,
      consultationFee: d.consultationFee,
      hospital: d.hospital,
      licenseNumber: d.licenseNumber,
      status: 'approved',
      about: `${d.name} is a board-certified ${d.specialization} with ${d.experienceYears} years of experience.`,
    });
    console.log(`Doctor seeded: ${email}`);
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
