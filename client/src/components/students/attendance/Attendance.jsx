import React from 'react';

const Attendance = () => {
  // Sample attendance data - replace with actual data fetching logic
  const attendanceData = [
    {
      courseName: 'Mathematics',
      totalClasses: 20,
      attendedClasses: 18,
    },
    {
      courseName: 'Physics',
      totalClasses: 25,
      attendedClasses: 22,
    },
    {
      courseName: 'Chemistry',
      totalClasses: 15,
      attendedClasses: 12,
    },
    {
      courseName: 'Computer Science',
      totalClasses: 30,
      attendedClasses: 28,
    },
  ];

  const calculateAbsents = (total, attended) => total - attended;
  const calculatePercentage = (attended, total) => ((attended / total) * 100).toFixed(2);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Course-wise Attendance</h2>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Course Name</th>
              <th>Total Classes</th>
              <th>Attended Classes</th>
              <th>Absents</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((item, index) => (
              <tr key={index}>
                <td>{item.courseName}</td>
                <td>{item.totalClasses}</td>
                <td>{item.attendedClasses}</td>
                <td>{calculateAbsents(item.totalClasses, item.attendedClasses)}</td>
                <td>{calculatePercentage(item.attendedClasses, item.totalClasses)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
