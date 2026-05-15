const { createProfessor, generateNextEmployeeId, findProfessorById, findProfessorByEmail, findProfessorByEmployeeId, findProfessorByUsername, findProfessorByUserUuid, getAllProfessors: getAllProfessorsModel, updateProfessor: updateProfessorModel, deleteProfessor: deleteProfessorModel } = require('../models/Professor');
const { createUser, findUserByEmail, findUserByUsername } = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/dbConnection');
const bcrypt = require('bcryptjs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'professor-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).fields([{ name: 'profilePhoto', maxCount: 1 }]);

const addProfessor = async (req, res) => {
  try {
    const {
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
      username,
      password
    } = req.body;

    // Validate phone number (must be at least 10 digits)
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    // Check if professor already exists
    const existingEmail = await findProfessorByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Professor with this email already exists' });
    }

    const existingEmployeeId = await findProfessorByEmployeeId(employeeId);
    if (existingEmployeeId) {
      return res.status(400).json({ message: 'Professor with this employee ID already exists' });
    }

    const existingUsername = await findProfessorByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Professor with this username already exists' });
    }

    // Check if user already exists
    const existingUserEmail = await findUserByEmail(email);
    if (existingUserEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingUserUsername = await findUserByUsername(username);
    if (existingUserUsername) {
      return res.status(400).json({ message: 'User with this username already exists' });
    }

    // Validate required fields
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Handle file upload
    let profileImage = null;
    if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
      profileImage = req.files.profilePhoto[0].filename;
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create user first
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createUser(firstName, lastName, email, username, hashedPassword, 'professor', department, null, client);

      // Create professor
      const professorData = {
        userUuid: user.uuid,
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
        salary: salary ? parseFloat(salary) : null,
        highestDegree,
        specialization,
        university,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        experience: experience ? parseInt(experience) : null,
        office,
        officeHours,
        subjects,
        bio,
        profileImage,
        username,
        password
      };

      const newProfessor = await createProfessor(professorData, client);

      await client.query('COMMIT');

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.status(201).json({
        message: 'Professor added successfully',
        user: userResponse,
        professor: newProfessor
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding professor:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAllProfessors = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const professors = await getAllProfessorsModel(parseInt(limit), parseInt(offset));
    res.json(professors);
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProfessorById = async (req, res) => {
  try {
    const { id, userUuid } = req.params;
    let professor;
    
    // Support both ID and userUuid
    if (userUuid) {
      professor = await findProfessorByUserUuid(userUuid);
    } else {
      professor = await findProfessorById(id);
    }
    
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    res.json(professor);
  } catch (error) {
    console.error('Error fetching professor:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateProfessor = async (req, res) => {
  try {
    const { id, userUuid } = req.params;
    
    // Allow professors to update their own profile, or admins to update any professor
    if (req.user.role === 'professor' && req.user.uuid !== userUuid) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }
    
    if (req.user.role !== 'administrator' && req.user.role !== 'professor') {
      return res.status(403).json({ message: 'Access denied. Only administrators and professors can update profiles.' });
    }

    const updateData = req.body;

    // Validate phone number if provided (must be at least 10 digits)
    if (updateData.phone && updateData.phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    // Handle file upload for profile image update
    if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
      updateData.profileImage = req.files.profilePhoto[0].filename;
    }

    // Parse numeric fields, handle empty strings
    if (updateData.salary !== undefined) {
      updateData.salary = updateData.salary === '' ? null : parseFloat(updateData.salary);
    }
    if (updateData.graduationYear !== undefined) {
      updateData.graduationYear = updateData.graduationYear === '' ? null : parseInt(updateData.graduationYear);
    }
    if (updateData.experience !== undefined) {
      updateData.experience = updateData.experience === '' ? null : parseInt(updateData.experience);
    }

    // Find professor by ID or userUuid
    let professor;
    if (userUuid) {
      professor = await findProfessorByUserUuid(userUuid);
    } else {
      professor = await findProfessorById(id);
    }
    
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }

    const updatedProfessor = await updateProfessorModel(professor.id, updateData);
    if (!updatedProfessor) {
      return res.status(404).json({ message: 'Professor not found' });
    }

    res.json(updatedProfessor);
  } catch (error) {
    console.error('Error updating professor:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProfessor = await deleteProfessorModel(id);
    if (!deletedProfessor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    res.json({ message: 'Professor deleted successfully' });
  } catch (error) {
    console.error('Error deleting professor:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProfessorCourses = async (req, res) => {
  try {
    // Get professor UUID from JWT token
    const professorUuid = req.user.uuid;
    
    const query = `
      SELECT
        c.id,
        c.course_code as "courseCode",
        c.course_name as "courseName",
        c.department,
        c.credits,
        c.semester,
        c.course_type as "courseType",
        c.course_status as "courseStatus",
        COALESCE(e.enrolled_count, 0) as "enrolledStudents"
      FROM courses c
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM enrollments
        WHERE status = 'active'
        GROUP BY course_id
      ) e ON c.id = e.course_id
      WHERE c.professor_uuid = $1 AND c.course_status = 'active'
      ORDER BY c.created_at DESC
    `;
    
    const result = await pool.query(query, [professorUuid]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching professor courses:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/professors/dashboard
// Returns aggregated data for professor dashboard: courses, upcoming assignments, pending submissions
const getProfessorDashboard = async (req, res) => {
  try {
    const professorUuid = req.user.uuid;

    // 1) Courses assigned (reuse query pattern from getProfessorCourses)
    const coursesQuery = `
      SELECT
        c.id,
        c.course_code as "courseCode",
        c.course_name as "courseName",
        c.department,
        c.credits,
        c.semester,
        c.course_type as "courseType",
        c.course_status as "courseStatus",
        COALESCE(e.enrolled_count, 0) as "enrolledStudents"
      FROM courses c
      LEFT JOIN (
        SELECT course_id, COUNT(*) as enrolled_count
        FROM enrollments
        WHERE status = 'active'
        GROUP BY course_id
      ) e ON c.id = e.course_id
      WHERE c.professor_uuid = $1 AND c.course_status = 'active'
      ORDER BY c.created_at DESC
    `;

    const coursesResult = await pool.query(coursesQuery, [professorUuid]);
    const courses = coursesResult.rows || [];

    // 2) Upcoming assignments (next 5)
    const upcomingQuery = `
      SELECT a.id, a.title, a.due_date as "dueDate", a.course_id as "courseId", c.course_name as "courseName"
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.professor_uuid = $1 AND (a.due_date IS NULL OR a.due_date >= NOW())
      ORDER BY a.due_date ASC NULLS LAST
      LIMIT 5
    `;
    const upcomingResult = await pool.query(upcomingQuery, [professorUuid]);
    const upcomingAssignments = upcomingResult.rows || [];

    // 3) Pending submissions count (submissions not graded) across professor's assignments
    let pendingSubmissions = 0;
    try {
      const pendingQuery = `
        SELECT COUNT(*)::int as count
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE a.professor_uuid = $1 AND (s.status IS NULL OR LOWER(s.status) != 'graded')
      `;
      const pendingResult = await pool.query(pendingQuery, [professorUuid]);
      pendingSubmissions = (pendingResult.rows && pendingResult.rows[0] && pendingResult.rows[0].count) || 0;
    } catch (err) {
      // If submissions table doesn't exist, treat as zero
      console.warn('Could not compute pending submissions:', err.message || err);
      pendingSubmissions = 0;
    }

    // 4) Basic totals
    const totals = {
      totalCourses: courses.length,
      upcomingCount: upcomingAssignments.length,
      pendingSubmissions
    };

    res.json({ totals, courses, upcomingAssignments });
  } catch (error) {
    console.error('Error building professor dashboard:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get the next auto-generated Employee ID
 * This endpoint is called before showing the add professor form
 * Returns the next sequential employee ID (e.g., EMP00001)
 * Accessible only to administrators
 */
const getNextEmployeeId = async (req, res) => {
  try {
    // Check if user is administrator
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Access denied. Only administrators can generate employee IDs.' });
    }

    const nextEmployeeId = await generateNextEmployeeId();
    
    res.json({
      message: 'Next employee ID generated successfully',
      employeeId: nextEmployeeId
    });
  } catch (error) {
    console.error('Error generating next employee ID:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  addProfessor,
  getAllProfessors,
  getProfessorById,
  updateProfessor,
  deleteProfessor,
  getProfessorCourses,
  getProfessorDashboard,
  getNextEmployeeId,
  upload
};
