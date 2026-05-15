const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyStudent = require('../middleware/verifyStudent');
const {
  getStudentDashboardStats,
  getStudentCourses,
  getStudentUpcomingAssignments,
  getStudentGradesSummary,
  getStudentAttendance,
  getStudentRecentActivities
} = require('../controller/studentDashboardController');

// All student dashboard routes require authentication and student role
router.use(verifyJWT);
router.use(verifyStudent);

// @route GET /api/student/dashboard/stats
router.get('/stats', getStudentDashboardStats);

// @route GET /api/student/dashboard/courses
router.get('/courses', getStudentCourses);

// @route GET /api/student/dashboard/assignments
router.get('/assignments', getStudentUpcomingAssignments);

// @route GET /api/student/dashboard/grades
router.get('/grades', getStudentGradesSummary);

// @route GET /api/student/dashboard/attendance
router.get('/attendance', getStudentAttendance);

// @route GET /api/student/dashboard/activities
router.get('/activities', getStudentRecentActivities);

module.exports = router;
