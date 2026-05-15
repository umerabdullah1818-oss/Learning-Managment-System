import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import MyGrades from '../../components/students/grades/MyGrades';

const GradesPage = () => {
  const [courseId, setCourseId] = useState('');

  return (
    <Layout>
      <div className="container">
        <MyGrades courseId={courseId} />
      </div>
    </Layout>
  );
};

export default GradesPage;
