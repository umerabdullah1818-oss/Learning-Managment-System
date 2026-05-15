import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../../config/api';

const Header = ({ toggleSidebar }) => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || localStorage.getItem('role');
  const isAdmin = userRole === 'administrator' || userRole === 'admin';

  const getProfileLink = () => {
    if (userRole === 'student') return '/student-profile';
    if (userRole === 'professor') return '/professor-profile';
    if (userRole === 'administrator' || userRole === 'admin') return '/admin-profile';
    return '/';
  };

  const getHomeUrl = () => {
    if (userRole === 'student') return '/student-dashboard';
    if (userRole === 'professor') return '/professor-dashboard';
    if (userRole === 'administrator' || userRole === 'admin') return '/dashboard';
    return '/';
  };

  const generateBreadcrumb = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(segment => segment);
    const breadcrumb = [{ title: 'Home', url: getHomeUrl() }];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const title = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      breadcrumb.push({ title, url: currentPath });
    });

    return breadcrumb;
  };

  const breadcrumb = generateBreadcrumb();
  const navbarStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,                
    width: "100%",
    height: "60px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e5e5",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
  };

  // Persisted user fallback for hard reloads
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const avatarName = (user?.name || storedUser?.name || localStorage.getItem('username')) || 'User';
  // Use avatar from Redux first, then persisted localStorage user
  const avatarUrl = (user?.avatar || user?.profile_image || user?.profileImage || user?.image)
    || (storedUser?.avatar || storedUser?.profile_image || storedUser?.profileImage || storedUser?.image);




  const resolveAvatarSrc = (url) => {
    if (!url) return null;
    const trimmed = String(url).trim();
    // If it's already an absolute URL, use it directly
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // If it looks like a windows absolute path or contains backslashes, extract filename
    if (/^[A-Za-z]:\\|\\\\/.test(trimmed) || trimmed.indexOf('\\') !== -1) {
      const fileName = trimmed.split(/\\|\//).pop();
      return `${API_BASE_URL}/images/${encodeURIComponent(fileName)}`;
    }
    // If it's a relative path that includes images folder
    if (trimmed.startsWith('/images') || trimmed.startsWith('images')) {
      const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${API_BASE_URL}${path}`;
    }
    // Otherwise assume it's just a filename stored in DB
    return `${API_BASE_URL}/images/${encodeURIComponent(trimmed)}`;
  };

  const avatarSrc = resolveAvatarSrc(avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=6366f1&color=fff&size=32`;

  return (
    <nav className="top-navbar">
      <div className="container-fluid d-flex align-items-center h-100">
        {/* Hamburger Menu */}
        <button className="hamburger-menu d-lg-none" id="sidebarToggle" onClick={toggleSidebar}>
          <i className="bi bi-list"></i>
        </button>

        {/* Breadcrumb for desktop */}
        <nav aria-label="breadcrumb" className="d-none d-lg-block ms-3">
          <ol className="breadcrumb mb-0">
            {breadcrumb.map((item, index) => (
              <li key={index} className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}>
                {index === breadcrumb.length - 1 ? (
                  item.title
                ) : (
                  <NavLink to={item.url}>{item.title}</NavLink>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Logo for mobile */}
        <Link to={getHomeUrl()} className="navbar-brand d-lg-none fw-bold me-auto">Kiaalap</Link>

        {/* Spacer for desktop */}
        <div className="flex-grow-1 d-none d-lg-block"></div>

        {/* Right Actions */}
        
        <div className="d-flex align-items-center gap-2">         
          {/* Quick Actions (admin only) */}
          {isAdmin && (
            <div className="dropdown">
              <button className="btn btn-light btn-icon" data-bs-toggle="dropdown">
                <i className="bi bi-plus-lg"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="/add-student"><i className="bi bi-person-plus me-2"></i>Add Student</a></li>
                <li><a className="dropdown-item" href="/add-course"><i className="bi bi-book me-2"></i>Add Course</a></li>
                <li><a className="dropdown-item" href="/add-professor"><i className="bi bi-person-badge me-2"></i>Add Professor</a></li>
                <li><a className="dropdown-item" href="/add-department"><i className="bi bi-building me-2"></i>Add Department</a></li>
                <li><a className="dropdown-item" href="/add-library-assets"><i className="bi bi-journal-bookmark me-2"></i>Add Library</a></li>
              </ul>
            </div>
          )}

          {/* User Menu */}
          <div className="dropdown">
            <button className="btn btn-light d-flex align-items-center" data-bs-toggle="dropdown">
              {/* Show uploaded avatar only for Student/Professor; hide for Admin */}
              {(userRole === 'student' || userRole === 'professor') && (
                <div className="user-avatar me-2">
                  <img
                    src={avatarSrc}
                    alt={avatarName}
                    className="rounded-circle"
                    width="32"
                    height="32"
                  />
                </div>
              )}
              {(userRole === 'administrator' || userRole === 'admin') && (
                <div
  className="user-avatar me-2 d-flex align-items-center justify-content-center rounded-circle"
  style={{
    width: 32,
    height: 32,
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: '#0d6efd', // Bootstrap primary blue
    color: '#ffffff'
  }}
>
  {avatarName.substring(0, 2).toUpperCase()}
</div>

              )}
              <span className="d-none d-md-inline">{localStorage.getItem('username') || avatarName}</span>
              <i className="bi bi-chevron-down ms-1"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><Link className="dropdown-item" to={getProfileLink()}><i className="bi bi-person me-2"></i>Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="/logout"><i className="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
