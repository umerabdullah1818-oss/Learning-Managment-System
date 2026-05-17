import React from 'react';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchProfile } from './redux/slices/authSlice'
import RegisterPage from './pages/auth/RegisterPage'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import LockPage from './pages/auth/LockPage'
import Logout from './components/auth/Logout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Error404 from './components/error/404'
import Error500 from './components/error/500'
import Layout from './pages/layouts/Layout'
import AddStudentPage from './pages/student/AddStudentPage'
import AllStudentPage from './pages/student/AllStudentPage'
import EditStudentPage from './pages/student/EditStudentPage'
import AddProfessorPage from './pages/Professor/Add-professorPage'
import AllProfessorPage from './pages/Professor/All-professorPage'
import EditProfessorPage from './pages/Professor/Edit-professorPage'
import AddCoursesPage from './pages/courses/Add-coursesPage'
import AllCoursePage from './pages/courses/All-coursePage'
import EditCoursePage from './pages/courses/Edit-CoursePage'
import AddLibraryAssetsPage from './pages/assets/Add-libraryAssetsPage'
import LibraryAssetsPage from './pages/assets/Library-AssetsPage'
import EditLibraryAssetPage from './pages/assets/Edit-LibraryAssetPage'
import AddDepartmentsPage from './pages/departments/Add-DepartmentsPage'
import AllDepartmentsPage from './pages/departments/All-DepartmentsPage'
import EditDepartmentPage from './pages/departments/Edit-DepartmentPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import EnrollCoursePage from './pages/Students/Enroll-CoursePage'
import AttendancePage from './pages/Students/AttendancePage'
import AssignmentPage from './pages/Students/AssignmentPage'
import GradesPage from './pages/Students/GradesPage'
import TranscriptPage from './pages/Students/TranscriptPage'
import AssignedCoursesPage from './pages/Professors/Assigned-CoursesPage'
import ProfessorGradesPage from './pages/Professors/GradesPage'
import ProfessorDashboard from './components/professors/ProfessorDashboard'
import AddAssignmentPage from './pages/Professors/Add-AssignmentPage';
import ListAssignmentsPage from './pages/Professors/List-AssignmentsPage';
import ViewSubmittedAssignmentsPage from './pages/Professors/View-SubmitedAssignmentsPage';
import ClassGradeReportPage from './pages/Professors/ClassGradeReportPage';
import StudentGradeDetailPage from './pages/Professors/StudentGradeDetailPage';
import CourseGradesPage from './pages/Professors/CourseGradesPage';
import StudentAttendancePage from './pages/Students/Attendance';
import ProfessorAttendancePage from './pages/Professors/Attendance';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';
import ProfessorProfilePage from './pages/Professor/ProfessorProfilePage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import TermsPage from './pages/Services/TermsPage'
import PrivacyPage from './pages/Services/PrivacyPage'
import Chatbot from './components/Chatbot/Chatbot'
import useAutoLock from './hooks/useAutoLock';
import LockGuard from './components/auth/LockGuard';

function AutoLockInitializer() {
  useAutoLock({ timeoutMs: 20 * 60 * 1000 }); //  20 minutes
  return null;
}

function App() {
  // Initialize profile after store/provider is available
  const AuthInitializer = () => {
    const dispatch = useDispatch();
    useEffect(() => {
      const token = localStorage.getItem('accessToken');
      if (token) dispatch(fetchProfile());
    }, [dispatch]);
    return null;
  };

  return (
        <>
          <AuthInitializer />
          <Chatbot />
          <Router>
          <LockGuard />
          <AutoLockInitializer />
          <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/password-recovery" element={<ForgotPasswordPage />} />
        <Route path="/lock" element={<LockPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin-profile" element={<ProtectedRoute allowedRoles={['administrator']}><AdminProfilePage /></ProtectedRoute>} />
        <Route path="/dashboard-1" element={<ProtectedRoute><Layout><div>Dashboard v.2</div></Layout></ProtectedRoute>} />
        <Route path="/dashboard-2" element={<ProtectedRoute><Layout><div>Dashboard v.3</div></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Layout><div>Analytics</div></Layout></ProtectedRoute>} />
        <Route path="/widgets" element={<ProtectedRoute><Layout><div>Widgets</div></Layout></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Layout><div>Events</div></Layout></ProtectedRoute>} />
        <Route path="/all-professors" element={<ProtectedRoute allowedRoles={['administrator']}><AllProfessorPage /></ProtectedRoute>} />
        <Route path="/add-professor" element={<ProtectedRoute allowedRoles={['administrator']}><AddProfessorPage /></ProtectedRoute>} />
        <Route path="/:id" element={<ProtectedRoute allowedRoles={['administrator']}><EditProfessorPage /></ProtectedRoute>} />
        <Route path="/professor-profile" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorProfilePage /></ProtectedRoute>} />
        <Route path="/all-students" element={<ProtectedRoute allowedRoles={['administrator']}><AllStudentPage /></ProtectedRoute>} />
        <Route path="/add-student" element={<ProtectedRoute allowedRoles={['administrator']}><AddStudentPage /></ProtectedRoute>} />
        <Route path="/edit-student/:id" element={<ProtectedRoute allowedRoles={['administrator']}><EditStudentPage /></ProtectedRoute>} />
        <Route path="/student-profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfilePage /></ProtectedRoute>} />

        <Route path="/enroll-course" element={<ProtectedRoute allowedRoles={['student']}><EnrollCoursePage /></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendancePage /></ProtectedRoute>} />
        <Route path="/attendance/:courseId" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendancePage /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute allowedRoles={['student']}><AssignmentPage /></ProtectedRoute>} />
        <Route path="/grades" element={<ProtectedRoute allowedRoles={['student']}><GradesPage /></ProtectedRoute>} />
        <Route path="/transcript" element={<ProtectedRoute allowedRoles={['student']}><TranscriptPage /></ProtectedRoute>} />
        <Route path="/assigned-courses" element={<ProtectedRoute allowedRoles={['professor']}><AssignedCoursesPage /></ProtectedRoute>} />
        <Route path="/professor/attendance" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorAttendancePage /></ProtectedRoute>} />
        <Route path="/professor/attendance/:courseId" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorAttendancePage /></ProtectedRoute>} />

        <Route path="/professor-dashboard" element={<ProtectedRoute allowedRoles={['professor']}><Layout><ProfessorDashboard /></Layout></ProtectedRoute>} />
        <Route path="/professor/dashboard" element={<ProtectedRoute allowedRoles={['professor']}><Layout><ProfessorDashboard /></Layout></ProtectedRoute>} />

        <Route path="/professor-grades" element={<ProtectedRoute allowedRoles={['professor']}><ProfessorGradesPage /></ProtectedRoute>} />
        <Route path="/professor/grades/:courseId" element={<ProtectedRoute allowedRoles={['professor']}><CourseGradesPage /></ProtectedRoute>} />
        <Route path="/student-assignments" element={<ProtectedRoute allowedRoles={['professor']}><AddAssignmentPage /></ProtectedRoute>} />
        <Route path="/professor/assignments" element={<ProtectedRoute allowedRoles={['professor']}><ListAssignmentsPage /></ProtectedRoute>} />
        <Route path="/professor/assignments/:assignmentId/submissions" element={<ProtectedRoute allowedRoles={['professor']}><ViewSubmittedAssignmentsPage /></ProtectedRoute>} />
        <Route path="/professor/course/report" element={<ProtectedRoute allowedRoles={['professor']}><ClassGradeReportPage /></ProtectedRoute>} />
        <Route path="/professor/course/student" element={<ProtectedRoute allowedRoles={['professor']}><StudentGradeDetailPage /></ProtectedRoute>} />
        <Route path="/add-assignment" element={<ProtectedRoute allowedRoles={['professor']}><AddAssignmentPage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute allowedRoles={['administrator']}><AllCoursePage /></ProtectedRoute>} />
        <Route path="/all-courses" element={<ProtectedRoute allowedRoles={['administrator']}><AllCoursePage /></ProtectedRoute>} />
        <Route path="/add-course" element={<ProtectedRoute allowedRoles={['administrator']}><AddCoursesPage /></ProtectedRoute>} />
        <Route path="/edit-course/:id" element={<ProtectedRoute allowedRoles={['administrator']}><EditCoursePage /></ProtectedRoute>} />
        <Route path="/course-info" element={<ProtectedRoute><Layout><div>Course Info</div></Layout></ProtectedRoute>} />
        <Route path="/course-payment" element={<ProtectedRoute><Layout><div>Course Payment</div></Layout></ProtectedRoute>} />
        <Route path="/library-assets" element={<ProtectedRoute allowedRoles={['administrator']}><LibraryAssetsPage /></ProtectedRoute>} />
        <Route path="/add-library-assets" element={<ProtectedRoute allowedRoles={['administrator']}><AddLibraryAssetsPage /></ProtectedRoute>} />
        <Route path="/edit-library-assets/:id" element={<ProtectedRoute allowedRoles={['administrator']}><EditLibraryAssetPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute allowedRoles={['administrator']}><AllDepartmentsPage /></ProtectedRoute>} />
        <Route path="/add-department" element={<ProtectedRoute allowedRoles={['administrator']}><AddDepartmentsPage /></ProtectedRoute>} />
        <Route path="/departments/edit/:id" element={<ProtectedRoute allowedRoles={['administrator']}><EditDepartmentPage /></ProtectedRoute>} />
        <Route path="/mailbox" element={<ProtectedRoute><Layout><div>Inbox</div></Layout></ProtectedRoute>} />
        <Route path="/mailbox-compose" element={<ProtectedRoute><Layout><div>Compose</div></Layout></ProtectedRoute>} />
        <Route path="/mailbox-view" element={<ProtectedRoute><Layout><div>View Message</div></Layout></ProtectedRoute>} />
        <Route path="/buttons" element={<ProtectedRoute><Layout><div>Buttons</div></Layout></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Layout><div>Alerts</div></Layout></ProtectedRoute>} />
        <Route path="/modals" element={<ProtectedRoute><Layout><div>Modals</div></Layout></ProtectedRoute>} />
        <Route path="/tabs" element={<ProtectedRoute><Layout><div>Tabs</div></Layout></ProtectedRoute>} />
        <Route path="/accordion" element={<ProtectedRoute><Layout><div>Accordion</div></Layout></ProtectedRoute>} />
        <Route path="/basic-form-element" element={<ProtectedRoute><Layout><div>Basic Forms</div></Layout></ProtectedRoute>} />
        <Route path="/advance-form-element" element={<ProtectedRoute><Layout><div>Advanced Forms</div></Layout></ProtectedRoute>} />
        <Route path="/password-meter" element={<ProtectedRoute><Layout><div>Password Meter</div></Layout></ProtectedRoute>} />
        <Route path="/multi-upload" element={<ProtectedRoute><Layout><div>File Upload</div></Layout></ProtectedRoute>} />
        <Route path="/images-cropper" element={<ProtectedRoute><Layout><div>Image Cropper</div></Layout></ProtectedRoute>} />
        <Route path="/line-charts" element={<ProtectedRoute><Layout><div>Line Charts</div></Layout></ProtectedRoute>} />
        <Route path="/area-charts" element={<ProtectedRoute><Layout><div>Area Charts</div></Layout></ProtectedRoute>} />
        <Route path="/bar-charts" element={<ProtectedRoute><Layout><div>Bar Charts</div></Layout></ProtectedRoute>} />
        <Route path="/c3" element={<ProtectedRoute><Layout><div>C3 Charts</div></Layout></ProtectedRoute>} />
        <Route path="/peity" element={<ProtectedRoute><Layout><div>Peity Charts</div></Layout></ProtectedRoute>} />
        <Route path="/rounded-chart" element={<ProtectedRoute><Layout><div>Rounded Charts</div></Layout></ProtectedRoute>} />
        <Route path="/static-table" element={<ProtectedRoute><Layout><div>Static Tables</div></Layout></ProtectedRoute>} />
        <Route path="/data-table" element={<ProtectedRoute><Layout><div>Data Tables</div></Layout></ProtectedRoute>} />
        <Route path="/code-editor" element={<ProtectedRoute><Layout><div>Code Editor</div></Layout></ProtectedRoute>} />
        <Route path="/preloader" element={<ProtectedRoute><Layout><div>Preloaders</div></Layout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Layout><div>Notifications</div></Layout></ProtectedRoute>} />
        <Route path="/tree-view" element={<ProtectedRoute><Layout><div>Tree View</div></Layout></ProtectedRoute>} />
        <Route path="/pdf-viewer" element={<ProtectedRoute><Layout><div>PDF Viewer</div></Layout></ProtectedRoute>} />
        <Route path="/google-map" element={<ProtectedRoute><Layout><div>Interactive Maps</div></Layout></ProtectedRoute>} />
        <Route path="/data-maps" element={<ProtectedRoute><Layout><div>Data Maps</div></Layout></ProtectedRoute>} />

        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/404" element={<Error404 />} />
        <Route path="/500" element={<Error500 />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
