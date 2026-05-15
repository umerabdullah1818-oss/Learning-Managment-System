const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const { getAssessmentWeights, getAssessmentWeight, setAssessmentWeight, deleteAssessmentWeight } = require('../controller/assessmentWeightController');

router.use(verifyJWT);

// GET all assessment weights for a course
router.get('/:courseId', verifyRole('professor'), getAssessmentWeights);

// GET a specific assessment weight
router.get('/:courseId/:assessmentType/:assessmentId', verifyRole('professor'), getAssessmentWeight);

// POST/PUT to set an assessment weight
router.post('/', verifyRole('professor'), setAssessmentWeight);

// DELETE an assessment weight
router.delete('/:courseId/:assessmentType/:assessmentId', verifyRole('professor'), deleteAssessmentWeight);

module.exports = router;
