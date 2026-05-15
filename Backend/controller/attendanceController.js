const Attendance = require('../models/Attendance');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Student = require('../models/Student');

// Get attendance for a student in a course
const getStudentAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentUuid = req.user.uuid;

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.isStudentEnrolled(studentUuid, courseId);
    if (!enrollment) {
      // Instead of returning 403, return an empty attendance result so frontend shows a friendly message
      return res.status(200).json({ attendance: [], statistics: null, message: 'Not enrolled in this course' });
    }

    // Translate user UUID to numeric student.id used by attendances.student_id
    const student = await Student.findStudentByUserUuid(studentUuid);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const attendance = await Attendance.getByStudentAndCourse(student.id, courseId);
    const stats = await Attendance.getStatistics(student.id, courseId);

    res.json({ attendance, statistics: stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance statistics for student
const getStudentAttendanceStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentUuid = req.user.uuid;
    const student = await Student.findStudentByUserUuid(studentUuid);
    if (!student) return res.status(200).json({ statistics: null, message: 'Student record not found' });

    // If student is not enrolled, return empty statistics rather than 403
    const enrollment = await Enrollment.isStudentEnrolled(studentUuid, courseId);
    if (!enrollment) return res.status(200).json({ statistics: null, message: 'Not enrolled in this course' });

    const stats = await Attendance.getStatistics(student.id, courseId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance (Professor)
const markAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { attendanceRecords, date } = req.body;
    const professorUuid = req.user.uuid;

    // Verify professor is assigned to the course
    const course = await Course.findCourseById(courseId);
    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not assigned to this course' });
    }

    // Normalize provided student identifiers to numeric student.id
    // attendanceRecords may contain either numeric student IDs or user UUIDs
    const existing = await Attendance.getByCourseDateAndDate(courseId, date);

    const records = await Promise.all(
      attendanceRecords.map(async (record) => {
        let numericStudentId = record.studentId;

        // If the frontend sent a UUID (string with dashes), resolve to numeric id
        if (typeof numericStudentId === 'string' && numericStudentId.includes('-')) {
          const s = await Student.findStudentByUserUuid(numericStudentId);
          if (!s) throw new Error(`Student not found for UUID ${numericStudentId}`);
          numericStudentId = s.id;
        }

        // Remove any existing record for this student on this date
        for (let att of existing) {
          if (att.student_id === numericStudentId) {
            await Attendance.delete(att.attendance_id);
          }
        }

        return {
          studentId: numericStudentId,
          courseId,
          date,
          status: record.status,
          note: record.note,
        };
      })
    );

    const affectedRows = await Attendance.bulkCreate(records);

    // Return the attendance rows for this course and date (include student name/email)
    const attendanceRows = await Attendance.getByCourseDateAndDate(courseId, date);

    res.json({ message: 'Attendance marked successfully', affectedRows, attendance: attendanceRows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance for a course (Professor view)
const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, page = 1, limit = 50 } = req.query;
    const professorUuid = req.user.uuid;

    // Verify professor is assigned to the course
    const course = await Course.findCourseById(courseId);
    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not assigned to this course' });
    }

    let attendance;
    if (date) {
      attendance = await Attendance.getByCourseDateAndDate(courseId, date);
    } else {
      const offset = (page - 1) * limit;
      attendance = await Attendance.getByCourseForProfessor(
        courseId,
        limit,
        offset
      );
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get class statistics (Professor)
const getClassStatistics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const professorUuid = req.user.uuid;

    // Verify professor is assigned to the course
    const course = await Course.findCourseById(courseId);
    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not assigned to this course' });
    }

    const stats = await Attendance.getClassStatistics(courseId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request attendance correction (Student)
const requestCorrection = async (req, res) => {
  try {
    const { courseId, attendanceId, date, requestedStatus, reason } = req.body;
    const studentUuid = req.user.uuid;

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.isStudentEnrolled(studentUuid, courseId);
    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    const student = await Student.findStudentByUserUuid(studentUuid);
    if (!student) return res.status(404).json({ message: 'Student record not found' });

    const correctionId = await AttendanceCorrection.create({
      studentId: student.id,
      courseId,
      attendanceId,
      date,
      requestedStatus,
      reason,
    });

    res.json({
      message: 'Correction request submitted successfully',
      correctionId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all corrections for professor (Pending, Approved, Rejected)
const getAllCorrections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const professorUuid = req.user.uuid;

    // Verify professor is assigned to the course
    const course = await Course.findCourseById(courseId);
    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not assigned to this course' });
    }

    const corrections = await AttendanceCorrection.getAllByCourse(courseId);
    res.json(corrections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending corrections for professor
const getPendingCorrections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const professorUuid = req.user.uuid;

    // Verify professor is assigned to the course
    const course = await Course.findCourseById(courseId);
    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not assigned to this course' });
    }

    const corrections = await AttendanceCorrection.getPendingByCourse(courseId);
    res.json(corrections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve correction request (Professor)
const approveCorrection = async (req, res) => {
  try {
    const { correctionId } = req.params;
    const professorUuid = req.user.uuid;

    // Verify the correction request exists and belongs to professor's course
    const correction = await AttendanceCorrection.getById(correctionId);
    const course = await Course.findCourseById(correction.course_id);

    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await AttendanceCorrection.approve(correctionId, professorUuid);
    res.json({ message: 'Correction approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject correction request (Professor)
const rejectCorrection = async (req, res) => {
  try {
    const { correctionId } = req.params;
    const { remarks } = req.body;
    const professorUuid = req.user.uuid;

    // Verify the correction request exists and belongs to professor's course
    const correction = await AttendanceCorrection.getById(correctionId);
    const course = await Course.findCourseById(correction.course_id);

    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await AttendanceCorrection.reject(correctionId, professorUuid, remarks);
    res.json({ message: 'Correction rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's correction requests
const getStudentCorrections = async (req, res) => {
  try {
    const studentUuid = req.user.uuid;
    const student = await Student.findStudentByUserUuid(studentUuid);
    if (!student) return res.status(404).json({ message: 'Student record not found' });
    const corrections = await AttendanceCorrection.getByStudent(student.id);
    res.json(corrections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update single attendance record
const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, note } = req.body;
    const professorUuid = req.user.uuid;

    // Get attendance and verify authorization
    const attendance = await Attendance.getById(attendanceId);
    const course = await Course.findCourseById(attendance.course_id);

    if (!course || course.professorUuid !== professorUuid) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Attendance.update(attendanceId, { status, note });
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentAttendance,
  getStudentAttendanceStats,
  markAttendance,
  getCourseAttendance,
  getClassStatistics,
  requestCorrection,
  getAllCorrections,
  getPendingCorrections,
  approveCorrection,
  rejectCorrection,
  getStudentCorrections,
  updateAttendance,
};
