import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import StudentGradeDetail from '../../components/professors/grades/StudentGradeDetail';

const StudentGradeDetailPage = () => {
  const [courseId, setCourseId] = useState('');
  const [studentUuid, setStudentUuid] = useState('');

  return (
    <Layout>
      <div className="container">
        <h3>Student Grade Detail</h3>
        <div className="row mb-3">
          <div className="col-md-6">
            <label>Course ID</label>
            <input className="form-control" value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Enter course id" />
          </div>
          <div className="col-md-6">
            <label>Student UUID</label>
            <input className="form-control" value={studentUuid} onChange={(e) => setStudentUuid(e.target.value)} placeholder="Enter student UUID" />
          </div>
        </div>

        <StudentGradeDetail courseId={courseId} studentUuid={studentUuid} />
      </div>
    </Layout>
  );
};

export default StudentGradeDetailPage;
