const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
const { getWeights, upsertWeights } = require('../controller/gradingWeightController');

router.use(verifyJWT);
router.get('/:courseId', verifyRole('professor'), getWeights);
router.post('/:courseId', verifyRole('professor'), upsertWeights);

module.exports = router;
