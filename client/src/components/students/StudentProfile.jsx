import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api';
import '../../css/dashboard.css';

const StudentProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [studentData, setStudentData] = useState(null);
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
      fetchStudentProfile();
    }
  }, [user?.uuid]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/students/user/${user.uuid}`, { headers });
      setStudentData(response.data);
      setEditData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching student profile:', err);
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
        `/api/students/user/${user.uuid}`,
        editData,
        { headers }
      );
      setStudentData(response.data);
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

  if (loading && !studentData) {
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

  if (error && !studentData) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

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
                    studentData?.profile_image
                      ? `${API_BASE_URL}/images/${studentData.profile_image}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData?.full_name || 'Student')}&background=6366f1&color=fff&size=96`
                  }
                  alt={studentData?.full_name}
                  className="rounded-circle me-3"
                  style={{ width: '80px', height: '80px' }}
                />
                <div>
                  <h4 className="mb-1">{studentData?.full_name}</h4>
                  <p className="text-muted mb-0">
                    <i className="bi bi-hash me-1"></i>
                    {studentData?.student_id}
                  </p>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-building me-1"></i>
                    {studentData?.department}
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
                {/* Full Name */}
                <div>
                  <label className="form-label">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={editData.full_name || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{studentData?.full_name}</p>
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
                    <p className="form-control-plaintext">{studentData?.email}</p>
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
                    <p className="form-control-plaintext">{studentData?.phone || 'N/A'}</p>
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
                      {studentData?.date_of_birth
                        ? new Date(studentData.date_of_birth).toLocaleDateString()
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
                    <p className="form-control-plaintext">{studentData?.gender || 'N/A'}</p>
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
                    <p className="form-control-plaintext">{studentData?.address || 'N/A'}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="form-label">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={editData.city || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{studentData?.city || 'N/A'}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="form-label">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={editData.state || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{studentData?.state || 'N/A'}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="form-label">Postal Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="postal_code"
                      value={editData.postal_code || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{studentData?.postal_code || 'N/A'}</p>
                  )}
                </div>

                {/* Parent Phone */}
                <div>
                  <label className="form-label">Parent/Guardian Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="form-control"
                      name="parent_phone"
                      value={editData.parent_phone || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <p className="form-control-plaintext">{studentData?.parent_phone || 'N/A'}</p>
                  )}
                </div>

                {/* Student ID */}
                <div>
                  <label className="form-label">Student ID</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-primary">{studentData?.student_id}</span>
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="form-label">Department</label>
                  <p className="form-control-plaintext">{studentData?.department}</p>
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
                        setEditData(studentData);
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

export default StudentProfile;
