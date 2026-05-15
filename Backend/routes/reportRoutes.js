const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const { calculateStudentCourseGrade, calculateCourseGrades, getStudentCourseGrade } = require('../controller/reportController');

router.use(verifyJWT);
// Professors can trigger course-wide calculation
router.post('/course/:courseId', verifyRole('professor'), calculateCourseGrades);
// Professors can trigger for a single student
router.post('/student/:studentUuid/course/:courseId', verifyRole('professor'), calculateStudentCourseGrade);
// Students can fetch their own summary
router.get('/student/:studentUuid/course/:courseId', getStudentCourseGrade);

module.exports = router;
