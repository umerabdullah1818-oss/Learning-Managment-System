import React from 'react';

const AssignmentsSection = ({ assignments }) => {
  return (
    <section className="dashboard-section assignments-section">
      <h2>Upcoming Assignments</h2>
      {assignments.length > 0 ? (
        <div className="assignments-list">
          {assignments.map(assignment => (
            <div key={assignment.id} className="assignment-item">
              <div className="assignment-title">{assignment.title}</div>
              <div className="assignment-course">{assignment.course_code}</div>
              <div className="assignment-due">
                Due: {new Date(assignment.due_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No pending assignments</p>
      )}
    </section>
  );
};

export default AssignmentsSection;
