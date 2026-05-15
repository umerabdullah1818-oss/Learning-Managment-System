const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/mailService');
const { createUser, findUserByEmail, updateRefreshToken, findUserByRefreshToken, clearRefreshToken, updateResetToken, findUserByResetToken, clearResetToken, updatePassword, updateUser } = require('../models/User');
const Student = require('../models/Student');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRole = (role) => {
  const allowedRoles = ['student', 'professor', 'staff member', 'administrator'];
  return allowedRoles.includes(role);
};

const validateRequired = (fields, body) => {
  for (const field of fields) {
    if (!body[field] || body[field].trim() === '') {
      return field;
    }
  }
  return null;
};

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, role } = req.body;

    const missingField = validateRequired(['firstName', 'lastName', 'email', 'username', 'password', 'role'], req.body);
    if (missingField) return res.status(400).json({ message: `${missingField} is required` });

    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    if (!validateRole(role)) return res.status(400).json({ message: 'Invalid role. Allowed roles: student, professor, staff member, administrator' });

    const existingUser = await findUserByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(firstName, lastName, email, username, hashedPassword, role);

    // If registering as a student, create a minimal student profile so student-related
    // endpoints (enrollments, etc.) can find the corresponding record.
    if (role === 'student') {
      try {
        const studentData = {
          userUuid: user.uuid,
          fullName: `${firstName} ${lastName}`,
          studentId: username || null,
          department: null,
          course: null,
          dateOfBirth: null,
          gender: null,
          phone: null,
          parentPhone: null,
          address: null,
          city: null,
          state: null,
          postalCode: null,
          profileImage: null,
          email,
          username,
          password, // createStudent will hash the password internally
          accountStatus: 'active',
          role: 'student'
        };

        await Student.createStudent(studentData);
      } catch (stuErr) {
        console.error('Failed creating student profile for new user:', stuErr);
        // Do not block user registration on student profile creation failure
      }
    }

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const missingField = validateRequired(['email', 'password'], req.body);
    if (missingField) return res.status(400).json({ message: `${missingField} is required` });

    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // If user is a student, fetch additional details
    let studentDetails = null;
    if (user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findStudentByUserUuid(user.uuid);
      if (student) {
    // Fetch enrollments and courses
    const pool = require('../config/dbConnection');
    const enrollmentsQuery = `
      SELECT e.id, e.enrollment_date, e.status, e.grade,
             c.id as course_id, c.course_name, c.course_code, c.course_description
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_uuid = $1
    `;
    const enrollmentsResult = await pool.query(enrollmentsQuery, [student.user_uuid]);
        studentDetails = {
          ...student,
          enrollments: enrollmentsResult.rows
        };
      }
    }

    // If user is a professor, fetch additional details
    let professorDetails = null;
    if (user.role === 'professor') {
      const Professor = require('../models/Professor');
      const professor = await Professor.findProfessorByUserUuid(user.uuid);
      if (professor) {
        professorDetails = professor;
      }
    }

    const accessToken = jwt.sign(
      { UserInfo: { id: user.id, uuid: user.uuid, email: user.email, role: user.role, professorId: professorDetails ? professorDetails.id : null } },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { email: user.email },
      process.env.REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    await updateRefreshToken(user.id, refreshToken);

    res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({
      accessToken,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        department: user.department,
        studentId: user.student_id,
        professorId: professorDetails ? professorDetails.id : null,
        firstLogin: user.first_login === undefined ? true : user.first_login
      },
      studentDetails,
      professorDetails
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;
    const user = await findUserByRefreshToken(refreshToken);
    if (!user) return res.status(403).json({ message: 'Forbidden' });

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
      if (err || user.email !== decoded.email) return res.status(403).json({ message: 'Forbidden' });

      const accessToken = jwt.sign(
        { UserInfo: { id: user.id, email: user.email, role: user.role } },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshToken = cookies.jwt;
    const user = await findUserByRefreshToken(refreshToken);
    if (user) await clearRefreshToken(user.id);

    res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'None' });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const missingField = validateRequired(['email'], req.body);
    if (missingField) return res.status(400).json({ message: `${missingField} is required` });

    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await updateResetToken(user.id, resetToken, expires);

    const resetLink = `http://localhost:5173/password-recovery?token=${resetToken}`;

    await sendPasswordResetEmail(user, resetLink);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const missingField = validateRequired(['token', 'password'], req.body);
    if (missingField) return res.status(400).json({ message: `${missingField} is required` });

    const user = await findUserByResetToken(token);
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePassword(user.id, hashedPassword);
    await clearResetToken(user.id);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const missingField = validateRequired(['currentPassword', 'newPassword'], req.body);
    // For first-login flow we allow changing password without currentPassword.
    // Check DB for user's current first_login flag
    const pool = require('../config/dbConnection');
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ message: 'User not found' });

    // If not first-login, require both currentPassword and newPassword
    if (!user.first_login) {
      const missing = validateRequired(['currentPassword', 'newPassword'], req.body);
      if (missing) return res.status(400).json({ message: `${missing} is required` });

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) return res.status(401).json({ message: 'Current password is incorrect' });
    } else {
      // If first_login is true, only newPassword is required
      if (!newPassword || newPassword.trim() === '') return res.status(400).json({ message: 'newPassword is required' });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Hash new password and update, also set first_login = false
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updatePassword(userId, hashedPassword, false);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    const missingField = validateRequired(['firstName', 'lastName', 'email'], req.body);
    if (missingField) return res.status(400).json({ message: `${missingField} is required` });

    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    // Check if email is already taken by another user
    const pool = require('../config/dbConnection');
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update user profile
    const updatedUser = await updateUser(userId, firstName, lastName, email);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user from database
    const pool = require('../config/dbConnection');
    const userResult = await pool.query('SELECT id, uuid, first_name, last_name, email, username, role, first_login FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        uuid: user.uuid,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role
        ,
        firstLogin: user.first_login === undefined ? true : user.first_login
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
