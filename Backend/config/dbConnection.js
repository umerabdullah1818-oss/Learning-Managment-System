// ============================================================
// Comprehensive In-Memory Mock Database for LMS
// ============================================================

const users = [];
const students = [];
const professors = [];
const courses = [];
const departments = [];
const enrollments = [];
const assignments = [];
const submissions = [];
const grades = [];
const finalGrades = [];
const attendances = [];
const assessmentWeights = [];
const gradingWeights = [];
const assets = [];
const studentCourseGrades = [];

let nextUserId = 1;
let nextStudentId = 1;
let nextProfessorId = 1;
let nextCourseId = 1;
let nextDeptId = 1;
let nextEnrollId = 1;
let nextAssignId = 1;
let nextSubmissionId = 1;
let nextGradeId = 1;
let nextFinalGradeId = 1;
let nextAttendId = 1;
let nextAssetId = 1;

// Helper: generate UUID
const genUuid = () => 'uuid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

// Helper: current timestamp
const now = () => new Date().toISOString();

// ============================================================
// Query handler
// ============================================================
const mockPool = {
  query: async (text, params = []) => {
    const q = text.trim().replace(/\s+/g, ' ');
    console.log("MOCK DB QUERY:", q.substring(0, 120));

    // ----- SELECT NOW() -----
    if (/SELECT NOW\(\)/i.test(q)) {
      return { rows: [{ now: now() }], rowCount: 1 };
    }

    // ----- SELECT COUNT(*) -----
    if (/SELECT COUNT\(\*\)/i.test(q)) {
      let table = 'users';
      if (/FROM students/i.test(q)) table = 'students';
      else if (/FROM professors/i.test(q)) table = 'professors';
      else if (/FROM courses/i.test(q)) table = 'courses';
      else if (/FROM departments/i.test(q)) table = 'departments';
      else if (/FROM enrollments/i.test(q)) table = 'enrollments';
      else if (/FROM assignments/i.test(q)) table = 'assignments';
      else if (/FROM attendances/i.test(q)) table = 'attendances';
      else if (/FROM final_grades/i.test(q)) table = 'finalGrades';
      else if (/FROM assets/i.test(q)) table = 'assets';

      const stores = { users, students, professors, courses, departments, enrollments, assignments, attendances, finalGrades, assets };
      const count = (stores[table] || []).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    // ==================== USERS ====================

    if (/INSERT INTO users/i.test(q)) {
      const newUser = {
        id: nextUserId++,
        uuid: genUuid(),
        first_name: params[0] || 'User',
        last_name: params[1] || 'Mock',
        email: params[2],
        username: params[3],
        password: params[4],
        role: params[5],
        department: params[6] || null,
        student_id: params[7] || null,
        refresh_token: null,
        reset_token: null,
        reset_token_expires: null,
        first_login: true,
        created_at: now(),
        updated_at: now()
      };
      users.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }

    if (/SELECT .* FROM users WHERE email = /i.test(q) && !/AND id !=/i.test(q)) {
      const user = users.find(u => u.email === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/SELECT .* FROM users WHERE email = .* AND id !=/i.test(q)) {
      const found = users.find(u => u.email === params[0] && u.id !== params[1]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    if (/SELECT .* FROM users WHERE username/i.test(q)) {
      const user = users.find(u => u.username === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/SELECT .* FROM users WHERE refresh_token/i.test(q)) {
      const user = users.find(u => u.refresh_token === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/SELECT .* FROM users WHERE reset_token/i.test(q)) {
      const user = users.find(u => u.reset_token === params[0] && u.reset_token_expires && new Date(u.reset_token_expires) > new Date());
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/SELECT .* FROM users WHERE id/i.test(q)) {
      const user = users.find(u => u.id === params[0] || u.id === Number(params[0]));
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/SELECT .* FROM users WHERE uuid/i.test(q)) {
      const user = users.find(u => u.uuid === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET refresh_token/i.test(q) && /WHERE id/i.test(q)) {
      const user = users.find(u => u.id === params[1] || u.id === Number(params[1]));
      if (user) user.refresh_token = params[0];
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET reset_token = NULL/i.test(q)) {
      const user = users.find(u => u.id === params[0] || u.id === Number(params[0]));
      if (user) { user.reset_token = null; user.reset_token_expires = null; }
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET reset_token/i.test(q)) {
      const user = users.find(u => u.id === params[2] || u.id === Number(params[2]));
      if (user) { user.reset_token = params[0]; user.reset_token_expires = params[1]; }
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET password.*first_login/i.test(q)) {
      const user = users.find(u => u.id === params[2] || u.id === Number(params[2]));
      if (user) { user.password = params[0]; user.first_login = params[1]; }
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET password/i.test(q)) {
      const user = users.find(u => u.id === params[1] || u.id === Number(params[1]));
      if (user) user.password = params[0];
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET first_name/i.test(q)) {
      const user = users.find(u => u.id === params[3] || u.id === Number(params[3]));
      if (user) {
        user.first_name = params[0]; user.last_name = params[1]; user.email = params[2];
      }
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (/UPDATE users SET refresh_token = NULL/i.test(q)) {
      const user = users.find(u => u.id === params[0] || u.id === Number(params[0]));
      if (user) user.refresh_token = null;
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    // ==================== STUDENTS ====================

    if (/INSERT INTO students/i.test(q)) {
      const s = {
        id: nextStudentId++,
        user_uuid: params[0] || null,
        full_name: params[1] || null,
        email: params[2] || null,
        student_id: params[3] || 'STU' + String(nextStudentId).padStart(5, '0'),
        department: params[4] || null,
        course: params[5] || null,
        date_of_birth: params[6] || null,
        gender: params[7] || null,
        phone: params[8] || null,
        parent_phone: params[9] || null,
        address: params[10] || null,
        city: params[11] || null,
        state: params[12] || null,
        postal_code: params[13] || null,
        profile_image: params[14] || null,
        account_status: params[15] || 'active',
        role: 'student',
        created_at: now(),
        updated_at: now()
      };
      students.push(s);
      return { rows: [s], rowCount: 1 };
    }

    if (/SELECT .* FROM students.*JOIN users.*WHERE s\.id/i.test(q)) {
      const s = students.find(st => st.id === Number(params[0]));
      if (s) {
        const u = users.find(usr => usr.uuid === s.user_uuid) || {};
        return { rows: [{ ...s, first_name: u.first_name, last_name: u.last_name, email: u.email || s.email, role: u.role || 'student', department: u.department || s.department, student_id: u.student_id || s.student_id }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT .* FROM students.*JOIN users.*WHERE s\.user_uuid/i.test(q)) {
      const s = students.find(st => st.user_uuid === params[0]);
      if (s) {
        const u = users.find(usr => usr.uuid === s.user_uuid) || {};
        return { rows: [{ ...s, first_name: u.first_name, last_name: u.last_name, email: u.email || s.email, role: u.role || 'student', department: u.department || s.department, student_id: u.student_id || s.student_id }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT .* FROM students.*JOIN users.*ORDER BY/i.test(q)) {
      const limit = Number(params[0]) || 10;
      const offset = Number(params[1]) || 0;
      const rows = students.slice(offset, offset + limit).map(s => {
        const u = users.find(usr => usr.uuid === s.user_uuid) || {};
        return { ...s, first_name: u.first_name, last_name: u.last_name, email: u.email || s.email, role: u.role || 'student', department: u.department || s.department, student_id: u.student_id || s.student_id };
      });
      return { rows, rowCount: rows.length };
    }

    if (/SELECT .* FROM students WHERE email/i.test(q)) {
      const s = students.find(st => st.email === params[0]);
      return { rows: s ? [s] : [], rowCount: s ? 1 : 0 };
    }

    if (/SELECT .* FROM students WHERE student_id/i.test(q)) {
      const s = students.find(st => st.student_id === params[0]);
      return { rows: s ? [s] : [], rowCount: s ? 1 : 0 };
    }

    if (/SELECT student_id FROM students/i.test(q)) {
      return { rows: students.map(s => ({ student_id: s.student_id })), rowCount: students.length };
    }

    if (/UPDATE students SET/i.test(q)) {
      const id = Number(params[params.length - 1]);
      const s = students.find(st => st.id === id);
      if (s) s.updated_at = now();
      return { rows: s ? [s] : [], rowCount: s ? 1 : 0 };
    }

    if (/DELETE FROM students/i.test(q)) {
      const idx = students.findIndex(s => s.id === Number(params[0]));
      if (idx >= 0) { const [removed] = students.splice(idx, 1); return { rows: [{ id: removed.id }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }

    // ==================== PROFESSORS ====================

    if (/INSERT INTO professors/i.test(q)) {
      const p = {
        id: nextProfessorId++,
        user_uuid: params[0] || null,
        title: params[1] || null,
        first_name: params[2] || null,
        last_name: params[3] || null,
        email: params[4] || null,
        phone: params[5] || null,
        date_of_birth: params[6] || null,
        gender: params[7] || null,
        address: params[8] || null,
        employee_id: params[9] || 'EMP' + String(nextProfessorId).padStart(5, '0'),
        department: params[10] || null,
        position: params[11] || null,
        employment_type: params[12] || null,
        joining_date: params[13] || null,
        salary: params[14] || null,
        highest_degree: params[15] || null,
        specialization: params[16] || null,
        university: params[17] || null,
        graduation_year: params[18] || null,
        experience: params[19] || null,
        office: params[20] || null,
        office_hours: params[21] || null,
        subjects: params[22] || null,
        bio: params[23] || null,
        profile_image: params[24] || null,
        username: params[25] || null,
        password: params[26] || null,
        first_login: params[27] !== undefined ? params[27] : true,
        account_status: params[28] || 'active',
        role: params[29] || 'professor',
        created_at: now(),
        updated_at: now()
      };
      professors.push(p);
      return { rows: [p], rowCount: 1 };
    }

    if (/SELECT .* FROM professors.*JOIN users.*WHERE p\.id/i.test(q)) {
      const p = professors.find(pr => pr.id === Number(params[0]));
      if (p) {
        const u = users.find(usr => usr.uuid === p.user_uuid) || {};
        return { rows: [{ ...p, first_name: u.first_name || p.first_name, last_name: u.last_name || p.last_name, email: u.email || p.email, role: u.role || 'professor', department: u.department || p.department }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT .* FROM professors.*JOIN users.*WHERE p\.user_uuid/i.test(q)) {
      const p = professors.find(pr => pr.user_uuid === params[0]);
      if (p) {
        const u = users.find(usr => usr.uuid === p.user_uuid) || {};
        return { rows: [{ ...p, first_name: u.first_name || p.first_name, last_name: u.last_name || p.last_name, email: u.email || p.email, role: u.role || 'professor', department: u.department || p.department }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (/SELECT .* FROM professors WHERE email/i.test(q)) {
      const p = professors.find(pr => pr.email === params[0]);
      return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
    }

    if (/SELECT .* FROM professors WHERE employee_id/i.test(q)) {
      const p = professors.find(pr => pr.employee_id === params[0]);
      return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
    }

    if (/SELECT .* FROM professors WHERE username/i.test(q)) {
      const p = professors.find(pr => pr.username === params[0]);
      return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
    }

    if (/SELECT employee_id FROM professors/i.test(q)) {
      return { rows: professors.map(p => ({ employee_id: p.employee_id })), rowCount: professors.length };
    }

    if (/SELECT .* FROM professors p/i.test(q) && /LEFT JOIN courses/i.test(q)) {
      const limit = Number(params[0]) || 10;
      const offset = Number(params[1]) || 0;
      const rows = professors.slice(offset, offset + limit).map(p => ({
        id: p.id, userUuid: p.user_uuid, name: `${p.title || ''} ${p.first_name} ${p.last_name}`.trim(),
        title: p.title, firstName: p.first_name, lastName: p.last_name, employeeId: p.employee_id,
        department: p.department, position: p.position, employmentType: p.employment_type,
        avatar: p.profile_image, email: p.email, username: p.username, status: p.account_status,
        role: p.role, createdAt: p.created_at, courses: String(courses.filter(c => c.professor_uuid === p.user_uuid).length)
      }));
      return { rows, rowCount: rows.length };
    }

    if (/UPDATE professors SET/i.test(q)) {
      const id = Number(params[params.length - 1]);
      const p = professors.find(pr => pr.id === id);
      if (p) p.updated_at = now();
      return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
    }

    if (/DELETE FROM professors/i.test(q)) {
      const idx = professors.findIndex(p => p.id === Number(params[0]));
      if (idx >= 0) { const [removed] = professors.splice(idx, 1); return { rows: [{ id: removed.id }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }

    // ==================== COURSES ====================

    if (/INSERT INTO courses/i.test(q)) {
      const c = { id: nextCourseId++, uuid: genUuid(), course_name: params[0] || null, course_code: params[1] || null, course_description: params[2] || null, department: params[3] || null, professor_uuid: params[4] || null, course_status: params[5] || 'active', created_at: now(), updated_at: now() };
      courses.push(c);
      return { rows: [c], rowCount: 1 };
    }

    if (/SELECT .* FROM courses WHERE id/i.test(q)) {
      const c = courses.find(cr => cr.id === Number(params[0]));
      return { rows: c ? [c] : [], rowCount: c ? 1 : 0 };
    }

    if (/SELECT .* FROM courses/i.test(q) && /ORDER BY/i.test(q)) {
      return { rows: courses, rowCount: courses.length };
    }

    if (/UPDATE courses/i.test(q)) {
      return { rows: courses.length ? [courses[0]] : [], rowCount: 1 };
    }

    if (/DELETE FROM courses/i.test(q)) {
      const idx = courses.findIndex(c => c.id === Number(params[0]));
      if (idx >= 0) { const [removed] = courses.splice(idx, 1); return { rows: [{ id: removed.id }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }

    // ==================== DEPARTMENTS ====================

    if (/INSERT INTO departments/i.test(q)) {
      const d = { id: nextDeptId++, name: params[0] || null, code: params[1] || null, description: params[2] || null, head: params[3] || null, status: params[4] || 'active', created_at: now() };
      departments.push(d);
      return { rows: [d], rowCount: 1 };
    }

    if (/SELECT .* FROM departments/i.test(q)) {
      if (/WHERE id/i.test(q)) {
        const d = departments.find(dp => dp.id === Number(params[0]));
        return { rows: d ? [d] : [], rowCount: d ? 1 : 0 };
      }
      return { rows: departments, rowCount: departments.length };
    }

    if (/UPDATE departments/i.test(q)) {
      return { rows: departments.length ? [departments[0]] : [], rowCount: 1 };
    }

    if (/DELETE FROM departments/i.test(q)) {
      const idx = departments.findIndex(d => d.id === Number(params[0]));
      if (idx >= 0) { const [removed] = departments.splice(idx, 1); return { rows: [{ id: removed.id }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }

    // ==================== ENROLLMENTS ====================

    if (/INSERT INTO enrollments/i.test(q)) {
      const e = { id: nextEnrollId++, user_uuid: params[0] || null, course_id: params[1] || null, enrollment_date: now(), status: 'active', grade: null };
      enrollments.push(e);
      return { rows: [e], rowCount: 1 };
    }

    if (/SELECT .* FROM enrollments/i.test(q) && /JOIN courses/i.test(q)) {
      const uuid = params[0];
      const rows = enrollments.filter(e => e.user_uuid === uuid).map(e => {
        const c = courses.find(cr => cr.id === Number(e.course_id)) || {};
        return { ...e, course_id: c.id, course_name: c.course_name, course_code: c.course_code, course_description: c.course_description };
      });
      return { rows, rowCount: rows.length };
    }

    if (/SELECT .* FROM enrollments/i.test(q)) {
      return { rows: enrollments, rowCount: enrollments.length };
    }

    if (/DELETE FROM enrollments/i.test(q)) {
      const idx = enrollments.findIndex(e => e.id === Number(params[0]));
      if (idx >= 0) { enrollments.splice(idx, 1); return { rows: [{ id: params[0] }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }

    // ==================== ASSIGNMENTS ====================

    if (/INSERT INTO assignments/i.test(q)) {
      const a = { id: nextAssignId++, course_id: params[0] || null, title: params[1] || null, description: params[2] || null, due_date: params[3] || null, total_marks: params[4] || 100, created_at: now() };
      assignments.push(a);
      return { rows: [a], rowCount: 1 };
    }

    if (/SELECT .* FROM assignments/i.test(q)) {
      return { rows: assignments, rowCount: assignments.length };
    }

    // ==================== GRADES / FINAL_GRADES ====================

    if (/INSERT INTO grades/i.test(q)) {
      const g = { id: nextGradeId++, created_at: now() };
      grades.push(g);
      return { rows: [g], rowCount: 1 };
    }

    if (/SELECT .* FROM grades/i.test(q)) {
      return { rows: grades, rowCount: grades.length };
    }

    if (/SELECT .* FROM final_grades/i.test(q)) {
      return { rows: finalGrades, rowCount: finalGrades.length };
    }

    // ==================== ATTENDANCE ====================

    if (/INSERT INTO attendances/i.test(q)) {
      const a = { id: nextAttendId++, created_at: now() };
      attendances.push(a);
      return { rows: [a], rowCount: 1 };
    }

    if (/SELECT .* FROM attendances/i.test(q)) {
      return { rows: attendances, rowCount: attendances.length };
    }

    // ==================== ASSETS ====================

    if (/INSERT INTO assets/i.test(q)) {
      const a = { id: nextAssetId++, created_at: now() };
      assets.push(a);
      return { rows: [a], rowCount: 1 };
    }

    if (/SELECT .* FROM assets/i.test(q)) {
      if (/WHERE id/i.test(q)) {
        const a = assets.find(as => as.id === Number(params[0]));
        return { rows: a ? [a] : [], rowCount: a ? 1 : 0 };
      }
      return { rows: assets, rowCount: assets.length };
    }

    if (/DELETE FROM assets/i.test(q)) {
      const idx = assets.findIndex(a => a.id === Number(params[0]));
      if (idx >= 0) { assets.splice(idx, 1); return { rows: [{ id: params[0] }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }

    // ==================== GRADING/ASSESSMENT WEIGHTS ====================

    if (/INSERT INTO grading_weights/i.test(q) || /INSERT INTO assessment_weights/i.test(q)) {
      return { rows: [{ id: 1 }], rowCount: 1 };
    }

    if (/SELECT .* FROM grading_weights/i.test(q) || /SELECT .* FROM assessment_weights/i.test(q)) {
      return { rows: [], rowCount: 0 };
    }

    // ==================== GENERIC FALLBACKS ====================

    if (/INSERT INTO/i.test(q) && /RETURNING/i.test(q)) {
      return { rows: [{ id: 1, uuid: genUuid() }], rowCount: 1 };
    }

    if (/INSERT INTO/i.test(q)) {
      return { rows: [{ id: 1 }], rowCount: 1 };
    }

    if (/UPDATE/i.test(q) && /RETURNING/i.test(q)) {
      return { rows: [{ id: 1 }], rowCount: 1 };
    }

    if (/UPDATE/i.test(q)) {
      return { rows: [], rowCount: 1 };
    }

    if (/DELETE/i.test(q)) {
      return { rows: [], rowCount: 0 };
    }

    if (/ROUND/i.test(q) && /attendances/i.test(q)) {
      return { rows: [{ average_attendance: '0' }], rowCount: 1 };
    }

    // Default
    return { rows: [], rowCount: 0 };
  },

  on: (event, cb) => {
    if (event === 'connect') {
      setTimeout(() => cb(), 100);
    }
  },

  connect: async () => {
    return {
      query: mockPool.query,
      release: () => {}
    };
  },

  end: async () => {}
};

console.log('⚠️ Running with MOCKED Database Connection (In-Memory) ⚠️');
module.exports = mockPool;
