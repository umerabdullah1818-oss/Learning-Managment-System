import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateAttendancePDF = (studentData, attendanceData, statisticsData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Header with border
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
  doc.rect(margin, margin, pageWidth - 2 * margin, 20);
  
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Attendance Certificate', pageWidth / 2, margin + 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Learning Management System', pageWidth / 2, margin + 18, { align: 'center' });

  // Certificate Issuance Date
  doc.setFontSize(9);
  doc.text(`Issued on: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth - margin, margin + 35, { align: 'right' });
  
  // Student Information
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Student Information', margin, margin + 45);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Name: ${studentData.firstName} ${studentData.lastName}`, margin, margin + 52);
  doc.text(`Student ID: ${studentData.studentId}`, margin, margin + 59);
  doc.text(`Email: ${studentData.email}`, margin, margin + 66);
  doc.text(`Course: ${studentData.courseName} (${studentData.courseCode})`, margin, margin + 73);

  // Attendance Statistics
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Attendance Summary', margin, margin + 87);
  doc.setFont(undefined, 'normal');

  const summaryData = [
    ['Metric', 'Count'],
    ['Total Sessions', statisticsData.totalSessions || statisticsData.total_sessions || 0],
    ['Present', statisticsData.presentCount || statisticsData.present_count || 0],
    ['Absent', statisticsData.absentCount || statisticsData.absent_count || 0],
    ['Late', statisticsData.lateCount || statisticsData.late_count || 0],
    ['Excused', statisticsData.excusedCount || statisticsData.excused_count || 0],
    ['Attendance %', `${statisticsData.percentage || statisticsData.attendance_percentage || 0}%`],
  ];

  doc.autoTable({
    startY: margin + 92,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  const tableEndY = doc.lastAutoTable.finalY + 10;

  // Attendance Details Table
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Detailed Attendance Record', margin, tableEndY + 10);
  doc.setFont(undefined, 'normal');

  const tableData = attendanceData && attendanceData.length > 0 ? attendanceData.map((record) => {
    const date = record.attendance_date || record.date;
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) : 'N/A';
    
    return [
      formattedDate,
      (record.status || 'N/A').toUpperCase(),
      record.note || record.notes || '-',
    ];
  }) : [['No records available', '-', '-']];

  doc.autoTable({
    startY: tableEndY + 15,
    head: [['Date', 'Status', 'Notes']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    didDrawPage: (data) => {
      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageWidth = pageSize.getWidth();
      doc.setFontSize(10);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        margin,
        pageHeight - 10
      );
    },
  });

  return doc.output('blob');
};

export const generateCourseAttendancePDF = (courseData, classStats) => {
  const doc = new jsPDF('l'); // landscape
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  // Header
  doc.setFontSize(16);
  doc.text('Course Attendance Report', pageWidth / 2, margin + 10, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Course: ${courseData.courseName} (${courseData.courseCode})`, margin, margin + 25);
  doc.text(`Professor: ${courseData.professorName}`, margin, margin + 32);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 39);

  // Class Statistics Table
  const tableData = classStats.map((student) => {
    // Get student name with multiple fallback options
    let studentName = student.full_name || 
                     student.fullname || 
                     student.fullName ||
                     `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
                     student.name ||
                     student.student_name ||
                     `Student ${student.student_id}`;
    
    return [
      student.student_id,
      studentName,
      student.total_sessions || 0,
      student.present_count || 0,
      student.absent_count || 0,
      student.late_count || 0,
      `${student.attendance_percentage || 0}%`,
    ];
  });

  doc.autoTable({
    startY: margin + 47,
    head: [['ID', 'Student Name', 'Total', 'Present', 'Absent', 'Late', 'Attendance %']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  return doc.output('blob');
};

export const downloadPDF = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
