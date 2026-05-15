const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Student = require('../models/Student');

// @desc    Enroll student in a course
// @route   POST /api/enrollments
// @access  Private/Student
const enrollStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userUuid = req.user.uuid; // Use UUID from JWT

  if (!courseId) {
    res.status(400);
    throw new Error('Course ID is required');
  }

  // Check if course exists and is active
  const course = await Course.findCourseById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.courseStatus !== 'active') {
    res.status(400);
    throw new Error('Course is not available for enrollment');
  }

  // Check if user is already enrolled
  const existingEnrollment = await Enrollment.isStudentEnrolled(userUuid, courseId);
  if (existingEnrollment) {
    if (existingEnrollment.status === 'active') {
      res.status(400);
      throw new Error('User is already enrolled in this course');
    } else if (existingEnrollment.status === 'dropped') {
      // Re-enroll if previously dropped
      const reenrollQuery = `
        UPDATE enrollments SET status = 'active', enrollment_date = CURRENT_TIMESTAMP
        WHERE user_uuid = $1 AND course_id = $2
        RETURNING id, user_uuid, course_id, enrollment_date, status;
      `;
      const reenrollResult = await require('../config/dbConnection').query(reenrollQuery, [userUuid, courseId]);
      res.status(200).json({
        success: true,
        message: 'Successfully re-enrolled in course',
        data: reenrollResult.rows[0]
      });
      return;
    }
  }

  // Check enrollment count
  const enrollmentCount = await Enrollment.getEnrollmentCount(courseId);
  if (enrollmentCount >= course.maxStudents) {
    res.status(400);
    throw new Error('Course is full');
  }

  const enrollment = await Enrollment.enrollStudentInCourse(userUuid, courseId);

  res.status(201).json({
    success: true,
    message: 'Successfully enrolled in course',
    data: enrollment
  });
});

// @desc    Unenroll student from a course
// @route   DELETE /api/enrollments/:id
// @access  Private/Student
const unenrollStudent = asyncHandler(async (req, res) => {
  const { id } = req.params; // This is the enrollment ID
  const userUuid = req.user.uuid; // Use UUID from JWT

  // Check if enrollment exists and is active, and belongs to the user
  const existingEnrollment = await Enrollment.findEnrollmentById(id);
  if (!existingEnrollment || existingEnrollment.user_uuid !== userUuid || existingEnrollment.status !== 'active') {
    res.status(404);
    throw new Error('Active enrollment not found');
  }

  const enrollment = await Enrollment.unenrollStudentFromCourseById(id);

  res.status(200).json({
    success: true,
    message: 'Successfully unenrolled from course',
    data: enrollment
  });
});

const getStudentEnrollments = asyncHandler(async (req, res) => {
    try {
        console.log('getStudentEnrollments invoked. User:', req.user);
        
        if (!req.user.uuid) {
            res.status(400);
            throw new Error('User UUID missing in token.');
        }

          const enrollments = await Enrollment.getEnrollmentsByUserUuid(req.user.uuid);

          // Return the enrollments array directly to match frontend expectation
          res.status(200).json(enrollments);
    } catch (error) {
        console.error('Error in getStudentEnrollments:', error);
        res.status(res.statusCode !== 200 ? res.statusCode : 500);
        res.json({ message: error.message || 'Internal Server Error' });
    }
});

// @desc    Get course enrollments (for professors/admins)
// @route   GET /api/enrollments/course/:courseId
// @access  Private
const getCourseEnrollments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const enrollments = await Enrollment.getEnrollmentsByCourse(courseId);

  res.status(200).json({
    success: true,
    data: enrollments
  });
});

// @desc    Check if student is enrolled in course
// @route   GET /api/enrollments/check/:courseId
// @access  Private
const checkEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userUuid = req.user.uuid; // Use UUID from JWT

  const enrollment = await Enrollment.isStudentEnrolled(userUuid, courseId);

  res.status(200).json({
    success: true,
    enrolled: !!enrollment && enrollment.status === 'active',
    status: enrollment ? enrollment.status : null
  });
});

module.exports = {
  enrollStudent,
  unenrollStudent,
  getStudentEnrollments,
  getCourseEnrollments,
  checkEnrollment
};
