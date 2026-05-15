import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api';
import '../../css/dashboard.css';

const ProfessorProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [professorData, setProfessorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user?.uuid) {
      fetchProfessorProfile();
    }
  }, [user?.uuid]);

  const fetchProfessorProfile = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/professors/user/${user.uuid}`, { headers });
      setProfessorData(response.data);
      setEditData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching professor profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(
        `/api/professors/user/${user.uuid}`,
        editData,
        { headers }
      );
      setProfessorData(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('Current password and new password cannot be the same');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        '/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers }
      );

      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading && !professorData) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !professorData) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const fullName = `${professorData?.title || ''} ${professorData?.first_name || ''} ${professorData?.last_name || ''}`.trim();

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="h3 font-bold">My Profile</h1>
        <p className="text-muted text-sm">View and manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="dashboard-row">
        <div className="dashboard-card">
          {/* Profile Header */}
          <div className="dashboard-card-header bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <img
                  src={
                    professorData?.profile_image
                      ? `${API_BASE_URL}/images/${professorData.profile_image}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0d6efd&color=fff&size=96`
                  }
                  alt={fullName}
                  className="rounded-circle me-3"
                  style={{ width: '80px', height: '80px' }}
                />
                <div>
                  <h4 className="mb-1">{fullName}</h4>
                  <p className="text-muted mb-0">
                    <i className="bi bi-briefcase me-1"></i>
                    {professorData?.position}
                  </p>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-hash me-1"></i>
                    {professorData?.employee_id}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="bi bi-pencil me-2"></i>Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="dashboard-card-body">
            {/* Personal Information Section */}
            <div className="mb-4">
              <h6 className="text-primary fw-semibold mb-3">
                <i className="bi bi-person-circle me-2"></i>Personal Information
              </h6>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div >
                  <label className="form-label">Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      placeholder="e.g., Dr., Prof."
                      value={editData.title || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{professorData?.title || 'N/A'}</p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <label className="form-label">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={editData.first_name || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{professorData?.first_name}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="form-label">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={editData.last_name || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{professorData?.last_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={editData.email || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{professorData?.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={editData.phone || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{professorData?.phone || 'N/A'}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="form-label">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="form-control"
                      name="date_of_birth"
                      value={editData.date_of_birth ? editData.date_of_birth.split('T')[0] : ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">
                      {professorData?.date_of_birth
                        ? new Date(professorData.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="form-label">Gender</label>
                  {isEditing ? (
                    <select
                      className="form-select"
                      name="gender"
                      value={editData.gender || ''}
                      onChange={handleEditChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="form-control-plaintext">{professorData?.gender || 'N/A'}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="form-label">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={editData.address || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{professorData?.address || 'N/A'}</p>
                  )}
                </div>

                {/* Employee ID */}
                <div>
                  <label className="form-label">Employee ID</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-primary">{professorData?.employee_id}</span>
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="form-label">Department</label>
                  <p className="form-control-plaintext">{professorData?.department}</p>
                </div>

                {/* Position */}
                <div className="col-md-6">
                  <label className="form-label">Position</label>
                  <p className="form-control-plaintext">{professorData?.position}</p>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="form-label">Employment Type</label>
                  <p className="form-control-plaintext">
                    <span className={`badge ${professorData?.employment_type === 'Full-Time' ? 'bg-success' : 'bg-warning'}`}>
                      {professorData?.employment_type}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="row mt-4">
                <div className="col-12">
                  <hr className="my-4" />
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary flex-fill"
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>Save Changes
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary flex-fill"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(professorData);
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-x-lg me-2"></i>Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="dashboard-row mt-4">
  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <h5 className="dashboard-card-title mb-0">
        <i className="bi bi-shield-lock me-2"></i>Security & Password
      </h5>
    </div>

    <div className="dashboard-card-body">
      {!showPasswordForm ? (
        <button
          className="btn btn-warning"
          onClick={() => setShowPasswordForm(true)}
        >
          <i className="bi bi-key me-2"></i>Change Password
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePassword();
          }}
        >
          <div className="row g-3">

            {/* Current Password */}
            <div className="col-12">
              <label htmlFor="currentPassword" className="form-label">
                Current Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="form-control"
                  id="currentPassword"
                  placeholder="Enter your current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowCurrentPassword((v) => !v)}
                >
                  <i
                    className={`bi ${
                      showCurrentPassword ? "bi-eye-slash" : "bi-eye"
                    }`}
                  ></i>
                </span>
              </div>
            </div>

            {/* New Password */}
            <div className="col-12">
              <label htmlFor="newPassword" className="form-label">
                New Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  id="newPassword"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowNewPassword((v) => !v)}
                >
                  <i
                    className={`bi ${
                      showNewPassword ? "bi-eye-slash" : "bi-eye"
                    }`}
                  ></i>
                </span>
              </div>
              <small className="text-muted">Minimum 6 characters</small>
            </div>

            {/* Confirm Password */}
            <div className="col-12">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  <i
                    className={`bi ${
                      showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                    }`}
                  ></i>
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-primary flex-fill"
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>Change Password
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary flex-fill"
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
              disabled={passwordLoading}
            >
              <i className="bi bi-x-lg me-2"></i>Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
</div>

    </div>
  );
};

export default ProfessorProfile;
