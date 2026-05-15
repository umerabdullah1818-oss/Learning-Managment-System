import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const professorAttendanceStyles = `
.professor-attendance {
  padding: 20px;
  background-color: #f8fafc; /* soft background */
  border-radius: 8px;
  min-height: 100vh;
  color: #1f2937; /* global readable text color */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 18px rgba(18, 38, 63, 0.06);
}

.attendance-header h2 {
  margin: 0 0 6px 0;
  color: #0f1724; /* darker heading */
  font-size: 24px;
  line-height: 1.15;
}

.attendance-header .subtitle {
  margin: 0;
  color: #475569; /* readable secondary */
  font-size: 13px;
}

.course-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  background: linear-gradient(90deg,#e8f5ff,#f0fbff);
  color: #0b5fa5;
  padding: 6px 10px;
  border-radius: 20px;
  font-weight: 700;
  box-shadow: 0 1px 0 rgba(11,95,165,0.06);
  font-size: 13px;
}

.course-badge .course-name {
  font-weight: 600;
  color: #0f1724;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions .date-picker {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  color: #0f1724;
  background: #fff;
}

.header-actions .date-picker:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37,99,235,0.06);
}

.header-actions .btn-refresh {
  padding: 10px 18px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.header-actions .btn-refresh:hover { background-color: #1e4bb8; }

.attendance-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.attendance-tabs .tab-btn {
  padding: 10px 16px;
  background-color: #ffffff;
  border: 1px solid #e6eef9;
  border-radius: 8px;
  color: #0f1724;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.attendance-tabs .tab-btn:hover { border-color: #cfe0ff; }

.attendance-tabs .tab-btn.active {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.attendance-content {
  background-color: #ffffff;
  padding: 22px;
  border-radius: 8px;
  box-shadow: 0 4px 18px rgba(18, 38, 63, 0.04);
  color: #0f1724;
}

.attendance-content .alert { font-weight: 600; }

.analytics-section { display: flex; flex-direction: column; gap: 24px; }

.loading-spinner { text-align: center; padding: 60px 20px; color: #475569; font-size: 16px; }

.alert { padding: 14px 18px; margin-bottom: 16px; border-radius: 6px; font-weight: 700; }
.alert.alert-danger { background-color: #fff1f2; color: #881337; border-left: 4px solid #ef4444; }
.alert.alert-success { background-color: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }

@media (max-width: 768px) {
  .professor-attendance { padding: 14px; }
  .attendance-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .attendance-header h2 { font-size: 20px; }
  .header-actions { width: 100%; flex-direction: column; }
  .header-actions .date-picker, .header-actions .btn-refresh { width: 100%; }
  
  .attendance-tabs { 
    overflow-x: auto; 
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    gap: 8px;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  .attendance-tabs::-webkit-scrollbar {
    height: 6px;
  }
  
  .attendance-tabs::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .attendance-tabs::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .attendance-tabs .tab-btn { 
    white-space: nowrap; 
    padding: 10px 14px;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: fit-content;
  }
  
  .attendance-tabs .tab-btn span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 2px 6px;
    margin-left: 6px;
    background: #e11d48;
    color: #fff;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
  }
  
  .attendance-tabs .tab-btn.active span {
    background: #fff;
    color: #2563eb;
  }
  
  .attendance-content { padding: 14px; }
}

@media (max-width: 480px) {
  .professor-attendance { padding: 10px; }
  
  .attendance-header { 
    padding: 16px; 
    margin-bottom: 16px;
  }
  
  .attendance-header h2 { 
    font-size: 18px; 
    margin-bottom: 8px;
  }
  
  .course-badge {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 8px 12px;
  }
  
  .header-actions { 
    gap: 8px; 
  }
  
  .header-actions .date-picker, 
  .header-actions .btn-refresh { 
    padding: 12px 14px;
    font-size: 15px;
  }
  
  .attendance-tabs {
    margin-bottom: 14px;
    gap: 6px;
  }
  
  .attendance-tabs .tab-btn {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 6px;
  }
  
  .attendance-tabs .tab-btn span {
    min-width: 18px;
    height: 18px;
    padding: 2px 5px;
    font-size: 10px;
    margin-left: 4px;
  }
  
  .attendance-content { 
    padding: 12px;
    border-radius: 6px;
  }
}
`;
import AttendanceMarkingTable from './AttendanceMarkingTable';
import ClassStatistics from './ClassStatistics';
import AttendanceAnalytics from './AttendanceAnalytics';
import CorrectionRequests from './CorrectionRequests';

const ProfessorAttendance = ({ courseId, course }) => {
  const [activeTab, setActiveTab] = useState('marking'); // marking, analytics
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchCourseData();
  }, [courseId, selectedDate]);

  useEffect(() => {
    // load pending count when course changes
    fetchPendingCorrections();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch attendance for selected date
      const attendanceRes = await axios.get(`${API_BASE_URL}/api/attendance/professor/course/${courseId}`, {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch statistics
      const statsRes = await axios.get(`${API_BASE_URL}/api/attendance/professor/stats/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      // Extract unique students from attendance
      const uniqueStudents = Array.from(
        new Map(attendanceRes.data.map((item) => [item.student_id, item])).values()
      );

      setAttendance(attendanceRes.data || []);
      // If no attendance records exist yet, fetch enrolled students for the course
      if (!attendanceRes.data || attendanceRes.data.length === 0 || uniqueStudents.length === 0) {
        try {
          const enrollRes = await axios.get(`${API_BASE_URL}/api/enrollments/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // enrollRes.data is { success:true, data: [...] } or array depending on controller; handle both
          const enrollments = Array.isArray(enrollRes.data) ? enrollRes.data : enrollRes.data?.data || [];
          const enrolledStudents = enrollments.map((en) => {
            // First, try to use first_name and last_name if available
            let firstName = en.first_name || '';
            let lastName = en.last_name || '';
            
            // If we don't have both, try to split the full name
            if (!firstName || !lastName) {
              const fullName = en.studentName || en.student_name || en.username || '';
              const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
              firstName = firstName || parts[0] || '';
              lastName = lastName || parts.slice(1).join(' ') || '';
            }
            
            return {
              student_id: en.student_id || en.id,
              first_name: firstName,
              last_name: lastName,
              student_email: en.studentEmail || en.email || en.student_email || ''
            };
          });
          setStudents(enrolledStudents);
        } catch (e) {
          console.warn('Failed to fetch enrollments, falling back to attendance data', e);
          setStudents(uniqueStudents);
        }
      } else {
        // Normalize student data from attendance records (they have full_name and email)
        const normalizedStudents = uniqueStudents.map((student) => {
          const fullName = student.full_name || '';
          const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
          return {
            student_id: student.student_id,
            first_name: parts[0] || '',
            last_name: parts.slice(1).join(' ') || '',
            student_email: student.email || ''
          };
        });
        setStudents(normalizedStudents);
      }
      setStatistics(statsRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCourseData();
  };

  const fetchPendingCorrections = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return setPendingCount(0);
      const res = await axios.get(`${API_BASE_URL}/api/attendance/professor/pending-corrections/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setCorrections(data);
      setPendingCount(data.length);
    } catch (err) {
      console.warn('Failed to load pending corrections', err);
      setPendingCount(0);
    }
  };

  if (loading) {
    return (
      <div className="professor-attendance">
        <style>{professorAttendanceStyles}</style>
        <div className="loading-spinner">Loading attendance data...</div>
      </div>
    );
  }

  const courseCode = course?.code || course?.courseCode || '';
  const courseName = course?.name || course?.courseName || '';

  return (
    <div className="professor-attendance">
      <style>{professorAttendanceStyles}</style>
      <div className="attendance-header">
        <div>
          <h2>Attendance Management</h2>
          {course && (
            <div className="course-badge">
              <strong>{courseCode}</strong>
              <span className="course-name"> &nbsp;-&nbsp; {courseName}</span>
            </div>
          )}
          <p className="subtitle">Manage and track student attendance</p>
        </div>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
          <button className="btn-refresh" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tab Navigation */}
      <div className="attendance-tabs">
        <button
          className={`tab-btn ${activeTab === 'marking' ? 'active' : ''}`}
          onClick={() => setActiveTab('marking')}
        >
          ✓ Mark Attendance
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => { setActiveTab('requests'); fetchPendingCorrections(); }}
        >
          📨 Correction Requests {pendingCount > 0 && <span style={{marginLeft:8, background:'#e11d48', color:'#fff', padding:'2px 8px', borderRadius:12, fontSize:12}}>{pendingCount}</span>}
        </button>
        
      </div>

      {/* Tab Content */}
      <div className="attendance-content">
        {activeTab === 'marking' && (
          <AttendanceMarkingTable
            courseId={courseId}
            students={students}
            attendance={attendance}
            selectedDate={selectedDate}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <ClassStatistics statistics={statistics} course={course} />
            <AttendanceAnalytics attendance={attendance} />
          </div>
        )}

        {activeTab === 'requests' && (
          <CorrectionRequests corrections={corrections} courseId={courseId} onRefresh={fetchPendingCorrections} />
        )}

      </div>
    </div>
  );
};

export default ProfessorAttendance;
