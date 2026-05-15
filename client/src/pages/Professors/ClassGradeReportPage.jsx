import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import ClassGradeReport from '../../components/professors/grades/ClassGradeReport';

const ClassGradeReportPage = () => {
  const [courseId, setCourseId] = useState('');

  return (
    <Layout>
      <div className="container">
        <h3>Class Grade Report</h3>
        <div className="mb-3">
          <label>Course ID</label>
          <input className="form-control" value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Enter course id" />
        </div>
        <ClassGradeReport courseId={courseId} />
      </div>
    </Layout>
  );
};

export default ClassGradeReportPage;
