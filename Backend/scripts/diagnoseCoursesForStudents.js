const pool = require('../config/dbConnection');

async function diagnoseCoursesForStudents() {
  try {
    console.log('\n=== COURSE DIAGNOSIS FOR STUDENT VIEW ===\n');

    // 1. Check total courses in database
    console.log('1️⃣  TOTAL COURSES IN DATABASE:');
    const totalCoursesResult = await pool.query('SELECT COUNT(*) as count FROM courses');
    console.log(`   Total courses: ${totalCoursesResult.rows[0].count}\n`);

    // 2. Check course statuses
    console.log('2️⃣  COURSES BY STATUS:');
    const statusResult = await pool.query(
      `SELECT COALESCE(course_status, 'active') as status, COUNT(*) as count 
       FROM courses 
       GROUP BY COALESCE(course_status, 'active')`
    );
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    console.log('');

    // 3. Check who created courses
    console.log('3️⃣  COURSES BY CREATOR:');
    const creatorResult = await pool.query(
      `SELECT c.created_by, u.role, u.email, COUNT(c.id) as count
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       GROUP BY c.created_by, u.role, u.email`
    );
    creatorResult.rows.forEach(row => {
      console.log(`   User ID: ${row.created_by}, Role: ${row.role || 'unknown'}, Email: ${row.email || 'unknown'}, Count: ${row.count}`);
    });
    console.log('');

    // 4. Check active courses created by admins
    console.log('4️⃣  ACTIVE COURSES CREATED BY ADMINS (Student View):');
    const adminCoursesResult = await pool.query(
      `SELECT c.id, c.course_code, c.course_name, c.department, COALESCE(c.course_status, 'active') as status, u.role, u.email
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE COALESCE(c.course_status, 'active') = 'active'
       AND u.role = 'administrator'
       LIMIT 20`
    );
    console.log(`   Found ${adminCoursesResult.rows.length} courses:\n`);
    adminCoursesResult.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.course_code} - ${row.course_name}`);
      console.log(`      Status: ${row.status}, Creator: ${row.email}`);
    });
    console.log('');

    // 5. Check users table for administrators
    console.log('5️⃣  ADMINISTRATORS IN SYSTEM:');
    const adminsResult = await pool.query(
      `SELECT id, email, role FROM users WHERE role = 'administrator' LIMIT 10`
    );
    console.log(`   Found ${adminsResult.rows.length} admins:\n`);
    adminsResult.rows.forEach((admin, idx) => {
      console.log(`   ${idx + 1}. ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}`);
    });
    console.log('');

    // 6. Check the actual query that would be executed for a student
    console.log('6️⃣  SIMULATING STUDENT QUERY (FIXED):');
    const studentQueryResult = await pool.query(
      `SELECT 
        c.id,
        c.course_code,
        c.course_name,
        c.department,
        COALESCE(c.course_status, 'active') as "courseStatus"
      FROM courses c
      LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
      WHERE 1=1 
      AND LOWER(c.course_status) = LOWER('active')
      AND c.created_by IN (SELECT id FROM users WHERE role = 'administrator')
      ORDER BY c.created_at DESC
      LIMIT 1000 OFFSET 0`
    );
    console.log(`   Query returned ${studentQueryResult.rows.length} courses\n`);
    studentQueryResult.rows.slice(0, 5).forEach((course, idx) => {
      console.log(`   ${idx + 1}. ${course.course_code} - ${course.course_name} (Status: ${course.courseStatus})`);
    });
    if (studentQueryResult.rows.length > 5) {
      console.log(`   ... and ${studentQueryResult.rows.length - 5} more`);
    }
    console.log('');

    console.log('=== END DIAGNOSIS ===\n');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await pool.end();
  }
}

diagnoseCoursesForStudents();
