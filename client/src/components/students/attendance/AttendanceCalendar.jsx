import React, { useState, useMemo } from 'react';
import {
  getMonthName,
  getDaysInMonth,
  getAttendanceForDate,
  isWeekend,
  formatDate,
  getStatusColor,
} from '../../../utils/attendanceUtils';

const attendanceCalendarStyles = `
.attendance-calendar {
  padding: 20px 0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.btn-nav {
  padding: 10px 15px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s ease;
}

.btn-nav:hover {
  background-color: #2980b9;
}

.month-year {
  flex: 1;
  text-align: center;
}

.month-year h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.btn-today {
  padding: 6px 12px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-today:hover {
  background-color: #c0392b;
}

.calendar-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 3px;
}

.calendar {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #ecf0f1;
  padding: 10px;
}

.weekday {
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: white;
  background-color: #34495e;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  padding: 5px;
  background-color: #ecf0f1;
}

.day {
  min-height: 100px;
  padding: 10px;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.day:hover {
  background-color: #f8f9fa;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.day.empty {
  background-color: #f5f7fa;
  cursor: default;
}

.day.empty:hover {
  background-color: #f5f7fa;
  box-shadow: none;
}

.day.today {
  border: 2px solid #e74c3c;
  background-color: #ffebee;
}

.day.weekend {
  background-color: #fafafa;
}

.day-number {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 14px;
}

.status-indicator {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;
}

.status-indicator:hover {
  transform: scale(1.1);
}

.status-indicator.empty {
  background-color: #bdc3c7;
  color: #7f8c8d;
}

.calendar-info {
  margin-top: 15px;
  padding: 15px;
  background-color: #e8f4f8;
  border-left: 4px solid #3498db;
  border-radius: 4px;
  color: #16a085;
  font-size: 14px;
}

.calendar-info p {
  margin: 0;
}

@media (max-width: 768px) {
  .calendar-header {
    gap: 12px;
  }

  .btn-nav {
    padding: 10px 20px;
    font-size: 20px;
    min-width: 50px;
  }

  .month-year h3 {
    font-size: 20px;
  }

  .calendar-legend {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
  }

  .legend-item {
    font-size: 13px;
  }

  .legend-box {
    width: 18px;
    height: 18px;
  }

  .weekday {
    font-size: 12px;
    padding: 8px 4px;
  }

  .day {
    min-height: 70px;
    padding: 6px;
  }

  .day-number {
    margin-bottom: 5px;
    font-size: 11px;
  }

  .status-indicator {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .calendar-info {
    font-size: 13px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .attendance-calendar {
    padding: 10px 0;
  }

  .calendar-header {
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
  }

  .btn-nav {
    flex: 1;
    padding: 12px 15px;
    font-size: 18px;
    border-radius: 8px;
  }

  .month-year {
    width: 100%;
    order: -1;
  }

  .month-year h3 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .btn-today {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 6px;
  }

  .calendar-legend {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    margin-bottom: 15px;
  }

  .legend-item {
    font-size: 14px;
    padding: 4px 0;
  }

  .legend-box {
    width: 20px;
    height: 20px;
  }

  .weekdays {
    padding: 8px 4px;
  }

  .weekday {
    font-size: 10px;
    padding: 6px 2px;
    font-weight: 700;
  }

  .days {
    gap: 0;
    padding: 4px;
  }

  .day {
    min-height: 55px;
    padding: 4px 2px;
    gap: 3px;
  }

  .day-number {
    font-size: 11px;
    margin-bottom: 3px;
    font-weight: 700;
  }

  .status-indicator {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }

  .status-indicator.empty {
    font-size: 10px;
  }

  .day.today {
    border-width: 2px;
  }

  .calendar-info {
    font-size: 12px;
    padding: 10px;
    margin-top: 12px;
    line-height: 1.5;
  }

  .calendar {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
}
`;

const AttendanceCalendar = ({ attendance }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthName = getMonthName(currentDate.getMonth());
  const year = currentDate.getFullYear();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate);

  // Create a map of attendance by date for quick lookup
  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach((record) => {
      const date = formatDate(record.attendance_date);
      map[date] = record;
    });
    return map;
  }, [attendance]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getDateStatus = (day) => {
    const dateStr = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceMap[dateStr];
  };

  const getStatusBgColor = (status) => {
    const colors = {
      Present: '#4caf50',
      Absent: '#f44336',
      Late: '#ff9800',
      Excused: '#2196f3',
    };
    return colors[status] || '#e0e0e0';
  };

  const getStatusText = (status) => {
    const texts = {
      Present: '✓',
      Absent: '✗',
      Late: '⏱',
      Excused: '✓',
    };
    return texts[status] || '?';
  };

  return (
    <div className="attendance-calendar">
      <style>{attendanceCalendarStyles}</style>
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="btn-nav">
          ←
        </button>
        <div className="month-year">
          <h3>
            {monthName} {year}
          </h3>
          <button onClick={handleToday} className="btn-today">
            Today
          </button>
        </div>
        <button onClick={handleNextMonth} className="btn-nav">
          →
        </button>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#4caf50' }}></span>
          Present
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#f44336' }}></span>
          Absent
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#ff9800' }}></span>
          Late
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: '#2196f3' }}></span>
          Excused
        </div>
      </div>

      <div className="calendar">
        <div className="weekdays">
          <div className="weekday">Sun</div>
          <div className="weekday">Mon</div>
          <div className="weekday">Tue</div>
          <div className="weekday">Wed</div>
          <div className="weekday">Thu</div>
          <div className="weekday">Fri</div>
          <div className="weekday">Sat</div>
        </div>

        <div className="days">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="day empty"></div>
          ))}

          {days.map((day) => {
            const status = getDateStatus(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`day ${status ? 'has-record' : ''} ${isToday ? 'today' : ''} ${isWeekend(new Date(year, currentDate.getMonth(), day)) ? 'weekend' : ''}`}
              >
                <div className="day-number">{day}</div>
                {status ? (
                  <div
                    className="status-indicator"
                    style={{ backgroundColor: getStatusBgColor(status.status) }}
                    title={`${status.status}${status.note ? `: ${status.note}` : ''}`}
                  >
                    {getStatusText(status.status)}
                  </div>
                ) : (
                  <div className="status-indicator empty">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-info">
        <p>
          Click on any date to see detailed attendance information. Green = Present, Red = Absent,
          Orange = Late, Blue = Excused
        </p>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
