const pool = require('../config/dbConnection');

const createCourse = async (courseData) => {
  const {
    courseCode,
    courseName,
    department,
    professorUuid,
    courseDescription,
    credits = 3,
    duration = 16,
    maxStudents = 30,
    prerequisites,
    semester,
    courseType,
    classDays,
    startTime,
    endTime,
    classroom,
    courseImage,
    courseStatus = 'active',
    enrollmentType = 'open',
    onlineAvailable = false,
    certificateOffered = false,
    recordedLectures = false,
    courseFee = 0.00,
    labFee = 0.00,
    materialFee = 0.00
  } = courseData;

  const query = `
    INSERT INTO courses (
      course_code, course_name, department, professor_uuid, course_description,
      credits, duration, max_students, prerequisites, semester, course_type,
      class_days, start_time, end_time, classroom, course_image, course_status,
      enrollment_type, online_available, certificate_offered, recorded_lectures,
      course_fee, lab_fee, material_fee, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22, $23, $24, $25
    )
    RETURNING id, uuid, course_code, course_name, department, professor_uuid,
             course_description, credits, duration, max_students, prerequisites,
             semester, course_type, class_days, start_time, end_time, classroom,
             course_image, course_status, enrollment_type, online_available,
             certificate_offered, recorded_lectures, course_fee, lab_fee,
             material_fee, total_fee, created_by, created_at;
  `;

  const values = [
    courseCode, courseName, department, professorUuid, courseDescription,
    credits, duration, maxStudents, prerequisites, semester, courseType,
    JSON.stringify(classDays), startTime, endTime, classroom, courseImage,
    courseStatus, enrollmentType, onlineAvailable, certificateOffered,
    recordedLectures, courseFee, labFee, materialFee, courseData.createdBy
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const findCourseById = async (id) => {
  const query = `
    SELECT
      c.id,
      c.course_code as "courseCode",
      c.course_name as "courseName",
      c.department,
      c.course_description as "courseDescription",
      c.credits,
      c.duration,
      c.max_students as "maxStudents",
      c.prerequisites,
      c.semester,
      c.course_type as "courseType",
      c.class_days as "classDays",
      c.start_time as "startTime",
      c.end_time as "endTime",
      c.classroom,
      c.course_image as "courseImage",
      c.course_status as "courseStatus",
      c.enrollment_type as "enrollmentType",
      c.online_available as "onlineAvailable",
      c.certificate_offered as "certificateOffered",
      c.recorded_lectures as "recordedLectures",
      c.course_fee as "courseFee",
      c.lab_fee as "labFee",
      c.material_fee as "materialFee",
      c.total_fee as "totalFee",
      c.professor_uuid as "professorUuid",
      c.created_at as "createdAt",
      c.updated_at as "updatedAt",
      CONCAT(COALESCE(p.title, ''), ' ', COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as "professorName",
      p.email as "professorEmail",
      p.department as "professorDepartment"
    FROM courses c
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    WHERE c.id = $1
  `;
  const result = await pool.query(query, [id]);
  if (result.rows[0]) {
    // Parse the classDays JSON string into an array
    try {
      result.rows[0].classDays = JSON.parse(result.rows[0].classDays || '[]');
    } catch (e) {
      result.rows[0].classDays = [];
    }
  }
  return result.rows[0];
};

const findCourseByCode = async (courseCode) => {
  const query = `
    SELECT
      c.id,
      c.course_code as "courseCode",
      c.course_name as "courseName",
      c.department,
      c.course_description as "courseDescription",
      c.credits,
      c.duration,
      c.max_students as "maxStudents",
      c.prerequisites,
      c.semester,
      c.course_type as "courseType",
      c.class_days as "classDays",
      c.start_time as "startTime",
      c.end_time as "endTime",
      c.classroom,
      c.course_image as "courseImage",
      c.course_status as "courseStatus",
      c.enrollment_type as "enrollmentType",
      c.online_available as "onlineAvailable",
      c.certificate_offered as "certificateOffered",
      c.recorded_lectures as "recordedLectures",
      c.course_fee as "courseFee",
      c.lab_fee as "labFee",
      c.material_fee as "materialFee",
      c.total_fee as "totalFee",
      c.created_at as "createdAt",
      c.updated_at as "updatedAt",
      CONCAT(COALESCE(p.title, ''), ' ', COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as "professorName",
      p.email as "professorEmail",
      p.department as "professorDepartment"
    FROM courses c
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    WHERE c.course_code = $1
  `;
  const result = await pool.query(query, [courseCode]);
  if (result.rows[0]) {
    // Parse the classDays JSON string into an array
    try {
      result.rows[0].classDays = JSON.parse(result.rows[0].classDays || '[]');
    } catch (e) {
      result.rows[0].classDays = [];
    }
  }
  return result.rows[0];
};

const getAllCourses = async (limit = 10, offset = 0, filters = {}) => {
  let whereClause = '';
  const values = [];
  let paramIndex = 1;

  if (filters.department) {
    whereClause += ` AND LOWER(c.department) = LOWER($${paramIndex})`;
    values.push(filters.department);
    paramIndex++;
  }

  if (filters.semester) {
    whereClause += ` AND LOWER(c.semester) = LOWER($${paramIndex})`;
    values.push(filters.semester);
    paramIndex++;
  }

  if (filters.courseType) {
    whereClause += ` AND LOWER(c.course_type) = LOWER($${paramIndex})`;
    values.push(filters.courseType);
    paramIndex++;
  }

  if (filters.status) {
    whereClause += ` AND LOWER(c.course_status) = LOWER($${paramIndex})`;
    values.push(filters.status);
    paramIndex++;
  }

  if (filters.search) {
    whereClause += ` AND (c.course_code ILIKE $${paramIndex} OR c.course_name ILIKE $${paramIndex})`;
    values.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.createdBy) {
    if (filters.createdBy === 'administrator') {
      // Get ALL administrator user IDs and filter courses created by any admin
      whereClause += ` AND c.created_by IN (SELECT id FROM users WHERE role = 'administrator')`;
    } else {
      whereClause += ` AND c.created_by = $${paramIndex}`;
      values.push(parseInt(filters.createdBy));
      paramIndex++;
    }
  }

  values.push(limit, offset);
  console.log('getAllCourses - params:', { limit, offset, filterCount: Object.keys(filters).length, valueCount: values.length }); // DEBUG

  // Prepare LIMIT/OFFSET values after filter values
  const query = `
    SELECT
      c.id,
      c.uuid,
      c.course_code as "courseCode",
      c.course_name as "courseName",
      c.department,
      c.credits,
      c.max_students as "maxStudents",
      c.course_image as "courseImage",
      c.classroom,
      c.semester,
      c.class_days as "classDays",
      COALESCE(c.course_status, 'active') as "courseStatus",
      CONCAT(COALESCE(p.title, ''), ' ', COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as "professorName",
      COALESCE(e.enrolled_count, 0) as "enrolledStudents"
    FROM courses c
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    LEFT JOIN (
      SELECT course_id, COUNT(*) as enrolled_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY course_id
    ) e ON c.id = e.course_id
    WHERE 1=1 ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  // Run count query to get total number of matching courses (without limit)
  const countValues = values.slice(0, values.length - 2); // exclude limit & offset
  const countQuery = `SELECT COUNT(*)::int AS total FROM courses c LEFT JOIN professors p ON c.professor_uuid = p.user_uuid WHERE 1=1 ${whereClause}`;
  const countResult = await pool.query(countQuery, countValues);
  const total = countResult.rows[0]?.total ?? 0;

  console.log('getAllCourses - executing query with', values.length, 'parameters'); // DEBUG
  const result = await pool.query(query, values);
  console.log('getAllCourses - query returned', result.rows.length, 'rows'); // DEBUG

  // Parse class_days JSON for each course
  result.rows.forEach(course => {
    course.classDays = JSON.parse(course.classDays || '[]');
  });

  return { rows: result.rows, total };
};

const updateCourse = async (id, updateData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      // Map camelCase to snake_case for database columns
      let dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

      // Special handling for classDays -> class_days
      if (key === 'classDays') {
        dbKey = 'class_days';
        values.push(JSON.stringify(updateData[key]));
      } else {
        values.push(updateData[key]);
      }

      fields.push(`${dbKey} = $${paramIndex}`);
      paramIndex++;
    }
  });

  if (fields.length === 0) return null;

  values.push(id);
  const query = `UPDATE courses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, values);
  if (result.rows[0]) {
    // Convert snake_case to camelCase
    const row = result.rows[0];
    return {
      id: row.id,
      courseCode: row.course_code,
      courseName: row.course_name,
      department: row.department,
      courseDescription: row.course_description,
      credits: row.credits,
      duration: row.duration,
      maxStudents: row.max_students,
      prerequisites: row.prerequisites,
      semester: row.semester,
      courseType: row.course_type,
      classDays: JSON.parse(row.class_days || '[]'),
      startTime: row.start_time,
      endTime: row.end_time,
      classroom: row.classroom,
      courseImage: row.course_image,
      courseStatus: row.course_status,
      enrollmentType: row.enrollment_type,
      onlineAvailable: row.online_available,
      certificateOffered: row.certificate_offered,
      recordedLectures: row.recorded_lectures,
      courseFee: row.course_fee,
      labFee: row.lab_fee,
      materialFee: row.material_fee,
      totalFee: row.total_fee,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  return null;
};

const deleteCourse = async (id) => {
  const query = 'DELETE FROM courses WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const getCoursesByProfessor = async (professorUuid, limit = 10, offset = 0) => {
  const query = `
    SELECT
      c.id,
      c.uuid as "uuid",
      c.course_code as "courseCode",
      c.course_name as "courseName",
      c.department,
      c.course_description as "courseDescription",
      c.credits,
      c.semester,
      c.course_type as "courseType",
      c.course_status as "courseStatus",
      c.course_image as "courseImage",
      c.created_at as "createdAt",
      COALESCE(e.enrolled_count, 0) as "enrolledStudents",
      CONCAT(COALESCE(p.title, ''), ' ', COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as "professorName"
    FROM courses c
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    LEFT JOIN (
      SELECT course_id, COUNT(*) as enrolled_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY course_id
    ) e ON c.id = e.course_id
    WHERE c.professor_uuid = $1 AND c.course_status = 'active'
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await pool.query(query, [professorUuid, limit, offset]);
  console.log(result);
  return result.rows;
};

const getCoursesByDepartment = async (department, limit = 10, offset = 0) => {
  const query = `
    SELECT
      c.id,
      c.uuid,
      c.course_code as "courseCode",
      c.course_name as "courseName",
      c.credits,
      c.semester,
      c.course_type as "courseType",
      c.course_status as "courseStatus",
      CONCAT(COALESCE(p.title, ''), ' ', COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as "professorName",
      c.created_at as "createdAt",
      COALESCE(e.enrolled_count, 0) as "enrolledStudents"
    FROM courses c
    LEFT JOIN professors p ON c.professor_uuid = p.user_uuid
    LEFT JOIN (
      SELECT course_id, COUNT(*) as enrolled_count
      FROM enrollments
      WHERE status = 'active'
      GROUP BY course_id
    ) e ON c.id = e.course_id
    WHERE c.department = $1
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await pool.query(query, [department, limit, offset]);
  return result.rows;
};

module.exports = {
  createCourse,
  findCourseById,
  findCourseByCode,
  getAllCourses,
  updateCourse,
  deleteCourse,
  getCoursesByProfessor,
  getCoursesByDepartment
};
