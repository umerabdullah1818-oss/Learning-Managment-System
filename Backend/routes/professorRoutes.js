const express = require('express');
const router = express.Router();
const { addProfessor, getAllProfessors, getProfessorById, updateProfessor, deleteProfessor, upload, getProfessorCourses, getEnrolledStudents, getProfessorDashboard, getNextEmployeeId } = require('../controller/professorController');
const verifyJWT = require('../middleware/verifyJWT');

// Routes for professor management
// Get next auto-generated Employee ID (admin only) - must be before :id routes
router.get('/generate/next-id', verifyJWT, getNextEmployeeId);

router.post('/', verifyJWT, upload, addProfessor);
router.get('/', verifyJWT, getAllProfessors);
router.get('/courses/assigned', verifyJWT, getProfessorCourses);
router.get('/dashboard', verifyJWT, getProfessorDashboard);
router.get('/user/:userUuid', verifyJWT, getProfessorById);
router.put('/user/:userUuid', verifyJWT, upload, updateProfessor);
router.get('/:id', verifyJWT, getProfessorById);
router.put('/:id', verifyJWT, upload, updateProfessor);
router.delete('/:id', verifyJWT, deleteProfessor);

module.exports = router;
