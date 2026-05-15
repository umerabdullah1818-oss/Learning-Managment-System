const pool = require('../config/dbConnection');

const createUser = async (firstName, lastName, email, username, password, role, department = null, studentId = null, client = pool) => {
  const query = `
    INSERT INTO users (first_name, last_name, email, username, password, role, department, student_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, uuid, first_name, last_name, email, username, role, department, student_id;
  `;
  const values = [firstName, lastName, email, username || null, password, role, department, studentId];
  const result = await client.query(query, values);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

const updateRefreshToken = async (userId, refreshToken) => {
  const query = 'UPDATE users SET refresh_token = $1 WHERE id = $2';
  await pool.query(query, [refreshToken, userId]);
};

const findUserByRefreshToken = async (refreshToken) => {
  const query = 'SELECT * FROM users WHERE refresh_token = $1';
  const result = await pool.query(query, [refreshToken]);
  return result.rows[0];
};

const clearRefreshToken = async (userId) => {
  const query = 'UPDATE users SET refresh_token = NULL WHERE id = $1';
  await pool.query(query, [userId]);
};

const updateResetToken = async (userId, resetToken, expires) => {
  const query = 'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3';
  await pool.query(query, [resetToken, expires, userId]);
};

const findUserByResetToken = async (resetToken) => {
  const query = 'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()';
  const result = await pool.query(query, [resetToken]);
  return result.rows[0];
};

const clearResetToken = async (userId) => {
  const query = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1';
  await pool.query(query, [userId]);
};

const updatePassword = async (userId, hashedPassword, firstLogin = null) => {
  if (firstLogin === null) {
    const query = 'UPDATE users SET password = $1 WHERE id = $2';
    await pool.query(query, [hashedPassword, userId]);
  } else {
    const query = 'UPDATE users SET password = $1, first_login = $2 WHERE id = $3';
    await pool.query(query, [hashedPassword, firstLogin, userId]);
  }
};

const findUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

const updateUser = async (userId, firstName, lastName, email) => {
  const query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING id, uuid, first_name, last_name, email, username, role';
  const result = await pool.query(query, [firstName, lastName, email, userId]);
  return result.rows[0];
};

module.exports = { createUser, findUserByEmail, updateRefreshToken, findUserByRefreshToken, clearRefreshToken, updateResetToken, findUserByResetToken, clearResetToken, updatePassword, findUserByUsername, updateUser };
