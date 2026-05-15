const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignmentsByProfessor,
  getAssignment,
  updateAssignmentStatus,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCourse,
  upload,
  submissionUpload,
  submitAssignment,
  getSubmissionsForAssignment,
  getStudentEnrolledAssignments
} = require('../controller/assignmentsController');

const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');

// All routes require authentication
router.use(verifyJWT);

// Get assignments for student's currently enrolled courses (must be before other GET routes)
router.get('/student/enrolled', getStudentEnrolledAssignments);

// Create assignment (professor only)
router.post('/', verifyRole('professor'), upload, createAssignment);

// Get assignments by professor
router.get('/professor/:professorUuid', getAssignmentsByProfessor);

// Get assignments by course
router.get('/course/:courseId', getAssignmentsByCourse);

// Get submissions for an assignment (professor only)
router.get('/:id/submissions', getSubmissionsForAssignment);

// Student submit assignment (authenticated students)
router.post('/:id/submit', submissionUpload, submitAssignment);

// Get single assignment
router.get('/:id', getAssignment);

// Update assignment status (professor only)
router.put('/:id/status', verifyRole('professor'), updateAssignmentStatus);

// Update assignment (professor only)
router.put('/:id', verifyRole('professor'), upload, updateAssignment);

// Delete assignment (professor only)
router.delete('/:id', verifyRole('professor'), deleteAssignment);

module.exports = router;
