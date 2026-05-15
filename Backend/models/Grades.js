const pool = require('../config/dbConnection');
const AssessmentWeight = require('./AssessmentWeight');

// Helper function to get weighted totals for all assessment types
const getWeightedTotals = async (studentUuid, courseId) => {
  try {
    // Fetch all grades for the student in the course
    const grades = await getGradesByStudentCourse(studentUuid, courseId);

    // Fetch all weights for the course
    const allWeights = await AssessmentWeight.getAssessmentWeightsByCourse(courseId);

    // Map weights for quick lookup by type and id
    const weightMap = {};
    allWeights.forEach(w => {
      if (!weightMap[w.assessment_type]) weightMap[w.assessment_type] = {};
      weightMap[w.assessment_type][w.assessment_id] = w.weight;
    });

    // Initialize totals and counts for each type
    const totals = {
      assignment: { totalWeightedScore: 0, count: 0, average: 0 },
      quiz: { totalWeightedScore: 0, count: 0, average: 0 },
      midterm: { totalWeightedScore: 0, count: 0, average: 0 },
      final: { totalWeightedScore: 0, count: 0, average: 0 }
    };

    // Calculate weighted totals for each type
    grades.forEach(grade => {
      const type = grade.assessment_type;
      const id = grade.assessment_id;
      const weight = weightMap[type]?.[id] ?? 0;
      
      if (totals[type]) {
        // Calculate weighted score: (score / max_score) * weight
        const weightedScore = (grade.score / grade.max_score) * weight;
        totals[type].totalWeightedScore += weightedScore;
        totals[type].count += 1;
      }
    });

    // Calculate averages for each type
    Object.keys(totals).forEach(type => {
      if (totals[type].count > 0) {
        totals[type].average = totals[type].totalWeightedScore / totals[type].count;
      }
    });

    return totals;
  } catch (err) {
    console.error(`Error calculating weighted totals for ${studentUuid} in course ${courseId}:`, err.message);
    return null;
  }
};

// Insert a grade record. assessmentId should be the id matching the assessmentType
const createGrade = async ({ studentUuid, courseId, assessmentType, assessmentId, score, maxScore = 100, weight = null }) => {
  // Validate assessment type
  const validTypes = ['assignment', 'quiz', 'midterm', 'final'];
  if (!validTypes.includes(assessmentType)) {
    throw new Error('Invalid assessment type');
  }

  // If an assessmentId is provided, try to find an existing grade for this
  // student/course/assessment. If found, update that row instead of creating
  // a new one (prevents duplicate rows when professors "update" marks).
  if (assessmentId) {
    const findQuery = `SELECT * FROM grades WHERE student_uuid = $1 AND course_id = $2 AND assessment_type = $3 AND assessment_id = $4 LIMIT 1;`;
    const found = await pool.query(findQuery, [studentUuid, courseId, assessmentType, assessmentId]);
    if (found.rows && found.rows.length > 0) {
      const existing = found.rows[0];
      // If a weight was provided, persist it to assessment_weights (do not store weight on grades table)
      if (weight !== null && typeof AssessmentWeight.setAssessmentWeight === 'function') {
        try {
          await AssessmentWeight.setAssessmentWeight({ courseId, assessmentType, assessmentId, weight });
        } catch (err) {
          console.error('Failed to upsert assessment weight:', err.message || err);
        }
      }

      // Use updateGrade to preserve behavior for updated_at timestamp
      const updated = await updateGrade(existing.id, { score, max_score: maxScore, assessment_id: assessmentId });
      return updated;
    }
  }

  // No existing row found (or no assessmentId provided) -> insert a new grade
  const columns = ['student_uuid', 'course_id', 'score', 'max_score', 'assessment_type'];
  const values = [studentUuid, courseId, score, maxScore, assessmentType];
  // Add per-item weight if provided
  if (weight !== null && weight !== undefined) {
    columns.push('weight');
    values.push(weight);
  }
  if (assessmentId) {
    columns.push('assessment_id');
    values.push(assessmentId);
  }

  const params = values.map((_, i) => `$${i + 1}`).join(', ');
  const query = `INSERT INTO grades (${columns.join(', ')}) VALUES (${params}) RETURNING *;`;
  const result = await pool.query(query, values);
  const inserted = result.rows[0];

  // After inserting the grade, if a weight was provided, persist it to assessment_weights
  if (assessmentId && weight !== null && typeof AssessmentWeight.setAssessmentWeight === 'function') {
    try {
      await AssessmentWeight.setAssessmentWeight({ courseId, assessmentType, assessmentId, weight });
    } catch (err) {
      console.error('Failed to upsert assessment weight after insert:', err.message || err);
    }
  }

  return inserted;
};

const updateGrade = async (id, updates = {}) => {
  // Only allow updating known columns to avoid accidental or malicious
  // creation of arbitrary column names. Map common camelCase keys to
  // snake_case column names expected by the DB.
  const allowedMap = {
    score: 'score',
    max_score: 'max_score',
    maxScore: 'max_score',
    assessment_type: 'assessment_type',
    assessmentType: 'assessment_type',
    assessment_id: 'assessment_id',
    assessmentId: 'assessment_id',
    graded_at: 'graded_at'
  };

  const set = [];
  const values = [];
  let idx = 1;

  Object.keys(updates).forEach(rawKey => {
    const key = allowedMap[rawKey];
    if (!key) return; // skip unknown keys
    set.push(`${key} = $${idx++}`);
    values.push(updates[rawKey]);
  });

  if (set.length === 0) return null;
  values.push(id);
  const query = `UPDATE grades SET ${set.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *;`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getGradesByCourse = async (courseId) => {
  const query = `SELECT * FROM grades WHERE course_id = $1 ORDER BY graded_at DESC;`;
  const result = await pool.query(query, [courseId]);
  return result.rows;
};

const getGradesByStudentCourse = async (studentUuid, courseId) => {
  const query = `SELECT * FROM grades WHERE student_uuid = $1 AND course_id = $2 ORDER BY graded_at DESC;`;
  const result = await pool.query(query, [studentUuid, courseId]);
  return result.rows;
};

// Return latest grade per assessment_type for a student in a course.
// Uses updated_at if present, falls back to graded_at.
const getLatestGradesByStudentCourse = async (studentUuid, courseId) => {
  // PostgreSQL DISTINCT ON to get the latest row per assessment_type
  const query = `
    SELECT DISTINCT ON (assessment_type) id, student_uuid, course_id, assessment_id, assessment_type, score, max_score, weight, graded_at, created_at, updated_at
    FROM grades
    WHERE student_uuid = $1 AND course_id = $2
    ORDER BY assessment_type, COALESCE(updated_at, graded_at, created_at) DESC;
  `;
  const result = await pool.query(query, [studentUuid, courseId]);
  return result.rows;
};

const getAverageForStudentCourseByType = async (studentUuid, courseId, assessmentType) => {
  const query = `
    SELECT AVG(score) as avg_score, AVG(max_score) as avg_max
    FROM grades
    WHERE student_uuid = $1 AND course_id = $2 AND assessment_type = $3;
  `;
  const result = await pool.query(query, [studentUuid, courseId, assessmentType]);
  return result.rows[0];
};

const deleteGradesByAssessment = async (courseId, assessmentType, assessmentId) => {
  const query = `DELETE FROM grades WHERE course_id = $1 AND assessment_type = $2 AND assessment_id = $3 RETURNING *;`;
  const result = await pool.query(query, [courseId, assessmentType, assessmentId]);
  return result.rows; // return deleted rows for reporting
};

module.exports = {
  createGrade,
  updateGrade,
  getGradesByCourse,
  getGradesByStudentCourse,
  getAverageForStudentCourseByType,
  deleteGradesByAssessment,
  getLatestGradesByStudentCourse,
  getWeightedTotals
};
