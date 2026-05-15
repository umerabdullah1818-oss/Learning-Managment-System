import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
import './auth.css';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load saved username if remember me was checked
    if (localStorage.getItem('rememberMe') === 'true') {
      setEmail(localStorage.getItem('username') || '');
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    dispatch(clearError());

    // Dispatch the loginUser thunk
    const resultAction = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(resultAction)) {
      // Login successful, navigate to appropriate dashboard based on role
      const user = resultAction.payload.user;
      toast.success('Login successful! Welcome back.');
      // If firstLogin is true, force change-password flow
      if (user.firstLogin) {
        navigate('/change-password');
        return;
      }

      if (user.role === 'student') {
        navigate('student-dashboard');
      } else if (user.role === 'professor') {
        navigate('/professor-dashboard');
      } else if (user.role === 'administrator') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Error is handled by the slice (which already shows a toast).
      // Keep behavior minimal here to avoid duplicate notifications.
    }
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
    if (e.target.checked) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('username', email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('username');
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (rememberMe) {
      localStorage.setItem('username', e.target.value);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo">
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <h1 className="h3 mb-2 fw-bold">Welcome Back!</h1>
          <p className="text-muted">Please login to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control"
                id="username"
                name="username"
                placeholder="example@kiaalap.edu"
                required
                aria-label="Email Address"
                aria-describedby="emailHelp"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
            <div className="invalid-feedback">
              Please enter a valid email address.
            </div>
            <small id="emailHelp" className="form-text text-muted">
              Your university email address
            </small>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                aria-label="Password"
                aria-describedby="passwordHelp"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                id="togglePassword"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
            <div className="invalid-feedback">
              Password is required.
            </div>
            <small id="passwordHelp" className="form-text text-muted">
              Your secure password
            </small>
          </div>

          <div className="mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value=""
                id="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <small className="text-muted">
              (only on private devices)
            </small>
          </div>

          <div className="d-grid gap-2">
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              <i className="bi bi-box-arrow-in-right me-2"></i>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center my-3">
              <span className="text-muted">or sign in with</span>
            </div>

            <div className="row g-2">
              <div className="col">
                <button className="btn btn-outline-secondary w-100 disabled" type="button" disabled>
                  <i className="bi bi-google"></i>
                  Google
                </button>
              </div>
              <div className="col">
                <button className="btn btn-outline-secondary w-100 disabled" type="button">
                  <i className="bi bi-microsoft"></i>
                  Microsoft
                </button>
              </div>
            </div>
          </div>

          <hr className="my-4 border-2 border-black" />

          <div className="text-center">
            <p className="mb-2">
              <Link to="/password-recovery" className="text-decoration-none">
                Forgot your password?
              </Link>
            </p>
            <p>
              Don't have an account?
              <Link to="/register" className="text-decoration-none fw-bold">
                Sign up
              </Link>
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
  );
};

export default Login;
