import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const location = useLocation();

  // If app is locked, redirect to lock screen, preserving current route
  const isLocked = sessionStorage.getItem('isLocked') === 'true';
  if (isLocked && location.pathname !== '/lock') {
    if (!sessionStorage.getItem('returnTo')) {
      sessionStorage.setItem('returnTo', location.pathname + location.search + location.hash);
    }
    return <Navigate to="/lock" replace />;
  }
  // If user is required to change password on first login, force redirect
  if (user && user.firstLogin) {
    // allow access to change-password route itself
    if (location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  }

  // If roles are specified and user doesn't have the required role, redirect
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect students to enroll-course, admins to all-courses, professors to assigned-courses
    if (user.role === 'student') {
      return <Navigate to="/enroll-course" replace />;
    } else if (user.role === 'administrator') {
      return <Navigate to="/all-courses" replace />;
    } else if (user.role === 'professor') {
      return <Navigate to="/assigned-courses" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
