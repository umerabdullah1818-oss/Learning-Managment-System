import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getStatusColor, getStatusLabel } from '../../../utils/attendanceUtils';
import RequestCorrectionModal from './RequestCorrectionModal';
import StudentCorrectionStatusModal from './StudentCorrectionStatusModal';

const attendanceHistoryStyles = `
/* =======================
   Attendance History
======================= */
.attendance-history {
  padding: 16px 0;
}

/* Controls */
.history-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 220px;
}

.search-box input,
.filter-controls select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

/* Table Wrapper */
.history-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  background: #fff;
}

/* Table */
.history-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.history-table thead {
  background: #2c3e50;
  color: #fff;
}

.history-table th,
.history-table td {
  padding: 12px;
  font-size: 14px;
  text-align: left;
}

.history-table tbody tr {
  border-bottom: 1px solid #eee;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

/* Actions */
.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #3498db;
}

.btn-request {
  background: #e74c3c;
}

/* =======================
   MOBILE VIEW (<= 600px)
======================= */
@media (max-width: 600px) {

  /* Controls stack */
  .history-controls {
    flex-direction: column;
  }

  .filter-controls {
    flex-direction: column;
  }

  /* Hide table header */
  .history-table thead {
    display: none;
  }

  /* Convert rows into cards */
  .history-table,
  .history-table tbody,
  .history-table tr,
  .history-table td {
    display: block;
    width: 100%;
  }

  .history-table {
    min-width: unset;
  }

  .history-table tr {
    background: #fff;
    margin-bottom: 14px;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    border-left: 4px solid #3498db;
  }

  .history-table tr.status-present {
    border-left-color: #27ae60;
  }

  .history-table tr.status-absent {
    border-left-color: #e74c3c;
  }

  .history-table tr.status-late {
    border-left-color: #f39c12;
  }

  .history-table tr.status-excused {
    border-left-color: #3498db;
  }

  .history-table td {
    padding: 8px 0;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;
  }

  .history-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #555;
    flex-shrink: 0;
    min-width: 70px;
  }

  /* Date styling */
  .date-cell {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
    padding-bottom: 4px;
    border-bottom: 1px solid #ecf0f1;
    margin-bottom: 8px;
  }

  /* Status badge in mobile */
  .status-cell {
    justify-content: space-between;
  }

  .status-badge {
    font-size: 11px;
    padding: 4px 10px;
  }

  /* Notes wrap */
  .notes-cell {
    white-space: normal;
    word-break: break-word;
  }

  .notes-cell::before {
    align-self: flex-start;
    padding-top: 2px;
  }

  /* Actions full width */
  .actions-cell {
    flex-direction: column;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid #ecf0f1;
    gap: 8px;
  }

  .actions-cell::before {
    display: none;
  }

  .btn-action {
    width: 100%;
    padding: 10px;
    font-size: 13px;
    border-radius: 6px;
  }

  .actions-cell > div {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .actions-cell > div button {
    width: 100%;
  }
}
`;

const AttendanceHistory = ({ attendance, onRefresh, courseId }) => {
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentCorrections, setStudentCorrections] = useState([]);
  const [correctionKeys, setCorrectionKeys] = useState(new Set());
  const [correctionMap, setCorrectionMap] = useState({});
  const [selectedCorrection, setSelectedCorrection] = useState(null);

  // Sort and filter attendance
  const filteredAttendance = attendance
    .filter((record) => filterStatus === 'All' || record.status === filterStatus)
    .filter((record) => {
      const dateStr = new Date(record.attendance_date).toLocaleDateString();
      return dateStr.includes(searchTerm);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.attendance_date) - new Date(a.attendance_date);
        case 'date-asc':
          return new Date(a.attendance_date) - new Date(b.attendance_date);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const handleRequestCorrection = (record) => {
    setSelectedRecord(record);
    setShowCorrectionModal(true);
  };

  const handleCorrectionSubmit = async (correctionData) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No access token found. Please login again.');
      }

      await axios.post('/api/attendance/student/request-correction', correctionData, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      setShowCorrectionModal(false);
      setSelectedRecord(null);
      onRefresh();
      // refresh student's corrections so UI disables repeated requests
      fetchStudentCorrections();
    } catch (error) {
      console.error('Error submitting correction:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to submit correction request');
    }
  };

  const buildKeyForCorrection = (corr) => {
    if (!corr) return null;
    if (corr.attendance_id) return `att-${corr.attendance_id}`;
    // fallback to date key (use YYYY-MM-DD)
    if (corr.correction_date) return `date-${new Date(corr.correction_date).toISOString().slice(0,10)}`;
    if (corr.correction_date === null && corr.date) return `date-${new Date(corr.date).toISOString().slice(0,10)}`;
    return null;
  };

  const buildKeyForRecord = (record) => {
    if (!record) return null;
    if (record.attendance_id) return `att-${record.attendance_id}`;
    if (record.attendance_date) return `date-${new Date(record.attendance_date).toISOString().slice(0,10)}`;
    return null;
  };

  const fetchStudentCorrections = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/attendance/student/corrections', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setStudentCorrections(data);
      const keys = new Set();
      const map = {};
      data.forEach((c) => {
        const k = buildKeyForCorrection(c);
        if (k) {
          keys.add(k);
          // store latest by key (overwrite with more recent)
          map[k] = map[k] ? (new Date(c.created_at) > new Date(map[k].created_at) ? c : map[k]) : c;
        }
      });
      setCorrectionKeys(keys);
      setCorrectionMap(map);
    } catch (err) {
      // silently ignore - corrections are optional
      console.warn('Failed to load student corrections', err?.message || err);
    }
  };

  useEffect(() => {
    fetchStudentCorrections();
  }, []);

  return (
    <div className="attendance-history">
      <style>{attendanceHistoryStyles}</style>
      <div className="history-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Excused">Excused</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {filteredAttendance.length === 0 ? (
        <div className="no-data">
          <p>📭 No attendance records found</p>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Time</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record.attendance_id} className={`status-${record.status.toLowerCase()}`}>
                  <td data-label="Date" className="date-cell">
                    {new Date(record.attendance_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td data-label="Status" className="status-cell">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(record.status) }}
                    >
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td data-label="Time" className="time-cell">
                    {record.attendance_date
                      ? new Date(record.attendance_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td data-label="Notes" className="notes-cell">{record.note || '-'}</td>
                  <td data-label="Actions" className="actions-cell">
                    {record.status === 'Absent' && (() => {
                      const key = buildKeyForRecord(record);
                      const already = key && correctionKeys.has(key);
                      return already ? (
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <button className="btn-action btn-request" disabled title="Request already submitted">✅ Requested</button>
                          <button className="btn-action" onClick={() => setSelectedCorrection(correctionMap[key])}>View</button>
                        </div>
                      ) : (
                        <button
                          className="btn-action btn-request"
                          onClick={() => handleRequestCorrection(record)}
                          title="Request correction for this record"
                        >
                          📝 Request Correction
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCorrectionModal && selectedRecord && (
        <RequestCorrectionModal
          record={selectedRecord}
          courseId={courseId}
          onSubmit={handleCorrectionSubmit}
          onClose={() => setShowCorrectionModal(false)}
        />
      )}
      {selectedCorrection && (
        <StudentCorrectionStatusModal correction={selectedCorrection} onClose={() => setSelectedCorrection(null)} />
      )}
    </div>
  );
};

export default AttendanceHistory;
