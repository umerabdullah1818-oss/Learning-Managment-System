const pool = require('../config/dbConnection');
const bcrypt = require('bcryptjs');

/**
 * Generates the next sequential Student ID
 * Format: STU00001, STU00002, etc.
 * This function queries the database to find the highest existing student ID
 * and increments it sequentially
 */
const generateNextStudentId = async () => {
  try {
    // Query to find the highest numeric part of student_id with 'STU' prefix
    const query = `
      SELECT student_id FROM students 
      WHERE student_id LIKE 'STU%' 
      ORDER BY 
        CAST(SUBSTRING(student_id, 4) AS INTEGER) DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0].student_id;
      const numericPart = parseInt(lastId.substring(3), 10);
      nextNumber = numericPart + 1;
    }
    
    // Format: STU + padded number (5 digits: 00001, 00002, etc.)
    return `STU${String(nextNumber).padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw new Error('Failed to generate student ID');
  }
};

/**
 * Generates the next available Student ID across both users and students tables
 * Ensures no collision if users has a reserved student_id but students doesn't yet.
 */
const generateNextAvailableStudentId = async () => {
  try {
    const query = `
      SELECT student_id FROM (
        SELECT student_id FROM students WHERE student_id LIKE 'STU%'
        UNION ALL
        SELECT student_id FROM users WHERE student_id LIKE 'STU%'
      ) AS all_ids
      WHERE student_id IS NOT NULL AND student_id <> ''
      ORDER BY CAST(SUBSTRING(student_id, 4) AS INTEGER) DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0].student_id;
      const numericPart = parseInt(lastId.substring(3), 10);
      nextNumber = (isNaN(numericPart) ? 0 : numericPart) + 1;
    }
    return `STU${String(nextNumber).padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating next available student ID:', error);
    throw new Error('Failed to generate next available student ID');
  }
};

/**
 * Fallback ID generator (should rarely be used if proper flow is followed)
 */
const generateStudentId = () => {
  // Format: STU + timestamp + 4 random hex chars, e.g. STU1633029123456a1b2
  return `STU${Date.now()}${Math.floor(Math.random() * 0xffff).toString(16)}`;
};

const createStudent = async (studentData, client = pool) => {
  const {
    userUuid,
    studentId,
    fullName,
    email,
    dateOfBirth,
    department,
    gender,
    phone,
    parentPhone,
    address,
    city,
    state,
    postalCode,
    profileImage,
    accountStatus = 'active'
  } = studentData;

  // Ensure a non-null studentId for DB insertion
  const finalStudentId = studentId || generateStudentId();

  const query = `
  INSERT INTO students (
    user_uuid,
    full_name,
    email,
    student_id,
    department,
    course,
    date_of_birth,
    gender,
    phone,
    parent_phone,
    address,
    city,
    state,
    postal_code,
    profile_image,
    account_status
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
  )
  RETURNING
    id, user_uuid, full_name, email, student_id, department, course,
    date_of_birth, gender, phone, parent_phone, address, city, state, postal_code,
    profile_image, account_status, created_at, updated_at;
`;


  const values = [
  userUuid,                // $1
  studentData.fullName,    // $2
  email,                   // $3
  studentData.studentId,   // $4
  studentData.department,  // $5
  studentData.course,      // $6
  studentData.dateOfBirth, // $7
  studentData.gender,      // $8
  studentData.phone,       // $9
  studentData.parentPhone, // $10
  studentData.address,     // $11
  studentData.city,        // $12
  studentData.state,       // $13
  studentData.postalCode,  // $14
  studentData.profileImage,// $15
  accountStatus            // $16
];



  const result = await client.query(query, values);
  return result.rows[0];
};

const createMinimalStudent = async ({ fullName = null, email, role = 'student', studentId = null }) => {
  const finalStudentId = studentId || generateStudentId();
  const query = `
    INSERT INTO students (full_name, email, student_id, account_status, role, created_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    RETURNING id, full_name, student_id, b, course, date_of_birth,
             gender, phone, parent_phone, address, city, state, postal_code,
             profile_image, email, account_status, role, created_at;
  `;

  const values = [fullName, email, finalStudentId, 'active', role];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findStudentById = async (id) => {
  const query = `
    SELECT s.*, u.student_id, u.department, u.email, u.role, u.first_name, u.last_name
    FROM students s
    JOIN users u ON s.user_uuid = u.uuid
    WHERE s.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const findStudentByEmail = async (email) => {
  const query = 'SELECT * FROM students WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

const findStudentByStudentId = async (studentId) => {
  const query = 'SELECT * FROM students WHERE student_id = $1';
  const result = await pool.query(query, [studentId]);
  return result.rows[0];
};

const findStudentByUserUuid = async (userUuid) => {
  const query = `
    SELECT s.*, u.student_id, u.department, u.email, u.role, u.first_name, u.last_name
    FROM students s
    JOIN users u ON s.user_uuid = u.uuid
    WHERE s.user_uuid = $1
  `;
  const result = await pool.query(query, [userUuid]);
  return result.rows[0];
};

const getAllStudents = async (limit = 10, offset = 0) => {
  const query = `
    SELECT s.id, s.full_name, s.date_of_birth, s.gender, s.phone, s.parent_phone, s.address, s.city, s.state, s.postal_code, s.profile_image, s.account_status, s.created_at,
           u.student_id, u.department, u.email, u.role, u.first_name, u.last_name
    FROM students s
    JOIN users u ON s.user_uuid = u.uuid
    ORDER BY s.created_at DESC LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const updateStudent = async (id, updateData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach(key => {
    // Skip undefined or protected/derived fields
    if (updateData[key] === undefined) return;
    const skipKeys = ['updated_at', 'created_at', 'id', 'user_uuid'];
    if (skipKeys.includes(key)) return;

    // Map camelCase to snake_case for database columns
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (dbKey === 'updated_at' || dbKey === 'created_at') return;
    fields.push(`${dbKey} = $${paramIndex}`);
    values.push(updateData[key]);
    paramIndex++;
  });

  if (fields.length === 0) return null;

  values.push(id);
  const query = `UPDATE students SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteStudent = async (id) => {
  const query = 'DELETE FROM students WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createStudent,
  createMinimalStudent,
  generateNextStudentId,
  generateNextAvailableStudentId,
  findStudentById,
  findStudentByEmail,
  findStudentByStudentId,
  findStudentByUserUuid,
  getAllStudents,
  updateStudent,
  deleteStudent
};
