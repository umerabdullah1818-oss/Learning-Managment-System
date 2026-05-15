import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Layout from '../layouts/Layout';
import {
  DashboardHeader,
  DashboardStats,
  CoursesSection,
  AssignmentsSection,
  GradesSection,
  AttendanceSection
} from '../../components/students';
import '../../css/dashboard-layout.css';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, coursesRes, assignmentsRes, gradesRes, attendanceRes] = await Promise.all([
        axios.get('/api/student/dashboard/stats', { headers }),
        axios.get('/api/student/dashboard/courses', { headers }),
        axios.get('/api/student/dashboard/assignments', { headers }),
        axios.get('/api/student/dashboard/grades', { headers }),
        axios.get('/api/student/dashboard/attendance', { headers })
      ]);

      setStats(statsRes.data);
      setCourses(coursesRes.data);
      setAssignments(assignmentsRes.data);
      setGrades(gradesRes.data);
      setAttendance(attendanceRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout><div className="dashboard-loading">Loading dashboard...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="dashboard-error">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="student-dashboard">
        <DashboardHeader user={user} />
        <DashboardStats stats={stats} />

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          <CoursesSection courses={courses} />
          <AssignmentsSection assignments={assignments} />
          <GradesSection grades={grades} />
          <AttendanceSection attendance={attendance} />
        </div>

        {/* Refresh Button */}
        <div className="dashboard-actions">
          <button onClick={fetchDashboardData} className="refresh-btn">
            🔄 Refresh Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
