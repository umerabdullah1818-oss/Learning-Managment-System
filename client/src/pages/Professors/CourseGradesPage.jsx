import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Layout from '../layouts/Layout';
import MultiAssessmentSection from '../../components/professors/grades/MultiAssessmentSection';
import FinalGradesSection from '../../components/professors/grades/FinalGradesSection';
import { fetchEnrolledStudents } from '../../redux/slices/enrolledStudentsSlice';
import { fetchGradesByCourse } from '../../redux/slices/gradesSlice';
import { API_BASE_URL } from '../../config/api';

const CourseGradesPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: students, loading: studentsLoading } = useSelector(state => state.enrolledStudents || {});
  const { list: grades, loading: gradesLoading } = useSelector(state => state.grades || {});
  const [courseDetails, setCourseDetails] = useState(null);
  const [customColumns, setCustomColumns] = useState([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [courseGrades, setCourseGrades] = useState({});

  useEffect(() => {
    if (courseId) {
      dispatch(fetchEnrolledStudents(courseId));
      dispatch(fetchGradesByCourse(courseId));
      fetchCourseDetails();
    }
  }, [courseId, dispatch]);

  useEffect(() => {
    if (grades && grades.length > 0) {
      const gradesByStudent = {};
      grades.forEach(grade => {
        if (!gradesByStudent[grade.student_uuid]) {
          gradesByStudent[grade.student_uuid] = {};
        }
        gradesByStudent[grade.student_uuid][grade.assessment_type] = grade;
      });
      setCourseGrades(gradesByStudent);
    }
  }, [grades]);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setCourseDetails(data);
    } catch (err) {
      console.error('Error fetching course:', err);
    }
  };

  const handleAddCustomColumn = () => {
    if (newColumnName.trim()) {
      setCustomColumns([...customColumns, { id: Date.now(), name: newColumnName }]);
      setNewColumnName('');
    }
  };

  const handleRemoveCustomColumn = (columnId) => {
    setCustomColumns(customColumns.filter(col => col.id !== columnId));
  };

  if (studentsLoading) {
    return (
      <Layout>
        <div className="container">
          <p>Loading course and students...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid">
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          ← Back to Courses
        </button>

        {/* Assessment Sections */}
        <div className="mb-4">
          {['assignment', 'quiz', 'midterm', 'final'].map(type => (
            <div key={type} className="mb-3 scrollable-section">
              <MultiAssessmentSection
                assessmentType={type}
                students={students}
                courseId={courseId}
                initialGrades={courseGrades}
              />
            </div>
          ))}
        </div>

        {/* Final Grades Section */}
        <div className="mb-4 scrollable-section">
          <FinalGradesSection
            students={students}
            courseId={courseId}
            courseGrades={courseGrades}
          />
        </div>

      </div>

      <style>{`
        /* Make assessment tables scrollable horizontally */
        .scrollable-section {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Small screen adjustments */
        @media (max-width: 575px) {
          .scrollable-section {
            margin-bottom: 16px;
          }

          .btn {
            width: 100%;
            margin-bottom: 8px;
          }

          .container-fluid {
            padding-left: 10px;
            padding-right: 10px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default CourseGradesPage;
