const pool = require('../config/dbConnection');

const getAssessmentWeight = async (courseId, assessmentType, assessmentId) => {
  try {
    const query = `SELECT weight FROM assessment_weights WHERE course_id = $1 AND assessment_type = $2 AND assessment_id = $3 LIMIT 1;`;
    const result = await pool.query(query, [courseId, assessmentType, assessmentId]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].weight;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching assessment weight: ${err.message}`);
    return null;
  }
};

const setAssessmentWeight = async ({ courseId, assessmentType, assessmentId, weight }) => {
  try {
    const query = `
      INSERT INTO assessment_weights (course_id, assessment_type, assessment_id, weight, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (course_id, assessment_type, assessment_id) DO UPDATE SET
        weight = EXCLUDED.weight,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await pool.query(query, [courseId, assessmentType, assessmentId, weight]);
    return result.rows[0];
  } catch (err) {
    console.error(`Error setting assessment weight: ${err.message}`);
    return null;
  }
};

const getAssessmentWeightsByCourse = async (courseId) => {
  try {
    const query = `SELECT * FROM assessment_weights WHERE course_id = $1 ORDER BY assessment_type, assessment_id;`;
    const result = await pool.query(query, [courseId]);
    return result.rows || [];
  } catch (err) {
    console.error(`Error fetching assessment weights for course: ${err.message}`);
    return [];
  }
};

const deleteAssessmentWeight = async (courseId, assessmentType, assessmentId) => {
  try {
    const query = `DELETE FROM assessment_weights WHERE course_id = $1 AND assessment_type = $2 AND assessment_id = $3 RETURNING *;`;
    const result = await pool.query(query, [courseId, assessmentType, assessmentId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error(`Error deleting assessment weight: ${err.message}`);
    return null;
  }
};

module.exports = {
  getAssessmentWeight,
  setAssessmentWeight,
  getAssessmentWeightsByCourse,
  deleteAssessmentWeight
};
