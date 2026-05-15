const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const { upsertFinalGrades, getFinalGradesByCourse, getFinalGradesByStudent } = require('../controller/finalGradesController');

router.use(verifyJWT);
router.post('/', verifyRole('professor'), upsertFinalGrades);
router.get('/course/:courseId', verifyRole('professor'), getFinalGradesByCourse);
// student summary - allows authenticated student to fetch their final grades summary
router.get('/student/:studentUuid/summary', getFinalGradesByStudent);

module.exports = router;
