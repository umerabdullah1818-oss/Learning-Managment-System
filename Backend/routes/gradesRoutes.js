const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const { createGrade, updateGrade, getGradesByCourse, getStudentGradesForCourse, getEnrolledStudents, deleteGradesByAssessment, getStudentAllCoursesGrades, getWeightedTotals, updateGradeVisibility, getGradeVisibility } = require('../controller/gradesController');

router.use(verifyJWT);

// Place specific routes BEFORE generic :id routes to avoid conflicts
router.put('/updateGradeVisibility', verifyRole('professor'), updateGradeVisibility);
router.get('/getGradeVisibility/:courseId', getGradeVisibility);
router.get('/weighted-totals/:studentUuid/:courseId', getWeightedTotals);
router.get('/student/:studentUuid/all-courses', getStudentAllCoursesGrades);
router.get('/enrolled/:courseId', verifyRole('professor'), getEnrolledStudents);

// Generic routes AFTER specific routes
router.post('/', verifyRole('professor'), createGrade);
router.put('/:id', verifyRole('professor'), updateGrade);
router.get('/course/:courseId', verifyRole('professor'), getGradesByCourse);
router.get('/student/:studentUuid/course/:courseId', verifyRole('professor'), getStudentGradesForCourse);
router.delete('/assessment/:courseId/:assessmentType/:assessmentId', verifyRole('professor'), deleteGradesByAssessment);

module.exports = router;
