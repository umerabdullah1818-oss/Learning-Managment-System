import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStudentById, updateStudent, clearError, resetSuccess } from '../../../redux/slices/studentSlice';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
// Delete functionality removed from this component

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentStudent, loading, error, success } = useSelector((state) => state.student);

  const [activeTab, setActiveTab] = useState('basic');
  // delete modal removed; deletion handled from list/detail views
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    studentId: '',
    department: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    parentPhone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    profileImage: null,

    // Account Information
    email: '',
    password: '',
    confirmPassword: '',
    accountStatus: 'active',
    role: 'student',


  });

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentStudent) {
      setFormData({
        fullName: currentStudent.full_name || '',
        studentId: currentStudent.student_id || '',
        department: currentStudent.department || '',
        course: currentStudent.course || '',
        dateOfBirth: currentStudent.date_of_birth ? currentStudent.date_of_birth.split('T')[0] : '',
        gender: currentStudent.gender || '',
        phone: currentStudent.phone || '',
        parentPhone: currentStudent.parent_phone || '',
        address: currentStudent.address || '',
        city: currentStudent.city || '',
        state: currentStudent.state || '',
        postalCode: currentStudent.postal_code || '',
        email: currentStudent.email || '',

        accountStatus: currentStudent.account_status || 'active',
        role: currentStudent.role || 'student',

      });
      if (currentStudent.profile_image) {
        setPreviewImage(`${API_BASE_URL}/images/${currentStudent.profile_image}`);
      }
    }
  }, [currentStudent]);

  useEffect(() => {
    if (success) {
      toast.success('Student updated successfully!');
      dispatch(resetSuccess());
      navigate('/all-students');
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e, tab) => {
    e.preventDefault();

    const submitData = new FormData();

    // Add all form fields to FormData
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        if (key === 'profileImage' && formData[key]) {
          submitData.append('profileImage', formData[key]);
        } else if (key !== 'profileImage') {
          submitData.append(key, formData[key]);
        }
      }
    });

    dispatch(updateStudent({ id, formData: submitData }));
  };

  const handleCancel = () => {
    navigate('/all-students');
  };

  const handleViewProfile = () => {
    navigate(`/student-profile/${id}`);
  };

  // delete handlers removed



  if (loading && !currentStudent) {
    return (
      <div className="dashboard-content">
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading student data...</p>
          </div>
        </div>
      </div>
    );
  }



  const profileImageUrl = currentStudent?.profile_image
    ? `${API_BASE_URL}/images/${currentStudent.profile_image}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'Student')}&background=6366f1&color=fff`;

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Page Header with Student Info */}
        <div className="dashboard-row">
          <div className="dashboard-grid grid-cols-1">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3">
              <img
                src={profileImageUrl}
                alt={formData.fullName}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #007bff',
                  marginRight: '12px'
                }}
              />
              <div>
                <h4 className="page-title mb-1">Edit Student - {formData.fullName || 'Loading...'}</h4>
                <p className="text-muted mb-0">Student ID: {formData.studentId} | {formData.department} Department</p>
              </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                  <span className={`badge bg-${formData.accountStatus === 'active' ? 'success' : 'secondary'}`}>
                    {formData.accountStatus}
                  </span>
                </div>
            </div>
          </div>
        </div>

        {/* Form Tabs */}
        <div className="dashboard-row">
          <div className="dashboard-grid grid-cols-1">
            <div className="dashboard-card">
              <div className="dashboard-card-body">
                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-4" id="studentFormTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                      onClick={() => setActiveTab('basic')}
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-person-circle me-2"></i>Basic Information
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                      onClick={() => setActiveTab('account')}
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-shield-lock me-2"></i>Account Information
                    </button>
                  </li>

                </ul>

                {/* Tab Content */}
                <div className="tab-content" id="studentFormTabContent">
                  {/* Basic Information Tab */}
                  {activeTab === 'basic' && (
                    <div className="tab-pane fade show active" role="tabpanel">
                      <form onSubmit={(e) => handleSubmit(e, 'basic')} className="needs-validation" noValidate>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
                          gap: '10px'
                        }}>
                          <div>
                            <div className="mb-4">
                              <label htmlFor="fullName" className="form-label">Full Name <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                              />
                              <div className="invalid-feedback">Please provide a valid name.</div>
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="studentId" className="form-label">Student ID <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                id="studentId"
                                name="studentId"
                                value={formData.studentId}
                                onChange={handleInputChange}
                                disabled
                              />
                              <div className="form-text">Student ID is auto-generated and cannot be changed</div>
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="department" className="form-label">Department <span className="text-danger">*</span></label>
                              <select
                                className="form-select"
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="">Select Department</option>
                                <option value="cs">Computer Science</option>
                                <option value="eng">Engineering</option>
                                <option value="bus">Business Administration</option>
                                <option value="med">Medicine</option>
                                <option value="psy">Psychology</option>
                              </select>
                              <div className="invalid-feedback">Please select a department.</div>
                            </div>
                          </div>

                          <div >
                            <div className="mb-4">
                              <label htmlFor="dateOfBirth" className="form-label">Date of Birth <span className="text-danger">*</span></label>
                              <input
                                type="date"
                                className="form-control"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                required
                              />
                              <div className="invalid-feedback">Please provide date of birth.</div>
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="gender" className="form-label">Gender <span className="text-danger">*</span></label>
                              <select
                                className="form-select"
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                              <div className="invalid-feedback">Please select a gender.</div>
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="phone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                              <input
                                type="tel"
                                className="form-control"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                              />
                              <div className="invalid-feedback">Please provide a phone number.</div>
                            </div>
                          </div>
                          <div>
                            <div className="mb-4">
                              <label htmlFor="parentPhone" className="form-label">Parent/Guardian Phone</label>
                              <input
                                type="tel"
                                className="form-control"
                                id="parentPhone"
                                name="parentPhone"
                                value={formData.parentPhone}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="address" className="form-label">Address</label>
                              <textarea
                                className="form-control"
                                id="address"
                                name="address"
                                rows="3"
                                value={formData.address}
                                onChange={handleInputChange}
                              ></textarea>
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="city" className="form-label">City</label>
                              <input
                                type="text"
                                className="form-control"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="state" className="form-label">State/Province</label>
                              <input
                                type="text"
                                className="form-control"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="postalCode" className="form-label">Postal Code</label>
                              <input
                                type="text"
                                className="form-control"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="profileImage" className="form-label">Update Profile Image</label>
                              <input
                                className="form-control"
                                type="file"
                                id="profileImage"
                                name="profileImage"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              <div className="form-text">Leave empty to keep current image. Accepted formats: JPG, PNG, GIF (Max 2MB)</div>
                              {previewImage && (
                                <div style={{ marginTop: '16px' }}>
                                  <img
                                    src={previewImage}
                                    alt="Profile Preview"
                                    style={{
                                      width: '120px',
                                      height: '120px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Action Buttons for Basic Information Tab - UPDATED TO FLEXBOX */}
                        <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                          <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                            <i className="bi bi-check-circle me-2"></i>
                            {loading ? 'Updating...' : 'Update Basic Information'}
                          </button>
                          <button type="button" className="btn btn-secondary flex-fill" onClick={handleCancel}>
                            <i className="bi bi-x-circle me-2"></i>Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Account Information Tab */}
                  {activeTab === 'account' && (
                    <div className="tab-pane fade show active" role="tabpanel">
                      <form onSubmit={(e) => handleSubmit(e, 'account')} className="needs-validation" noValidate>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
                          gap: '10px'
                        }}>
                          <div>
                            <div className="mb-4">
                              <label htmlFor="email" className="form-label">Email Address</label>
                              <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                              />
                              <div className="invalid-feedback">Please provide a valid email.</div>
                            </div>
                          </div>

                          {/* <div >
                            <div className="mb-4">
                              <label htmlFor="password" className="form-label">New Password</label>
                              <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                placeholder="Leave blank to keep current password"
                                value={formData.password}
                                onChange={handleInputChange}
                              />
                              <div className="form-text">Only fill if you want to change the password</div>
                            </div>
                          </div>
                          <div >
                            <div className="mb-4">
                              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                              <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm new password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                              />
                              <div className="invalid-feedback">Passwords must match.</div>
                            </div>
                          </div> */}
                          <div >
                            <div className="mb-4">
                              <label htmlFor="accountStatus" className="form-label">Account Status</label>
                              <select
                                className="form-select"
                                id="accountStatus"
                                name="accountStatus"
                                value={formData.accountStatus}
                                onChange={handleInputChange}
                              >
                                <option value="active">Active</option>
                                {/* <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option> */}
                              </select>
                            </div>
                          </div>
                          <div>
                            <div className="mb-4">
                              <label htmlFor="role" className="form-label">Role</label>
                              <select
                                className="form-select"
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                              >
                                <option value="student">Student</option>
                                {/* <option value="class_rep">Class Representative</option>
                                <option value="prefect">Prefect</option> */}
                              </select>
                            </div>
                          </div>
                          {/* <div className="col-12 px-2">
                            <div className="alert alert-info" role="alert">
                              <i className="bi bi-info-circle me-2"></i>
                              <strong>Last Login:</strong> {currentStudent?.last_login ? new Date(currentStudent.last_login).toLocaleString() : 'Never'} from IP {currentStudent?.last_login_ip || 'N/A'}
                            </div>
                          </div> */}
                        </div>
                        <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                          <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                            <i className="bi bi-check-circle me-2"></i>
                            {loading ? 'Updating...' : 'Update Account Information'}
                          </button>
                          <button type="button" className="btn btn-secondary flex-fill" onClick={() => setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))}>
                            <i className="bi bi-arrow-clockwise me-2"></i>Reset Password Fields
                          </button>
                        </div>
                      </form>
                    </div>
                  )}


                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Student removed from this page; use All Students or Student Details */}
    </div>
  );
};

export default EditStudent;
