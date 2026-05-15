import React from 'react';

const CoursesSection = ({ courses }) => {
  return (
    <section className="dashboard-section courses-section">
      <h2>Your Courses</h2>
      {courses.length > 0 ? (
        <div className="courses-list">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h3>{course.course_code}</h3>
                <span className="course-status">{course.status}</span>
              </div>
              <p className="course-name">{course.course_name}</p>
              <p className="course-professor">
                Prof. {course.professor_full_name}
              </p>
              <div className="course-meta">
                <span>{course.credits} Credits</span>
                <span>Sem: {course.semester}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No courses enrolled yet</p>
      )}
    </section>
  );
};

export default CoursesSection;
