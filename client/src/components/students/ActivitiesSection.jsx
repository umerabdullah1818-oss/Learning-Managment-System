import React from 'react';

const ActivitiesSection = ({ activities }) => {
  return (
    <section className="dashboard-section activities-section">
      <h2>Recent Activities</h2>
      {activities.length > 0 ? (
        <div className="activities-list">
          {activities.map((activity, idx) => (
            <div key={idx} className="activity-item">
              <div className="activity-type">{activity.type}</div>
              <div className="activity-title">{activity.title}</div>
              <div className="activity-course">{activity.course_name}</div>
              <div className="activity-time">
                {new Date(activity.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No recent activities</p>
      )}
    </section>
  );
};

export default ActivitiesSection;
