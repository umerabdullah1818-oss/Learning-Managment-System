const db = require('../config/dbConnection');

class Department {
    constructor(data) {
        this.id = data.id;
        this.departmentName = data.departmentname;
        this.departmentCode = data.departmentcode;
        this.establishedYear = data.establishedyear;
        this.departmentStatus = data.departmentstatus;
        this.description = data.description;
        this.headName = data.headname;
        this.headTitle = data.headtitle;
        this.headEmail = data.heademail;
        this.headPhone = data.headphone;
        this.officeLocation = data.officelocation;
        this.appointmentDate = data.appointmentdate;
        this.currentStudents = data.currentstudents;
        this.maxCapacity = data.maxcapacity;
        this.facultyCount = data.facultycount;
        this.budgetYear = data.budgetyear;
        this.allowOnlineApplication = data.allowonlineapplication;
        this.enableNotifications = data.enablenotifications;
        this.publiclyVisible = data.publiclyvisible;
        this.departmentWebsite = data.departmentwebsite;
        this.socialMedia = data.socialmedia;
        this.createdAt = data.createdat;
        this.updatedAt = data.updatedat;
    }

    // Create a new department
    static async create(departmentData) {
        const sql = `INSERT INTO departments (departmentName, departmentCode, establishedYear, departmentStatus, description, headName, headTitle, headEmail, headPhone, officeLocation, appointmentDate, currentStudents, maxCapacity, facultyCount, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`;
        const values = [
            departmentData.departmentName,
            departmentData.departmentCode,
            departmentData.establishedYear,
            departmentData.departmentStatus,
            departmentData.description,
            departmentData.headName,
            departmentData.headTitle,
            departmentData.headEmail,
            departmentData.headPhone,
            departmentData.officeLocation,
            departmentData.appointmentDate,
            departmentData.currentStudents,
            departmentData.maxCapacity,
            departmentData.facultyCount
        ];
        try {
            const result = await db.query(sql, values);
            return result.rows[0].id;
        } catch (error) {
            throw error;
        }
    }

    // Get all departments
    static async findAll() {
        const sql = `SELECT * FROM departments ORDER BY createdAt DESC`;
        try {
            const result = await db.query(sql);
            return result.rows.map(row => new Department(row));
        } catch (error) {
            throw error;
        }
    }

    // Get department by ID
    static async findById(id) {
        const sql = `SELECT * FROM departments WHERE id = $1`;
        try {
            const result = await db.query(sql, [id]);
            return result.rows.length ? new Department(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Get department by code
    static async findByCode(code) {
        const sql = `SELECT * FROM departments WHERE departmentCode = $1`;
        try {
            const result = await db.query(sql, [code]);
            return result.rows.length ? new Department(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Update department
    static async update(id, updateData) {
        const camelToDbMap = {
            departmentName: 'departmentname',
            departmentCode: 'departmentcode',
            establishedYear: 'establishedyear',
            departmentStatus: 'departmentstatus',
            description: 'description',
            headName: 'headname',
            headTitle: 'headtitle',
            headEmail: 'heademail',
            headPhone: 'headphone',
            officeLocation: 'officelocation',
            appointmentDate: 'appointmentdate',
            currentStudents: 'currentstudents',
            maxCapacity: 'maxcapacity',
            facultyCount: 'facultycount',
            budgetYear: 'budgetyear',
            allowOnlineApplication: 'allowonlineapplication',
            enableNotifications: 'enablenotifications',
            publiclyVisible: 'publiclyvisible',
            departmentWebsite: 'departmentwebsite',
            socialMedia: 'socialmedia'
        };

        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                const dbKey = camelToDbMap[key];
                if (dbKey) {
                    fields.push(`${dbKey} = $${paramIndex}`);
                    values.push(updateData[key]);
                    paramIndex++;
                }
            }
        });

        if (fields.length === 0) return false;

        fields.push(`updatedat = CURRENT_TIMESTAMP`);
        const sql = `UPDATE departments SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
        values.push(id);

        try {
            const result = await db.query(sql, values);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete department
    static async delete(id) {
        const sql = `DELETE FROM departments WHERE id = $1`;
        try {
            const result = await db.query(sql, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get departments by status
    static async findByStatus(status) {
        const sql = `SELECT * FROM departments WHERE departmentStatus = $1 ORDER BY createdAt DESC`;
        try {
            const result = await db.query(sql, [status]);
            return result.rows.map(row => new Department(row));
        } catch (error) {
            throw error;
        }
    }

    // Get department statistics
    static async getStats() {
        const sql = `
            SELECT
                COUNT(*) as totalDepartments,
                SUM(currentStudents) as totalStudents,
                SUM(facultyCount) as totalFaculty
            FROM departments
            WHERE departmentStatus = 'active'
        `;
        try {
            const result = await db.query(sql);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Search departments
    static async search(searchTerm) {
        const sql = `
            SELECT * FROM departments
            WHERE departmentName ILIKE $1 OR departmentCode ILIKE $1 OR headName ILIKE $1
            ORDER BY createdAt DESC
        `;
        const searchPattern = `%${searchTerm}%`;
        try {
            const result = await db.query(sql, [searchPattern]);
            return result.rows.map(row => new Department(row));
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Department;
