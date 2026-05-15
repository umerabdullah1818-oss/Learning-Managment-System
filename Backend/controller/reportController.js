const asyncHandler = require('express-async-handler');
const Grades = require('../models/Grades');
const GradingWeight = require('../models/GradingWeight');
const StudentCourseGrades = require('../models/StudentCourseGrades');
const Enrollment = require('../models/Enrollment');

const computeLetterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const safeNumber = (v) => (v === null || v === undefined ? 0 : Number(v));

// POST /api/reports/student/:studentUuid/course/:courseId
const calculateStudentCourseGrade = asyncHandler(async (req, res) => {
  const { studentUuid, courseId } = req.params;

  const weights = await GradingWeight.getWeightsByCourse(courseId);
  const assignmentAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'assignment');
  const quizAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'quiz');
  const midtermAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'midterm');
  const finalAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'final');

  const aAvg = safeNumber(assignmentAvgObj.avg_score);
  const qAvg = safeNumber(quizAvgObj.avg_score);
  const mScore = safeNumber(midtermAvgObj.avg_score);
  const fScore = safeNumber(finalAvgObj.avg_score);

  const aw = weights ? Number(weights.assignment_weight) : 0;
  const qw = weights ? Number(weights.quiz_weight) : 0;
  const mw = weights ? Number(weights.midterm_weight) : 0;
  const fw = weights ? Number(weights.final_weight) : 0;

  // weights are percentages, so divide by 100
  const weightedTotal = (aAvg * (aw/100)) + (qAvg * (qw/100)) + (mScore * (mw/100)) + (fScore * (fw/100));
  const letter = computeLetterGrade(weightedTotal);

  const saved = await StudentCourseGrades.upsertStudentCourseGrade({
    studentUuid,
    courseId,
    assignmentAvg: aAvg,
    quizAvg: qAvg,
    midtermScore: mScore,
    finalScore: fScore,
    weightedTotal,
    letterGrade: letter
  });

  res.json({ success: true, data: saved });
});

// POST /api/reports/course/:courseId  -> compute for all enrolled students
const calculateCourseGrades = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollments = await Enrollment.getEnrollmentsByCourse(courseId);
  const results = [];
  for (const e of enrollments) {
    try {
      const studentUuid = e.user_uuid || e.userUuid || e.userId || e.user_uuid;
      if (!studentUuid) continue;
      const response = await (async () => {
        const weights = await GradingWeight.getWeightsByCourse(courseId);
        const assignmentAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'assignment');
        const quizAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'quiz');
        const midtermAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'midterm');
        const finalAvgObj = await Grades.getAverageForStudentCourseByType(studentUuid, courseId, 'final');

        const aAvg = safeNumber(assignmentAvgObj.avg_score);
        const qAvg = safeNumber(quizAvgObj.avg_score);
        const mScore = safeNumber(midtermAvgObj.avg_score);
        const fScore = safeNumber(finalAvgObj.avg_score);

        const aw = weights ? Number(weights.assignment_weight) : 0;
        const qw = weights ? Number(weights.quiz_weight) : 0;
        const mw = weights ? Number(weights.midterm_weight) : 0;
        const fw = weights ? Number(weights.final_weight) : 0;

        const weightedTotal = (aAvg * (aw/100)) + (qAvg * (qw/100)) + (mScore * (mw/100)) + (fScore * (fw/100));
        const letter = computeLetterGrade(weightedTotal);

        const saved = await StudentCourseGrades.upsertStudentCourseGrade({
          studentUuid,
          courseId,
          assignmentAvg: aAvg,
          quizAvg: qAvg,
          midtermScore: mScore,
          finalScore: fScore,
          weightedTotal,
          letterGrade: letter
        });
        return saved;
      })();
      results.push(response);
    } catch (err) {
      console.error('Error computing grade for enrollment', e, err.message || err);
    }
  }

  res.json({ success: true, count: results.length, data: results });
});

// GET /api/reports/student/:studentUuid/course/:courseId -> fetch saved summary
const getStudentCourseGrade = asyncHandler(async (req, res) => {
  const { studentUuid, courseId } = req.params;
  const rec = await StudentCourseGrades.getStudentCourseGrade(studentUuid, courseId);
  if (!rec) return res.status(404).json({ success: false, message: 'No grade summary found' });
  res.json({ success: true, data: rec });
});

module.exports = { calculateStudentCourseGrade, calculateCourseGrades, getStudentCourseGrade };
