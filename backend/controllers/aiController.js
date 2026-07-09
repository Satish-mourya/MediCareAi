const asyncHandler = require('express-async-handler');
const AIAnalysis = require('../models/AIAnalysis');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const geminiService = require('../services/geminiService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Analyze patient symptoms via Gemini and recommend doctors
// @route   POST /api/ai/symptom-check
// @access  Private (patient)
const checkSymptoms = asyncHandler(async (req, res) => {
  const { symptomText } = req.body;
  if (!symptomText || symptomText.trim().length < 8) {
    throw new ApiError(400, 'Please describe your symptoms in a bit more detail');
  }

  const analysis = await geminiService.analyzeSymptoms(symptomText);

  const saved = await AIAnalysis.create({
    patient: req.user._id,
    symptomText,
    possibleCauses: analysis.possibleCauses,
    urgencyLevel: analysis.urgencyLevel,
    selfCareTips: analysis.selfCareTips,
    precautions: analysis.precautions,
    recommendedSpecialization: analysis.recommendedSpecialization,
    disclaimer: analysis.disclaimer,
    rawModelResponse: analysis.rawModelResponse,
  });

  // Fetch top 4 approved doctors matching the recommended specialization
  const recommendedDoctors = await Doctor.find({
    specialization: analysis.recommendedSpecialization,
    status: 'approved',
  })
    .populate('user', 'name avatar')
    .sort({ ratingAverage: -1, experienceYears: -1 })
    .limit(4);

  res.status(200).json(
    new ApiResponse(200, {
      analysisId: saved._id,
      analysis: {
        possibleCauses: analysis.possibleCauses,
        urgencyLevel: analysis.urgencyLevel,
        selfCareTips: analysis.selfCareTips,
        precautions: analysis.precautions,
        redFlagSymptoms: analysis.redFlagSymptoms,
        summary: analysis.summary,
        recommendedSpecialization: analysis.recommendedSpecialization,
        disclaimer: analysis.disclaimer,
      },
      recommendedDoctors,
    }, 'Symptom analysis complete')
  );
});

// @desc    Generate (or fetch cached) AI prep summary for doctor before consultation
// @route   GET /api/ai/doctor-summary/:appointmentId
// @access  Private (doctor - own appointment only)
const getDoctorSummary = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId).populate('doctor');

  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.doctor.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to view this appointment');
  }

  if (appointment.aiDoctorSummary && appointment.aiDoctorSummary.generatedAt) {
    return res
      .status(200)
      .json(new ApiResponse(200, { summary: appointment.aiDoctorSummary }, 'Cached AI summary'));
  }

  if (!appointment.reasonForVisit) {
    throw new ApiError(400, 'Patient has not submitted symptom details for this appointment');
  }

  let priorAnalysis = null;
  if (appointment.aiAnalysis) {
    priorAnalysis = await require('../models/AIAnalysis').findById(appointment.aiAnalysis);
  }

  const summary = await geminiService.generateDoctorSummary(appointment.reasonForVisit, priorAnalysis);

  appointment.aiDoctorSummary = summary;
  await appointment.save();

  res.status(200).json(new ApiResponse(200, { summary }, 'AI doctor summary generated'));
});

module.exports = { checkSymptoms, getDoctorSummary };
