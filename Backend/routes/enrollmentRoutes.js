const express = require('express');
const router = express.Router();
const {
  enrollStudent,
  unenrollStudent,
  getStudentEnrollments,
  getCourseEnrollments,
  checkEnrollment
} = require('../controller/enrollmentController');

const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');
const verifyStudent = require('../middleware/verifyStudent');

// All routes require authentication
router.use(verifyJWT);

// Student routes - allow both student role and any authenticated user
router.post('/', verifyStudent, enrollStudent);
router.delete('/:id', verifyStudent, unenrollStudent);
router.get('/student', getStudentEnrollments);  // Allow any authenticated user
// Alias used by frontend: return the same as `/student`
router.get('/student-courses', getStudentEnrollments);
router.get('/check/:courseId', checkEnrollment);  // Allow any authenticated user

// Admin/Professor routes for viewing enrollments
// Allow both administrators and professors to view course enrollments
router.get('/course/:courseId', (req, res, next) => {
  try {
    const role = req.user && req.user.role;
    if (role === 'administrator' || role === 'professor') return next();
    return res.status(403).json({ message: 'Access denied. Administrator or Professor role required.' });
  } catch (err) {
    return res.status(403).json({ message: 'Access denied' });
  }
}, getCourseEnrollments);

module.exports = router;
