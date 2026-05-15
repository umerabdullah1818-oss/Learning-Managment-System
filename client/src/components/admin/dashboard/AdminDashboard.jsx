import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import RecentActivities from './RecentActivities';
import { API_BASE_URL } from '../../../config/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalProfessors: 0,
    totalCourses: 0,
    totalDepartments: 0,
    totalEnrollments: 0,
    averageAttendance: 0,
  });
  const [chartData, setChartData] = useState({
    enrollmentTrend: [],
    courseDistribution: [],
    professorWorkload: [],
    gradeDistribution: [],
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const { students } = useSelector((state) => state.student);
  const { courses } = useSelector((state) => state.course);
  const { departments } = useSelector((state) => state.department);
  const authToken = useSelector((state) => state.auth.token);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = authToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated. Please login.');
        setLoading(false);
        return;
      }
      
      // Fetch all required data in parallel
      const [statsResponse, chartsResponse, activitiesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/dashboard/charts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/dashboard/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsResponse.data);
      setChartData(chartsResponse.data);
      setActivities(activitiesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Welcome back! Here's your system overview.</p>
      </div>

      {/* Dashboard Stats Section */}
      <DashboardStats stats={stats} />

      {/* Charts Section */}
      <DashboardCharts chartData={chartData} />

      {/* Recent Activities Section */}
      <RecentActivities activities={activities} />
    </div>
  );
};

export default AdminDashboard;
