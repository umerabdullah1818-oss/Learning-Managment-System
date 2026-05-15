import React from 'react';

const DashboardStats = ({ stats }) => {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon courses-icon">📚</div>
        <div className="stat-content">
          <h3>Enrolled Courses</h3>
          <p className="stat-value">{stats?.enrolledCourses || 0}</p>
        </div>
      </div>

      {/* <div className="stat-card">
        <div className="stat-icon gpa-icon">🎯</div>
        <div className="stat-content">
          <h3>Current GPA</h3>
          <p className="stat-value">{stats?.gpa?.toFixed(2) || 'N/A'}</p>
        </div>
      </div> */}

      <div className="stat-card">
        <div className="stat-icon attendance-icon">✅</div>
        <div className="stat-content">
          <h3>Attendance</h3>
          <p className="stat-value">{stats?.attendance?.toFixed(1) || 0}%</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon assignments-icon">📝</div>
        <div className="stat-content">
          <h3>Pending Assignments</h3>
          <p className="stat-value">{stats?.pendingAssignments || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
