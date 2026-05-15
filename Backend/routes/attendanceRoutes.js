const express = require('express');
const {
  getStudentAttendance,
  getStudentAttendanceStats,
  markAttendance,
  getCourseAttendance,
  getClassStatistics,
  requestCorrection,
  getAllCorrections,
  getPendingCorrections,
  approveCorrection,
  rejectCorrection,
  getStudentCorrections,
  updateAttendance,
} = require('../controller/attendanceController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyStudent = require('../middleware/verifyStudent');
const verifyRole = require('../middleware/verifyRole');

const router = express.Router();

// Student routes
router.get('/student/course/:courseId', verifyJWT, verifyStudent, getStudentAttendance);
router.get('/student/stats/:courseId', verifyJWT, verifyStudent, getStudentAttendanceStats);
router.get('/student/corrections', verifyJWT, verifyStudent, getStudentCorrections);
router.post('/student/request-correction', verifyJWT, verifyStudent, requestCorrection);

// Professor routes
router.post('/professor/mark/:courseId', verifyJWT, verifyRole('professor'), markAttendance);
router.get('/professor/course/:courseId', verifyJWT, verifyRole('professor'), getCourseAttendance);
router.get('/professor/stats/:courseId', verifyJWT, verifyRole('professor'), getClassStatistics);
router.get('/professor/corrections/:courseId', verifyJWT, verifyRole('professor'), getAllCorrections);
router.get('/professor/pending-corrections/:courseId', verifyJWT, verifyRole('professor'), getPendingCorrections);
router.put('/professor/approve-correction/:correctionId', verifyJWT, verifyRole('professor'), approveCorrection);
router.put('/professor/reject-correction/:correctionId', verifyJWT, verifyRole('professor'), rejectCorrection);

// Update individual attendance record
router.put('/professor/update/:attendanceId', verifyJWT, verifyRole('professor'), updateAttendance);

module.exports = router;
