const asyncHandler = require('express-async-handler');
const Grades = require('../models/Grades');
const Assignments = require('../models/Assignments');
const GradingWeight = require('../models/GradingWeight');
const Enrollment = require('../models/Enrollment');
const StudentCourseGrades = require('../models/StudentCourseGrades');
const FinalGrades = require('../models/FinalGrades');
const AssessmentWeight = require('../models/AssessmentWeight');
const pool = require('../config/dbConnection');

// POST /api/grades
const createGrade = asyncHandler(async (req, res) => {
  const { studentUuid, courseId, assessmentType, assessmentId, score, maxScore, weight } = req.body;
  if (!studentUuid || !courseId || !assessmentType || score === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const grade = await Grades.createGrade({ studentUuid, courseId, assessmentType, assessmentId, score, maxScore, weight });
  res.status(201).json({ success: true, data: grade });
});

// PUT /api/grades/:id
const updateGrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  // If a weight is provided in the update payload, persist it to assessment_weights
  if (updates && updates.weight !== undefined) {
    try {
      // Try to find existing grade row to obtain courseId/assessment info
      const g = await pool.query('SELECT course_id, assessment_type, assessment_id FROM grades WHERE id = $1 LIMIT 1', [id]);
      const row = g.rows && g.rows[0];
      const courseIdForWeight = row ? row.course_id : updates.courseId || updates.course_id;
      const assessmentTypeForWeight = row ? row.assessment_type : updates.assessmentType || updates.assessment_type;
      const assessmentIdForWeight = row ? row.assessment_id : updates.assessmentId || updates.assessment_id;

      if (courseIdForWeight && assessmentTypeForWeight && assessmentIdForWeight) {
        await AssessmentWeight.setAssessmentWeight({ courseId: courseIdForWeight, assessmentType: assessmentTypeForWeight, assessmentId: assessmentIdForWeight, weight: Number(updates.weight) });
      }
    } catch (err) {
      console.error('Error upserting assessment weight during grade update:', err.message || err);
    }
    // Remove weight from updates so it is not (attempted to be) stored on grades table
    delete updates.weight;
  }

  const grade = await Grades.updateGrade(id, updates);
  if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
  res.json({ success: true, data: grade });
});

// GET /api/grades/course/:courseId
const getGradesByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const grades = await Grades.getGradesByCourse(courseId);
  res.json({ success: true, data: grades });
});

// GET /api/grades/enrolled/:courseId
const getEnrolledStudents = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  
  const query = `
    SELECT
      e.id,
      e.user_uuid as "userUuid",
      e.course_id as "courseId",
      u.username as "studentName",
      u.first_name as "studentFirstName",
      u.last_name as "studentLastName",
      u.email as "studentEmail",
      s.student_id as "studentId",
      s.department as "studentDepartment"
    FROM enrollments e
    JOIN users u ON e.user_uuid = u.uuid
    LEFT JOIN students s ON u.uuid = s.user_uuid
    WHERE e.course_id = $1 AND e.status = 'active'
    ORDER BY u.username ASC
  `;
  
  const result = await pool.query(query, [courseId]);
  res.json({ success: true, data: result.rows });
});

// GET /api/grades/student/:studentUuid/course/:courseId
const getStudentGradesForCourse = asyncHandler(async (req, res) => {
  const { studentUuid, courseId } = req.params;
  const grades = await Grades.getGradesByStudentCourse(studentUuid, courseId);
  res.json({ success: true, data: grades });
});

// GET /api/grades/student/:studentUuid/all-courses
const getStudentAllCoursesGrades = asyncHandler(async (req, res) => {
  const { studentUuid } = req.params;

  // allow students to fetch their own data, or professors/admins to fetch any
  const requester = req.user && (req.user.uuid || req.user.userUuid || null);
  const role = req.user && req.user.role;
  if (!requester) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (requester !== studentUuid && role !== 'professor' && role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const enrollments = await Enrollment.getEnrollmentsByUserUuid(studentUuid);
  const activeEnrollments = (enrollments || []).filter(e => !e.status || e.status === 'active');

  const rows = await Promise.all(activeEnrollments.map(async (enr) => {
    const courseId = enr.course_id || enr.courseId || enr.course_id;
    const course = {
      id: courseId,
      courseCode: enr.courseCode || enr.course_code,
      courseName: enr.courseName || enr.course_name,
      semester: enr.semester,
      credits: enr.credits
    };

    // Check if grades are visible for this course (only for students, not for professors/admins)
    let gradesVisible = true;
    if (role === 'student') {
      try {
        const courseRes = await pool.query(
          'SELECT grades_visible FROM courses WHERE id = $1 LIMIT 1',
          [courseId]
        );
        gradesVisible = courseRes.rows[0] ? courseRes.rows[0].grades_visible : true;
      } catch (err) {
        console.error('Error checking grades visibility for course', courseId, err.message || err);
        gradesVisible = true; // default to visible if error
      }
    }

    let courseGrades = null;
    let assessments = [];
    let finalGrade = null;

    try {
      courseGrades = await StudentCourseGrades.getStudentCourseGrade(studentUuid, courseId);
    } catch (err) {
      console.error('Error fetching student_course_grades for', studentUuid, courseId, err.message || err);
      courseGrades = null; // graceful fallback when table missing or other DB errors
    }

    try {
      // fetch full assessment list (older behavior)
      assessments = await Grades.getGradesByStudentCourse(studentUuid, courseId);
    } catch (err) {
      console.error('Error fetching grades for', studentUuid, courseId, err.message || err);
      assessments = [];
    }

    // Enrich assessments with per-item weight if missing by checking assessment_weights
    try {
      for (const a of assessments) {
        if ((a.weight === null || a.weight === undefined) && a.assessment_id) {
          try {
            const w = await AssessmentWeight.getAssessmentWeight(courseId, a.assessment_type, a.assessment_id);
            if (w != null) a.weight = w;
          } catch (err) {
            // swallow per-item weight errors
            console.error('Error fetching assessment weight for assessment', a.assessment_id, err.message || err);
          }
        }
      }
    } catch (err) {
      console.error('Error enriching assessments with weights', err.message || err);
    }

    try {
      finalGrade = await FinalGrades.getFinalGrade(studentUuid, courseId);
    } catch (err) {
      console.error('Error fetching final grade for', studentUuid, courseId, err.message || err);
      finalGrade = null;
    }

    // additionally fetch latest per-type grades (assignment, quiz, midterm, final)
    let latestAssessments = [];
    try {
      latestAssessments = await Grades.getLatestGradesByStudentCourse(studentUuid, courseId);
    } catch (err) {
      console.error('Error fetching latest assessments for', studentUuid, courseId, err.message || err);
      latestAssessments = [];
    }

    // enrich latestAssessments with weights if missing
    try {
      for (const a of latestAssessments) {
        if ((a.weight === null || a.weight === undefined) && a.assessment_id) {
          try {
            const w = await AssessmentWeight.getAssessmentWeight(courseId, a.assessment_type, a.assessment_id);
            if (w != null) a.weight = w;
          } catch (err) {
            console.error('Error fetching assessment weight for latest assessment', a.assessment_id, err.message || err);
          }
        }
      }
    } catch (err) {
      console.error('Error enriching latestAssessments with weights', err.message || err);
    }

    // Attempt to filter latestAssessments to only include items created by professor when possible.
    // We can only verify for assessment types that have their own table (e.g., assignments).
    try {
      // find course professor_uuid
      const courseRes = await pool.query('SELECT professor_uuid FROM courses WHERE id = $1 LIMIT 1', [courseId]);
      const courseProfessorUuid = (courseRes.rows[0] && courseRes.rows[0].professor_uuid) || null;

      const filtered = [];
      for (const a of latestAssessments) {
        if (a.assessment_type === 'assignment' && a.assessment_id) {
          try {
            const asm = await Assignments.findAssignmentById(a.assessment_id);
            if (asm && courseProfessorUuid && asm.professorUuid === courseProfessorUuid) {
              filtered.push(a);
            } else {
              // skip assignments not created by the course professor
            }
          } catch (err) {
            console.error('Error fetching assignment to verify professor', a.assessment_id, err.message || err);
          }
        } else {
          // For other types we don't have a canonical creator, include them as-is
          filtered.push(a);
        }
      }
      latestAssessments = filtered;
    } catch (err) {
      console.error('Error filtering latest assessments by professor', err.message || err);
    }

    // fetch grading weights for the course
    let weights = null;
    try {
      weights = await GradingWeight.getWeightsByCourse(courseId);
    } catch (err) {
      console.error('Error fetching grading weights for', courseId, err.message || err);
      weights = null;
    }

    // If student role and grades not visible, return empty grade data
    if (role === 'student' && !gradesVisible) {
      return { 
        course, 
        courseGrades: null, 
        assessments: [], 
        finalGrade: null, 
        latestAssessments: [], 
        weights: null,
        gradesVisible: false,
        message: 'Grades are not yet visible for this course'
      };
    }

    return { 
      course, 
      courseGrades, 
      assessments, 
      finalGrade, 
      latestAssessments, 
      weights,
      gradesVisible: true
    };
  }));

  res.json({ success: true, data: rows });
});

// DELETE /api/grades/assessment/:courseId/:assessmentType/:assessmentId
const deleteGradesByAssessment = asyncHandler(async (req, res) => {
  const { courseId, assessmentType, assessmentId } = req.params;
  if (!courseId || !assessmentType || !assessmentId) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }
  if (typeof Grades.deleteGradesByAssessment !== 'function') {
    return res.status(501).json({ success: false, message: 'Server not configured to delete assessment grades' });
  }
  const deleted = await Grades.deleteGradesByAssessment(parseInt(courseId), assessmentType, assessmentId);
  res.json({ success: true, deletedCount: deleted.length, data: deleted });
});

// GET /api/grades/weighted-totals/:studentUuid/:courseId
const getWeightedTotals = asyncHandler(async (req, res) => {
  const { studentUuid, courseId } = req.params;

  // Verify authorization: students can only view their own, professors/admins can view any
  const requester = req.user && (req.user.uuid || req.user.userUuid || null);
  const role = req.user && req.user.role;
  if (!requester) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (requester !== studentUuid && role !== 'professor' && role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const totals = await Grades.getWeightedTotals(studentUuid, courseId);
  if (!totals) {
    return res.status(500).json({ success: false, message: 'Failed to calculate weighted totals' });
  }

  res.json({
    success: true,
    data: {
      studentUuid,
      courseId,
      weightedTotals: totals
    }
  });
});

// PUT /api/grades/updateGradeVisibility
// Update grade visibility status for a course
const updateGradeVisibility = asyncHandler(async (req, res) => {
  const { professorId, courseId, gradesVisible } = req.body;

  if (!professorId || !courseId || gradesVisible === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields: professorId, courseId, gradesVisible' });
  }

  try {
    // Verify that the professor owns the course
    const courseQuery = `
      SELECT id, professor_uuid FROM courses WHERE id = $1
    `;
    const courseResult = await pool.query(courseQuery, [courseId]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = courseResult.rows[0];
    const userUuid = req.user?.uuid || req.user?.userUuid;

    // Verify authorization: professor must own the course or be an admin
    if (req.user?.role !== 'admin' && course.professor_uuid !== userUuid) {
      return res.status(403).json({ success: false, message: 'Not authorized to update grades visibility for this course' });
    }

    // Update the course with grades_visible status
    const updateQuery = `
      UPDATE courses 
      SET grades_visible = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [gradesVisible, courseId]);
    const updatedCourse = updateResult.rows[0];

    res.status(200).json({
      success: true,
      message: `Grades visibility has been set to ${gradesVisible ? 'ON' : 'OFF'}`,
      data: {
        courseId: updatedCourse.id,
        courseName: updatedCourse.course_name,
        gradesVisible: updatedCourse.grades_visible
      }
    });
  } catch (err) {
    console.error('Error updating grade visibility:', err.message || err);
    res.status(500).json({ success: false, message: 'Failed to update grade visibility' });
  }
});

// GET /api/grades/getGradeVisibility/:courseId
// Get grade visibility status for a course
const getGradeVisibility = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required' });
  }

  try {
    const query = `
      SELECT id, course_name, grades_visible 
      FROM courses 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [courseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.course_name,
        gradesVisible: course.grades_visible
      }
    });
  } catch (err) {
    console.error('Error retrieving grade visibility:', err.message || err);
    res.status(500).json({ success: false, message: 'Failed to retrieve grade visibility' });
  }
});

module.exports = { createGrade, updateGrade, getGradesByCourse, getStudentGradesForCourse, getEnrolledStudents, deleteGradesByAssessment, getStudentAllCoursesGrades, getWeightedTotals, updateGradeVisibility, getGradeVisibility };
