const pool = require('../config/dbConnection');

// Helper function to convert percentage to letter grade using the grading scale
const getLetterGrade = (percentage) => {
  const pct = parseFloat(percentage) || 0;
  if (pct >= 85) return 'A';
  if (pct >= 80) return 'A−';
  if (pct >= 75) return 'B+';
  if (pct >= 71) return 'B';
  if (pct >= 68) return 'B−';
  if (pct >= 64) return 'C+';
  if (pct >= 61) return 'C';
  if (pct >= 58) return 'C−';
  if (pct >= 54) return 'D+';
  if (pct >= 50) return 'D';
  return 'F';
};

const upsertFinalGrade = async ({ studentUuid, courseId, finalWeightedScore, weightSum, finalPercentage, letterGrade = null, professorUuid = null, notes = null }) => {
  // Auto-calculate letter grade if not provided
  const calculatedLetterGrade = letterGrade || getLetterGrade(finalPercentage);
  
  const query = `
    INSERT INTO final_grades (student_uuid, course_id, final_weighted_score, weight_sum, final_percentage, letter_grade, professor_uuid, notes, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (student_uuid, course_id) DO UPDATE SET
      final_weighted_score = EXCLUDED.final_weighted_score,
      weight_sum = EXCLUDED.weight_sum,
      final_percentage = EXCLUDED.final_percentage,
      letter_grade = EXCLUDED.letter_grade,
      professor_uuid = EXCLUDED.professor_uuid,
      notes = EXCLUDED.notes,
      computed_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [studentUuid, courseId, finalWeightedScore, weightSum, finalPercentage, calculatedLetterGrade, professorUuid, notes];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getFinalGradesByCourse = async (courseId) => {
  const query = `SELECT * FROM final_grades WHERE course_id = $1 ORDER BY computed_at DESC;`;
  const result = await pool.query(query, [courseId]);
  return result.rows;
};

const getFinalGrade = async (studentUuid, courseId) => {
  const query = `SELECT * FROM final_grades WHERE student_uuid = $1 AND course_id = $2 LIMIT 1;`;
  const result = await pool.query(query, [studentUuid, courseId]);
  return result.rows[0];
};

const getFinalGradesByStudent = async (studentUuid) => {
  const query = `SELECT * FROM final_grades WHERE student_uuid = $1 ORDER BY computed_at DESC;`;
  const result = await pool.query(query, [studentUuid]);
  return result.rows;
};

module.exports = {
  getLetterGrade,
  upsertFinalGrade,
  getFinalGradesByCourse,
  getFinalGrade,
  getFinalGradesByStudent
};
