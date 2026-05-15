const pool = require('../config/dbConnection');
const Professor = require('./Professor');

class AttendanceCorrection {
  // Get all correction requests
  static async getAll(limit = 100, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT ac.*, s.full_name, s.email, c.course_name, c.course_code
         FROM attendance_corrections ac
         JOIN students s ON ac.student_id = s.id
         JOIN courses c ON ac.course_id = c.id
         ORDER BY ac.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching correction requests: ' + error.message);
    }
  }

  // Get correction request by ID
  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT ac.*, s.full_name, s.email, c.course_name
         FROM attendance_corrections ac
         JOIN students s ON ac.student_id = s.id
         JOIN courses c ON ac.course_id = c.id
         WHERE ac.correction_id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error('Error fetching correction request: ' + error.message);
    }
  }

  // Get all corrections for a course (all statuses)
  static async getAllByCourse(courseId) {
    try {
      const result = await pool.query(
        `SELECT ac.*, s.full_name, s.email, a.status as current_status
         FROM attendance_corrections ac
         JOIN students s ON ac.student_id = s.id
         LEFT JOIN attendances a ON a.attendance_id = ac.attendance_id
         WHERE ac.course_id = $1
         ORDER BY ac.created_at DESC`,
        [courseId]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching corrections: ' + error.message);
    }
  }

  // Get pending corrections for professor
  static async getPendingByCourse(courseId) {
    try {
      const result = await pool.query(
        `SELECT ac.*, s.full_name, s.email, a.status as current_status
         FROM attendance_corrections ac
         JOIN students s ON ac.student_id = s.id
         LEFT JOIN attendances a ON a.attendance_id = ac.attendance_id
         WHERE ac.course_id = $1 AND ac.status = 'Pending'
         ORDER BY ac.created_at ASC`,
        [courseId]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching pending corrections: ' + error.message);
    }
  }

  // Get corrections for a student
  static async getByStudent(studentId) {
    try {
      const result = await pool.query(
        `SELECT ac.*, c.course_name, c.course_code
         FROM attendance_corrections ac
         JOIN courses c ON ac.course_id = c.id
         WHERE ac.student_id = $1
         ORDER BY ac.created_at DESC`,
        [studentId]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching student corrections: ' + error.message);
    }
  }

  // Create correction request
  static async create(data) {
    try {
      const { studentId, courseId, attendanceId, date, requestedStatus, reason } = data;
      const result = await pool.query(
        `INSERT INTO attendance_corrections 
         (student_id, course_id, attendance_id, correction_date, requested_status, reason, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING correction_id`,
        [studentId, courseId, attendanceId, date, requestedStatus, reason]
      );
      return result.rows[0].correction_id;
    } catch (error) {
      throw new Error('Error creating correction request: ' + error.message);
    }
  }

  // Approve correction request
  static async approve(id, professorUuid) {
    try {
      const correction = await this.getById(id);
      if (!correction) throw new Error('Correction request not found');

      // Update correction status
      // Resolve professor numeric id from professor UUID (some parts of DB use numeric professor.id)
      let professorId = null;
      if (professorUuid) {
        try {
          const prof = await Professor.findProfessorByUserUuid(professorUuid);
          professorId = prof && prof.id ? prof.id : null;
        } catch (e) {
          // ignore lookup error, continue with null professorId
          professorId = null;
        }
      }

      await pool.query(
        `UPDATE attendance_corrections 
         SET status = 'Approved', professor_id = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE correction_id = $2`,
        [professorId, id]
      );

      // Update the attendance record if it exists
      if (correction.attendance_id) {
        await pool.query(
          `UPDATE attendances 
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE attendance_id = $2`,
          [correction.requested_status, correction.attendance_id]
        );
      }

      return true;
    } catch (error) {
      throw new Error('Error approving correction: ' + error.message);
    }
  }

  // Reject correction request
  static async reject(id, professorUuid, remarks) {
    try {
      // Resolve numeric professor id if UUID provided
      let professorId = null;
      if (professorUuid) {
        try {
          const prof = await Professor.findProfessorByUserUuid(professorUuid);
          professorId = prof && prof.id ? prof.id : null;
        } catch (e) {
          professorId = null;
        }
      }

      await pool.query(
        `UPDATE attendance_corrections 
         SET status = 'Rejected', professor_id = $1, rejection_remarks = $2, updated_at = CURRENT_TIMESTAMP
         WHERE correction_id = $3`,
        [professorId, remarks || null, id]
      );
      return true;
    } catch (error) {
      throw new Error('Error rejecting correction: ' + error.message);
    }
  }

  // Update correction request
  static async update(id, data) {
    try {
      const { reason, requestedStatus } = data;
      await pool.query(
        `UPDATE attendance_corrections 
         SET reason = $1, requested_status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE correction_id = $3`,
        [reason, requestedStatus, id]
      );
      return true;
    } catch (error) {
      throw new Error('Error updating correction: ' + error.message);
    }
  }

  // Delete correction request
  static async delete(id) {
    try {
      await pool.query('DELETE FROM attendance_corrections WHERE correction_id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error('Error deleting correction: ' + error.message);
    }
  }
}

module.exports = AttendanceCorrection;
