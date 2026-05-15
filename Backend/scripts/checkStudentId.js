const pool = require('../config/dbConnection');

async function run(id) {
  try {
    const target = id || 'STU00003';
    console.log('Checking student_id:', target);
    const u = await pool.query('SELECT id, uuid, email, role FROM users WHERE student_id = $1', [target]);
    const s = await pool.query('SELECT id, user_uuid, full_name, email FROM students WHERE student_id = $1', [target]);
    console.log('users:', u.rowCount, u.rows);
    console.log('students:', s.rowCount, s.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run(process.argv[2]);
