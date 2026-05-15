import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'administrator',
    newsletter: false,
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    dispatch(clearError());

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check username pattern
    const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernamePattern.test(formData.username)) {
      toast.error('Username must be 3-20 characters, letters, numbers, and underscores only.');
      return;
    }

    // Dispatch the registerUser thunk
    const resultAction = await dispatch(registerUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      role: formData.role
    }));

    if (registerUser.fulfilled.match(resultAction)) {
      // Registration successful, redirect to login
      toast.success('Registration successful! Please login to continue.');
        navigate('/');      
    } else {
      // Error is handled by the slice and can be displayed via error state
      // toast.error(resultAction.payload || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 0'
    }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '520px', padding: '20px' }}>
        <div className="auth-card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div className="brand-logo" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              background: '#6366f1',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <i className="bi bi-mortarboard-fill" style={{ fontSize: '30px', color: 'white' }}></i>
            </div>
            <h1 className="h3 mb-2 fw-bold">Create Account</h1>
            <p className="text-muted">Join the Kiaalap community today</p>
          </div>

          <form id="registerForm" onSubmit={handleSubmit} noValidate>
            <div className="dashboard-grid grid-cols-2" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div>
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                  aria-label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
                <div className="invalid-feedback">Please enter your first name.</div>
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                  aria-label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
                <div className="invalid-feedback">Please enter your last name.</div>
              </div>
            </div>

            <div className="mb-3 mt-3">
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
                  aria-label="Email Address"
                  aria-describedby="emailHelp"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="invalid-feedback">Please enter a valid email address.</div>
              <small id="emailHelp" className="form-text text-muted">
                We'll never share your email with anyone else.
              </small>
            </div>

            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <div className="input-group">
                <span className="input-group-text">@</span>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  required
                  pattern="[a-zA-Z0-9_]{3,20}"
                  aria-label="Username"
                  aria-describedby="usernameHelp"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="invalid-feedback">
                Username must be 3-20 characters, letters, numbers, and underscores only.
              </div>
              <small id="usernameHelp" className="form-text text-muted">
                Choose a unique username for your account.
              </small>
            </div>

            <div className="dashboard-grid grid-cols-2"  >
              <div>
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
                    placeholder="Min 8 characters"
                    required
                    minLength="8"
                    aria-label="Password"
                    aria-describedby="passwordHelp"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    id="togglePassword"
                    aria-label="Toggle password visibility"
                    onClick={togglePassword}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                <div className="invalid-feedback">Password must be at least 8 characters.</div>
                <small id="passwordHelp" className="form-text text-muted">Use a strong password.</small>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Repeat password"
                    required
                    aria-label="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    id="toggleConfirmPassword"
                    aria-label="Toggle confirm password visibility"
                    onClick={toggleConfirmPassword}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                <div className="invalid-feedback">Passwords do not match.</div>
              </div>
            </div>

            <div className="mb-3 mt-3">
              <label htmlFor="role" className="form-label">I am a</label>
              <select
                className="form-select"
                id="role"
                name="role"
                required
                aria-label="Select role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="">Choose your role...</option>
                {/* <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="staff member">Staff Member</option> */}
                <option value="administrator">Administrator</option>
              </select>
              <div className="invalid-feedback">Please select your role.</div>
            </div>

            <div className="mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value=""
                  id="newsletter"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="newsletter">
                  Sign up for our newsletter
                </label>
              </div>

              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value=""
                  id="terms"
                  name="terms"
                  required
                  checked={formData.terms}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="terms">
                  I agree to the <a href="/terms" className="text-decoration-none">Terms of Service</a> and
                  <a href="/privacy" className="text-decoration-none"> Privacy Policy</a>
                </label>
                <div className="invalid-feedback">You must agree to the terms and conditions.</div>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                <i className="bi bi-person-plus me-2"></i>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center my-3">
                <span className="text-muted">or sign up with</span>
              </div>

              <div className="dashboard-grid grid-cols-2" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div>
                  <button className="btn btn-outline-secondary w-100 disabled" type="button">
                    <i className="bi bi-google"></i>
                    Google
                  </button>
                </div>
                <div>
                  <button className="btn btn-outline-secondary w-100 disabled" type="button">
                    <i className="bi bi-microsoft"></i>
                    Microsoft
                  </button>
                </div>
              </div>
            </div>

            <hr className="my-4 border-2 border-black" />

            <div className="text-center">
              <p>
                Already have an account?
                <Link to="/" className="text-decoration-none fw-bold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-white-50 small">
            &copy; 2025 Kiaalap. All rights reserved.
            <a href="/terms" className="text-white-50">Privacy</a> ·
            <a href="/privacy" className="text-white-50">Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
