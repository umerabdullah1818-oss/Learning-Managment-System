// Attendance calculation utilities

// Calculate attendance percentage with weighted credits:
// Present = 1.0, Late = 0.5, Excused = 1.0, Absent = 0.0
export const calculateAttendancePercentage = (attendancePoints, totalSessions) => {
  if (totalSessions === 0) return 0;
  const maxPossiblePoints = totalSessions * 1.0;
  return Math.round((attendancePoints / maxPossiblePoints) * 100 * 100) / 100;
};

export const getAttendanceStatus = (percentage) => {
  if (percentage >= 90) return { status: 'Excellent', color: 'success', bgColor: '#4caf50' };
  if (percentage >= 75) return { status: 'Good', color: 'info', bgColor: '#2196f3' };
  if (percentage >= 60) return { status: 'At Risk', color: 'warning', bgColor: '#ff9800' };
  return { status: 'Critical', color: 'danger', bgColor: '#f44336' };
};

export const getStatusColor = (status) => {
  const statusMap = {
    Present: '#4caf50',
    Absent: '#f44336',
    Late: '#ff9800',
    Excused: '#2196f3',
  };
  return statusMap[status] || '#757575';
};

export const getStatusLabel = (status) => {
  const labels = {
    Present: '✓ Present',
    Absent: '✗ Absent',
    Late: '⏱ Late',
    Excused: '✓ Excused',
  };
  return labels[status] || status;
};

export const groupAttendanceByMonth = (attendanceRecords) => {
  const grouped = {};

  attendanceRecords.forEach((record) => {
    const date = new Date(record.attendance_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(record);
  });

  return grouped;
};

export const groupAttendanceByDate = (attendanceRecords) => {
  const grouped = {};

  attendanceRecords.forEach((record) => {
    const dateKey = new Date(record.attendance_date).toISOString().split('T')[0];

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(record);
  });

  return grouped;
};

export const getAttendanceMetrics = (attendanceData) => {
  if (!attendanceData || attendanceData.length === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      percentage: 0,
      attendancePoints: 0,
    };
  }

  const presentCount = attendanceData.filter((a) => a.status === 'Present').length;
  const absentCount = attendanceData.filter((a) => a.status === 'Absent').length;
  const lateCount = attendanceData.filter((a) => a.status === 'Late').length;
  const excusedCount = attendanceData.filter((a) => a.status === 'Excused').length;
  const totalSessions = attendanceData.length;

  // Calculate weighted attendance points
  // Present = 1.0, Late = 0.5, Excused = 1.0, Absent = 0.0
  const attendancePoints = (presentCount * 1.0) + (lateCount * 0.5) + (excusedCount * 1.0) + (absentCount * 0.0);

  return {
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendancePoints: Math.round(attendancePoints * 10) / 10,
    percentage: calculateAttendancePercentage(attendancePoints, totalSessions),
  };
};

export const formatDate = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getMonthName = (monthIndex) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[monthIndex];
};

export const getAttendanceForDate = (attendanceData, date) => {
  const dateStr = formatDate(date);
  return attendanceData.filter((a) => formatDate(a.attendance_date) === dateStr);
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};
