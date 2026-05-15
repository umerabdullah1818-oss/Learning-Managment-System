const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  getCoursesByProfessor,
  getCoursesByDepartment,
  getAssignedCourses,
  upload
} = require('../controller/courseController');

const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');

// All routes require authentication
router.use(verifyJWT);

// Admin only routes
router.post('/', upload, verifyAdmin, createCourse);
// Allow file upload when updating a course (courseImage)
router.put('/:id', upload, verifyAdmin, updateCourse);
router.delete('/:id', verifyAdmin, deleteCourse);

// All authenticated users can GET courses
router.get('/', getCourses);
// Get courses assigned to authenticated professor
router.get('/assigned', getAssignedCourses);
// Specific routes before dynamic id route
router.get('/professor/:professorId',getCoursesByProfessor);
router.get('/department/:department', getCoursesByDepartment);
router.get('/:id', getCourse);

module.exports = router;
