const express = require('express');
const router = express.Router();
const {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    getDepartmentByCode,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
} = require('../controller/departmentController');

// Routes for departments

// Create a new department
router.post('/', createDepartment);

// Get all departments (with optional filters)
router.get('/', getAllDepartments);

// Get department statistics
router.get('/stats', getDepartmentStats);

// Get department by ID
router.get('/:id', getDepartmentById);

// Get department by code
router.get('/code/:code', getDepartmentByCode);

// Update department
router.put('/:id', updateDepartment);

// Delete department
router.delete('/:id', deleteDepartment);

module.exports = router;
