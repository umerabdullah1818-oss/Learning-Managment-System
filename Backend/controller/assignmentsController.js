const Assignment = require('../models/Assignments');
const Course = require('../models/Course');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/dbConnection');
const Enrollment = require('../models/Enrollment');

// Configure multer for assignment file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/assignments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDF and Word files
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word files are allowed!'), false);
    }
  }
}).single('assignmentFile');

// Wrap upload so multer errors are forwarded to Express error handler
// Also ensure req.body exists for form fields
const uploadMiddleware = (req, res, next) => {
  // Initialize req.body if not present (Multer should do this, but be defensive)
  req.body = req.body || {};
  
  upload(req, res, (err) => {
    if (err) {
      // Multer error or file validation error
      return next(err);
    }
    
    // After Multer, ensure req.body is a plain object with parsed fields
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
    }
    
    console.log('After Multer - req.body:', req.body);
    if (req.file) {
      console.log('After Multer - file:', req.file.fieldname, req.file.filename);
    }
    
    next();
  });
};

// Configure multer for student submission uploads (store in public/submissions)
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/submissions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const submissionUpload = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word files are allowed!'), false);
    }
  }
}).single('submissionFile');

const submissionUploadMiddleware = (req, res, next) => {
  req.body = req.body || {};
  submissionUpload(req, res, (err) => {
    if (err) return next(err);
    if (!req.body || typeof req.body !== 'object') req.body = {};
    console.log('After submission Multer - req.body:', req.body);
    if (req.file) console.log('After submission Multer - file:', req.file.filename);
    next();
  });
};

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private/Professor
const createAssignment = asyncHandler(async (req, res) => {
  const { title, dueDate, status = 'Pending', courseId } = req.body;
  const professorUuid = req.user.uuid; // From JWT token

  // Validate required fields
  if (!title || title.trim() === '') {
    res.status(400);
    throw new Error('Assignment title is required');
  }
  if (!dueDate) {
    res.status(400);
    throw new Error('Due date is required');
  }
  if (!courseId) {
    res.status(400);
    throw new Error('Course is required');
  }

  // Verify course belongs to this professor
  const course = await Course.findCourseById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  if (course.professorUuid !== professorUuid && req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to create assignments for this course');
  }

  // Debug logging for file upload
  let filePath = null;
  if (req.file) {
    filePath = req.file.filename;
    console.log('Assignment file uploaded:', req.file.filename, 'original name:', req.file.originalname);
  } else {
    console.log('No file uploaded for assignment');
  }

  const assignmentData = {
    title: title.trim(),
    dueDate,
    status,
    filePath,
    courseId,
    professorUuid
  };

  const assignment = await Assignment.createAssignment(assignmentData);

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: assignment
  });
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Professor
const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const professorUuid = req.user.uuid;

  // Verify assignment exists and belongs to professor
  const assignment = await Assignment.findAssignmentById(id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  if (assignment.professorUuid !== professorUuid && req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to update this assignment');
  }

  // Prepare update data (support FormData file uploads)
  const updateData = { ...(req.body || {}) };
  console.log('updateAssignment handler - req.body:', req.body);
  console.log('updateAssignment handler - updateData:', updateData);
  if (req.file) {
    // add uploaded filename as filePath
    updateData.filePath = req.file.filename;
    console.log('Assignment file uploaded (update):', req.file.filename);
  }

  console.log('Before calling model updateAssignment - final updateData:', updateData);
  // Update assignment
  const updatedAssignment = await Assignment.updateAssignment(id, updateData);

  if (!updatedAssignment) {
    res.status(400);
    throw new Error('No valid fields provided to update or assignment not found');
  }

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    data: updatedAssignment
  });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Professor
const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const professorUuid = req.user.uuid;

  const assignment = await Assignment.findAssignmentById(id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  if (assignment.professorUuid !== professorUuid && req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to delete this assignment');
  }

  await Assignment.deleteAssignment(id, professorUuid);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully'
  });
});

// @desc    Get assignments for a specific course
// @route   GET /api/assignments/course/:courseId
// @access  Private/Professor/Student
const getAssignmentsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userUuid = req.user.uuid;

  // Verify course exists and is active
  const course = await Course.findCourseById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Check if course is active (especially for students)
  if (req.user.role === 'student' && course.courseStatus !== 'active') {
    res.status(403);
    throw new Error('This course is not active');
  }

  // For professors: check if they own the course
  // For students: check if they are enrolled
  // For admins: allow access
  if (req.user.role === 'professor') {
    if (course.professorUuid !== userUuid && req.user.role !== 'administrator') {
      res.status(403);
      throw new Error('You are not authorized to view assignments for this course');
    }
  } else if (req.user.role === 'student') {
    // Verify student is enrolled in this course (use model helper)
    const enrollment = await Enrollment.isStudentEnrolled(userUuid, courseId);
    console.log('Enrollment check for user', userUuid, 'course', courseId, 'result:', enrollment);
    if (!enrollment || enrollment.status !== 'active') {
      res.status(403);
      throw new Error('You are not enrolled in this course');
    }
  } else if (req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to view assignments for this course');
  }

  // Get assignments for course
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
      c.course_name as "courseName",
      s.id as "submissionId",
      s.file_path as "studentFilePath",
      s.status as "studentSubmissionStatus",
      s.submitted_at as "studentSubmittedAt"
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_uuid = $2
    WHERE a.course_id = $1
    ORDER BY a.due_date ASC;
  `;

  let result;
  try {
    result = await pool.query(query, [courseId, userUuid]);
  } catch (err) {
    // If the submissions table doesn't exist yet, fall back to a query without the join
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
          c.course_code as "courseCode", 
          c.course_name as "courseName"
        FROM assignments a
        LEFT JOIN courses c ON a.course_id = c.id
        WHERE a.course_id = $1
        ORDER BY a.due_date ASC;
      `;
      result = await pool.query(fallbackQuery, [courseId]);
    } else {
      throw err;
    }
  }

  res.status(200).json({
    success: true,
    data: result.rows
  });
});

// @desc    Student submit assignment (upload file)
// @route   POST /api/assignments/:id/submit
// @access  Private (student)
const submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentUuid = req.user.uuid;

  // Verify assignment exists
  const assignment = await Assignment.findAssignmentById(id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Verify student is enrolled in the course
  const enrollment = await Enrollment.isStudentEnrolled(studentUuid, assignment.courseId);
  if (!enrollment || enrollment.status !== 'active') {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  // Ensure file was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('No submission file uploaded');
  }

  const filePath = req.file.filename;

  // Ensure submissions table exists (no separate model file created per request)
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
      student_uuid UUID,
      file_path TEXT,
      status VARCHAR(50),
      submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableQuery);
  // Prevent duplicate submission by same student for the same assignment
  const checkQuery = `SELECT id FROM submissions WHERE assignment_id = $1 AND student_uuid = $2 LIMIT 1;`;
  const checkResult = await pool.query(checkQuery, [id, studentUuid]);
  if (checkResult.rows && checkResult.rows.length > 0) {
    res.status(409);
    throw new Error('You have already submitted this assignment');
  }

  // Insert submission record
  const insertQuery = `
    INSERT INTO submissions (assignment_id, student_uuid, file_path, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, assignment_id as "assignmentId", student_uuid as "studentUuid", file_path as "filePath", status, submitted_at as "submittedAt";
  `;
  // Determine submission status: if upload is after due date, mark as 'Late'
  let computedStatus = 'Submitted';
  try {
    if (assignment.dueDate) {
      const due = new Date(assignment.dueDate);
      const now = new Date();
      if (now > due) computedStatus = 'Late';
    }
  } catch (err) {
    console.warn('Could not compute dueDate comparison, defaulting to Submitted', err);
  }

  const submissionStatus = (req.body.submissionStatus) ? req.body.submissionStatus : computedStatus;
  const insertValues = [id, studentUuid, filePath, submissionStatus];
  const result = await pool.query(insertQuery, insertValues);

  res.status(201).json({
    success: true,
    message: 'Submission saved successfully',
    data: result.rows[0]
  });
});

// @desc    Get all submissions for an assignment (professor only)
// @route   GET /api/assignments/:id/submissions
// @access  Private/Professor
const getSubmissionsForAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const professorUuid = req.user.uuid;

  // Verify assignment exists and belongs to professor
  const assignment = await Assignment.findAssignmentById(id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  if (assignment.professorUuid !== professorUuid && req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to view submissions for this assignment');
  }

  // Ensure submissions table exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
      student_uuid UUID,
      file_path TEXT,
      status VARCHAR(50),
      submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableQuery);

  // Get all submissions for this assignment with student details
  const query = `
    SELECT 
      s.id,
      s.assignment_id as "assignmentId",
      s.student_uuid as "studentUuid",
      s.file_path as "filePath",
      s.status,
      s.submitted_at as "submittedAt",
      u.first_name as "studentFirstName",
      u.last_name as "studentLastName",
      u.email as "studentEmail",
      st.student_id as "studentId"
    FROM submissions s
    LEFT JOIN users u ON s.student_uuid = u.uuid
    LEFT JOIN students st ON s.student_uuid = st.user_uuid
    WHERE s.assignment_id = $1
    ORDER BY s.submitted_at DESC;
  `;

  const result = await pool.query(query, [id]);

  res.status(200).json({
    success: true,
    data: {
      assignment: assignment,
      submissions: result.rows
    }
  });
});

/**
 * @desc    Get all assignments for student's currently enrolled courses
 * @route   GET /api/assignments/student/enrolled
 * @access  Private (student)
 * @details Only includes assignments from courses with 'active' enrollment status
 *          Excludes dropped, completed, or inactive courses automatically
 *          Includes submission status if student has submitted
 */
const getStudentEnrolledAssignments = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;
  const userRole = req.user.role;

  if (userRole !== 'student' && userRole !== 'administrator') {
    res.status(403);
    throw new Error('Only students can view their enrolled course assignments');
  }

  try {
    const assignments = await Assignment.findAssignmentsByEnrolledCourses(studentUuid);

    if (!assignments || assignments.length === 0) {
      const enrollmentQuery = `SELECT COUNT(*) as count FROM enrollments WHERE user_uuid = $1;`;
      const enrollmentResult = await pool.query(enrollmentQuery, [studentUuid]);
      const hasAnyEnrollment = parseInt(enrollmentResult.rows[0].count, 10) > 0;

      return res.status(200).json({
        success: true,
        data: [],
        message: hasAnyEnrollment ? 'No assignments available for your current courses.' : 'You are not enrolled in any courses yet.',
        hasActiveEnrollments: false
      });
    }

    const assignmentsArray = assignments.map(a => ({
      id: a.id,
      uuid: a.uuid,
      title: a.title,
      dueDate: a.dueDate,
      status: a.status,
      filePath: a.filePath,
      courseId: a.courseId,
      courseCode: a.courseCode,
      courseName: a.courseName,
      courseStatus: a.courseStatus,
      enrollmentStatus: a.enrollmentStatus,
      enrollmentDate: a.enrollmentDate,
      professorName: a.professorName,
      professorUuid: a.professorUuid,
      submissionId: a.submissionId,
      studentFilePath: a.studentFilePath,
      studentSubmissionStatus: a.studentSubmissionStatus,
      studentSubmittedAt: a.studentSubmittedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }));

    const assignmentsByCourseId = Object.values(assignmentsArray.reduce((acc, cur) => {
      if (!acc[cur.courseId]) acc[cur.courseId] = { courseId: cur.courseId, courseCode: cur.courseCode, courseName: cur.courseName, professorName: cur.professorName, assignments: [] };
      acc[cur.courseId].assignments.push(cur);
      return acc;
    }, {}));

    return res.status(200).json({
      success: true,
      data: assignmentsArray,
      dataByC: assignmentsByCourseId,
      count: assignmentsArray.length,
      message: `Found ${assignmentsArray.length} assignment(s) for your active courses`,
      hasActiveEnrollments: true
    });
  } catch (err) {
    console.error('Error fetching student enrolled assignments:', err);
    res.status(500);
    throw new Error('Failed to fetch assignments for enrolled courses');
  }
});

// @desc    Get all assignments for a professor
// @route   GET /api/assignments/professor/:professorUuid
// @access  Private/Professor
const getAssignmentsByProfessor = asyncHandler(async (req, res) => {
  const { professorUuid } = req.params;
  const requestingUserUuid = req.user.uuid;

  // Verify professor can only access their own assignments
  if (professorUuid !== requestingUserUuid && req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to view these assignments');
  }

  const assignments = await Assignment.findAssignmentsByProfessorId(professorUuid);

  res.status(200).json({
    success: true,
    data: assignments
  });
});

// @desc    Get single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private/Professor
const getAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const professorUuid = req.user.uuid;

  const assignment = await Assignment.findAssignmentById(id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Verify authorization
  if (assignment.professorUuid !== professorUuid && req.user.role !== 'administrator') {
    res.status(403);
    throw new Error('You are not authorized to view this assignment');
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});

// @desc    Update assignment status
// @route   PUT /api/assignments/:id/status
// @access  Private/Professor
const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const professorUuid = req.user.uuid;

  // Validate status
  const validStatuses = ['Pending', 'Submitted', 'Late', 'Graded'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const assignment = await Assignment.updateAssignmentStatus(id, professorUuid, status);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found or you are not authorized');
  }

  res.status(200).json({
    success: true,
    message: 'Assignment status updated successfully',
    data: assignment
  });
});

module.exports = {
  createAssignment,
  getAssignmentsByProfessor,
  getAssignment,
  updateAssignmentStatus,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCourse,
  submitAssignment,
  getSubmissionsForAssignment,
  getStudentEnrolledAssignments,
  upload: uploadMiddleware,
  submissionUpload: submissionUploadMiddleware
};
