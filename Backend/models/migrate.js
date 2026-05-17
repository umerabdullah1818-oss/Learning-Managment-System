const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const pool = require('../config/dbConnection');
const fs = require('fs');

async function runMigration(closePool = true) {
  try {
    console.log('Running migration...');

    // Read and execute users table SQL
    const usersSqlFilePath = path.join(__dirname, 'createUsersTable.sql');
    const usersSql = fs.readFileSync(usersSqlFilePath, 'utf8');
    await pool.query(usersSql);
    console.log('Users table created/updated successfully!');

    // Alter users table to make username nullable
    console.log('Altering users table to make username nullable...');
    await pool.query(`ALTER TABLE users ALTER COLUMN username DROP NOT NULL;`);
    console.log('Users table altered successfully!');

    // Read and execute students table SQL
    const studentsSqlFilePath = path.join(__dirname, 'createStudentsTable.sql');
    const studentsSql = fs.readFileSync(studentsSqlFilePath, 'utf8');
    await pool.query(studentsSql);
    console.log('Students table created/updated successfully!');

    // Alter students table to add user_uuid if not exists
    console.log('Altering students table...');
    await pool.query(`DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'user_uuid') THEN
            ALTER TABLE students ADD COLUMN user_uuid UUID;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'students' AND constraint_name = 'fk_user_uuid') THEN
            ALTER TABLE students ADD CONSTRAINT fk_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'students' AND constraint_name = 'unique_user_uuid') THEN
            ALTER TABLE students ADD CONSTRAINT unique_user_uuid UNIQUE(user_uuid);
        END IF;
    END
    $$;`);
    console.log('Students table altered successfully!');

    // Update existing students to link with users via UUID
    console.log('Updating existing student records...');
    const updateStudentsQuery = `
      UPDATE students
      SET user_uuid = users.uuid
      FROM users
      WHERE students.email = users.email AND students.user_uuid IS NULL;
    `;
    await pool.query(updateStudentsQuery);
    console.log('Existing students updated with user_uuid!');

    // Read and execute professors table SQL
    const professorsSqlFilePath = path.join(__dirname, 'createProfessorsTable.sql');
    const professorsSql = fs.readFileSync(professorsSqlFilePath, 'utf8');
    await pool.query(professorsSql);
    console.log('Professors table created successfully!');

    // Alter professors table to add user_uuid if not exists
    console.log('Altering professors table...');
    await pool.query(`DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professors' AND column_name = 'user_uuid') THEN
            ALTER TABLE professors ADD COLUMN user_uuid UUID;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'professors' AND constraint_name = 'fk_professor_user_uuid') THEN
            ALTER TABLE professors ADD CONSTRAINT fk_professor_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'professors' AND constraint_name = 'unique_professor_user_uuid') THEN
            ALTER TABLE professors ADD CONSTRAINT unique_professor_user_uuid UNIQUE(user_uuid);
        END IF;
    END
    $$;`);
    console.log('Professors table altered successfully!');

    // Ensure professors table has first_login column (added later)
    console.log("Ensuring professors table has 'first_login' column...");
    await pool.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professors' AND column_name = 'first_login') THEN
      ALTER TABLE professors ADD COLUMN first_login BOOLEAN DEFAULT true;
      END IF;
    END
    $$;`);
    console.log("Professors table 'first_login' column ensured successfully!");

    // Update existing professors to link with users via UUID
    console.log('Updating existing professor records...');
    const updateProfessorsQuery = `
      UPDATE professors
      SET user_uuid = users.uuid
      FROM users
      WHERE professors.email = users.email AND professors.user_uuid IS NULL;
    `;
    await pool.query(updateProfessorsQuery);
    console.log('Existing professors updated with user_uuid!');

    // Read and execute courses table SQL
    const coursesSqlFilePath = path.join(__dirname, 'createCoursesTable.sql');
    const coursesSql = fs.readFileSync(coursesSqlFilePath, 'utf8');
    await pool.query(coursesSql);
    console.log('Courses table created successfully!');

    // Alter courses table to add uuid if not exists
    console.log('Altering courses table to add uuid...');
    await pool.query(`DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'uuid') THEN
            ALTER TABLE courses ADD COLUMN uuid UUID DEFAULT gen_random_uuid() UNIQUE;
            -- Update existing courses with uuid
            UPDATE courses SET uuid = gen_random_uuid() WHERE uuid IS NULL;
        END IF;
    END
    $$;`);
    console.log('Courses table altered successfully!');

    // Read and execute assignments table SQL
    const assignmentsSqlFilePath = path.join(__dirname, 'createAssignmentsTable.sql');
    const assignmentsSql = fs.readFileSync(assignmentsSqlFilePath, 'utf8');
    await pool.query(assignmentsSql);
    console.log('Assignments table created successfully!');

    // Alter courses table to ensure professor_uuid exists
    console.log('Ensuring courses table has professor_uuid column with foreign key...');
await pool.query(`DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'professor_uuid') THEN
            ALTER TABLE courses ADD COLUMN professor_uuid UUID;
            ALTER TABLE courses ADD CONSTRAINT fk_course_professor_uuid FOREIGN KEY (professor_uuid) REFERENCES professors(user_uuid) ON DELETE SET NULL;
        END IF;
    END
    $$;`);
    console.log('Courses table professor_uuid ensured successfully!');

    // Alter courses table to add grades_visible column
    console.log('Ensuring courses table has grades_visible column...');
    await pool.query(`DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'grades_visible') THEN
            ALTER TABLE courses ADD COLUMN grades_visible BOOLEAN DEFAULT false;
        END IF;
    END
    $$;`);
    console.log('Courses table grades_visible column ensured successfully!');

    const assetsSqlFilePath = path.join(__dirname, 'createAssetsTable.sql');
    const assetsSql = fs.readFileSync(assetsSqlFilePath, 'utf8');
    await pool.query(assetsSql);
    console.log('Assets table created successfully!');

    // Read and execute departments table SQL
    const departmentsSqlFilePath = path.join(__dirname, 'createDepartmentTable.sql');
    const departmentsSql = fs.readFileSync(departmentsSqlFilePath, 'utf8');
    await pool.query(departmentsSql);
    console.log('Departments table created successfully!');

    // Read and execute enrollments table SQL
    const enrollmentsSqlFilePath = path.join(__dirname, 'createEnrollmentsTable.sql');
    const enrollmentsSql = fs.readFileSync(enrollmentsSqlFilePath, 'utf8');
    await pool.query(enrollmentsSql);
    console.log('Enrollments table created successfully!');

    // Read and execute grades table SQL
    const gradesSqlFilePath = path.join(__dirname, 'createGradesTable.sql');
    const gradesSql = fs.readFileSync(gradesSqlFilePath, 'utf8');
    await pool.query(gradesSql);
    console.log('Grades table created successfully!');

    // Ensure grades table has 'weight' column (added later) to avoid errors
    console.log("Ensuring grades table has 'weight' column...");
    await pool.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grades' AND column_name = 'weight') THEN
        ALTER TABLE grades ADD COLUMN weight DECIMAL(5,2);
      END IF;
    END
    $$;`);
    console.log("Grades table 'weight' column ensured successfully!");

    // Read and execute grading weights table SQL
    const gradingWeightsSqlFilePath = path.join(__dirname, 'createGradingWeightsTable.sql');
    const gradingWeightsSql = fs.readFileSync(gradingWeightsSqlFilePath, 'utf8');
    await pool.query(gradingWeightsSql);
    console.log('Grading Weights table created successfully!');

    // Read and execute assessment weights table SQL
    const assessmentWeightsSqlFilePath = path.join(__dirname, 'createAssessmentWeightsTable.sql');
    if (fs.existsSync(assessmentWeightsSqlFilePath)) {
      const assessmentWeightsSql = fs.readFileSync(assessmentWeightsSqlFilePath, 'utf8');
      await pool.query(assessmentWeightsSql);
      console.log('Assessment Weights table created successfully!');
    }

    // Read and execute final grades table SQL
    const finalGradesSqlFilePath = path.join(__dirname, 'createFinalGradesTable.sql');
    if (fs.existsSync(finalGradesSqlFilePath)) {
      const finalGradesSql = fs.readFileSync(finalGradesSqlFilePath, 'utf8');
      await pool.query(finalGradesSql);
      console.log('Final Grades table created successfully!');
    }

    // Read and execute attendance tables SQL
    const attendanceSqlFilePath = path.join(__dirname, 'createAttendanceTable.sql');
    if (fs.existsSync(attendanceSqlFilePath)) {
      const attendanceSql = fs.readFileSync(attendanceSqlFilePath, 'utf8');
      await pool.query(attendanceSql);
      console.log('Attendance tables (attendances, attendance_corrections, attendance_history) created successfully!');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close the pool only if requested
    if (closePool) {
      await pool.end();
    }
  }
}

async function refreshMigration() {
  try {
    console.log('Refreshing migration...');

    // Drop all tables in reverse order to avoid dependency issues
    await pool.query('DROP TABLE IF EXISTS enrollments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS departments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS assets CASCADE;');
    await pool.query('DROP TABLE IF EXISTS courses CASCADE;');
    await pool.query('DROP TABLE IF EXISTS professors CASCADE;');
    await pool.query('DROP TABLE IF EXISTS students CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('All tables dropped successfully!');

    // Re-run migration without closing the pool inside runMigration
    // so that we only call `pool.end()` once (in this function's finally)
    await runMigration(false);
    console.log('Refresh migration completed successfully!');
  } catch (err) {
    console.error('Refresh migration failed:', err);
  } finally {
    await pool.end();
  }
}

async function rollbackMigration() {
  try {
    console.log('Rolling back migration (dropping all tables)...');

    // Drop all tables as a full rollback (since tracking individual steps is not implemented)
    await pool.query('DROP TABLE IF EXISTS enrollments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS departments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS assets CASCADE;');
    await pool.query('DROP TABLE IF EXISTS courses CASCADE;');
    await pool.query('DROP TABLE IF EXISTS professors CASCADE;');
    await pool.query('DROP TABLE IF EXISTS students CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('Rollback completed: all tables dropped!');
  } catch (err) {
    console.error('Rollback failed:', err);
  } finally {
    await pool.end();
  }
}

async function dropAndCreateEnrollments() {
  try {
    console.log("Dropping and recreating enrollments table...");

    // Drop enrollments only
    await pool.query('DROP TABLE IF EXISTS enrollments CASCADE;');
    console.log("Enrollments table dropped!");

    // Recreate from SQL file
    const enrollmentsSqlFilePath = path.join(__dirname, 'createEnrollmentsTable.sql');
    const enrollmentsSql = fs.readFileSync(enrollmentsSqlFilePath, 'utf8');

    await pool.query(enrollmentsSql);
    console.log("Enrollments table recreated!");

  } catch (err) {
    console.error("Error in enrollments migration:", err);
  } finally {
    await pool.end();
  }
}


// Check command line arguments
const command = process.argv[2];

async function dropAndCreateAssignments() {
  try {
    console.log("Dropping and recreating assignments table...");

    // Drop assignments table if exists cascading
    await pool.query('DROP TABLE IF EXISTS assignments CASCADE;');
    console.log("Assignments table dropped!");

    // Read and execute assignments table creation SQL
    const assignmentsSqlFilePath = path.join(__dirname, 'createAssignmentsTable.sql');
    const assignmentsSql = fs.readFileSync(assignmentsSqlFilePath, 'utf8');

    await pool.query(assignmentsSql);
    console.log("Assignments table recreated!");

  } catch (err) {
    console.error("Error in assignments migration:", err);
  } finally {
    await pool.end();
  }
}

if (command === 'refresh') {
  refreshMigration();
} else if (command === 'rollback') {
  rollbackMigration();
} else if (command === 'enrollments') {
  dropAndCreateEnrollments();
} else if (command === 'assignments') {
  dropAndCreateAssignments();
} else {
  runMigration();
}
