const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const TimeSlot = require('../models/TimeSlot');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get all approved doctors, optionally filtered by specialization/search
// @route   GET /api/doctors?specialization=Cardiologist&search=heart&page=1&limit=12
const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, page = 1, limit = 12, sortBy = 'ratingAverage' } = req.query;

  const filter = { status: 'approved' };
  if (specialization) filter.specialization = specialization;

  let query = Doctor.find(filter).populate('user', 'name avatar');

  if (search) {
    const users = await require('../models/User').find({
      name: { $regex: search, $options: 'i' },
    }).select('_id');
    query = Doctor.find({
      ...filter,
      $or: [{ user: { $in: users.map((u) => u._id) } }, { specialization: { $regex: search, $options: 'i' } }],
    }).populate('user', 'name avatar');
  }

  const total = await Doctor.countDocuments(filter);
  const doctors = await query
    .sort({ [sortBy]: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json(
    new ApiResponse(200, {
      doctors,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    })
  );
});

// @desc    Get single doctor's full public profile with reviews
// @route   GET /api/doctors/:id
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'name avatar phone');
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const reviews = await Review.find({ doctor: doctor._id })
    .populate('patient', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json(new ApiResponse(200, { doctor, reviews }));
});

// Default 5 initial 1-hour slots ready for every working day (Mon-Sat)
const DEFAULT_1HR_SLOTS = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
];

// @desc    Get available time slots for a doctor (auto-initializes 5 1-hr slots for Mon-Sat)
// @route   GET /api/doctors/:id/slots?date=2026-07-10&all=true
const getDoctorSlots = asyncHandler(async (req, res) => {
  const { date, all } = req.query;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const isSunday = start.getDay() === 0;
    const isHoliday = (doctor.holidays || []).some(
      (h) => new Date(h).toDateString() === start.toDateString()
    );

    // If it's Sunday, doctor is closed
    if (isSunday) {
      return res.status(200).json(
        new ApiResponse(200, { slots: [], isSunday: true }, 'Clinic closed on Sundays')
      );
    }

    // If marked as holiday
    if (isHoliday) {
      return res.status(200).json(
        new ApiResponse(200, { slots: [], isHoliday: true }, 'Doctor is on leave on this date')
      );
    }

    // Check if slots already exist for this date
    const existingCount = await TimeSlot.countDocuments({
      doctor: doctor._id,
      date: { $gte: start, $lte: end },
    });

    // Auto-initialize 5 1-hour slots if none exist yet for this working day
    if (existingCount === 0) {
      const initialSlots = DEFAULT_1HR_SLOTS.map((s) => ({
        doctor: doctor._id,
        date: start,
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: false,
      }));

      try {
        await TimeSlot.insertMany(initialSlots, { ordered: false });
      } catch (err) {
        // Ignore duplicate key race conditions
      }
    }

    const filter = {
      doctor: doctor._id,
      date: { $gte: start, $lte: end },
    };
    if (all !== 'true') {
      filter.isBooked = false;
    }

    const slots = await TimeSlot.find(filter).sort({ startTime: 1 });
    return res.status(200).json(new ApiResponse(200, { slots, isSunday: false }));
  }

  const filter = { doctor: doctor._id, isBooked: false, date: { $gte: new Date() } };
  const slots = await TimeSlot.find(filter).sort({ date: 1, startTime: 1 });
  res.status(200).json(new ApiResponse(200, { slots }));
});

// @desc    Get/Update logged-in doctor's own profile
// @route   GET/PUT /api/doctors/me/profile
const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email avatar phone');
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  res.status(200).json(new ApiResponse(200, { doctor }));
});

const updateMyDoctorProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'qualifications', 'experienceYears', 'consultationFee', 'hospital',
    'about', 'languages',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const doctor = await Doctor.findOneAndUpdate({ user: req.user._id }, updates, {
    new: true,
    runValidators: true,
  });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  res.status(200).json(new ApiResponse(200, { doctor }, 'Profile updated'));
});

// @desc    Doctor manually creates time slots (single or bulk-generated from a range)
// @route   POST /api/doctors/me/slots
// body: { date, startTime, endTime, slotDurationMinutes }  -> auto-splits range into slots
const createSlots = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const { date, startTime, endTime, slotDurationMinutes = 30 } = req.body;
  if (!date || !startTime || !endTime) {
    throw new ApiError(400, 'date, startTime and endTime are required');
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Check holiday
  const isHoliday = doctor.holidays.some(
    (h) => new Date(h).toDateString() === normalizedDate.toDateString()
  );
  if (isHoliday) throw new ApiError(400, 'This date is marked as a holiday');

  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const toTimeStr = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const startMins = toMinutes(startTime);
  const endMins = toMinutes(endTime);
  if (startMins >= endMins) throw new ApiError(400, 'endTime must be after startTime');

  const slotsToCreate = [];
  for (let t = startMins; t + slotDurationMinutes <= endMins; t += slotDurationMinutes) {
    slotsToCreate.push({
      doctor: doctor._id,
      date: normalizedDate,
      startTime: toTimeStr(t),
      endTime: toTimeStr(t + slotDurationMinutes),
    });
  }

  // Insert ignoring duplicates (unique index on doctor+date+startTime)
  const created = [];
  for (const slot of slotsToCreate) {
    try {
      const doc = await TimeSlot.create(slot);
      created.push(doc);
    } catch (err) {
      if (err.code !== 11000) throw err; // ignore duplicate slot conflicts
    }
  }

  res.status(201).json(new ApiResponse(201, { created }, `${created.length} slot(s) created`));
});

// @desc    Delete an unbooked slot
// @route   DELETE /api/doctors/me/slots/:slotId
const deleteSlot = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  const slot = await TimeSlot.findOne({ _id: req.params.slotId, doctor: doctor._id });
  if (!slot) throw new ApiError(404, 'Slot not found');
  if (slot.isBooked) throw new ApiError(400, 'Cannot delete a booked slot. Cancel the appointment instead.');

  await slot.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Slot deleted'));
});

// @desc    Update an existing unbooked slot's timing
// @route   PUT /api/doctors/me/slots/:slotId
// body: { startTime, endTime }
const updateSlot = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const { startTime, endTime } = req.body;
  if (!startTime || !endTime) {
    throw new ApiError(400, 'Both startTime and endTime are required');
  }

  const slot = await TimeSlot.findOne({ _id: req.params.slotId, doctor: doctor._id });
  if (!slot) throw new ApiError(404, 'Slot not found');
  if (slot.isBooked) {
    throw new ApiError(400, 'Cannot edit an already booked slot');
  }

  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    throw new ApiError(400, 'endTime must be after startTime');
  }

  // Check collision with another slot on the same date
  const collision = await TimeSlot.findOne({
    doctor: doctor._id,
    date: slot.date,
    startTime,
    _id: { $ne: slot._id },
  });
  if (collision) {
    throw new ApiError(409, `A slot starting at ${startTime} already exists on this date`);
  }

  slot.startTime = startTime;
  slot.endTime = endTime;
  await slot.save();

  res.status(200).json(new ApiResponse(200, { slot }, 'Slot updated successfully'));
});

// @desc    Mark a holiday (removes future unbooked slots on that date)
// @route   POST /api/doctors/me/holidays
const addHoliday = asyncHandler(async (req, res) => {
  const { date } = req.body;
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  doctor.holidays.push(normalizedDate);
  await doctor.save();

  const dayStart = new Date(normalizedDate);
  const dayEnd = new Date(normalizedDate);
  dayEnd.setHours(23, 59, 59, 999);

  await TimeSlot.deleteMany({
    doctor: doctor._id,
    date: { $gte: dayStart, $lte: dayEnd },
    isBooked: false,
  });

  res.status(200).json(new ApiResponse(200, { doctor }, 'Holiday marked and open slots cleared'));
});

// @desc    Set recurring weekly schedule template
// @route   PUT /api/doctors/me/recurring-schedule
const setRecurringSchedule = asyncHandler(async (req, res) => {
  const { recurringSchedule } = req.body;
  const doctor = await Doctor.findOneAndUpdate(
    { user: req.user._id },
    { recurringSchedule },
    { new: true, runValidators: true }
  );
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  res.status(200).json(new ApiResponse(200, { doctor }, 'Recurring schedule updated'));
});

// @desc    Get all distinct specializations that currently have approved doctors
// @route   GET /api/doctors/specializations/list
const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization', { status: 'approved' });
  res.status(200).json(new ApiResponse(200, { specializations }));
});

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  createSlots,
  updateSlot,
  deleteSlot,
  addHoliday,
  setRecurringSchedule,
  getSpecializations,
};
