const pool = require('../config/dbConnection');
const bcrypt = require('bcryptjs');

/**
 * Generates the next sequential Employee ID for Professors
 * Format: EMP00001, EMP00002, etc.
 * This function queries the database to find the highest existing employee ID
 * and increments it sequentially
 */
const generateNextEmployeeId = async () => {
  try {
    // Query to find the highest numeric part of employee_id with 'EMP' prefix
    const query = `
      SELECT employee_id FROM professors 
      WHERE employee_id LIKE 'EMP%' 
      ORDER BY 
        CAST(SUBSTRING(employee_id, 4) AS INTEGER) DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastId = result.rows[0].employee_id;
      const numericPart = parseInt(lastId.substring(3), 10);
      nextNumber = numericPart + 1;
    }
    
    // Format: EMP + padded number (5 digits: 00001, 00002, etc.)
    return `EMP${String(nextNumber).padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
};

// Create Professor - Main function to insert professor into database
const createProfessor = async (professorData, client = pool) => {
  const {
    userUuid,
    title,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    employeeId,
    department,
    position,
    employmentType,
    joiningDate,
    salary,
    highestDegree,
    specialization,
    university,
    graduationYear,
    experience,
    office,
    officeHours,
    subjects,
    bio,
    profileImage,
    username,
    password,
    accountStatus = 'active',
    role = 'professor'
  } = professorData;

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO professors (
      user_uuid, title, first_name, last_name, email, phone, date_of_birth, gender, address,
      employee_id, department, position, employment_type, joining_date, salary,
      highest_degree, specialization, university, graduation_year, experience,
      office, office_hours, subjects, bio, profile_image, username, password, first_login, account_status, role
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
    )
    RETURNING id, title, first_name, last_name, email, phone, date_of_birth,
             gender, address, employee_id, department, position, employment_type,
             joining_date, salary, highest_degree, specialization, university,
             graduation_year, experience, office, subjects, bio, profile_image,
             username, account_status, role, created_at;
  `;

  const values = [
    userUuid, title, firstName, lastName, email, phone, dateOfBirth, gender, address,
    employeeId, department, position, employmentType, joiningDate, salary,
    highestDegree, specialization, university, graduationYear, experience,
    office, officeHours, subjects, bio, profileImage, username, hashedPassword, (professorData.firstLogin === undefined ? true : professorData.firstLogin), accountStatus, role
  ];

  const result = await client.query(query, values);
  return result.rows[0];
};

const findProfessorById = async (id) => {
  const query = `
    SELECT p.*, u.first_name, u.last_name, u.email, u.role, u.department
    FROM professors p
    JOIN users u ON p.user_uuid = u.uuid
    WHERE p.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const findProfessorByEmail = async (email) => {
  const query = 'SELECT * FROM professors WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

const findProfessorByEmployeeId = async (employeeId) => {
  const query = 'SELECT * FROM professors WHERE employee_id = $1';
  const result = await pool.query(query, [employeeId]);
  return result.rows[0];
};

const findProfessorByUsername = async (username) => {
  const query = 'SELECT * FROM professors WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

const findProfessorByUserUuid = async (userUuid) => {
  const query = `
    SELECT p.*, u.first_name, u.last_name, u.email, u.role, u.department
    FROM professors p
    JOIN users u ON p.user_uuid = u.uuid
    WHERE p.user_uuid = $1
  `;
  const result = await pool.query(query, [userUuid]);
  return result.rows[0];
};

const getAllProfessors = async (limit = 10, offset = 0) => {
  const query = `
    SELECT
      p.id,
      p.user_uuid as "userUuid",
      CONCAT(COALESCE(p.title, ''), ' ', p.first_name, ' ', p.last_name) as name,
      p.title,
      p.first_name as "firstName",
      p.last_name as "lastName",
      p.employee_id as "employeeId",
      p.department,
      p.position,
      p.employment_type as "employmentType",
      p.profile_image as "avatar",
      p.email,
      p.username,
      p.account_status as "status",
      p.role,
      p.created_at as "createdAt",
      COALESCE(COUNT(c.id), 0) as "courses"
    FROM professors p
    LEFT JOIN courses c ON p.user_uuid = c.professor_uuid AND c.course_status = 'active'
    GROUP BY p.id, p.user_uuid, p.title, p.first_name, p.last_name, p.employee_id, p.department, p.position, p.employment_type, p.profile_image, p.email, p.username, p.account_status, p.role, p.created_at
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const updateProfessor = async (id, updateData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach(key => {
    // Skip protected/derived fields that should not be updated directly
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
  const query = `UPDATE professors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteProfessor = async (id) => {
  const query = 'DELETE FROM professors WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  createProfessor,
  generateNextEmployeeId,
  findProfessorById,
  findProfessorByEmail,
  findProfessorByEmployeeId,
  findProfessorByUsername,
  findProfessorByUserUuid,
  getAllProfessors,
  updateProfessor,
  deleteProfessor
};
