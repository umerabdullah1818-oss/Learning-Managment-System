const pool = require('../config/dbConnection');

const upsertStudentCourseGrade = async ({ studentUuid, courseId, assignmentAvg = null, quizAvg = null, midtermScore = null, finalScore = null, weightedTotal = null, letterGrade = null }) => {
  const query = `
    INSERT INTO student_course_grades (student_uuid, course_id, assignment_avg, quiz_avg, midterm_score, final_score, weighted_total, letter_grade, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT (student_uuid, course_id) DO UPDATE SET
      assignment_avg = EXCLUDED.assignment_avg,
      quiz_avg = EXCLUDED.quiz_avg,
      midterm_score = EXCLUDED.midterm_score,
      final_score = EXCLUDED.final_score,
      weighted_total = EXCLUDED.weighted_total,
      letter_grade = EXCLUDED.letter_grade,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [studentUuid, courseId, assignmentAvg, quizAvg, midtermScore, finalScore, weightedTotal, letterGrade];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getStudentCourseGrade = async (studentUuid, courseId) => {
  const query = `SELECT * FROM student_course_grades WHERE student_uuid = $1 AND course_id = $2 LIMIT 1;`;
  const result = await pool.query(query, [studentUuid, courseId]);
  return result.rows[0];
};

module.exports = {
  upsertStudentCourseGrade,
  getStudentCourseGrade
};
