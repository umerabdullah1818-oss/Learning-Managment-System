import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createStudent, fetchNextStudentId, clearError, resetSuccess } from '../../../redux/slices/studentSlice';
import { fetchDepartments } from '../../../redux/slices/departmentSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AddStudent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success, nextStudentId } = useSelector((state) => state.student);
  const { departments } = useSelector((state) => state.department);

  const [activeTab, setActiveTab] = useState('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    password: 'password123',
    confirmPassword: 'password123',
    accountStatus: 'active',
    role: 'student',
  });

  const [errors, setErrors] = useState({});

  // Fetch departments and next student ID on mount
  useEffect(() => {
    dispatch(fetchDepartments());
    // Fetch the next auto-generated student ID when component mounts
    dispatch(fetchNextStudentId());
  }, [dispatch]);

  // Set the auto-generated student ID when it's fetched
  useEffect(() => {
    if (nextStudentId) {
      setFormData(prev => ({ ...prev, studentId: nextStudentId }));
    }
  }, [nextStudentId]);

  useEffect(() => {
    if (success) {
      toast.success('Student created successfully!');
      navigate('/all-students');
      
      // Reset form
      setFormData({
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
        email: '',
        password: 'password123',
        confirmPassword: 'password123',
        accountStatus: 'active',
        role: 'student',
      });
      setActiveTab('basic');
      dispatch(resetSuccess());
    }

    if (error) {
        toast.error(error);
        dispatch(clearError()); 
    }
  }, [success, error, dispatch, navigate]); 

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'password') {
      setFormData(prev => ({ ...prev, confirmPassword: value }));
    }
    
    const fieldValue = files ? files[0] : value;
    validateField(name, fieldValue);
  };

  const validateField = (name, value) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];

      if (name === 'email') {
        if (value && !/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }

      if (name === 'phone' || name === 'parentPhone') {
        if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
          newErrors[name] = 'Please enter a valid phone number';
        }
      }

      if (name === 'profileImage') {
        const file = value;
        if (file && !file.type.startsWith('image/')) {
          newErrors.profileImage = 'Profile image must be an image file (jpg, png)';
        } else if (file && file.size > 2 * 1024 * 1024) {
          newErrors.profileImage = 'Profile image must be smaller than 2MB';
        }
      }

      if (name === 'password') {
        if (value && value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
      }

      if (name === 'confirmPassword') {
        if (value && value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }

      return newErrors;
    });
  };

  const validateTab = (tab) => {
    const newErrors = { ...errors }; 

    if (tab === 'basic') {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.profileImage) newErrors.profileImage = 'Profile image is required';
    } else if (tab === 'account') {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTabChange = (tab) => {
    if (validateTab(activeTab)) { 
      setActiveTab(tab);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      'fullName', 'studentId', 'department', 'dateOfBirth', 'gender', 'phone',
      'email', 'password', 'confirmPassword', 'profileImage'
    ];

    const newErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
        newErrors[field] = `${fieldLabel} is required`;
      }
    });

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
    }
    if (formData.profileImage && !formData.profileImage.type.startsWith('image/')) {
        newErrors.profileImage = 'Profile image must be an image file (jpg, png)';
    } else if (formData.profileImage && formData.profileImage.size > 2 * 1024 * 1024) {
        newErrors.profileImage = 'Profile image must be smaller than 2MB';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Focus on the tab with the first error
      const basicFields = ['fullName', 'studentId', 'department', 'dateOfBirth', 'gender', 'phone', 'profileImage'];
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key]);
      
      if (firstErrorField && basicFields.includes(firstErrorField)) {
        setActiveTab('basic');
      } else if (firstErrorField) {
        setActiveTab('account');
      }

      const fieldLabels = {
        fullName: 'Full Name', studentId: 'Student ID', department: 'Department', dateOfBirth: 'Date of Birth', gender: 'Gender', phone: 'Phone', profileImage: 'Profile Image', email: 'Email', password: 'Password', confirmPassword: 'Confirm Password',
      };
      const missingFields = Object.keys(newErrors).map(f => fieldLabels[f] || f);
      const message = `Please correct the following fields: ${missingFields.join(', ')}`;
      toast.error(message);
      return;
    }

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    try {
      await dispatch(createStudent(submitData)).unwrap();
      // Success is handled in useEffect
    } catch (error) {
      // Error is handled in useEffect
    }
  };

  const handleCancel = () => {
    navigate('/all-students');
  };
  
  // Custom style object for the responsive grid layout
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '12px'
  };

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="page-title">Add New Student</h4>
          <p className="text-muted">Fill in the information below to add a new student to the system</p>
        </div>
      </div>

      {/* Form Tabs */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {/* Tab Navigation (Bootstrap handles responsiveness here) */}
              <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => handleTabChange('basic')}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-person-circle me-2"></i>Basic Info
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => handleTabChange('account')}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-shield-lock me-2"></i>Account Info
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <form onSubmit={handleSubmit}>
                
                {/* Basic Information Tab - Mobile-first Grid */}
                {activeTab === 'basic' && (
                  <div style={gridStyle} className="g-3">
                    
                    {/* Full Name */}
                    <div className="mb-3">
                      <label htmlFor="fullName" className="form-label">Full Name <span className="text-danger">*</span></label>
                      <input type="text" className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                        id="fullName" name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleInputChange} required />
                      {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                    </div>

                    {/* Student ID - Auto-Generated, Disabled */}
                    <div className="mb-3">
                      <label htmlFor="studentId" className="form-label">Student ID <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.studentId ? 'is-invalid' : ''}`}
                        id="studentId" 
                        name="studentId" 
                        placeholder="Auto-generated" 
                        value={formData.studentId} 
                        onChange={handleInputChange} 
                        disabled
                        required 
                      />
                      <div className="form-text">Auto-generated sequential ID (e.g., STU00001)</div>
                      {errors.studentId && <div className="invalid-feedback">{errors.studentId}</div>}
                    </div>

                    {/* Department */}
                    <div className="mb-3">
                      <label htmlFor="department" className="form-label">Department <span className="text-danger">*</span></label>
                      <select className={`form-select ${errors.department ? 'is-invalid' : ''}`} id="department" name="department" value={formData.department} onChange={handleInputChange} required>
                        <option value="">Select Department</option>
                        {departments.map(dept => <option key={dept.id} value={dept.departmentName}>{dept.departmentName}</option>)}
                      </select>
                      {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                    </div>

                    {/* Date of Birth */}
                    <div className="mb-3">
                      <label htmlFor="dateOfBirth" className="form-label">Date of Birth <span className="text-danger">*</span></label>
                      <input type="date" className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required />
                      {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth}</div>}
                    </div>

                    {/* Gender */}
                    <div className="mb-3">
                      <label htmlFor="gender" className="form-label">Gender <span className="text-danger">*</span></label>
                      <select className={`form-select ${errors.gender ? 'is-invalid' : ''}`} id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                    </div>

                    {/* Phone */}
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                      <input type="tel" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} id="phone" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleInputChange} required />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>

                    {/* Parent Phone */}
                    <div className="mb-3">
                      <label htmlFor="parentPhone" className="form-label">Parent/Guardian Phone</label>
                      <input type="tel" className={`form-control ${errors.parentPhone ? 'is-invalid' : ''}`} id="parentPhone" name="parentPhone" placeholder="Enter parent phone" value={formData.parentPhone} onChange={handleInputChange} />
                      {errors.parentPhone && <div className="invalid-feedback">{errors.parentPhone}</div>}
                    </div>

                    {/* Address - Full Width */}
                    <div className="mb-3" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="address" className="form-label">Address</label>
                      <textarea className="form-control" id="address" name="address" rows="3" placeholder="Enter address" value={formData.address} onChange={handleInputChange}></textarea>
                    </div>

                    {/* City */}
                    <div className="mb-3">
                      <label htmlFor="city" className="form-label">City</label>
                      <input type="text" className="form-control" id="city" name="city" placeholder="Enter city" value={formData.city} onChange={handleInputChange} />
                    </div>

                    {/* State */}
                    <div className="mb-3">
                      <label htmlFor="state" className="form-label">State/Province</label>
                      <input type="text" className="form-control" id="state" name="state" placeholder="Enter state" value={formData.state} onChange={handleInputChange} />
                    </div>

                    {/* Postal Code */}
                    <div className="mb-3">
                      <label htmlFor="postalCode" className="form-label">Postal Code</label>
                      <input type="text" className="form-control" id="postalCode" name="postalCode" placeholder="Enter postal code" value={formData.postalCode} onChange={handleInputChange} />
                    </div>

                    {/* Profile Image - Full Width */}
                    <div className="mb-3" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="profileImage" className="form-label">Profile Image <span className="text-danger">*</span></label>
                      <input className={`form-control ${errors.profileImage ? 'is-invalid' : ''}`} type="file" id="profileImage" name="profileImage" accept="image/*" onChange={handleInputChange} required aria-required="true" />
                      <div className="form-text">Accepted formats: JPG, PNG, GIF (Max 2MB)</div>
                      {errors.profileImage && <div className="invalid-feedback">{errors.profileImage}</div>}
                      {formData.profileImage && (
                        <div className="mt-3">
                          <img
                            src={formData.profileImage instanceof File ? URL.createObjectURL(formData.profileImage) : ''}
                            alt="Profile Preview"
                            style={{
                              width: '120px',
                              height: '120px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '3px solid #007bff',
                              display: 'block'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- */}

                {/* Account Information Tab - Mobile-first Grid */}
                {activeTab === 'account' && (
                  <div style={gridStyle} className="g-3">
                    {/* Email Address */}
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          id="password"
                          name="password"
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          disabled
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>
                      {/* Note: Added d-block to invalid-feedback for group-input layout */}
                      {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>} 
                      <div className="form-text">Default password is <strong>password123</strong></div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          id="confirmPassword"
                          name="confirmPassword"
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          disabled
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex="-1"
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>
                      {/* Note: Added d-block to invalid-feedback for group-input layout */}
                      {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                      <div className="form-text">Default password is <strong>password123</strong></div>
                    </div>

                    {/* Account Status */}
                    <div className="mb-3">
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

                    {/* Role */}
                    <div className="mb-3">
                      <label htmlFor="role" className="form-label">Role</label>
                      <select
                        className="form-select"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        disabled
                      >
                        <option value="student">Student</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* --- */}

                {/* Action Buttons - Fully Responsive Mobile-First Stack */}
                <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                  {activeTab === 'account' ? (
                    <>
                      <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                        <i className="bi bi-check-circle me-2"></i>
                        {loading ? 'Creating...' : 'Complete Registration'}
                      </button>

                      <button type="button" className="btn btn-success flex-fill" onClick={handleSubmit} disabled={loading}>
                        <i className="bi bi-check-all me-2"></i>
                        Save All Information
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-primary flex-fill" onClick={() => handleTabChange('account')} disabled={Object.keys(errors).length > 0}>
                      <i className="bi bi-arrow-right me-2"></i>Next
                    </button>
                  )}

                  <button type="button" className="btn btn-secondary flex-fill" onClick={handleCancel}>
                    <i className="bi bi-x-circle me-2"></i>Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;