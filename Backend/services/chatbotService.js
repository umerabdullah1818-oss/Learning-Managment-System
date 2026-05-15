const Assignments = require('../models/Assignments');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const FinalGrades = require('../models/FinalGrades');
const Attendance = require('../models/Attendance');
const Professor = require('../models/Professor');
const Course = require('../models/Course');

// Build student context by querying models
async function buildStudentContext(userUuid) {
  const student = await Student.findStudentByUserUuid(userUuid).catch(() => null);
  const courses = await Enrollment.getEnrollmentsByUserUuid(userUuid).catch(() => []);
  const assignments = await Assignments.findAssignmentsByEnrolledCourses(userUuid).catch(() => []);
  const finalGrades = await FinalGrades.getFinalGradesByStudent(userUuid).catch(() => []);

  // Compute simple GPA as average of final_percentage if available
  let gpa = null;
  if (finalGrades && finalGrades.length) {
    const avg = finalGrades.reduce((s, g) => s + (parseFloat(g.final_percentage) || 0), 0) / finalGrades.length;
    // Map percent to 4.0-ish scale (simple mapping)
    gpa = Math.round((avg / 25) * 100) / 100; // crude: 100 -> 4.0
  }

  // attendance: compute average attendancePercent from Attendance.getStatistics if possible
  let attendancePercent = null;
  try {
    if (courses && courses.length) {
      const stats = [];
      for (const c of courses) {
        try {
          const s = await Attendance.getStatistics(c.student_id || c.studentId || c.id, c.course_id || c.courseId || c.course_id);
          if (s && s.attendance_percentage !== null && s.attendance_percentage !== undefined) stats.push(parseFloat(s.attendance_percentage));
        } catch (err) {
          // ignore per-course attendance errors
        }
      }
      if (stats.length) attendancePercent = Math.round((stats.reduce((a, b) => a + b, 0) / stats.length) * 100) / 100;
    }
  } catch (err) {
    attendancePercent = null;
  }

  // pick pending assignments (due in future and status not submitted)
  const pendingAssignments = (assignments || []).filter(a => {
    const due = a.dueDate || a.due_date;
    const status = a.studentSubmissionStatus || a.status;
    const notSubmitted = !status || status.toLowerCase() !== 'submitted';
    const future = !due || new Date(due) >= new Date();
    return notSubmitted && future;
  }).map(a => ({ id: a.id, title: a.title, dueDate: a.dueDate || a.due_date, course: a.courseName || a.course_name }));

  return {
    student: {
      name: student ? (student.full_name || student.first_name || student.username) : null,
      uuid: userUuid
    },
    gpa,
    attendancePercent,
    courses: (courses || []).map(c => ({ id: c.course_id || c.courseId || c.id, title: c.courseName || c.course_name || c.courseName })),
    pendingAssignments
  };
}

async function buildProfessorContext(userUuid) {
  const professor = await Professor.findProfessorByUserUuid(userUuid).catch(() => null);
  // courses where professor is assigned
  const courses = [];
  try {
    // This queries courses where professor_uuid == userUuid - reuse Course.findCourseById isn't ideal
    const pool = require('../config/dbConnection');
    const res = await pool.query('SELECT id, course_name as "courseName", course_code as "courseCode" FROM courses WHERE professor_uuid = $1 AND course_status = $2', [userUuid, 'active']);
    courses.push(...res.rows);
  } catch (err) {
    // ignore
  }

  // assignments authored by professor
  const assignments = await Assignments.findAssignmentsByProfessorId(userUuid).catch(() => []);

  // pending submission counts (best-effort): assignments list may include submission counts in future
  const pendingReviews = (assignments || []).filter(a => a.status && a.status.toLowerCase() !== 'closed').map(a => ({ id: a.id, title: a.title, dueDate: a.dueDate || a.due_date, course: a.courseName || a.course_name }));

  return {
    professor: {
      name: professor ? (professor.first_name || professor.name || professor.username) : null,
      uuid: userUuid
    },
    courses: courses.map(c => ({ id: c.id, title: c.courseName || c.course_name || c.courseCode })),
    assignments,
    pendingReviews
  };
}

// Generic builder that picks based on role
async function buildContext(user) {
  if (!user || !user.uuid) return null;
  if (user.role === 'student') return buildStudentContext(user.uuid);
  if (user.role === 'professor') return buildProfessorContext(user.uuid);
  return null;
}

// Simple rule-based reply generator using the assistant rules
function generateReply(message, context, role = 'student') {
  const q = (message || '').toLowerCase();
  // Detect outside-LMS questions (simple)
  const outside = /politics|personal life|where are you from|who are you|religion|sexual|vote|election/gi;
  if (outside.test(q)) return 'I can only help with LMS and academic-related questions.';
  // Role-specific replies
  if (role === 'student') {
    if (q.includes('assignment')) return 'To view assignments: navigate to Assignments → select the course → open the assignment. To submit: open assignment → upload file → click Submit.';
    if (q.includes('course')) return 'Check your enrolled courses on the Dashboard or Courses page; select a course for details.';
    if (q.includes('grade') || q.includes('gpa')) {
      const g = context && context.gpa !== null ? `Your GPA: ${context.gpa}` : 'Open Grades or Transcript to view course grades and GPA.';
      return g;
    }
    if (q.includes('attendance')) {
      const a = context && context.attendancePercent !== null ? `Your attendance average: ${context.attendancePercent}%` : 'Open Attendance to view per-course attendance and history.';
      return a;
    }
    if (q.includes('password')) return 'Change password from Profile → Change Password or visit account settings to update your password.';
    if (q.includes('profile')) return 'Update profile: open Profile from the sidebar, edit fields and click Save.';
    if (q.includes('dashboard')) return 'Dashboard shows quick stats: upcoming deadlines, recent grades, enrolled courses, and attendance summary.';
    if (q.includes('pending') || q.includes('deadline') || q.includes('due')) {
      if (context && context.pendingAssignments && context.pendingAssignments.length) {
        const list = context.pendingAssignments.slice(0,5).map(a => `• ${a.title} — due ${a.dueDate || 'N/A'} (${a.course || 'course'})`).join('\n');
        return `You have these pending assignments:\n${list}`;
      }
      return 'I do not see pending assignments in your profile. Check the Assignments page for details.';
    }
    return ' I can help with assignments, courses, grades, attendance, profile, and deadlines. Try mentioning one of those.';
  }

  // Professor replies
  if (role === 'professor') {
    if (q.includes('assignment') || q.includes('assignments') || q.includes('create assignment') || q.includes('edit assignment')) {
      return 'Manage assignments from Professor → Assignments. Click "New" to create, or open an existing assignment to edit due date, files, and grading settings.';
    }
    if (q.includes('course') || q.includes('courses') || q.includes('roster') || q.includes('students')) {
      return 'Your assigned courses are listed in Professor Dashboard → Assigned Courses. Open a course to see roster, materials, and stats.';
    }
    if (q.includes('grade') || q.includes('grading') || q.includes('grades') || q.includes('publish')) {
      return 'To grade: open Assignments → select an assignment → view submissions. Enter marks and click Publish to release grades to students.';
    }
    if (q.includes('rubric') || q.includes('rubrics')) {
      return 'Rubrics can be added while creating/editing an assignment in the grading settings. Use rubrics to standardize marking.';
    }
    if (q.includes('attendance') || q.includes('attend')) {
      return 'Attendance tools are under Attendance. Choose a course to record sessions, mark present/absent, and view history.';
    }
    if (q.includes('submission') || q.includes('submissions') || q.includes('pending') || q.includes('review') || q.includes('ungraded')) {
      if (context && context.pendingReviews && context.pendingReviews.length) {
        const list = context.pendingReviews.slice(0,5).map(a => `• ${a.title} — ${a.course || 'course'} ${a.dueDate ? `(${a.dueDate})` : ''}`).join('\n');
        return `Pending reviews / open assignments:\n${list}`;
      }
      return 'Open Assignments → choose an assignment to view submission list and start grading.';
    }
    if (q.includes('export') || q.includes('download') || q.includes('submissions download')) {
      return 'You can download submissions from the assignment submissions view. Use the download/export button to export grades or files.';
    }
    if (q.includes('office hours') || q.includes('office-hour') || q.includes('office')) {
      return 'Set or view your office hours on your Professor Profile page or include them in your course information.';
    }
    if (q.includes('exam') || q.includes('midterm') || q.includes('final')) {
      return 'Schedule exams via the course settings or coordinate with administration. Post exam details in the course announcements or calendar.';
    }
    if (q.includes('profile') || q.includes('password')) return 'Update your profile on Professor Profile page. Change password via Settings → Change Password.';
    return ' I can help with course management, creating/editing assignments, grading workflows, attendance, and submissions. Ask about one of those.';
  }

  return 'I can only help with LMS and academic-related questions.';
}

module.exports = {
  buildStudentContext,
  buildProfessorContext,
  buildContext,
  generateReply
};
