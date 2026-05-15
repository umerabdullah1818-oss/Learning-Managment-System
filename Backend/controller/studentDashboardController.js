const asyncHandler = require('express-async-handler');
const pool = require('../config/dbConnection');

// @desc Get student dashboard statistics
// @route GET /api/student/dashboard/stats
// @access Private/Student
exports.getStudentDashboardStats = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;

  try {
    // Get total enrolled courses
    const coursesResult = await pool.query(
      `SELECT COUNT(*) as count FROM enrollments 
       WHERE user_uuid = $1 AND status = 'active'`,
      [studentUuid]
    );
    const enrolledCourses = parseInt(coursesResult.rows[0].count);

    // Get current GPA (from final_grades)
    const gpaResult = await pool.query(
      `SELECT ROUND(AVG(final_percentage), 2) as gpa
       FROM final_grades
       WHERE student_uuid = $1`,
      [studentUuid]
    );
    const gpa = parseFloat(gpaResult.rows[0]?.gpa) || 0;

    // Get attendance percentage
    const attendanceResult = await pool.query(
      `SELECT 
        ROUND(
          (COUNT(CASE WHEN status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))::numeric,
          2
        ) as attendance_percentage
       FROM attendances
       WHERE student_id = (SELECT id FROM students WHERE user_uuid = $1)`,
      [studentUuid]
    );
    const attendance = parseFloat(attendanceResult.rows[0]?.attendance_percentage) || 0;

    // Get pending assignments count
    const assignmentsResult = await pool.query(
      `SELECT COUNT(*) as count FROM assignments a
       JOIN enrollments e ON a.course_id = e.course_id
       WHERE e.user_uuid = $1 AND e.status = 'active'
       AND a.due_date > NOW() AND a.status != 'Graded'`,
      [studentUuid]
    );
    const pendingAssignments = parseInt(assignmentsResult.rows[0].count);

    res.status(200).json({
      enrolledCourses,
      gpa,
      attendance,
      pendingAssignments
    });
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// @desc Get student's enrolled courses
// @route GET /api/student/dashboard/courses
// @access Private/Student
exports.getStudentCourses = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;

  try {
    const coursesResult = await pool.query(
      `SELECT 
        c.id,
        c.course_code,
        c.course_name,
        c.semester,
        c.credits,
        u.first_name as professor_name,
        u.last_name as professor_last_name,
        e.enrollment_date,
        e.status
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.professor_uuid = u.uuid
       WHERE e.user_uuid = $1 AND e.status = 'active'
       ORDER BY c.course_name ASC`,
      [studentUuid]
    );

    const courses = coursesResult.rows.map(course => ({
      ...course,
      professor_full_name: `${course.professor_name} ${course.professor_last_name}`
    }));

    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// @desc Get upcoming assignments for student
// @route GET /api/student/dashboard/assignments
// @access Private/Student
exports.getStudentUpcomingAssignments = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;

  try {
    const assignmentsResult = await pool.query(
      `SELECT 
        a.id,
        a.title,
        a.due_date,
        c.course_code,
        c.course_name,
        a.created_at,
        a.status
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.user_uuid = $1 AND e.status = 'active'
       AND a.due_date > NOW() AND a.status != 'Graded'
       ORDER BY a.due_date ASC
       LIMIT 10`,
      [studentUuid]
    );

    const assignments = assignmentsResult.rows;

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching upcoming assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// @desc Get student's grades summary
// @route GET /api/student/dashboard/grades
// @access Private/Student
exports.getStudentGradesSummary = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;

  try {
    const gradesResult = await pool.query(
      `SELECT 
        c.id,
        c.course_code,
        c.course_name,
        c.grades_visible,
        fg.letter_grade,
        fg.final_percentage,
        fg.computed_at
       FROM final_grades fg
       JOIN courses c ON fg.course_id = c.id
       WHERE fg.student_uuid = $1
       ORDER BY fg.computed_at DESC`,
      [studentUuid]
    );

    // Filter grades to only include courses where grades_visible is true
    const grades = gradesResult.rows.filter(grade => grade.grades_visible === true);

    res.status(200).json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Error fetching grades', error: error.message });
  }
});

// @desc Get student's attendance
// @route GET /api/student/dashboard/attendance
// @access Private/Student
exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;

  try {
    const attendanceResult = await pool.query(
      `SELECT 
        c.course_code,
        c.course_name,
        COUNT(CASE WHEN att.status = 'Present' THEN 1 END) as days_present,
        COUNT(CASE WHEN att.status = 'Absent' THEN 1 END) as days_absent,
        COUNT(*) as total_classes,
        ROUND(
          (COUNT(CASE WHEN att.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))::numeric,
          2
        ) as attendance_percentage
       FROM attendances att
       JOIN courses c ON att.course_id = c.id
       JOIN students s ON att.student_id = s.id
       WHERE s.user_uuid = $1
       GROUP BY c.id, c.course_code, c.course_name
       ORDER BY c.course_name ASC`,
      [studentUuid]
    );

    const attendance = attendanceResult.rows;

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

// @desc Get recent activities for student
// @route GET /api/student/dashboard/activities
// @access Private/Student
exports.getStudentRecentActivities = asyncHandler(async (req, res) => {
  const studentUuid = req.user.uuid;

  try {
    const activitiesResult = await pool.query(
      `SELECT 
        'assignment' as type,
        'New Assignment: ' || a.title as title,
        c.course_name,
        a.created_at as timestamp
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE e.user_uuid = $1 AND e.status = 'active'
       AND a.status != 'Pending'
       UNION ALL
       SELECT 
        'grade' as type,
        'Grades Updated for ' || c.course_name as title,
        c.course_name,
        fg.computed_at as timestamp
       FROM final_grades fg
       JOIN courses c ON fg.course_id = c.id
       WHERE fg.student_uuid = $1 AND fg.computed_at IS NOT NULL
       ORDER BY timestamp DESC
       LIMIT 5`,
      [studentUuid]
    );

    const activities = activitiesResult.rows;

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

module.exports = {
  getStudentDashboardStats: exports.getStudentDashboardStats,
  getStudentCourses: exports.getStudentCourses,
  getStudentUpcomingAssignments: exports.getStudentUpcomingAssignments,
  getStudentGradesSummary: exports.getStudentGradesSummary,
  getStudentAttendance: exports.getStudentAttendance,
  getStudentRecentActivities: exports.getStudentRecentActivities
};
