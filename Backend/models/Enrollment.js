const pool = require('../config/dbConnection');

const enrollStudentInCourse = async (userUuid, courseId) => {
  const query = `
    INSERT INTO enrollments (user_uuid, course_id, enrollment_date, status)
    VALUES ($1, $2, CURRENT_TIMESTAMP, 'active')
    RETURNING id, user_uuid, course_id, enrollment_date, status;
  `;
  const result = await pool.query(query, [userUuid, courseId]);
  return result.rows[0];
};

const unenrollStudentFromCourse = async (userUuid, courseId) => {
  const query = `
    UPDATE enrollments
    SET status = 'dropped'
    WHERE user_uuid = $1 AND course_id = $2 AND status = 'active'
    RETURNING id, user_uuid, course_id, status;
  `;
  const result = await pool.query(query, [userUuid, courseId]);
  return result.rows[0];
};

const findEnrollmentById = async (id) => {
  const query = `SELECT * FROM enrollments WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const unenrollStudentFromCourseById = async (id) => {
  const query = `
    UPDATE enrollments
    SET status = 'dropped'
    WHERE id = $1 AND status = 'active'
    RETURNING id, user_uuid, course_id, status;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const getEnrollmentsByUserUuid = async (userUuid) => {
  const query = `
    SELECT
      e.id,
      e.user_uuid,
      e.course_id,
      e.enrollment_date,
      e.status,
      e.grade,
      c.course_code as "courseCode",
      c.course_name as "courseName",
      c.department,
      c.credits,
      c.semester,
      c.course_type as "courseType",
      CONCAT(p.title, ' ', p.first_name, ' ', p.last_name) as "professorName"
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    WHERE e.user_uuid = $1 AND e.status = 'active' AND c.course_status = 'active'
    ORDER BY e.enrollment_date DESC;
  `;
  const result = await pool.query(query, [userUuid]);
  return result.rows;
};

const getEnrollmentsByCourse = async (courseId) => {
  const query = `
    SELECT
      e.id,
      e.user_uuid,
      e.course_id,
      e.enrollment_date,
      e.status,
      e.grade,
      u.username as "studentName",
      u.email as "studentEmail",
      u.first_name,
      u.last_name,
      s.id as "student_id",
      s.department as "studentDepartment"
    FROM enrollments e
    JOIN users u ON e.user_uuid = u.uuid
    LEFT JOIN students s ON u.uuid = s.user_uuid
    JOIN courses c ON e.course_id = c.id
    WHERE e.course_id = $1 AND e.status = 'active' AND c.course_status = 'active'
    ORDER BY e.enrollment_date DESC;
  `;
  const result = await pool.query(query, [courseId]);
  return result.rows;
};

const isStudentEnrolled = async (userUuid, courseId) => {
  const query = `
    SELECT id, status FROM enrollments
    WHERE user_uuid = $1 AND course_id = $2;
  `;
  const result = await pool.query(query, [userUuid, courseId]);
  return result.rows[0];
};

const getEnrollmentCount = async (courseId) => {
  const query = `
    SELECT COUNT(*)::int as count FROM enrollments
    WHERE course_id = $1 AND status = 'active';
  `;
  const result = await pool.query(query, [courseId]);
  return result.rows[0].count;
};

module.exports = {
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  findEnrollmentById,
  unenrollStudentFromCourseById,
  getEnrollmentsByUserUuid,
  getEnrollmentsByCourse,
  isStudentEnrolled,
  getEnrollmentCount
};
