const Department = require('../models/Departments');

// Create a new department
const createDepartment = async (req, res) => {
    try {
        const departmentData = {
            departmentName: req.body.departmentName,
            departmentCode: req.body.departmentCode,
            establishedYear: req.body.establishedYear,
            departmentStatus: req.body.departmentStatus || 'active',
            description: req.body.description,
            headName: req.body.headName,
            headTitle: req.body.headTitle || 'Professor',
            headEmail: req.body.headEmail,
            headPhone: req.body.headPhone,
            officeLocation: req.body.officeLocation,
            appointmentDate: req.body.appointmentDate,
            currentStudents: req.body.currentStudents || 0,
            maxCapacity: req.body.maxCapacity,
            facultyCount: req.body.facultyCount || 0,
        };

        const departmentId = await Department.create(departmentData);
        const newDepartment = await Department.findById(departmentId);

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: newDepartment
        });
    } catch (error) {
        console.error('Error creating department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Department code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create department',
            error: error.message
        });
    }
};

// Get all departments
const getAllDepartments = async (req, res) => {
    try {
        const { status, search } = req.query;
        let departments;

        if (status) {
            departments = await Department.findByStatus(status);
        } else if (search) {
            departments = await Department.search(search);
        } else {
            departments = await Department.findAll();
        }

        // Convert department objects to plain objects for JSON response
        const departmentData = departments.map(dept => ({
            id: dept.id,
            departmentName: dept.departmentName,
            departmentCode: dept.departmentCode,
            establishedYear: dept.establishedYear,
            departmentStatus: dept.departmentStatus,
            description: dept.description,
            headName: dept.headName,
            headTitle: dept.headTitle,
            headEmail: dept.headEmail,
            headPhone: dept.headPhone,
            officeLocation: dept.officeLocation,
            appointmentDate: dept.appointmentDate,
            currentStudents: dept.currentStudents,
            maxCapacity: dept.maxCapacity,
            facultyCount: dept.facultyCount,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt
        }));

        res.status(200).json({
            success: true,
            count: departments.length,
            data: departmentData
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments',
            error: error.message
        });
    }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department',
            error: error.message
        });
    }
};

// Get department by code
const getDepartmentByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const department = await Department.findByCode(code);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department',
            error: error.message
        });
    }
};

// Update department
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if department exists
        const existingDepartment = await Department.findById(id);
        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const updated = await Department.update(id, updateData);

        if (updated) {
            const updatedDepartment = await Department.findById(id);
            res.status(200).json({
                success: true,
                message: 'Department updated successfully',
                data: updatedDepartment
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update department'
            });
        }
    } catch (error) {
        console.error('Error updating department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Department code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update department',
            error: error.message
        });
    }
};

// Delete department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department exists
        const existingDepartment = await Department.findById(id);
        if (!existingDepartment) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const deleted = await Department.delete(id);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'Department deleted successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete department'
            });
        }
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete department',
            error: error.message
        });
    }
};

// Get department statistics
const getDepartmentStats = async (req, res) => {
    try {
        const stats = await Department.getStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching department stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department statistics',
            error: error.message
        });
    }
};

module.exports = {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    getDepartmentByCode,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
};
