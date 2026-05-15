const pool = require('../config/dbConnection');

const getWeightsByCourse = async (courseId) => {
  const query = `SELECT * FROM grading_weights WHERE course_id = $1 LIMIT 1;`;
  const result = await pool.query(query, [courseId]);
  return result.rows[0];
};

const upsertWeights = async ({ courseId, professorUuid = null, assignmentWeight = 20, quizWeight = 20, midtermWeight = 25, finalWeight = 35 }) => {
  const query = `
    INSERT INTO grading_weights (course_id, professor_uuid, assignment_weight, quiz_weight, midterm_weight, final_weight, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (course_id) DO UPDATE SET
      professor_uuid = EXCLUDED.professor_uuid,
      assignment_weight = EXCLUDED.assignment_weight,
      quiz_weight = EXCLUDED.quiz_weight,
      midterm_weight = EXCLUDED.midterm_weight,
      final_weight = EXCLUDED.final_weight,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [courseId, professorUuid, assignmentWeight, quizWeight, midtermWeight, finalWeight];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getWeightsByCourse,
  upsertWeights
};
