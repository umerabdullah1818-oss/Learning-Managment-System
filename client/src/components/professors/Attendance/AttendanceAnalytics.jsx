import React, { useMemo } from 'react';
import { groupAttendanceByDate, getAttendanceMetrics } from '../../../utils/attendanceUtils';

const attendanceAnalyticsStyles = `
.attendance-analytics {
  margin-bottom: 30px;
}

.attendance-analytics h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
}

.attendance-analytics .no-data {
  text-align: center;
  padding: 40px;
  color: #95a5a6;
  font-size: 16px;
}

.analytics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.summary-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-card.present {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.summary-card.absent {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.summary-card.late {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-label {
  font-size: 12px;
  text-transform: uppercase;
  opacity: 0.9;
  margin-bottom: 10px;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 5px;
}

.card-percent {
  font-size: 14px;
  opacity: 0.9;
}

.session-analytics {
  margin-top: 30px;
}

.session-analytics h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.analytics-table thead {
  background-color: #34495e;
  color: white;
}

.analytics-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
}

.analytics-table tbody tr {
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.3s ease;
}

.analytics-table tbody tr:hover {
  background-color: #f8f9fa;
}

.analytics-table td {
  padding: 15px;
  font-size: 14px;
  color: #2c3e50;
}

.analytics-table .date {
  font-weight: 600;
}

.analytics-table .present {
  color: #27ae60;
  font-weight: 600;
}

.analytics-table .absent {
  color: #e74c3c;
  font-weight: 600;
}

.analytics-table .late {
  color: #f39c12;
}

.analytics-table .percentage {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #ecf0f1;
  border-radius: 3px;
  margin-bottom: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.percentage-text {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .analytics-summary {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .summary-card {
    padding: 15px;
  }

  .card-value {
    font-size: 28px;
  }

  .analytics-table {
    font-size: 12px;
  }

  .analytics-table th {
    padding: 10px;
    font-size: 11px;
  }

  .analytics-table td {
    padding: 10px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .analytics-summary {
    grid-template-columns: 1fr;
  }

  .analytics-table {
    font-size: 11px;
  }

  .analytics-table th {
    padding: 8px;
  }

  .analytics-table td {
    padding: 8px;
  }

  .progress-bar {
    display: none;
  }
}
`;

const AttendanceAnalytics = ({ attendance }) => {
  const metrics = useMemo(() => {
    if (!attendance || attendance.length === 0) {
      return {
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        percentages: {},
        weightedPercentage: 0,
      };
    }

    const dateGroups = groupAttendanceByDate(attendance);
    const percentages = {};

    Object.entries(dateGroups).forEach(([date, records]) => {
      const presentInSession = records.filter((r) => r.status === 'Present').length;
      const absentInSession = records.filter((r) => r.status === 'Absent').length;
      const lateInSession = records.filter((r) => r.status === 'Late').length;
      const excusedInSession = records.filter((r) => r.status === 'Excused').length;
      const totalInSession = presentInSession + absentInSession + lateInSession + excusedInSession;
      const pointsInSession = presentInSession * 1 + lateInSession * 0.5 + excusedInSession * 1;
      percentages[date] = totalInSession > 0 ? ((pointsInSession / totalInSession) * 100).toFixed(2) : '0.00';
    });

    const presentCount = attendance.filter((a) => a.status === 'Present').length;
    const absentCount = attendance.filter((a) => a.status === 'Absent').length;
    const lateCount = attendance.filter((a) => a.status === 'Late').length;
    const excusedCount = attendance.filter((a) => a.status === 'Excused').length;

    const totalRecords = presentCount + absentCount + lateCount + excusedCount;
    const pointsEarned = presentCount * 1 + lateCount * 0.5 + excusedCount * 1;
    const weightedPercentage = totalRecords > 0 ? ((pointsEarned / totalRecords) * 100).toFixed(2) : '0.00';

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      percentages,
      weightedPercentage,
    };
  }, [attendance]);

  if (!attendance || attendance.length === 0) {
    return (
      <div className="attendance-analytics">
        <style>{attendanceAnalyticsStyles}</style>
        <h3>Attendance Analytics</h3>
        <p className="no-data">No attendance data available yet</p>
      </div>
    );
  }

  // Session-wise statistics
  const sessionStats = useMemo(() => {
    const dateGroups = groupAttendanceByDate(attendance);
    return Object.entries(dateGroups)
      .map(([date, records]) => {
        const presentCount = records.filter((r) => r.status === 'Present').length;
        const absentCount = records.filter((r) => r.status === 'Absent').length;
        const lateCount = records.filter((r) => r.status === 'Late').length;
        const excusedCount = records.filter((r) => r.status === 'Excused').length;
        const total = presentCount + absentCount + lateCount + excusedCount;
        const points = presentCount * 1 + lateCount * 0.5 + excusedCount * 1;
        const percentage = total > 0 ? ((points / total) * 100).toFixed(2) : '0.00';

        return {
          date,
          total,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          percentage,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance]);

  return (
    <div className="attendance-analytics">
      <style>{attendanceAnalyticsStyles}</style>
      <h3>Attendance Analytics</h3>

      <div className="analytics-summary">
        <div className="summary-card">
          <div className="card-label">Total Records</div>
          <div className="card-value">{metrics.totalRecords}</div>
        </div>
        <div className="summary-card present">
          <div className="card-label">Present</div>
          <div className="card-value">{metrics.presentCount}</div>
          <div className="card-percent">
            {metrics.totalRecords > 0
              ? ((metrics.presentCount / metrics.totalRecords) * 100).toFixed(1)
              : 0}
            %
          </div>
        </div>
        <div className="summary-card absent">
          <div className="card-label">Absent</div>
          <div className="card-value">{metrics.absentCount}</div>
          <div className="card-percent">
            {metrics.totalRecords > 0
              ? ((metrics.absentCount / metrics.totalRecords) * 100).toFixed(1)
              : 0}
            %
          </div>
        </div>
        <div className="summary-card late">
          <div className="card-label">Late</div>
          <div className="card-value">{metrics.lateCount}</div>
          <div className="card-percent">
            {metrics.totalRecords > 0
              ? ((metrics.lateCount / metrics.totalRecords) * 100).toFixed(1)
              : 0}
            %
          </div>
        </div>
        <div className="summary-card">
          <div className="card-label">Excused</div>
          <div className="card-value">{metrics.excusedCount}</div>
          <div className="card-percent">
            {metrics.totalRecords > 0
              ? ((metrics.excusedCount / metrics.totalRecords) * 100).toFixed(1)
              : 0}
            %
          </div>
        </div>
        {/* <div className="summary-card warning">
          <div className="card-label">Attendance % (Weighted)</div>
          <div className="card-value">{metrics.weightedPercentage}%</div>
        </div> */}
      </div>

      <div className="session-analytics">
        <h4>Session-wise Statistics</h4>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Excused</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {sessionStats.map((session) => (
              <tr key={session.date}>
                <td className="date">
                  {new Date(session.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td>{session.total}</td>
                <td className="present">{session.presentCount}</td>
                <td className="absent">{session.absentCount}</td>
                <td className="late">{session.lateCount}</td>
                <td className="present">{session.excusedCount}</td>
                <td className="percentage">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${session.percentage}%` }}
                    ></div>
                  </div>
                  <span className="percentage-text">{session.percentage}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
