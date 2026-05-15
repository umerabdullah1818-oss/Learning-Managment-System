import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { undoRedoManager } from '../../../utils/UndoRedoManager';

const attendanceMarkingTableStyles = `
.marking-table-container {
  padding: 20px 0;
}

.marking-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  align-items: center;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar-center {
  flex: 1;
  justify-content: center;
  min-width: 200px;
}

.stat-badge {
  padding: 8px 15px;
  background-color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #27ae60;
}

.stat-badge.absent {
  color: #e74c3c;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 5px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
}

.btn-success {
  background-color: #27ae60;
}

.btn-success:hover {
  background-color: #229954;
}

.btn-danger {
  background-color: #e74c3c;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-info {
  background-color: #3498db;
}

.btn-info:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
}

.btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.marking-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.marking-table thead {
  background-color: #34495e;
  color: white;
}

.marking-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
}

.marking-table tbody tr {
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.3s ease;
}

.marking-table tbody tr:hover {
  background-color: #f8f9fa;
}

.marking-table tbody tr.status-present {
  border-left: 4px solid #27ae60;
}

.marking-table tbody tr.status-absent {
  border-left: 4px solid #e74c3c;
}

.marking-table tbody tr.status-late {
  border-left: 4px solid #f39c12;
}

.marking-table tbody tr.status-excused {
  border-left: 4px solid #3498db;
}

.marking-table td {
  padding: 12px 15px;
  font-size: 14px;
  color: #2c3e50;
}

.marking-table .id-cell {
  font-weight: 600;
  color: #3498db;
}

.marking-table .email-cell {
  color: #7f8c8d;
  font-size: 12px;
}

.status-select {
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.3s ease;
}

.status-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.notes-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 13px;
}

.notes-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.save-section {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.btn-large {
  padding: 12px 40px;
  font-size: 16px;
  min-width: 200px;
}

@media (max-width: 1024px) {
  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }

  .toolbar-center {
    justify-content: flex-start;
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .marking-toolbar {
    flex-direction: column;
    gap: 10px;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .toolbar-left .btn,
  .toolbar-center .btn,
  .toolbar-right .btn {
    flex: 1;
    min-width: 120px;
    padding: 8px 12px;
    font-size: 12px;
  }

  .marking-table {
    font-size: 12px;
  }

  .marking-table th {
    padding: 10px;
    font-size: 11px;
  }

  .marking-table td {
    padding: 10px;
  }

  .status-select,
  .notes-input {
    font-size: 12px;
    padding: 6px 10px;
  }

  .save-section {
    padding: 15px;
  }

  .btn-large {
    width: 100%;
    min-width: auto;
  }
}
`;

const AttendanceMarkingTable = ({
  courseId,
  students,
  attendance,
  selectedDate,
  onRefresh,
}) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [notesData, setNotesData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    // Initialize attendance data from props
    const newData = {};
    const newNotes = {};

    students.forEach((student) => {
      const record = attendance.find((a) => a.student_id === student.student_id);
      newData[student.student_id] = record?.status || 'Present';
      newNotes[student.student_id] = record?.note || '';
    });

    setAttendanceData(newData);
    setNotesData(newNotes);
  }, [students, attendance]);

  const handleStatusChange = (studentId, newStatus) => {
    const oldStatus = attendanceData[studentId];

    // Record action in undo/redo manager
    undoRedoManager.executeAction('update_attendance', {
      studentId,
      oldStatus,
      newStatus,
      date: selectedDate,
    });

    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: newStatus,
    }));

    setCanUndo(undoRedoManager.canUndo());
    setCanRedo(undoRedoManager.canRedo());
  };

  const handleNoteChange = (studentId, note) => {
    setNotesData((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  const handleUndo = () => {
    const lastAction = undoRedoManager.undo();
    if (lastAction) {
      setAttendanceData((prev) => ({
        ...prev,
        [lastAction.value.studentId]: lastAction.value.oldStatus,
      }));
      setCanUndo(undoRedoManager.canUndo());
      setCanRedo(undoRedoManager.canRedo());
    }
  };

  const handleRedo = () => {
    const redoneAction = undoRedoManager.redo();
    if (redoneAction) {
      setAttendanceData((prev) => ({
        ...prev,
        [redoneAction.value.studentId]: redoneAction.value.newStatus,
      }));
      setCanUndo(undoRedoManager.canUndo());
      setCanRedo(undoRedoManager.canRedo());
    }
  };

  const handleMarkAll = (status) => {
    const newData = {};
    students.forEach((student) => {
      newData[student.student_id] = status;
    });
    setAttendanceData(newData);
    setMessage(null);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const attendanceRecords = students.map((student) => ({
        studentId: student.student_id,
        status: attendanceData[student.student_id],
        note: notesData[student.student_id],
      }));

      await axios.post(
        `${API_BASE_URL}/api/attendance/professor/mark/${courseId}`,
        {
          attendanceRecords,
          date: selectedDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      undoRedoManager.clear();
      setCanUndo(false);
      setCanRedo(false);

      setTimeout(() => {
        setMessage(null);
        onRefresh();
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save attendance',
      });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceData).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceData).filter((s) => s === 'Absent').length;

  return (
    <div className="marking-table-container">
      <style>{attendanceMarkingTableStyles}</style>
      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div className="marking-toolbar">
        <div className="toolbar-left">
          <button className="btn btn-success" onClick={() => handleMarkAll('Present')}>
            ✓ Mark All Present
          </button>
          <button className="btn btn-danger" onClick={() => handleMarkAll('Absent')}>
            ✗ Mark All Absent
          </button>
          <button className="btn btn-info" onClick={() => handleMarkAll('Late')}>
            ⏱ Mark All Late
          </button>
        </div>

        <div className="toolbar-center">
          <span className="stat-badge">
            ✓ Present: <strong>{presentCount}</strong>
          </span>
          <span className="stat-badge absent">
            ✗ Absent: <strong>{absentCount}</strong>
          </span>
        </div>

        <div className="toolbar-right">
          <button
            className="btn btn-secondary"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo last change"
          >
            ↶ Undo
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo last change"
          >
            ↷ Redo
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="marking-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No students enrolled in this course
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.student_id} className={`status-${attendanceData[student.student_id]?.toLowerCase()}`}>
                  <td className="id-cell">{student.student_id}</td>
                  <td className="name-cell">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="email-cell">{student.student_email}</td>
                  <td className="status-cell">
                    <select
                      value={attendanceData[student.student_id] || 'Present'}
                      onChange={(e) => handleStatusChange(student.student_id, e.target.value)}
                      className="status-select"
                    >
                      <option value="Present">✓ Present</option>
                      <option value="Absent">✗ Absent</option>
                      <option value="Late">⏱ Late</option>
                      <option value="Excused">✓ Excused</option>
                    </select>
                  </td>
                  <td className="notes-cell">
                    <input
                      type="text"
                      placeholder="Add note..."
                      value={notesData[student.student_id] || ''}
                      onChange={(e) => handleNoteChange(student.student_id, e.target.value)}
                      className="notes-input"
                      maxLength="100"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="save-section">
        <button
          className="btn btn-primary btn-large"
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
        >
          {saving ? '💾 Saving...' : '💾 Save Attendance'}
        </button>
      </div>
    </div>
  );
};

export default AttendanceMarkingTable;
