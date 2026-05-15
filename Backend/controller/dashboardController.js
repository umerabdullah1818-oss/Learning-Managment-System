const pool = require('../config/dbConnection');
const asyncHandler = require('express-async-handler');

// @desc Get dashboard statistics
// @route GET /api/admin/dashboard/stats
// @access Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get total students
    const studentsResult = await pool.query('SELECT COUNT(*) as count FROM students');
    const totalStudents = parseInt(studentsResult.rows[0].count);

    // Get total professors
    const professorsResult = await pool.query('SELECT COUNT(*) as count FROM professors');
    const totalProfessors = parseInt(professorsResult.rows[0].count);

    // Get total courses
    const coursesResult = await pool.query('SELECT COUNT(*) as count FROM courses');
    const totalCourses = parseInt(coursesResult.rows[0].count);

    // Get total departments
    const departmentsResult = await pool.query('SELECT COUNT(*) as count FROM departments');
    const totalDepartments = parseInt(departmentsResult.rows[0].count);

    // Get total enrollments
    const enrollmentsResult = await pool.query('SELECT COUNT(*) as count FROM enrollments');
    const totalEnrollments = parseInt(enrollmentsResult.rows[0].count);

    // Get average attendance (overall system attendance)
    // attendance table is named `attendances` and status values are capitalized (e.g. 'Present')
    const attendanceResult = await pool.query(`
      SELECT 
        ROUND(
          (COUNT(CASE WHEN status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))::numeric,
          2
        ) as average_attendance
      FROM attendances
    `);
    const averageAttendance = attendanceResult.rows[0]?.average_attendance || 0;

    res.status(200).json({
      totalStudents,
      totalProfessors,
      totalCourses,
      totalDepartments,
      totalEnrollments,
      averageAttendance: parseFloat(averageAttendance)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// @desc Get dashboard charts data
// @route GET /api/admin/dashboard/charts
// @access Private/Admin
exports.getDashboardCharts = asyncHandler(async (req, res) => {
  try {
    // Enrollment Trend (Last 12 months)
    const enrollmentTrendResult = await pool.query(`
      SELECT 
        TO_CHAR(enrollment_date, 'Mon') as month,
        COUNT(*) as students
      FROM enrollments
      WHERE enrollment_date >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(enrollment_date, 'Mon'), DATE_TRUNC('month', enrollment_date)
      ORDER BY DATE_TRUNC('month', enrollment_date)
      LIMIT 12
    `);
    const enrollmentTrend = enrollmentTrendResult.rows;

    // Course Distribution by Department
    // courses table stores department as a text column `department`
    const courseDistributionResult = await pool.query(`
      SELECT department as name, COUNT(*) as value
      FROM courses
      GROUP BY department
      ORDER BY value DESC
      LIMIT 10
    `);
    const courseDistribution = courseDistributionResult.rows;

    // Professor Workload (Top 10 professors)
    // courses.professor_uuid references users.uuid (professors stored in users table)
    const professorWorkloadResult = await pool.query(`
      SELECT 
        (u.first_name || ' ' || u.last_name) as name,
        COUNT(c.id) as courses
      FROM users u
      LEFT JOIN courses c ON u.uuid = c.professor_uuid
      WHERE u.role = 'professor'
      GROUP BY u.uuid, u.first_name, u.last_name
      ORDER BY courses DESC
      LIMIT 10
    `);
    const professorWorkload = professorWorkloadResult.rows;

    // Grade Distribution
    // final_grades stores a `letter_grade` column
    const gradeDistributionResult = await pool.query(`
      SELECT COALESCE(letter_grade, 'N/A') as grade, COUNT(*) as count
      FROM final_grades
      GROUP BY letter_grade
      ORDER BY grade
    `);
    const gradeDistribution = gradeDistributionResult.rows;

    res.status(200).json({
      enrollmentTrend,
      courseDistribution,
      professorWorkload,
      gradeDistribution
    });
  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    res.status(500).json({ message: 'Error fetching charts data', error: error.message });
  }
});

// @desc Get recent activities
// @route GET /api/admin/dashboard/activities
// @access Private/Admin
exports.getRecentActivities = asyncHandler(async (req, res) => {
  try {
    // Fetch recent activities from multiple sources
    const activitiesResult = await pool.query(`
      SELECT 
        'enrollment' as type,
        'New Student Enrollment' as title,
        'User ' || u.username || ' enrolled in course' as description,
        e.enrollment_date as timestamp
      FROM enrollments e
      JOIN users u ON e.user_uuid = u.uuid
      UNION ALL
      SELECT 
        'assignment' as type,
        'Assignment Created' as title,
        'Assignment for course ' || c.course_code as description,
        a.created_at as timestamp
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      UNION ALL
      SELECT 
        'grade' as type,
        'Grades Posted' as title,
        'Final grades updated' as description,
        fg.computed_at as timestamp
      FROM final_grades fg
      WHERE fg.computed_at IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    const activities = activitiesResult.rows;

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

module.exports = {
  getDashboardStats: exports.getDashboardStats,
  getDashboardCharts: exports.getDashboardCharts,
  getRecentActivities: exports.getRecentActivities
};
