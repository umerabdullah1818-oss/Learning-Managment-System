const pool = require('../config/dbConnection');
const { v4: uuidv4 } = require('uuid');

// Create a new assignment
const createAssignment = async ({ title, dueDate, status = 'Pending', filePath = null, courseId, professorUuid }) => {
  const id = uuidv4();
  const query = `
    INSERT INTO assignments (uuid, title, due_date, status, file_path, course_id, professor_uuid, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, uuid, title, due_date, status, file_path, course_id, professor_uuid, created_at, updated_at;
  `;
  const values = [id, title, dueDate, status, filePath, courseId, professorUuid];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find assignments by professor uuid with course details
const findAssignmentsByProfessorId = async (professorUuid) => {
  const query = `
    SELECT 
      a.id,
      a.uuid,
      a.title,
      a.due_date as "dueDate",
      a.status,
      a.file_path as "filePath",
      a.course_id as "courseId",
      a.professor_uuid as "professorUuid",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt",
      c.course_code as "courseCode", 
      c.course_name as "courseName"
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE a.professor_uuid = $1
    ORDER BY a.due_date ASC;
  `;
  const result = await pool.query(query, [professorUuid]);
  return result.rows;
};

// Find assignment by id and professor uuid
const findAssignment = async ({ id, professorUuid }) => {
  let conditions = [];
  let values = [];
  let index = 1;

  if (id) {
    conditions.push(`a.id = $${index++}`);
    values.push(id);
  }
  if (professorUuid) {
    conditions.push(`a.professor_uuid = $${index++}`);
    values.push(professorUuid);
  }

  if (conditions.length === 0) return null;

  const whereClause = conditions.join(' AND ');
  const query = `
    SELECT 
      a.id,
      a.uuid,
      a.title,
      a.due_date as "dueDate",
      a.status,
      a.file_path as "filePath",
      a.course_id as "courseId",
      a.professor_uuid as "professorUuid",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt",
      c.course_code as "courseCode", 
      c.course_name as "courseName"
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE ${whereClause} 
    LIMIT 1;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find assignment by id
const findAssignmentById = async (id) => {
  const query = `
    SELECT 
      a.id,
      a.uuid,
      a.title,
      a.due_date as "dueDate",
      a.status,
      a.file_path as "filePath",
      a.course_id as "courseId",
      a.professor_uuid as "professorUuid",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt",
      c.course_code as "courseCode", 
      c.course_name as "courseName"
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE a.id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Update assignment status by id and professor_uuid
const updateAssignmentStatus = async (id, professorUuid, status) => {
  const query = `
    UPDATE assignments
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND professor_uuid = $3
    RETURNING id, uuid, title, due_date as "dueDate", status, file_path as "filePath", course_id as "courseId", professor_uuid as "professorUuid", created_at as "createdAt", updated_at as "updatedAt";
  `;
  const values = [status, id, professorUuid];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Update assignment (general update)
const updateAssignment = async (id, updateData) => {
  // Defensive: ensure updateData is a plain object
  if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
    console.warn('updateAssignment received invalid updateData:', updateData);
    return null;
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  try {
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });
  } catch (err) {
    console.error('Error processing updateData keys:', err);
    return null;
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE assignments 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $${paramIndex} 
    RETURNING id, uuid, title, due_date as "dueDate", status, file_path as "filePath", course_id as "courseId", professor_uuid as "professorUuid", created_at as "createdAt", updated_at as "updatedAt";
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Delete assignment
const deleteAssignment = async (id, professorUuid) => {
  const query = `
    DELETE FROM assignments 
    WHERE id = $1 AND professor_uuid = $2 
    RETURNING id;
  `;
  const result = await pool.query(query, [id, professorUuid]);
  return result.rows[0];
};

/**
 * Fetch assignments ONLY for courses where student is currently enrolled (active status)
 * Excludes dropped, completed, or inactive courses
 * @param {string} studentUuid - UUID of the student
 * @returns {Array} Array of assignments with course and submission details
 */
const findAssignmentsByEnrolledCourses = async (studentUuid) => {
  const query = `
    SELECT 
      a.id,
      a.uuid,
      a.title,
      a.due_date as "dueDate",
      a.status,
      a.file_path as "filePath",
      a.course_id as "courseId",
      a.professor_uuid as "professorUuid",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt",
      c.id as "courseId_check",
      c.course_code as "courseCode", 
      c.course_name as "courseName",
      c.course_status as "courseStatus",
      e.status as "enrollmentStatus",
      e.enrollment_date as "enrollmentDate",
      CONCAT(p.title, ' ', p.first_name, ' ', p.last_name) as "professorName",
      s.id as "submissionId",
      s.file_path as "studentFilePath",
      s.status as "studentSubmissionStatus",
      s.submitted_at as "studentSubmittedAt"
    FROM enrollments e
    INNER JOIN courses c ON e.course_id = c.id
    INNER JOIN assignments a ON a.course_id = c.id
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_uuid = $1
    WHERE 
      e.user_uuid = $1
      AND e.status = 'active'
      AND c.course_status = 'active'
    ORDER BY a.due_date ASC;
  `;
  
  try {
    const result = await pool.query(query, [studentUuid]);
    return result.rows;
  } catch (err) {
    // Fallback for when submissions table doesn't exist yet
    if (err && err.message && err.message.toLowerCase().includes('submissions')) {
      const fallbackQuery = `
        SELECT 
          a.id,
          a.uuid,
          a.title,
          a.due_date as "dueDate",
          a.status,
          a.file_path as "filePath",
          a.course_id as "courseId",
          a.professor_uuid as "professorUuid",
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          c.id as "courseId_check",
          c.course_code as "courseCode", 
          c.course_name as "courseName",
          c.course_status as "courseStatus",
          e.status as "enrollmentStatus",
          e.enrollment_date as "enrollmentDate",
          CONCAT(p.title, ' ', p.first_name, ' ', p.last_name) as "professorName"
        FROM enrollments e
        INNER JOIN courses c ON e.course_id = c.id
        INNER JOIN assignments a ON a.course_id = c.id
        LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
        WHERE 
          e.user_uuid = $1
          AND e.status = 'active'
          AND c.course_status = 'active'
        ORDER BY a.due_date ASC;
      `;
      const result = await pool.query(fallbackQuery, [studentUuid]);
      return result.rows;
    }
    throw err;
  }
};

module.exports = {
  createAssignment,
  findAssignmentsByProfessorId,
  findAssignment,
  findAssignmentById,
  updateAssignmentStatus,
  updateAssignment,
  deleteAssignment,
  findAssignmentsByEnrolledCourses
};
