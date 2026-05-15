const Course = require('../models/Course');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/dbConnection'); 


// Configure multer for course image uploads
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
    cb(null, 'course-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).fields([
  { name: 'courseImage', maxCount: 1 },
  { name: 'courseCode', maxCount: 1 },
  { name: 'courseName', maxCount: 1 },
  { name: 'department', maxCount: 1 },
  { name: 'professorUuid', maxCount: 1 },
  { name: 'description', maxCount: 1 },
  { name: 'credits', maxCount: 1 },
  { name: 'duration', maxCount: 1 },
  { name: 'maxStudents', maxCount: 1 },
  { name: 'prerequisites', maxCount: 1 },
  { name: 'semester', maxCount: 1 },
  { name: 'courseType', maxCount: 1 },
  { name: 'classDays', maxCount: 1 },
  { name: 'startTime', maxCount: 1 },
  { name: 'endTime', maxCount: 1 },
  { name: 'classroom', maxCount: 1 },
  { name: 'status', maxCount: 1 },
  { name: 'enrollmentType', maxCount: 1 },
  { name: 'onlineAvailable', maxCount: 1 },
  { name: 'certificateOffered', maxCount: 1 },
  { name: 'recordedLectures', maxCount: 1 },
  { name: 'courseFee', maxCount: 1 },
  { name: 'labFee', maxCount: 1 },
  { name: 'materialFee', maxCount: 1 }
]);

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res) => {
  console.log('🔍 DEBUG: createCourse called');
  console.log('📁 DEBUG: req.files:', req.files ? Object.keys(req.files) : 'no files');
  console.log('📋 DEBUG: req.body:', Object.keys(req.body));
  
  const {
    courseCode,
    courseName,
    department,
    professorUuid,
    description,
    credits,
    duration,
    maxStudents,
    prerequisites,
    semester,
    courseType,
    classDays,
    startTime,
    endTime,
    classroom,
    status,
    enrollmentType,
    onlineAvailable,
    certificateOffered,
    recordedLectures,
    courseFee,
    labFee,
    materialFee
  } = req.body;

  // Validate required fields
  if (!courseCode || courseCode.trim() === '') {
    res.status(400);
    throw new Error('Course code is required');
  }
  if (!courseName || courseName.trim() === '') {
    res.status(400);
    throw new Error('Course name is required');
  }
  if (!department || department.trim() === '') {
    res.status(400);
    throw new Error('Department is required');
  }
  if (!professorUuid || professorUuid.trim() === '') {
    res.status(400);
    throw new Error('Professor is required');
  }

  // Check if course code already exists
  const existingCourse = await Course.findCourseByCode(courseCode);
  if (existingCourse) {
    res.status(400);
    throw new Error('Course code already exists');
  }

  // Handle course image
  let courseImage = null;
  if (req.files && req.files.courseImage && req.files.courseImage[0]) {
    courseImage = req.files.courseImage[0].filename;
    console.log('✅ DEBUG: Course image found:', courseImage);
  } else {
    console.log('❌ DEBUG: No course image in req.files');
  }

  // Parse classDays from comma-separated string to array
  let classDaysArray = [];
  if (classDays) {
    classDaysArray = classDays.split(',').map(day => day.trim()).filter(day => day);
  }

  // Helper function to parse numeric values safely
  const parseNumeric = (value, defaultValue) => {
    if (value === '' || value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to parse integer values safely
  const parseIntSafe = (value, defaultValue) => {
    if (value === '' || value === null || value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const courseData = {
    courseCode,
    courseName,
    department,
    professorUuid: professorUuid && professorUuid !== '' ? professorUuid : null,
    courseDescription: description,
    credits: parseIntSafe(credits, 3),
    duration: parseIntSafe(duration, 16),
    maxStudents: parseIntSafe(maxStudents, 30),
    prerequisites,
    semester,
    courseType,
    classDays: classDaysArray,
    startTime,
    endTime,
    classroom,
    courseImage,
    courseStatus: status || 'active',
    enrollmentType: enrollmentType || 'open',
    onlineAvailable: onlineAvailable === 'true' || onlineAvailable === true,
    certificateOffered: certificateOffered === 'true' || certificateOffered === true,
    recordedLectures: recordedLectures === 'true' || recordedLectures === true,
    courseFee: parseNumeric(courseFee, 0.00),
    labFee: parseNumeric(labFee, 0.00),
    materialFee: parseNumeric(materialFee, 0.00),
    createdBy: req.user.id // Track who created the course
  };

  const course = await Course.createCourse(courseData);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course
  });
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const page = Math.floor(offset / limit) + 1;

  const filters = {};
  if (req.query.department) filters.department = req.query.department;
  if (req.query.semester) filters.semester = req.query.semester;
  if (req.query.courseType) filters.courseType = req.query.courseType;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.search) filters.search = req.query.search;

  // For students, only show active courses available for enrollment
  // For admins, show all courses regardless of status unless specifically filtered
  if (req.user.role !== 'administrator') {
    filters.status = 'active';
    filters.createdBy = 'administrator';
  }
  // Note: For admins, we don't set a default status filter so all statuses are shown

  console.log('getCourses params:', { page, limit, offset, filters }); // DEBUG

  const { rows, total } = await Course.getAllCourses(limit, offset, filters);

  console.log('getAllCourses result:', { rowsCount: rows.length, total }); // DEBUG

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total: total
    }
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findCourseById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findCourseById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if course code is being changed and if it already exists
  if (req.body.courseCode && req.body.courseCode !== course.courseCode) {
    const existingCourse = await Course.findCourseByCode(req.body.courseCode);
    if (existingCourse) {
      res.status(400);
      throw new Error('Course code already exists');
    }
  }

  // If upload middleware was used, multer places files in req.files
  // If a new course image was uploaded, set it on req.body so updateCourse will persist it
  try {
    if (req.files && req.files.courseImage && req.files.courseImage[0]) {
      req.body.courseImage = req.files.courseImage[0].filename;
      console.log('✅ DEBUG: updateCourse - new courseImage set on req.body:', req.body.courseImage);
    }
  } catch (e) {
    // ignore
  }

  // Normalize classDays: if client sent a JSON string or comma-separated string, convert to array
  if (req.body.classDays) {
    if (typeof req.body.classDays === 'string') {
      try {
        const parsed = JSON.parse(req.body.classDays);
        if (Array.isArray(parsed)) {
          req.body.classDays = parsed;
        } else {
          req.body.classDays = String(req.body.classDays).split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        req.body.classDays = String(req.body.classDays).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }

  const updatedCourse = await Course.updateCourse(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: updatedCourse
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findCourseById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  await Course.deleteCourse(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});

const getCoursesByProfessor = asyncHandler(async (req, res) => {
  try {
    const professorId = req.params.professorId;
    if (!professorId || professorId.trim() === '') {
      console.error('Validation error: Professor ID is missing or empty');
      res.status(400);
      throw new Error('Professor ID is required and cannot be empty');
    }

    console.log('Fetching courses for professor:', professorId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Additional validation for professorId format (UUID v4 regex)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(professorId)) {
      console.error('Validation error: Invalid Professor ID format', professorId);
      res.status(400);
      throw new Error('Invalid Professor ID format');
    }

    // Check if professor exists in the database
    const professorCheck = await pool.query('SELECT 1 FROM professors WHERE user_uuid = $1 LIMIT 1', [professorId]);
    if (professorCheck.rowCount === 0) {
      console.error('Professor not found for ID:', professorId);
      res.status(404);
      throw new Error('Professor not found');
    }

    const courses = await Course.getCoursesByProfessor(professorId, limit, offset);

    console.log(`Courses fetched for professor ${professorId}:`, courses.length);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total: courses.length
      }
    });
  } catch (error) {
    console.error('Error fetching courses by professor:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch courses by professor'
    });
  }
});

// @desc    Get courses by department
// @route   GET /api/courses/department/:department
// @access  Private
const getCoursesByDepartment = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const courses = await Course.getCoursesByDepartment(req.params.department, limit, offset);

  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      page,
      limit,
      total: courses.length
    }
  });
});

// @desc    Get courses assigned to the authenticated professor
// @route   GET /api/courses/assigned
// @access  Private/Professor
const getAssignedCourses = asyncHandler(async (req, res) => {
  try {
    // Get professor UUID from the JWT token (attached by verifyJWT middleware)
    const professorUuid = req.user?.uuid;

    if (!professorUuid) {
      res.status(401);
      throw new Error('Unauthorized: Professor ID not found in token');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch courses for this professor
    const courses = await Course.getCoursesByProfessor(professorUuid, limit, offset);

    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching assigned courses:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch assigned courses'
    });
  }
});

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  getCoursesByProfessor,
  getCoursesByDepartment,
  getAssignedCourses,
  upload
};
