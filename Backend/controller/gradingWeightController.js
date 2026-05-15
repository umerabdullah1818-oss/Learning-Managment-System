const asyncHandler = require('express-async-handler');
const GradingWeight = require('../models/GradingWeight');

// GET /api/grading-weights/:courseId
const getWeights = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const weights = await GradingWeight.getWeightsByCourse(courseId);
  if (!weights) {
    return res.status(200).json({ success: false, message: 'No grading weights found for this course', data: null });
  }
  res.json({ success: true, data: weights });
});

// POST /api/grading-weights/:courseId
const upsertWeights = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const professorUuid = req.user && req.user.uuid ? req.user.uuid : null;
  const { assignmentWeight, quizWeight, midtermWeight, finalWeight } = req.body;

  // Basic validation
  const a = Number(assignmentWeight ?? 20);
  const q = Number(quizWeight ?? 20);
  const m = Number(midtermWeight ?? 25);
  const f = Number(finalWeight ?? 35);
  const total = a + q + m + f;
  if (Math.abs(total - 100) > 0.001) {
    return res.status(400).json({ success: false, message: 'Total weights must equal 100' });
  }

  const result = await GradingWeight.upsertWeights({ courseId, professorUuid, assignmentWeight: a, quizWeight: q, midtermWeight: m, finalWeight: f });
  res.json({ success: true, data: result });
});

module.exports = { getWeights, upsertWeights };
