const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const {
  createStudent,
  generateNextStudentId,
  generateNextAvailableStudentId,
  findStudentById,
  findStudentByUserUuid,
  getAllStudents,
  updateStudent: updateStudentModel,
  deleteStudent: deleteStudentModel
} = require('../models/Student');
const { createUser, findUserByEmail } = require('../models/User');
const pool = require('../config/dbConnection');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('profileImage');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequired = (fields, body) => {
  for (const field of fields) {
    if (!body[field] || body[field].trim() === '') {
      return field;
    }
  }
  return null;
};

const validateStudentData = (data) => {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (!data.studentId || data.studentId.trim().length < 1) {
    errors.push('Student ID is required');
  }

  if (!data.department) {
    errors.push('Department is required');
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth is required');
  }

  if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Valid gender is required');
  }

  if (!data.phone || data.phone.trim().length < 10) {
    errors.push('Valid phone number is required');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};

const validateStudentCreationData = (data) => {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (!data.studentId || data.studentId.trim().length < 1) {
    errors.push('Student ID is required');
  }

  if (!data.department) {
    errors.push('Department is required');
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth is required');
  }

  if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Valid gender is required');
  }

  if (!data.phone || data.phone.trim().length < 10) {
    errors.push('Valid phone number is required');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};

const validateUserData = (data) => {
  const errors = [];

  if (!data.firstName || data.firstName.trim().length < 1) {
    errors.push('First name is required');
  }

  if (!data.lastName || data.lastName.trim().length < 1) {
    errors.push('Last name is required');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!data.studentId || data.studentId.trim().length < 1) {
    errors.push('Student ID is required');
  }

  if (!data.department) {
    errors.push('Department is required');
  }

  return errors;
};

exports.createStudent = async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ message: 'Access denied. Only administrators can add students.' });
  }

  // Handle file upload
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 2MB.' });
        }
      }
      return res.status(400).json({ message: err.message });
    }

    const studentData = {
      fullName: req.body.fullName,
      studentId: req.body.studentId,
      department: req.body.department,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      phone: req.body.phone,
      parentPhone: req.body.parentPhone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      profileImage: req.file ? req.file.filename : null,
      email: req.body.email,
      email:req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      accountStatus: req.body.accountStatus || 'active',
      role: req.body.role || 'student'
    };

    // Check for required fields that might be missing due to FormData not appending empty values
    if (studentData.department === undefined || studentData.department === null || (typeof studentData.department === 'string' && studentData.department.trim() === '')) {
      return res.status(400).json({ message: 'Department is required' });
    }

    // Validate required fields
    const missingField = validateRequired(['fullName', 'studentId', 'department', 'dateOfBirth', 'gender', 'phone', 'email', 'password', 'confirmPassword'], studentData);
    if (missingField) {
      return res.status(400).json({ message: `${missingField} is required` });
    }

    // Additional validation
    const validationErrors = validateStudentData(studentData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    // Ensure password is provided and valid
    if (!studentData.password || typeof studentData.password !== 'string' || studentData.password.trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Check for existing user
    const existingEmail = await findUserByEmail(studentData.email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check for existing student ID in users table; if collision, auto-pick next available
    if (studentData.studentId) {
      const existingStudentIdQuery = 'SELECT 1 FROM users WHERE student_id = $1 LIMIT 1';
      const existingStudentIdResult = await pool.query(existingStudentIdQuery, [studentData.studentId]);
      if (existingStudentIdResult.rows.length > 0) {
        // Auto-resolve by generating the next available ID across users + students
        const nextId = await generateNextAvailableStudentId();
        studentData.studentId = nextId;
      }
    } else {
      // If no ID provided, generate one proactively
      studentData.studentId = await generateNextAvailableStudentId();
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create user first
      const nameParts = studentData.fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      const user = await createUser(firstName, lastName, studentData.email, null, hashedPassword, 'student', studentData.department, studentData.studentId, client);

      // Create student record
      const studentRecord = await createStudent({
        userUuid: user.uuid,
        fullName: studentData.fullName,
        email: studentData.email,
        studentId: studentData.studentId,
        department: studentData.department,
        dateOfBirth: studentData.dateOfBirth,
        gender: studentData.gender,
        phone: studentData.phone,
        parentPhone: studentData.parentPhone,
        address: studentData.address,
        city: studentData.city,
        state: studentData.state,
        postalCode: studentData.postalCode,
        profileImage: studentData.profileImage,
        accountStatus: studentData.accountStatus
      }, client);

      await client.query('COMMIT');

      // Fetch the full student data with user details joined
      const fullStudent = await findStudentById(studentRecord.id);

      // Remove password from response
      const { password, ...userResponse } = user;

      res.status(201).json({
        message: 'Student created successfully',
        user: userResponse,
        student: fullStudent
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating student:', error);
      res.status(500).json({ message: error.message });
    } finally {
      client.release();
    }
  });
};

exports.getAllStudents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const students = await getAllStudents(limit, offset);
    res.json({ students });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { id, userUuid } = req.params;
    let student;
    
    // Support both ID and userUuid
    if (userUuid) {
      student = await findStudentByUserUuid(userUuid);
    } else {
      student = await findStudentById(id);
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove password from response
    const { password, ...studentResponse } = student;
    res.json(studentResponse);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id, userUuid } = req.params;
    
    // Allow students to update their own profile, or admins to update any student
    if (req.user.role === 'student' && req.user.uuid !== userUuid) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }
    
    if (req.user.role !== 'administrator' && req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only administrators and students can update profiles.' });
    }

    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 2MB.' });
          }
        }
        return res.status(400).json({ message: err.message });
      }

      // Find student by ID or userUuid
      let student;
      if (userUuid) {
        student = await findStudentByUserUuid(userUuid);
      } else {
        student = await findStudentById(id);
      }
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const updateData = {
        fullName: req.body.full_name || req.body.fullName,
        email: req.body.email,
        dateOfBirth: req.body.date_of_birth || req.body.dateOfBirth,
        gender: req.body.gender,
        phone: req.body.phone,
        parentPhone: req.body.parent_phone || req.body.parentPhone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postal_code || req.body.postalCode
      };

      // If a new profile image was uploaded, include it in update
      if (req.file && req.file.filename) {
        updateData.profileImage = req.file.filename;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const updatedStudent = await updateStudentModel(student.id, updateData);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(updatedStudent);
    });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    // Check if user is administrator
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can delete students.' });
    }

    const { id } = req.params;

    // Check if student exists
    const student = await findStudentById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete student
    const deletedStudent = await deleteStudentModel(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student deleted successfully',
      student: { id: deletedStudent.id }
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get the next auto-generated Student ID
 * This endpoint is called before showing the add student form
 * Returns the next sequential student ID (e.g., STU00001)
 * Accessible only to administrators
 */
exports.getNextStudentId = async (req, res) => {
  try {
    // Check if user is administrator
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can generate student IDs.' });
    }

    // Use the cross-table generator to avoid collisions with users table
    const nextStudentId = await generateNextAvailableStudentId();
    
    res.json({
      message: 'Next student ID generated successfully',
      studentId: nextStudentId
    });
  } catch (error) {
    console.error('Error generating next student ID:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

