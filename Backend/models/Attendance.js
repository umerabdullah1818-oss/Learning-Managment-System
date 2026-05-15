const pool = require('../config/dbConnection');

class Attendance {
  // Get all attendance records
  static async getAll() {
    try {
      const result = await pool.query('SELECT * FROM attendances');
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching attendance records: ' + error.message);
    }
  }

  // Get attendance by ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM attendances WHERE attendance_id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error fetching attendance: ' + error.message);
    }
  }

  // Get attendance for a student in a course
  static async getByStudentAndCourse(studentId, courseId) {
    try {
      const result = await pool.query(
        `SELECT a.*, s.id as student_id, s.full_name, s.email
         FROM attendances a
         JOIN students s ON a.student_id = s.id
         WHERE a.student_id = $1 AND a.course_id = $2
         ORDER BY a.attendance_date DESC`,
        [studentId, courseId]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching student attendance: ' + error.message);
    }
  }

  // Get attendance for a course on a specific date
  static async getByCourseDateAndDate(courseId, date) {
    try {
      const result = await pool.query(
        `SELECT a.*, s.id as student_id, s.full_name, s.email
         FROM attendances a
         JOIN students s ON a.student_id = s.id
         WHERE a.course_id = $1 AND DATE(a.attendance_date) = $2
         ORDER BY s.full_name ASC`,
        [courseId, date]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching course attendance: ' + error.message);
    }
  }

  // Get attendance statistics for a student in a course
  // Weighted calculation: Present=1.0, Late=0.5, Excused=1.0, Absent=0.0
  static async getStatistics(studentId, courseId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
          SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) as excused_count,
          ROUND(
            (SUM(CASE 
              WHEN status = 'Present' THEN 1.0 
              WHEN status = 'Late' THEN 0.5 
              WHEN status = 'Excused' THEN 1.0 
              ELSE 0.0 
            END)::numeric / COUNT(*)) * 100, 2
          ) as attendance_percentage
         FROM attendances 
         WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error('Error calculating statistics: ' + error.message);
    }
  }

  // Create new attendance record
  static async create(data) {
    try {
      const { studentId, courseId, date, status, note } = data;
      const result = await pool.query(
        `INSERT INTO attendances (student_id, course_id, attendance_date, status, note, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING attendance_id`,
        [studentId, courseId, date, status, note || null]
      );
      return result.rows[0].attendance_id;
    } catch (error) {
      throw new Error('Error creating attendance: ' + error.message);
    }
  }

  // Update attendance record
  static async update(id, data) {
    try {
      const { status, note } = data;
      await pool.query(
        `UPDATE attendances 
         SET status = $1, note = $2, updated_at = CURRENT_TIMESTAMP
         WHERE attendance_id = $3`,
        [status, note || null, id]
      );
      return true;
    } catch (error) {
      throw new Error('Error updating attendance: ' + error.message);
    }
  }

  // Bulk create attendance records
  static async bulkCreate(records) {
    try {
      const values = records.map((r, idx) => [
        r.studentId,
        r.courseId,
        r.date,
        r.status,
        r.note || null
      ]);

      const placeholders = values
        .map((_, idx) => {
          const offset = idx * 5;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
        })
        .join(',');
      const flatValues = values.flat();

      const result = await pool.query(
        `INSERT INTO attendances (student_id, course_id, attendance_date, status, note)
         VALUES ${placeholders}`,
        flatValues
      );
      return result.rowCount;
    } catch (error) {
      throw new Error('Error bulk creating attendance: ' + error.message);
    }
  }

  // Delete attendance record
  static async delete(id) {
    try {
      await pool.query('DELETE FROM attendances WHERE attendance_id = $1', [id]);
      return true;
    } catch (error) {
      throw new Error('Error deleting attendance: ' + error.message);
    }
  }

  // Get attendance by course for professor
  static async getByCourseForProfessor(courseId, limit = 100, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT a.*, s.id as student_id, s.full_name, s.email
         FROM attendances a
         JOIN students s ON a.student_id = s.id
         WHERE a.course_id = $1
         ORDER BY a.attendance_date DESC
         LIMIT $2 OFFSET $3`,
        [courseId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching course attendance: ' + error.message);
    }
  }

  // Get class statistics (professor view)
  static async getClassStatistics(courseId) {
    try {
      const result = await pool.query(
        `SELECT 
          s.id as student_id,
          s.full_name,
          s.email,
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
          ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2) as attendance_percentage
         FROM attendances a
         JOIN students s ON a.student_id = s.id
         WHERE a.course_id = $1
         GROUP BY s.id
         ORDER BY attendance_percentage ASC`,
        [courseId]
      );
      return result.rows;
    } catch (error) {
      throw new Error('Error calculating class statistics: ' + error.message);
    }
  }
}

module.exports = Attendance;
