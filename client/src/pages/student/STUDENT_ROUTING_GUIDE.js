/**
 * Student Dashboard Routes Configuration
 * 
 * This file shows how to integrate the Student Dashboard and other student pages
 * into your main routing structure.
 * 
 * Add this to your main App.jsx or routing configuration file
 */

// Import the Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AllStudentPage from './pages/student/AllStudentPage';
import AddStudentPage from './pages/student/AddStudentPage';
import EditStudentPage from './pages/student/EditStudentPage';

// Import other student-related components if needed
import { 
  DashboardHeader, 
  DashboardStats, 
  CoursesSection, 
  AssignmentsSection, 
  GradesSection, 
  AttendanceSection, 
  ActivitiesSection 
} from './components/students';

export {
  StudentDashboard,
  AllStudentPage,
  AddStudentPage,
  EditStudentPage,
  DashboardHeader,
  DashboardStats,
  CoursesSection,
  AssignmentsSection,
  GradesSection,
  AttendanceSection,
  ActivitiesSection
};
