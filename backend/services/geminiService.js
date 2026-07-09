const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VALID_SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician',
  'Orthopedic', 'Gynecologist', 'ENT Specialist', 'Psychiatrist', 'Gastroenterologist',
  'Pulmonologist', 'Endocrinologist', 'Ophthalmologist', 'Dentist', 'Urologist',
  'Oncologist', 'Nephrologist', 'Rheumatologist',
];

const DISCLAIMER =
  'This AI-generated information is for educational purposes only and is NOT a medical diagnosis. ' +
  'Always consult a licensed healthcare professional for accurate diagnosis and treatment. ' +
  'If you are experiencing a medical emergency, call your local emergency number immediately.';

/**
 * Extracts the first valid JSON object from a raw model response string.
 * Gemini is instructed to return pure JSON, but this guards against
 * accidental markdown fences or stray text.
 */
function extractJson(rawText) {
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('Model did not return a parseable JSON object');
  }
  const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}

/**
 * Analyzes patient-described symptoms and returns a strictly structured object.
 * Never provides a definitive diagnosis - only possibilities, urgency, and guidance.
 */
async function analyzeSymptoms(symptomText) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
You are a clinical triage assistant embedded in a hospital appointment booking platform.
A patient has described their symptoms in natural language. Analyze the text and respond
ONLY with a single valid JSON object (no markdown, no commentary, no code fences) matching
EXACTLY this schema:

{
  "possibleCauses": ["string", "..."],       // 3-6 plausible, non-definitive possible causes
  "urgencyLevel": "low" | "moderate" | "high" | "emergency",
  "selfCareTips": ["string", "..."],          // 2-5 safe, general self-care suggestions
  "precautions": ["string", "..."],           // 2-5 things to avoid or watch for
  "recommendedSpecialization": "string",      // MUST be exactly one of: ${VALID_SPECIALIZATIONS.join(', ')}
  "redFlagSymptoms": ["string", "..."],       // symptoms that would warrant immediate ER visit, empty array if none apply
  "summary": "string"                         // one short plain-language paragraph summarizing the analysis
}

Rules you MUST follow:
- NEVER state a definitive diagnosis. Use language like "may be related to", "possible causes include".
- If symptoms suggest a medical emergency (e.g. chest pain with shortness of breath, stroke symptoms,
  severe bleeding, suicidal ideation), set urgencyLevel to "emergency" and clearly list redFlagSymptoms.
- recommendedSpecialization must be chosen from the provided list only. Default to "General Physician"
  if uncertain.
- Keep each array item concise (under 15 words).
- Output valid JSON only. Do not include any text outside the JSON object.

Patient's described symptoms:
"""${symptomText}"""
`.trim();

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  const parsed = extractJson(rawText);

  // Enforce specialization safety - never let the model return an unlisted specialty
  if (!VALID_SPECIALIZATIONS.includes(parsed.recommendedSpecialization)) {
    parsed.recommendedSpecialization = 'General Physician';
  }
  if (!['low', 'moderate', 'high', 'emergency'].includes(parsed.urgencyLevel)) {
    parsed.urgencyLevel = 'moderate';
  }

  return {
    possibleCauses: parsed.possibleCauses || [],
    urgencyLevel: parsed.urgencyLevel,
    selfCareTips: parsed.selfCareTips || [],
    precautions: parsed.precautions || [],
    recommendedSpecialization: parsed.recommendedSpecialization,
    redFlagSymptoms: parsed.redFlagSymptoms || [],
    summary: parsed.summary || '',
    disclaimer: DISCLAIMER,
    rawModelResponse: parsed,
  };
}

/**
 * Generates a concise pre-consultation briefing for the doctor based on the
 * patient's originally submitted symptom text and prior AI analysis.
 */
async function generateDoctorSummary(symptomText, priorAnalysis = null) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
You are assisting a licensed doctor preparing for a patient consultation. Given the patient's
self-reported symptoms (and, if available, a prior AI triage analysis), produce ONLY a single
valid JSON object with EXACTLY this schema, no markdown or commentary:

{
  "possibleConditions": ["string", "..."],   // 3-6 differential possibilities, non-definitive
  "urgencyLevel": "low" | "moderate" | "high" | "emergency",
  "keySymptoms": ["string", "..."],          // extracted key symptoms/timeline from patient text
  "suggestedQuestions": ["string", "..."],   // 3-6 targeted questions the doctor could ask
  "possibleTests": ["string", "..."]         // 2-5 relevant tests/examinations to consider
}

Patient's reported symptoms:
"""${symptomText}"""

Prior AI triage analysis (may be null):
${priorAnalysis ? JSON.stringify(priorAnalysis) : 'null'}
`.trim();

  const result = await model.generateContent(prompt);
  const parsed = extractJson(result.response.text());

  return {
    possibleConditions: parsed.possibleConditions || [],
    urgencyLevel: ['low', 'moderate', 'high', 'emergency'].includes(parsed.urgencyLevel)
      ? parsed.urgencyLevel
      : 'moderate',
    keySymptoms: parsed.keySymptoms || [],
    suggestedQuestions: parsed.suggestedQuestions || [],
    possibleTests: parsed.possibleTests || [],
    generatedAt: new Date(),
  };
}

module.exports = { analyzeSymptoms, generateDoctorSummary, DISCLAIMER, VALID_SPECIALIZATIONS };
