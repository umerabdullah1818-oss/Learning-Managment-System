import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const studentAttendanceStyles = `
.attendance-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.attendance-container.student-attendance {
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.attendance-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  background-color: #2980b9 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.attendance-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid #ecf0f1;
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #3498db;
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.attendance-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.loading-spinner {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
}

.loading-spinner::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-left: 10px;
  border: 3px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 5px;
  font-weight: 500;
}

.alert.alert-danger {
  background-color: #fadbd8;
  color: #c0392b;
  border-left: 4px solid #c0392b;
}

.alert.alert-success {
  background-color: #d5f4e6;
  color: #27ae60;
  border-left: 4px solid #27ae60;
}

.alert.alert-warning {
  background-color: #fdeaa8;
  color: #d68910;
  border-left: 4px solid #d68910;
}

@media (max-width: 768px) {
  .attendance-container { padding: 15px; }

  .attendance-header { flex-direction: column; gap: 15px; align-items: flex-start; }

  .attendance-header h2 { font-size: 22px; }

  .header-actions { width: 100%; flex-direction: column; }

  .attendance-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  .tab-btn { padding: 10px 15px; white-space: nowrap; }

  .attendance-content { padding: 15px; }
}
`;
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceSummary from './AttendanceSummary';
import AttendanceHistory from './AttendanceHistory';

const StudentAttendance = ({ courseId, courseInfo }) => {
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // summary, calendar, history

  useEffect(() => {
    fetchAttendance();
  }, [courseId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/api/attendance/student/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAttendance(response.data.attendance);
      setStatistics(response.data.statistics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="attendance-container">
        <style>{studentAttendanceStyles}</style>
        <div className="loading-spinner">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="attendance-container student-attendance">
      <style>{studentAttendanceStyles}</style>
      <div className="attendance-header">
        <h2>My Attendance</h2>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchAttendance}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tab Navigation */}
      <div className="attendance-tabs">
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Summary
        </button>
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendar
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 History
        </button>
      </div>

      {/* Tab Content */}
      <div className="attendance-content">
        {activeTab === 'summary' && (
          <AttendanceSummary 
            statistics={statistics} 
            attendance={attendance} 
            courseInfo={courseInfo}
          />
        )}

        {activeTab === 'calendar' && (
          <AttendanceCalendar attendance={attendance} />
        )}

        {activeTab === 'history' && (
          <AttendanceHistory attendance={attendance} onRefresh={fetchAttendance} courseId={courseId} />
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
