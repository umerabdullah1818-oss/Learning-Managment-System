import React from 'react';

const GradesSection = ({ grades }) => {
  // Filter out courses where grades are not visible
  const visibleGrades = grades.filter(grade => grade.gradesVisible !== false);
  const hiddenGrades = grades.filter(grade => grade.gradesVisible === false);

  return (
    <section className="dashboard-section grades-section">
      <h2>Recent Grades</h2>
      
      {/* Show hidden grades message if any */}
      {hiddenGrades.length > 0 && (
        <div className="alert alert-info mb-3" style={{ fontSize: '0.9rem' }}>
          <strong>📋 {hiddenGrades.length}</strong> {hiddenGrades.length === 1 ? 'grade is' : 'grades are'} not yet available
        </div>
      )}
      
      {visibleGrades.length > 0 ? (
        <div className="grades-list">
          {visibleGrades.map((grade, idx) => (
            <div key={idx} className="grade-item">
              <div className="grade-course">{grade.course_code}</div>
              <div className="grade-value">
                <span className="letter-grade">{grade.letter_grade || 'N/A'}</span>
                <span className="percentage-grade">
                  {grade.final_percentage ? parseFloat(grade.final_percentage).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No grades available yet</p>
      )}
    </section>
  );
};

export default GradesSection;
