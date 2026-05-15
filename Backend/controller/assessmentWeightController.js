const asyncHandler = require('express-async-handler');
const AssessmentWeight = require('../models/AssessmentWeight');

// GET /api/assessment-weights/:courseId
const getAssessmentWeights = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const weights = await AssessmentWeight.getAssessmentWeightsByCourse(courseId);
  res.json({ success: true, data: weights });
});

// GET /api/assessment-weights/:courseId/:assessmentType/:assessmentId
const getAssessmentWeight = asyncHandler(async (req, res) => {
  const { courseId, assessmentType, assessmentId } = req.params;
  const weight = await AssessmentWeight.getAssessmentWeight(courseId, assessmentType, assessmentId);
  if (!weight) {
    return res.status(404).json({ success: false, message: 'Assessment weight not found' });
  }
  res.json({ success: true, data: { weight } });
});

// POST /api/assessment-weights
const setAssessmentWeight = asyncHandler(async (req, res) => {
  const { courseId, assessmentType, assessmentId, weight } = req.body;
  if (!courseId || !assessmentType || !assessmentId || weight === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields: courseId, assessmentType, assessmentId, weight' });
  }

  // Validate assessment type
  const validTypes = ['assignment', 'quiz', 'midterm', 'final'];
  if (!validTypes.includes(assessmentType)) {
    return res.status(400).json({ success: false, message: 'Invalid assessment type' });
  }

  // Validate weight is a positive number
  const w = Number(weight);
  if (isNaN(w) || w < 0) {
    return res.status(400).json({ success: false, message: 'Weight must be a positive number' });
  }

  const result = await AssessmentWeight.setAssessmentWeight({ courseId, assessmentType, assessmentId, weight: w });
  if (!result) {
    return res.status(500).json({ success: false, message: 'Failed to set assessment weight' });
  }
  res.status(201).json({ success: true, data: result });
});

// DELETE /api/assessment-weights/:courseId/:assessmentType/:assessmentId
const deleteAssessmentWeight = asyncHandler(async (req, res) => {
  const { courseId, assessmentType, assessmentId } = req.params;
  if (!courseId || !assessmentType || !assessmentId) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  const result = await AssessmentWeight.deleteAssessmentWeight(courseId, assessmentType, assessmentId);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Assessment weight not found' });
  }
  res.json({ success: true, message: 'Assessment weight deleted', data: result });
});

module.exports = {
  getAssessmentWeights,
  getAssessmentWeight,
  setAssessmentWeight,
  deleteAssessmentWeight
};
