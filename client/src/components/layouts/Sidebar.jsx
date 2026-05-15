import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../../css/dashboard.css';

const Sidebar = ({ isOpen, collapsed = false }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const isActive = (path) => location.pathname === path;

  const isSubmenuActive = (submenuPaths) => submenuPaths.some(path => location.pathname === path);

  const isStudent = user?.role === 'student';
  const isProfessor = user?.role === 'professor';

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h5>
              <i className="bi bi-mortarboard-fill"></i>
              <span>Kiaalap</span>
            </h5>
            <button className="sidebar-close" id="sidebarClose">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

      <nav className="sidebar-nav">
        {isStudent ? (
          <>
            <div className="menu-section">
              <div className="menu-section-title">Student</div>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <NavLink to="/student-dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-house-door"></i>
                    <span>Overview</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/enroll-course" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-book"></i>
                    <span>Courses</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/attendance" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-check-circle"></i>
                    <span>Attendance</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/assignments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-pencil-square"></i>
                    <span>Assignments</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/grades" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-graph-up"></i>
                    <span>Grades</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/transcript" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-file-earmark-text"></i>
                    <span>Transcript</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        ) : isProfessor ? (
          <>
            <div className="menu-section">
              <div className="menu-section-title">Professor</div>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <NavLink to="/professor-dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-house-door"></i>
                    <span>Overview</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/assigned-courses" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-book-half"></i>
                    <span>Assigned Courses</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/professor-grades" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-graph-up"></i>
                    <span>Grades</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/professor/assignments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-pencil-square"></i>
                    <span>Assignments of Students</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/professor/attendance" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <i className="bi bi-check-circle"></i>
                    <span>Attendance of Students</span>
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>

            <div className="menu-section">
              <div className="menu-section-title">Academic</div>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">
                    <i className="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <a className={`nav-link has-submenu ${isSubmenuActive(['/all-professors', '/add-professor', '/edit-professor', '/professor-profile']) ? 'active' : ''}`} href="javascript:void(0)" data-bs-toggle="collapse" data-bs-target="#professorsSubmenu" aria-expanded={isSubmenuActive(['/all-professors', '/add-professor', '/edit-professor', '/professor-profile'])}>
                    <i className="bi bi-person-badge"></i>
                    <span>Professors</span>
                  </a>
                  <ul id="professorsSubmenu" className={`submenu collapse ${isSubmenuActive(['/all-professors', '/add-professor', '/professor-profile']) ? 'show' : ''} list-unstyled`}>
                    <li><NavLink className="nav-link" to="/all-professors">All Professors</NavLink></li>
                    <li><NavLink className="nav-link" to="/add-professor">Add Professor</NavLink></li>
                    {/* <li><NavLink className="nav-link" to="/professor-profile">Professor Profile</NavLink></li> */}
                  </ul>
                </li>
                <li className="nav-item">
                  <a className={`nav-link has-submenu ${isSubmenuActive(['/all-students', '/add-student', '/edit-student', '/student-profile']) ? 'active' : ''}`} href="javascript:void(0)" data-bs-toggle="collapse" data-bs-target="#studentsSubmenu" aria-expanded={isSubmenuActive(['/all-students', '/add-student', '/edit-student', '/student-profile'])}>
                    <i className="bi bi-people"></i>
                    <span>Students</span>
                  </a>
                  <ul id="studentsSubmenu" className={`submenu collapse ${isSubmenuActive(['/all-students', '/add-student', '/student-profile']) ? 'show' : ''} list-unstyled`}>
                    <li><NavLink className="nav-link" to="/all-students">All Students</NavLink></li>
                    <li><NavLink className="nav-link" to="/add-student">Add Student</NavLink></li>
                    {/* <li><NavLink className="nav-link" to="/student-profile">Student Profile</NavLink></li> */}
                  </ul>
                </li>
                <li className="nav-item">
                  <a className={`nav-link has-submenu ${isSubmenuActive(['/all-courses', '/add-course', '/edit-course', '/course-info', '/course-payment']) ? 'active' : ''}`} href="javascript:void(0)" data-bs-toggle="collapse" data-bs-target="#coursesSubmenu" aria-expanded={isSubmenuActive(['/all-courses', '/add-course', '/edit-course', '/course-info', '/course-payment'])}>
                    <i className="bi bi-book"></i>
                    <span>Courses</span>
                  </a>
                  <ul id="coursesSubmenu" className={`submenu collapse ${isSubmenuActive(['/all-courses', '/add-course', '/edit-course', '/course-info', '/course-payment']) ? 'show' : ''} list-unstyled`}>
                    <li><NavLink className="nav-link" to="/all-courses">All Courses</NavLink></li>
                    <li><NavLink className="nav-link" to="/add-course">Add Course</NavLink></li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a className={`nav-link has-submenu ${isSubmenuActive(['/library-assets', '/add-library-assets', '/edit-library-assets']) ? 'active' : ''}`} href="javascript:void(0)" data-bs-toggle="collapse" data-bs-target="#librarySubmenu" aria-expanded={isSubmenuActive(['/library-assets', '/add-library-assets', '/edit-library-assets'])}>
                    <i className="bi bi-journal-bookmark"></i>
                    <span>Library</span>
                  </a>
                  <ul id="librarySubmenu" className={`submenu collapse ${isSubmenuActive(['/library-assets', '/add-library-assets', '/edit-library-assets']) ? 'show' : ''} list-unstyled`}>
                    <li><NavLink className="nav-link" to="/library-assets">Library Assets</NavLink></li>
                    <li><NavLink className="nav-link" to="/add-library-assets">Add Library Asset</NavLink></li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a className={`nav-link has-submenu ${isSubmenuActive(['/departments', '/add-department', '/edit-department']) ? 'active' : ''}`} href="javascript:void(0)" data-bs-toggle="collapse" data-bs-target="#departmentsSubmenu" aria-expanded={isSubmenuActive(['/departments', '/add-department', '/edit-department'])}>
                    <i className="bi bi-building"></i>
                    <span>Departments</span>
                  </a>
                  <ul id="departmentsSubmenu" className={`submenu collapse ${isSubmenuActive(['/departments', '/add-department', '/edit-department']) ? 'show' : ''} list-unstyled`}>
                    <li><NavLink className="nav-link" to="/departments">Departments List</NavLink></li>
                    <li><NavLink className="nav-link" to="/add-department">Add Department</NavLink></li>
                  </ul>
                </li>
              </ul>
            </div>
            
          </>
        )}
      </nav>
    </aside>
    <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`}></div>
  </>
);
};

export default Sidebar;
