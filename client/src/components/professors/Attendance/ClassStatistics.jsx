import React from 'react';
import { toast } from 'react-toastify';
import { generateCourseAttendancePDF, downloadPDF } from '../../../services/pdfExportService';

const classStatisticsStyles = `
.class-statistics {
  margin-bottom: 30px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.stats-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.btn-export {
  padding: 10px 16px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-export:hover {
  background-color: #229954;
}

.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
}

.stat-card.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  opacity: 0.9;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.student-stats-table {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.student-stats-table table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.student-stats-table thead {
  background-color: #34495e;
  color: white;
}

.student-stats-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
}

.student-stats-table tbody tr {
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.3s ease;
}

.student-stats-table tbody tr:hover {
  background-color: #f8f9fa;
}

.student-stats-table td {
  padding: 15px;
  font-size: 14px;
  color: #2c3e50;
}

.student-stats-table .name {
  font-weight: 600;
}

.student-stats-table .present {
  color: #27ae60;
  font-weight: 600;
}

.student-stats-table .absent {
  color: #e74c3c;
  font-weight: 600;
}

.student-stats-table .late {
  color: #f39c12;
}

.student-stats-table .percentage {
  text-align: center;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.good {
  background-color: #d5f4e6;
  color: #27ae60;
}

.badge.at-risk {
  background-color: #fadbd8;
  color: #c0392b;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.status-badge.good {
  background-color: #27ae60;
}

.status-badge.warning {
  background-color: #f39c12;
}

.status-badge.danger {
  background-color: #e74c3c;
}

.status-badge.excellent {
  background-color: #16a085;
}

@media (max-width: 768px) {
  .stats-header {
    flex-direction: column;
    gap: 15px;
  }

  .overall-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .student-stats-table {
    font-size: 12px;
  }

  .student-stats-table th {
    padding: 10px;
    font-size: 11px;
  }

  .student-stats-table td {
    padding: 10px;
    font-size: 12px;
  }
}
`;

const ClassStatistics = ({ statistics, course }) => {
  const handleExportPDF = async () => {
    try {
      // Get professor name from localStorage with multiple fallback options
      const firstName = localStorage.getItem('firstName') || 
                       localStorage.getItem('firstname') || 
                       localStorage.getItem('first_name') || '';
      const lastName = localStorage.getItem('lastName') || 
                      localStorage.getItem('lastname') || 
                      localStorage.getItem('last_name') || '';
      const userName = localStorage.getItem('userName') || 
                      localStorage.getItem('username') || 
                      localStorage.getItem('name') || '';
      
      // Construct professor name with fallbacks
      let professorName = `${firstName} ${lastName}`.trim();
      if (!professorName) professorName = userName;
      if (!professorName) professorName = 'Professor';

      // Get course details from props with multiple fallback options
      const courseCode = course?.code || 
                        course?.courseCode || 
                        course?.course_code || 
                        course?.Code || 
                        'N/A';
      const courseName = course?.name || 
                        course?.courseName || 
                        course?.course_name || 
                        course?.Name || 
                        'Course';

      const courseData = {
        courseName: courseName,
        courseCode: courseCode,
        professorName: professorName,
      };

      const blob = generateCourseAttendancePDF(courseData, statistics);
      const fileName = `${courseCode.replace(/\s+/g, '_')}_Attendance_Report_${Date.now()}.pdf`;
      downloadPDF(blob, fileName);
      toast.success('Attendance report exported successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  const getStudentName = (s) => {
    if (!s) return '—';
    
    // Priority 1: full_name from backend (this is what getClassStatistics returns)
    if (s.full_name) return s.full_name;
    if (s.fullname) return s.fullname;
    if (s.fullName) return s.fullName;
    
    // Priority 2: first_name/last_name combinations
    if (s.first_name || s.last_name) {
      return `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—';
    }
    if (s.firstname || s.lastname) {
      return `${s.firstname || ''} ${s.lastname || ''}`.trim() || '—';
    }
    
    // Priority 3: name variations
    if (s.name) return s.name;
    if (s.student_name) return s.student_name;
    if (s.studentName) return s.studentName;
    
    // Priority 4: nested student object
    if (s.student) {
      if (s.student.full_name) return s.student.full_name;
      if (s.student.first_name || s.student.last_name) {
        return `${s.student.first_name || ''} ${s.student.last_name || ''}`.trim() || '—';
      }
      if (s.student.name) return s.student.name;
    }
    
    // Last resort - show student ID
    return s.student_id || s.studentId || s.id || '—';
  };

  if (!statistics || statistics.length === 0) {
    return (
      <div className="class-statistics">
        <style>{classStatisticsStyles}</style>
        <h3>Class Statistics</h3>
        <p className="no-data">No attendance data available yet</p>
      </div>
    );
  }

  // Calculate overall statistics
  const totalStudents = statistics.length;
  const overallAttendance = totalStudents > 0
    ? (
        statistics.reduce((sum, s) => sum + (Number(s.attendance_percentage) || 0), 0) /
        totalStudents
      ).toFixed(2)
    : '0.00';

  const atRiskStudents = statistics.filter((s) => s.attendance_percentage < 75).length;

  return (
    <div className="class-statistics">
      <style>{classStatisticsStyles}</style>
      <div className="stats-header">
        <h3>Class Attendance Statistics</h3>
        <button className="btn-export" onClick={handleExportPDF}>
          📥 Export Report
        </button>
      </div>

      <div className="overall-stats">
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{totalStudents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overall Attendance</div>
          <div className="stat-value">{overallAttendance}%</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">At Risk</div>
          <div className="stat-value">{atRiskStudents}</div>
        </div>
      </div>

      <div className="student-stats-table">
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Total Sessions</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Attendance %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {statistics.map((student) => {
              const attendanceValue = Number(student.attendance_percentage) || 0;
              return (
                <tr key={student.student_id}>
                  <td className="name">
                    {getStudentName(student)}
                  </td>
                  <td>{student.total_sessions || 0}</td>
                  <td className="present">{student.present_count || 0}</td>
                  <td className="absent">{student.absent_count || 0}</td>
                  <td className="late">{student.late_count || 0}</td>
                  <td className="percentage">
                    <span className={`badge ${attendanceValue >= 75 ? 'good' : 'at-risk'}`}>
                      {attendanceValue.toFixed(2)}%
                    </span>
                  </td>
                  <td className="status">
                    {attendanceValue >= 90 && <span className="status-badge good">Excellent</span>}
                    {attendanceValue >= 75 && attendanceValue < 90 && (
                      <span className="status-badge good">Good</span>
                    )}
                    {attendanceValue >= 60 && attendanceValue < 75 && (
                      <span className="status-badge warning">At Risk</span>
                    )}
                    {attendanceValue < 60 && (
                      <span className="status-badge danger">Critical</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassStatistics;
