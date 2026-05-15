import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { getAttendanceStatus, getAttendanceMetrics } from '../../../utils/attendanceUtils';
import { generateAttendancePDF, downloadPDF } from '../../../services/pdfExportService';
import { toast } from 'react-toastify';

const attendanceSummaryStyles = `
.attendance-summary {
  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    h3 {
      margin: 0;
      color: #2c3e50;
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

      &:hover {
        background-color: #229954;
      }
    }
  }

  .status-card {
    display: flex;
    align-items: center;
    gap: 30px;
    padding: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    border-left: 5px solid;
    margin-bottom: 30px;

    .status-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: bold;
      color: white;
    }

    .status-info {
      flex: 1;

      h2 {
        margin: 0 0 10px 0;
        font-size: 48px;
      }

      .status-label {
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .metric-card {
      padding: 20px;
      background-color: #ecf0f1;
      border-radius: 8px;
      text-align: center;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      &.present {
        border-left: 4px solid #27ae60;
      }

      &.absent {
        border-left: 4px solid #e74c3c;
      }

      &.late {
        border-left: 4px solid #f39c12;
      }

      &.excused {
        border-left: 4px solid #3498db;
      }

      .metric-label {
        font-size: 12px;
        color: #7f8c8d;
        margin-bottom: 10px;
        text-transform: uppercase;
        font-weight: 600;
      }

      .metric-value {
        font-size: 32px;
        font-weight: bold;
        color: #2c3e50;
      }
    }
  }
}

.status-success {
  color: #27ae60;
}

.status-info {
  color: #3498db;
}

.status-warning {
  color: #f39c12;
}

.status-danger {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .attendance-summary {
    padding: 10px 0;
  }

  .attendance-summary .summary-header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    align-items: flex-start;
  }

  .attendance-summary .summary-header h3 {
    font-size: 18px;
  }

  .attendance-summary .btn-export {
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 6px;
  }

  .attendance-summary .status-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    padding: 20px;
    border-left-width: 0;
    border-top: 5px solid;
  }

  .attendance-summary .status-card .status-icon {
    width: 70px;
    height: 70px;
    font-size: 36px;
  }

  .attendance-summary .status-card .status-info h2 {
    font-size: 40px;
    margin-bottom: 8px;
  }

  .attendance-summary .status-card .status-info .status-label {
    font-size: 15px;
  }

  .attendance-summary .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .attendance-summary .metrics-grid .metric-card {
    padding: 16px;
  }

  .attendance-summary .metrics-grid .metric-card .metric-label {
    font-size: 11px;
    margin-bottom: 8px;
  }

  .attendance-summary .metrics-grid .metric-card .metric-value {
    font-size: 28px;
  }

  .attendance-summary .alert {
    font-size: 13px;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 6px;
    line-height: 1.5;
  }

  .attendance-summary .alert-warning {
    background-color: #fff3cd;
    color: #856404;
    border-left: 4px solid #f39c12;
  }

  .attendance-summary .alert-danger {
    background-color: #f8d7da;
    color: #721c24;
    border-left: 4px solid #e74c3c;
  }
}

@media (max-width: 480px) {
  .attendance-summary .metrics-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .attendance-summary .metrics-grid .metric-card {
    padding: 14px;
  }

  .attendance-summary .status-card {
    padding: 18px;
  }

  .attendance-summary .status-card .status-icon {
    width: 60px;
    height: 60px;
    font-size: 32px;
  }

  .attendance-summary .status-card .status-info h2 {
    font-size: 36px;
  }

  .attendance-summary .metrics-grid .metric-card .metric-value {
    font-size: 26px;
  }
}
`;

const AttendanceSummary = ({ statistics, attendance, courseInfo }) => {
  const metrics = getAttendanceMetrics(attendance);
  const statusInfo = getAttendanceStatus(metrics.percentage);
  const [studentDetails, setStudentDetails] = useState(null);
  
  // Get user info from Redux store
  const reduxUser = useSelector((state) => state.auth?.user);
  const token = useSelector((state) => state.auth?.token) || localStorage.getItem('accessToken');

  // Fetch student details on mount
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!token) return;
      
      try {
        const decoded = jwtDecode(token);
        const userUuid = decoded.UserInfo?.uuid || decoded.uuid;
        
        if (userUuid) {
          const response = await axios.get(
            `${API_BASE_URL}/api/students/user/${userUuid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStudentDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching student details:', error);
      }
    };

    fetchStudentDetails();
  }, [token]);

  const handleExportPDF = async () => {
    try {
      // Get student info from multiple sources
      let studentInfo = { firstName: '', lastName: '', studentId: '', email: '' };
      
      // Priority 1: From API response (studentDetails)
      if (studentDetails) {
        studentInfo.firstName = studentDetails.first_name || studentDetails.firstName || '';
        studentInfo.lastName = studentDetails.last_name || studentDetails.lastName || '';
        studentInfo.studentId = studentDetails.student_id || studentDetails.studentId || '';
        studentInfo.email = studentDetails.email || '';
      }
      
      // Priority 2: From token
      if (token && (!studentInfo.firstName || !studentInfo.email)) {
        try {
          const decoded = jwtDecode(token);
          const userInfo = decoded.UserInfo || decoded;
          
          if (!studentInfo.email) {
            studentInfo.email = userInfo.email || '';
          }
          
          if (!studentInfo.studentId) {
            studentInfo.studentId = userInfo.uuid || userInfo.studentId || '';
          }
          
          // Try to get name from username if not from API
          if (!studentInfo.firstName && userInfo.username) {
            const nameParts = userInfo.username.split(' ');
            studentInfo.firstName = nameParts[0] || '';
            studentInfo.lastName = nameParts.slice(1).join(' ') || '';
          }
        } catch (err) {
          console.error('Error decoding token:', err);
        }
      }
      
      // Priority 3: From Redux user info
      if (reduxUser && !studentInfo.firstName) {
        if (reduxUser.name) {
          const nameParts = reduxUser.name.split(' ');
          studentInfo.firstName = nameParts[0] || '';
          studentInfo.lastName = nameParts.slice(1).join(' ') || '';
        } else if (reduxUser.username) {
          const nameParts = reduxUser.username.split(' ');
          studentInfo.firstName = nameParts[0] || '';
          studentInfo.lastName = nameParts.slice(1).join(' ') || '';
        }
        if (!studentInfo.studentId) {
          studentInfo.studentId = reduxUser.uuid || '';
        }
      }
      
      // Priority 4: Fallback to localStorage
      if (!studentInfo.firstName) {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
          const nameParts = storedUsername.split(' ');
          studentInfo.firstName = nameParts[0] || 'Student';
          studentInfo.lastName = nameParts.slice(1).join(' ') || '';
        } else {
          studentInfo.firstName = 'Student';
        }
      }
      
      if (!studentInfo.studentId) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          studentInfo.studentId = storedUser.uuid || storedUser.studentId || 'N/A';
        } catch (e) {
          studentInfo.studentId = 'N/A';
        }
      }

      const studentData = {
        firstName: studentInfo.firstName || 'Student',
        lastName: studentInfo.lastName || '',
        studentId: studentInfo.studentId || 'N/A',
        email: studentInfo.email || 'N/A',
        courseName: courseInfo?.course_name || courseInfo?.courseName || 'N/A',
        courseCode: courseInfo?.course_code || courseInfo?.courseCode || 'N/A',
      };

      const blob = generateAttendancePDF(studentData, attendance, metrics);
      downloadPDF(blob, `Attendance_Certificate_${studentData.firstName}_${studentData.lastName}_${Date.now()}.pdf`);
      toast.success('Attendance certificate exported successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  return (
    <div className="attendance-summary">
      <style>{attendanceSummaryStyles}</style>
      <div className="summary-header">
        <h3>Attendance Overview</h3>
        <button className="btn-export" onClick={handleExportPDF}>
          📥 Export Certificate
        </button>
      </div>

      <div className="status-card" style={{ borderColor: statusInfo.bgColor }}>
        <div className="status-icon" style={{ backgroundColor: statusInfo.bgColor }}>
          {metrics.percentage >= 75 ? '✓' : '⚠'}
        </div>
        <div className="status-info">
          <h2>{metrics.percentage}%</h2>
          <p className={`status-label status-${statusInfo.color}`}>{statusInfo.status}</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Sessions</div>
          <div className="metric-value">{metrics.totalSessions}</div>
        </div>

        <div className="metric-card present">
          <div className="metric-label">Present</div>
          <div className="metric-value">{metrics.presentCount}</div>
        </div>

        <div className="metric-card absent">
          <div className="metric-label">Absent</div>
          <div className="metric-value">{metrics.absentCount}</div>
        </div>

        <div className="metric-card late">
          <div className="metric-label">Late</div>
          <div className="metric-value">{metrics.lateCount}</div>
        </div>

        <div className="metric-card excused">
          <div className="metric-label">Excused</div>
          <div className="metric-value">{metrics.excusedCount}</div>
        </div>
      </div>

      {metrics.percentage < 75 && (
        <div className="alert alert-warning">
          ⚠️ Your attendance is below 75%. Please contact your instructor to improve your attendance.
        </div>
      )}

      {metrics.percentage < 60 && (
        <div className="alert alert-danger">
          🚨 Your attendance is critical. You may be at risk of failing this course.
        </div>
      )}
    </div>
  );
};

export default AttendanceSummary;
