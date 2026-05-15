import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../css/dashboard.css';

// Eye icon toggles for password fields

const AdminProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [adminData, setAdminData] = useState(null);
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
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/auth/get-profile', { headers });

      const adminData = {
        id: response.data.user.uuid,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        email: response.data.user.email,
        username: response.data.user.username,
        role: response.data.user.role
      };
      setAdminData(adminData);
      setEditData(adminData);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      toast.error('Failed to fetch profile details');
      setError('Failed to load profile details');
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
        '/api/auth/update-profile',
        {
          firstName: editData.first_name,
          lastName: editData.last_name,
          email: editData.email
        },
        { headers }
      );

      // Update local state with new data
      const updatedData = {
        ...adminData,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        email: response.data.user.email
      };
      setAdminData(updatedData);
      setEditData(updatedData);

      toast.success('Profile updated successfully!');
      setIsEditing(false);
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

  if (loading && !adminData) {
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

  if (error && !adminData) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const fullName = `${adminData?.first_name || ''} ${adminData?.last_name || ''}`.trim();

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
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff&size=96`}
                  alt={fullName}
                  className="rounded-circle me-3"
                  style={{ width: '80px', height: '80px' }}
                />
                <div>
                  <h4 className="mb-1">{fullName}</h4>
                  <p className="text-muted mb-0">
                    <i className="bi bi-shield-check me-1"></i>
                    Administrator
                  </p>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-person me-1"></i>
                    {adminData?.username}
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
                    <p className="form-control-plaintext">{adminData?.first_name}</p>
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
                    <p className="form-control-plaintext">{adminData?.last_name}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="form-label">Username</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-secondary">{adminData?.username}</span>
                  </p>
                </div>

                {/* Email Address */}
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
                    <p className="form-control-plaintext">{adminData?.email}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="form-label">Role</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-primary">
                      <i className="bi bi-shield-check me-1"></i>
                      {adminData?.role || 'Administrator'}
                    </span>
                  </p>
                </div>

                {/* Account Status */}
                <div>
                  <label className="form-label">Account Status</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Active
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
                        setEditData(adminData);
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

export default AdminProfile;
