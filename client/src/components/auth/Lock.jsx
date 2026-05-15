import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config/api";
import 'bootstrap-icons/font/bootstrap-icons.css';

const Lock = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get user info from access token or stored user object
    const populateUser = () => {
      const token = localStorage.getItem('accessToken');
      let decoded = null;
      if (token) {
        try {
          const payload = token.split('.')[1];
          decoded = JSON.parse(atob(payload));
        } catch (e) {
          decoded = null;
        }
      }

      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
          return {};
        }
      })();

      setUserName(decoded?.name || storedUser.name || localStorage.getItem('username') || '');
      setUserEmail(decoded?.email || storedUser.email || '');
      setUserRole(decoded?.role || storedUser.role || storedUser.roles?.[0] || 'student');
      setAvatarUrl(storedUser.avatar || (`https://ui-avatars.com/api/?name=${encodeURIComponent(decoded?.name || storedUser.name || '')}&background=6366f1&color=fff&size=100`));
    };

    populateUser();
    const updateDateTime = () => {
      const now = new Date();

      // Format time
      const timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const timeString = now.toLocaleTimeString('en-US', timeOptions);

      // Format date
      const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      const dateString = now.toLocaleDateString('en-US', dateOptions);

      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password.trim()) {
      toast.error('Password is required to unlock.');
      return;
    }

    const data = {
      email: userEmail || localStorage.getItem('username') || '',
      password: password
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        toast.success('Screen unlocked successfully!');

        // Decide where to redirect: returnTo or role based route
        const returnTo = sessionStorage.getItem('returnTo');
        // decode role from token (safe fallback)
        let role = userRole;
        try {
          const payload = result.accessToken.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          role = decoded?.role || decoded?.roles?.[0] || role;
        } catch (e) {
          // ignore
        }

        const roleRoutes = {
          admin: '/admin',
          professor: '/professor',
          student: '/student'
        };

        sessionStorage.removeItem('isLocked');
        sessionStorage.removeItem('returnTo');
        navigate(returnTo || roleRoutes[role] || '/login');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error?.message || 'Unable to unlock.');
    }
  };

  const handleSwitchUser = (e) => {
    e.preventDefault();
    // Clear tokens and stored user, then navigate to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    sessionStorage.removeItem('isLocked');
    navigate('/login');
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '420px', padding: '20px' }}>
        <div className="auth-card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div className="lock-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={avatarUrl || null}
                alt="User Avatar"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'block',
                  border: '4px solid #f3f4f6',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                loading="lazy"
              />
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                right: '50%',
                transform: 'translateX(50%)',
                background: '#ef4444',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white'
              }}>
                <i className="bi bi-lock-fill"></i>
              </div>
            </div>

            <h1 className="h4 mb-2 fw-bold mt-3">{userName}</h1>
            <p className="text-muted mb-1">{userEmail}</p>
            <div className="mb-3">
              <span className="badge bg-info text-dark" style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                <i className="bi bi-shield-check me-1"></i>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>

            <div className="text-center my-3">
              <div className="badge bg-secondary">
                <i className="bi bi-clock me-1"></i>
                <span>{currentTime}</span>
              </div>
              <div className="text-muted small mt-2">
                <span>{currentDate}</span>
              </div>
            </div>

            <p className="text-muted small">
              Your session is locked. Enter your password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="password" className="form-label visually-hidden">Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-key"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  autoFocus
                  aria-label="Password"
                  aria-describedby="passwordHelp"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleTogglePassword}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              <div className="invalid-feedback">
                Password is required to unlock.
              </div>
              <small id="passwordHelp" className="form-text text-muted">
                Enter your password to unlock the screen
              </small>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-primary btn-lg" type="submit">
                <i className="bi bi-unlock me-2"></i>
                Unlock Screen
              </button>
            </div>

            <hr className="my-4" />

            <div className="text-center">
              {/* <p className="mb-2">
                <a href="#" onClick={handleSwitchUser} className="text-decoration-none">
                  <i className="bi bi-person-switch me-1"></i>
                  Switch User
                </a>
              </p> */}
              <p>
                <a href="#" onClick={handleSignOut} className="text-decoration-none text-danger">
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Sign Out Completely
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-white-50 small">
            &copy; 2025 Kiaalap. All rights reserved.
            <a href="/privacy" className="text-white-50">Privacy</a> ·
            <a href="/terms" className="text-white-50">Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Lock;
