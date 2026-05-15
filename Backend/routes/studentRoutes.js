const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getNextStudentId
} = require('../controller/studentController');

// All student routes require authentication
router.use(verifyJWT);

// Get next auto-generated Student ID (admin only) - must be before :id routes
router.get('/generate/next-id', verifyAdmin, getNextStudentId);

// Create a new student (admin only)
router.post('/', verifyAdmin, createStudent);

// Get all students (admin only)
router.get('/', verifyAdmin, getAllStudents);

// Get student by userUuid
router.get('/user/:userUuid', getStudentById);

// Get student by ID
router.get('/:id', getStudentById);

// Update student by ID (admin only)
router.put('/:id', verifyAdmin, updateStudent);

// Update student by userUuid (self or admin)
router.put('/user/:userUuid', updateStudent);

// Delete student by ID (admin only)
router.delete('/:id', verifyAdmin, deleteStudent);

module.exports = router;
