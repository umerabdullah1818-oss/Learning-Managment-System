import React from 'react';
import './RecentActivities.css';

const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      enrollment: 'fas fa-user-plus',
      assignment: 'fas fa-tasks',
      grade: 'fas fa-star',
      attendance: 'fas fa-calendar-check',
      course: 'fas fa-book',
      user: 'fas fa-user'
    };
    return icons[type] || 'fas fa-circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      enrollment: '#3498db',
      assignment: '#9b59b6',
      grade: '#2ecc71',
      attendance: '#f39c12',
      course: '#e74c3c',
      user: '#1abc9c'
    };
    return colors[type] || '#95a5a6';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="recent-activities">
      <div className="activities-header">
        <h5>Recent Activities</h5>
        <small className="text-muted">Latest system activities</small>
      </div>

      <div className="activities-list">
        {activities && activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: getActivityColor(activity.type) }}>
                <i className={getActivityIcon(activity.type)}></i>
              </div>
              <div className="activity-content">
                <h6 className="activity-title">{activity.title}</h6>
                <p className="activity-description">{activity.description}</p>
                <small className="activity-time">{formatDate(activity.timestamp)}</small>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <p>No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
