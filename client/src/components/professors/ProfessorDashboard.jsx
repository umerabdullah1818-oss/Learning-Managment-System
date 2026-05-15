import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import '../../css/dashboard-layout.css';
import { DashboardHeader } from '../../components/students';
import { useNavigate } from 'react-router-dom';

const ProfessorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [data, setData] = useState({ totals: { totalCourses: 0 }, courses: [] });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/professors/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard');
        const payload = await res.json();
        setData(payload);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.uuid) fetchDashboard();
  }, [user]);

  if (loading) return <div className="text-center mt-4">Loading dashboard...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="student-dashboard">
      <DashboardHeader user={user} />

      {/* Stats Section */}
      <div className="stats-container">
        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/assigned-courses')}
        >
          <div className="stat-icon courses-icon">📚</div>
          <div className="stat-content">
            <h3>Assigned Courses</h3>
            <p className="stat-value">{data.totals.totalCourses}</p>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Assigned Courses</h2>
          {data.courses.length === 0 ? (
            <p className="no-data">No active courses assigned.</p>
          ) : (
            <div className="courses-list">
              {data.courses.map(c => (
                <div key={c.id} className="course-card">
                  <div className="course-header">
                    <h3>{c.courseName}</h3>
                    <div className="course-status">{c.courseStatus}</div>
                  </div>
                  <div className="course-name">{c.courseCode}</div>
                  <div className="course-professor">Enrolled: {c.enrolledStudents}</div>
                  <div className="course-meta">{c.department} • {c.credits} credits • {c.semester}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline Responsive CSS */}
      <style jsx="true">{`
        /* Stats container */
        .stats-container {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          flex: 1 1 250px;
          min-width: 200px;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-content h3 {
          font-size: 16px;
          margin: 0;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
        }

        /* Courses list */
        .courses-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .course-card {
          background: #fff;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .course-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .course-status {
          background: #e0e0e0;
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 12px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .stats-container {
            flex-direction: column;
          }

          .stat-card {
            width: 100%;
          }

          .courses-list {
            grid-template-columns: 1fr;
          }

          .course-card {
            padding: 12px;
          }

          .course-meta {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfessorDashboard;
