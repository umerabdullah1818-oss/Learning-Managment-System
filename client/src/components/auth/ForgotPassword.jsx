import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, resetPassword, clearError } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [currentView, setCurrentView] = useState('recoveryForm'); // recoveryForm, successMessage, resetPasswordForm
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    // Check if there's a reset token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setCurrentView('resetPasswordForm');
    }
  }, []);

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    dispatch(clearError());

    // Dispatch the forgotPassword thunk
    const resultAction = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(resultAction)) {
      // Success, show success message
      toast.success('Password reset instructions sent to your email!');
      setCurrentView('successMessage');
    } else {
      // Error is handled by the slice and can be displayed via error state
      toast.error(resultAction.payload || 'Failed to send reset instructions');
      console.error('Forgot password failed:', resultAction.payload);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Clear previous errors
    dispatch(clearError());

    // Dispatch the resetPassword thunk
    const resultAction = await dispatch(resetPassword({ token: resetToken, password: newPassword }));

    if (resetPassword.fulfilled.match(resultAction)) {
      // Success, navigate to login
      navigate('/');
    } else {
      // Error is handled by the slice and can be displayed via error state
      console.error('Reset password failed:', resultAction.payload);
    }
  };

  const resetForm = () => {
    setCurrentView('recoveryForm');
    setEmail('');
  };

  return (
    <div className="auth-container">
      {/* Initial Password Recovery Form */}
      {currentView === 'recoveryForm' && (
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <i className="bi bi-key"></i>
            </div>
            <h1 className="h3 mb-2 fw-bold">Forgot Password?</h1>
            <p className="text-muted">No worries! Enter your email and we'll send you reset instructions.</p>
          </div>

          <form onSubmit={handleRecoverySubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  placeholder="example@kiaalap.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email Address"
                  aria-describedby="emailHelp"
                />
              </div>
              <div className="invalid-feedback">
                Please enter a valid email address.
              </div>
              <small id="emailHelp" className="form-text text-muted">
                Enter the email address associated with your account.
              </small>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                <i className="bi bi-send me-2"></i>
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </div>

            <hr className="my-4" />

            <div className="text-center">
              <p className="mb-2">
                <Link to="/" className="text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Login
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
      )}

      {/* Success Message */}
      {currentView === 'successMessage' && (
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <i className="bi bi-check-lg"></i>
            </div>
            <h1 className="h3 mb-2 fw-bold">Check Your Email</h1>
            <p className="text-muted">
              We've sent password reset instructions to
              <strong> {email}</strong>
            </p>
          </div>

          <div className="alert alert-info" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            If you don't receive an email within 5 minutes, check your spam folder.
          </div>

          <div className="d-grid gap-2">
            <button className="btn btn-primary btn-lg" onClick={() => window.location.href = '/login'}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Login
            </button>

            <button className="btn btn-outline-secondary" onClick={resetForm}>
              Didn't receive email? Try again
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      {currentView === 'resetPasswordForm' && (
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <i className="bi bi-shield-lock"></i>
            </div>
            <h1 className="h3 mb-2 fw-bold">Reset Password</h1>
            <p className="text-muted">Enter your new password below</p>
          </div>

          <form onSubmit={handleResetSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-control"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Min 8 characters"
                  required
                  minLength="8"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-label="New Password"
                  aria-describedby="newPasswordHelp"
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              <div className="invalid-feedback">
                Password must be at least 8 characters.
              </div>
              <small id="newPasswordHelp" className="form-text text-muted">
                Use a strong password with letters, numbers, and symbols.
              </small>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  className="form-control"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  placeholder="Repeat password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  aria-label="Confirm Password"
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  <i className={`bi ${showConfirmNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              <div className="invalid-feedback">
                Passwords do not match.
              </div>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                <i className="bi bi-check-lg me-2"></i>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <hr className="my-4" />

            <div className="text-center">
              <p>
                <Link to="/login" className="text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      )}

      <div className="text-center mt-4">
        <p className="text-white-50 small">
          &copy; 2025 Kiaalap. All rights reserved.
          <a href="#" className="text-white-50">Privacy</a> ·
          <a href="#" className="text-white-50">Terms</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
