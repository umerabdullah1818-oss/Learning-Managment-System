import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../layouts/Layout';
import { fetchProfessorCourses } from '../../redux/slices/coursesSlice';
import { FaUsers, FaInfoCircle, FaChevronRight, FaBook } from 'react-icons/fa';

// Inject custom CSS once
const injectGradesPageStyles = () => {
  const id = 'grades-page-grid-styles';
  if (typeof document === 'undefined' || document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.innerHTML = `
    /* Card styling */
    .grade-card { 
      transition: transform .18s ease, box-shadow .18s ease; 
      cursor: pointer; 
    }
    .grade-card:focus { 
      outline: 3px solid rgba(13,110,253,.25); 
    }
    .grade-card .card-body { 
      min-height: 110px; 
    }

    /* GRID LAYOUT */
    .grades-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr; /* mobile: 1 card */
    }

    @media (min-width: 576px) {
      .grades-grid {
        grid-template-columns: repeat(2, 1fr); /* small: 2 cards */
      }
    }

    @media (min-width: 992px) {
      .grades-grid {
        grid-template-columns: repeat(3, 1fr); /* large: 3 cards */
      }
    }

    /* Smaller devices */
    @media (max-width: 576px) {
      .grade-card .card-body { min-height: 90px; }
      .grade-card .card-title { font-size: 1rem; }
      .grade-card .card-text { font-size: .875rem; }
    }
  `;
  document.head.appendChild(style);
};

const GradesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: courses, loading: coursesLoading } = useSelector(
    state => state.courses || {}
  );

  useEffect(() => {
    dispatch(fetchProfessorCourses());
    injectGradesPageStyles();
  }, [dispatch]);

  const handleCourseClick = (courseId) => {
    navigate(`/professor/grades/${courseId}`);
  };

  return (
    <Layout>
      <div className="container">
        <h2 className="mb-4"><FaBook className="me-2" /> Grade Management</h2>

        {coursesLoading ? (
          <p className="text-muted">Loading your courses...</p>
        ) : courses && courses.length > 0 ? (
          
          <div className="grades-grid">

            {courses.map(course => (
              <div key={course.id}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Manage grades for ${course.courseCode}`}
                  className="card h-100 grade-card"
                  onClick={() => handleCourseClick(course.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleCourseClick(course.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
                  }}
                >
                  <div className="card-body d-flex flex-column justify-content-between">
                    <div>
                      <h5 className="card-title mb-1"><FaBook className="me-2" /> {course.courseCode}</h5>
                      <p className="card-text text-muted mb-2 text-truncate">{course.courseName}</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-muted d-flex align-items-center">
                        <FaUsers className="me-2" /> {course.enrolledStudents} students
                      </small>
                      <span className="badge bg-primary">{course.credits} credits</span>
                    </div>
                  </div>

                  <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center">
                    <small className="text-muted">Click to manage grades</small>
                    <FaChevronRight className="text-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <FaInfoCircle className="me-2" />
            <div>You don't have any courses assigned yet.</div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GradesPage;
