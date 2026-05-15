import React from 'react';

const Grades = () => {
  // Sample grades data - replace with actual data fetching logic
  const gradesData = [
    {
      courseName: 'Mathematics',
      assignments: { score: 85, total: 100, weightage: 20 },
      quizzes: { score: 90, total: 100, weightage: 20 },
      midterm: { score: 78, total: 100, weightage: 30 },
      final: { score: 82, total: 100, weightage: 30 },
      totalGPA: 3.7,
    },
    {
      courseName: 'Physics',
      assignments: { score: 92, total: 100, weightage: 25 },
      quizzes: { score: 88, total: 100, weightage: 25 },
      midterm: { score: 85, total: 100, weightage: 25 },
      final: { score: 90, total: 100, weightage: 25 },
      totalGPA: 3.9,
    },
    {
      courseName: 'Chemistry',
      assignments: { score: 80, total: 100, weightage: 20 },
      quizzes: { score: 85, total: 100, weightage: 20 },
      midterm: { score: 75, total: 100, weightage: 30 },
      final: { score: 88, total: 100, weightage: 30 },
      totalGPA: 3.5,
    },
    {
      courseName: 'Computer Science',
      assignments: { score: 95, total: 100, weightage: 20 },
      quizzes: { score: 92, total: 100, weightage: 20 },
      midterm: { score: 88, total: 100, weightage: 30 },
      final: { score: 94, total: 100, weightage: 30 },
      totalGPA: 4.0,
    },
  ];

  const calculateWeightedScore = (item) => {
    return ((item.score / item.total) * item.weightage).toFixed(2);
  };

  const calculateTotalGrade = (course) => {
    const totalWeighted =
      parseFloat(calculateWeightedScore(course.assignments)) +
      parseFloat(calculateWeightedScore(course.quizzes)) +
      parseFloat(calculateWeightedScore(course.midterm)) +
      parseFloat(calculateWeightedScore(course.final));
    return totalWeighted.toFixed(2);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Course-wise Grades</h2>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Course Name</th>
              <th>Assignments Marks</th>
              <th>Quiz Marks</th>
              <th>Midterm Exam</th>
              <th>Final Exam</th>
              <th>Total Grade / GPA</th>
            </tr>
          </thead>
          <tbody>
            {gradesData.map((course, index) => (
              <tr key={index}>
                <td>{course.courseName}</td>
                <td>{course.assignments.score}/{course.assignments.total}</td>
                <td>{course.quizzes.score}/{course.quizzes.total}</td>
                <td>{course.midterm.score}/{course.midterm.total}</td>
                <td>{course.final.score}/{course.final.total}</td>
                <td>{course.totalGPA}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-5 mb-3">Grade Breakdown</h3>
      {gradesData.map((course, index) => (
        <div key={index} className="card mb-3">
          <div className="card-header">
            <strong>{course.courseName}</strong>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <h5>Assignments</h5>
                <p>Score: {course.assignments.score}/{course.assignments.total}</p>
                <p>Weightage: {course.assignments.weightage}%</p>
                <p>Weighted Score: {calculateWeightedScore(course.assignments)}</p>
              </div>
              <div className="col-md-3">
                <h5>Quizzes</h5>
                <p>Score: {course.quizzes.score}/{course.quizzes.total}</p>
                <p>Weightage: {course.quizzes.weightage}%</p>
                <p>Weighted Score: {calculateWeightedScore(course.quizzes)}</p>
              </div>
              <div className="col-md-3">
                <h5>Midterm Exam</h5>
                <p>Score: {course.midterm.score}/{course.midterm.total}</p>
                <p>Weightage: {course.midterm.weightage}%</p>
                <p>Weighted Score: {calculateWeightedScore(course.midterm)}</p>
              </div>
              <div className="col-md-3">
                <h5>Final Exam</h5>
                <p>Score: {course.final.score}/{course.final.total}</p>
                <p>Weightage: {course.final.weightage}%</p>
                <p>Weighted Score: {calculateWeightedScore(course.final)}</p>
              </div>
            </div>
            <hr />
            <p><strong>Total Weighted Grade: {calculateTotalGrade(course)}</strong></p>
            <p><strong>GPA: {course.totalGPA}</strong></p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Grades;
