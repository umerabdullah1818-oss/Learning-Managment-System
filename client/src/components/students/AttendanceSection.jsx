import React from 'react';

const AttendanceSection = ({ attendance }) => {
  return (
    <section className="dashboard-section attendance-section">
      <h2>Course Attendance</h2>
      {attendance.length > 0 ? (
        <div className="attendance-list">
          {attendance.map((att, idx) => (
            <div key={idx} className="attendance-item">
              <div className="attendance-course">{att.course_code}</div>
              <div className="attendance-stats">
                <span className="present">✅ {att.days_present}</span>
                <span className="absent">❌ {att.days_absent}</span>
                <span className="percentage">{att.attendance_percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No attendance data</p>
      )}
    </section>
  );
};

export default AttendanceSection;
