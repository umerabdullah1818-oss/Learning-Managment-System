import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addProfessor, fetchNextEmployeeId, clearError, clearSuccess } from '../../../redux/slices/professorSlice';
import { fetchDepartments } from '../../../redux/slices/departmentSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../../css/dashboard.css';
import '../../../css/dashboard-layout.css'

const AddProfessor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success, nextEmployeeId } = useSelector((state) => state.professor);
  const { departments, loading: departmentsLoading, error: departmentsError } = useSelector((state) => state.department);

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    employeeId: '',
    department: '',
    position: '',
    employmentType: '',
    joiningDate: '',
    salary: '',
    highestDegree: '',
    specialization: '',
    university: '',
    graduationYear: '',
    experience: '',
    office: '',
    subjects: '',
    bio: '',
    username: '',
    password: 'password123',
    profilePhoto: null
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (success) {
      toast.success('Professor added successfully!');
      dispatch(clearSuccess());
      navigate('/all-professors');
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  // Fetch departments and next employee ID on component mount
  useEffect(() => {
    dispatch(fetchDepartments());
    // Fetch the next auto-generated employee ID when component mounts
    dispatch(fetchNextEmployeeId());
  }, [dispatch]);

  // Set the auto-generated employee ID when it's fetched
  useEffect(() => {
    if (nextEmployeeId) {
      setFormData(prev => ({ ...prev, employeeId: nextEmployeeId }));
    }
  }, [nextEmployeeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Run runtime validation for this field
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Validate profile photo on change (file size/type)
  useEffect(() => {
    if (formData.profilePhoto) {
      const file = formData.profilePhoto;
      setErrors(prev => {
        const newErrors = { ...prev };
        // basic image type check
        if (!file.type.startsWith('image/')) {
          newErrors.profilePhoto = 'Profile photo must be an image file (jpg, png)';
        } else if (file.size > 2 * 1024 * 1024) {
          newErrors.profilePhoto = 'Profile photo must be smaller than 2MB';
        } else {
          delete newErrors.profilePhoto;
        }
        return newErrors;
      });
    } else {
      // if cleared, set required error later by validateForm
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profilePhoto;
        return newErrors;
      });
    }
  }, [formData.profilePhoto]);

  // Validate individual field at runtime
  const validateField = (name, value) => {
    setErrors(prev => {
      const newErrors = { ...prev };

      // remove previous error for field by default
      delete newErrors[name];

      if (name === 'email') {
        if (value && !/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }

      if (name === 'phone') {
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          newErrors.phone = 'Please enter a valid phone number';
        }
      }

      if (name === 'graduationYear') {
        const year = Number(value);
        if (value && (year < 1950 || year > new Date().getFullYear())) {
          newErrors.graduationYear = 'Please enter a valid graduation year';
        }
      }

      if (name === 'experience') {
        const exp = Number(value);
        if (value !== '' && (isNaN(exp) || exp < 0 || exp > 50)) {
          newErrors.experience = 'Please enter valid years of experience (0-50)';
        }
      }

      if (name === 'salary') {
        const sal = Number(value);
        if (value !== '' && (isNaN(sal) || sal < 0 || sal > 1000000)) {
          newErrors.salary = 'Please enter a valid salary amount';
        }
      }

      if (name === 'username') {
        if (value && value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        }
      }

      if (name === 'password') {
        if (value && value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
      }

      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = [
      'title', 'firstName', 'lastName', 'email', 'phone',
      'employeeId', 'department', 'position', 'employmentType',
      'joiningDate', 'highestDegree', 'username', 'password'
    ];

    // profilePhoto is required
    requiredFields.push('profilePhoto');

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Graduation year validation
    if (formData.graduationYear && (formData.graduationYear < 1950 || formData.graduationYear > new Date().getFullYear())) {
      newErrors.graduationYear = 'Please enter a valid graduation year';
    }

    // Experience validation
    if (formData.experience && (formData.experience < 0 || formData.experience > 50)) {
      newErrors.experience = 'Please enter valid years of experience (0-50)';
    }

    // Salary validation
    if (formData.salary && (formData.salary < 0 || formData.salary > 1000000)) {
      newErrors.salary = 'Please enter a valid salary amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear previous messages
    dispatch(clearError());
    dispatch(clearSuccess());

    // Prepare data for submission
    const submitData = new FormData();

    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    try {
      await dispatch(addProfessor(submitData)).unwrap();
      // Reset form on success
      setFormData({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        employeeId: '',
        department: '',
        position: '',
        employmentType: '',
        joiningDate: '',
        salary: '',
        highestDegree: '',
        specialization: '',
        university: '',
        graduationYear: '',
        experience: '',
        office: '',
        subjects: '',
        bio: '',
        username: '',
        password: 'password123',
        profilePhoto: null
      });
      setPreviewImage(null);
      setErrors({});
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleCancel = () => {
    navigate('/all-professors');
  };

  const handleReset = () => {
    setFormData({
      title: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      employeeId: '',
      department: '',
      position: '',
      employmentType: '',
      joiningDate: '',
      salary: '',
      highestDegree: '',
      specialization: '',
      university: '',
      graduationYear: '',
      experience: '',
      office: '',
      subjects: '',
      bio: '',
      username: '',
      password: 'password123',
      profilePhoto: null
    });
    setPreviewImage(null);
    setErrors({});
    dispatch(clearError());
    dispatch(clearSuccess());
  };

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 font-bold">Add New Professor</h1>
            <p className="text-muted text-sm">Register a new faculty member to your institution.</p>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/all-professors')}
            >
              <i className="bi bi-arrow-left me-2"></i>Back to Professors
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Professor added successfully!
          <button type="button" className="btn-close" onClick={() => dispatch(clearSuccess())}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => dispatch(clearError())}></button>
        </div>
      )}

      {/* Add Professor Form */}
      <div className="dashboard-row">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h5 className="dashboard-card-title mb-0">Professor Registration</h5>
          </div>
          <div className="dashboard-card-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* Personal Information Section */}
              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <h6 className="text-primary fw-semibold mb-3">
                    <i className="bi bi-person-circle me-2"></i>Personal Information
                  </h6>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-12 gap-3 mb-3">
                <div className="col-span-2">
                  <label htmlFor="title" className="form-label">Title <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.title ? 'is-invalid' : ''}`}
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose...</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                  </select>
                  {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>
                <div className="col-span-5">
                  <label htmlFor="firstName" className="form-label">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                </div>
                <div className="col-span-5">
                  <label htmlFor="lastName" className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="email" className="form-label">Email Address <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div>
                  <label htmlFor="phone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="form-label">Gender</label>
                  <select
                    className="form-select"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Choose...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <label htmlFor="address" className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    id="address"
                    name="address"
                    rows="2"
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <h6 className="text-primary fw-semibold mb-3">
                    <i className="bi bi-mortarboard me-2"></i>Academic Information
                  </h6>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="employeeId" className="form-label">Employee ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.employeeId ? 'is-invalid' : ''}`}
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    placeholder="Auto-generated"
                    disabled
                    required
                  />
                  <div className="form-text">Auto-generated sequential ID (e.g., EMP00001)</div>
                  {errors.employeeId && <div className="invalid-feedback">{errors.employeeId}</div>}
                </div>
                <div>
                  <label htmlFor="department" className="form-label">Department <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    disabled={departmentsLoading}
                  >
                    <option value="">
                      {departmentsLoading ? 'Loading departments...' : 'Choose Department...'}
                    </option>
                    {departments && departments.map((dept) => (
                      <option key={dept.id} value={dept.departmentName}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                  {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="position" className="form-label">Position <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.position ? 'is-invalid' : ''}`}
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose Position...</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Visiting Professor">Visiting Professor</option>
                  </select>
                  {errors.position && <div className="invalid-feedback">{errors.position}</div>}
                </div>
                <div>
                  <label htmlFor="employmentType" className="form-label">Employment Type <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.employmentType ? 'is-invalid' : ''}`}
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose Type...</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Adjunct">Adjunct</option>
                  </select>
                  {errors.employmentType && <div className="invalid-feedback">{errors.employmentType}</div>}
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="joiningDate" className="form-label">Joining Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className={`form-control ${errors.joiningDate ? 'is-invalid' : ''}`}
                    id="joiningDate"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.joiningDate && <div className="invalid-feedback">{errors.joiningDate}</div>}
                </div>
                <div>
                  <label htmlFor="salary" className="form-label">Monthly Salary</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                      id="salary"
                      name="salary"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.salary}
                      onChange={handleInputChange}
                    />
                    {errors.salary && <div className="invalid-feedback">{errors.salary}</div>}
                  </div>
                </div>
              </div>

              {/* Educational Background */}
              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <h6 className="text-primary fw-semibold mb-3">
                    <i className="bi bi-book me-2"></i>Educational Background
                  </h6>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="highestDegree" className="form-label">Highest Degree <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.highestDegree ? 'is-invalid' : ''}`}
                    id="highestDegree"
                    name="highestDegree"
                    value={formData.highestDegree}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose Degree...</option>
                    <option value="PhD">PhD</option>
                    <option value="Master's">Master's</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.highestDegree && <div className="invalid-feedback">{errors.highestDegree}</div>}
                </div>
                <div>
                  <label htmlFor="specialization" className="form-label">Specialization/Field</label>
                  <input
                    type="text"
                    className="form-control"
                    id="specialization"
                    name="specialization"
                    placeholder="e.g., Machine Learning"
                    value={formData.specialization}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="university" className="form-label">University/Institution</label>
                  <input
                    type="text"
                    className="form-control"
                    id="university"
                    name="university"
                    placeholder="Name of university"
                    value={formData.university}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="graduationYear" className="form-label">Graduation Year</label>
                  <input
                    type="number"
                    className={`form-control ${errors.graduationYear ? 'is-invalid' : ''}`}
                    id="graduationYear"
                    name="graduationYear"
                    min="1950"
                    max={new Date().getFullYear()}
                    placeholder="YYYY"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                  />
                  {errors.graduationYear && <div className="invalid-feedback">{errors.graduationYear}</div>}
                </div>
              </div>

              {/* Additional Information */}
              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <h6 className="text-primary fw-semibold mb-3">
                    <i className="bi bi-info-circle me-2"></i>Additional Information
                  </h6>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="experience" className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className={`form-control ${errors.experience ? 'is-invalid' : ''}`}
                    id="experience"
                    name="experience"
                    min="0"
                    placeholder="Years"
                    value={formData.experience}
                    onChange={handleInputChange}
                  />
                  {errors.experience && <div className="invalid-feedback">{errors.experience}</div>}
                </div>
                <div>
                  <label htmlFor="office" className="form-label">Office Location</label>
                  <input
                    type="text"
                    className="form-control"
                    id="office"
                    name="office"
                    placeholder="e.g., Room 301, Building A"
                    value={formData.office}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div className="col-12">
                  <label htmlFor="subjects" className="form-label">Subjects to Teach</label>
                  <input
                    type="text"
                    className="form-control"
                    id="subjects"
                    name="subjects"
                    placeholder="e.g., Data Structures, Algorithms, Machine Learning"
                    value={formData.subjects}
                    onChange={handleInputChange}
                  />
                  <div className="form-text">Separate multiple subjects with commas</div>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div className="col-12">
                  <label htmlFor="bio" className="form-label">Biography/About</label>
                  <textarea
                    className="form-control"
                    id="bio"
                    name="bio"
                    rows="3"
                    placeholder="Brief description about the professor's background and expertise"
                    value={formData.bio}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>

              {/* Profile Photo */}
              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <label htmlFor="profilePhoto" className="form-label">Profile Photo <span className="text-danger">*</span></label>
                  <input
                    type="file"
                    className={`form-control ${errors.profilePhoto ? 'is-invalid' : ''}`}
                    id="profilePhoto"
                    name="profilePhoto"
                    accept="image/*"
                    required
                    aria-required="true"
                    onChange={(e) => {
                      handleFileChange(e);
                      // validate immediately
                      const file = e.target.files[0];
                      if (!file) {
                        setErrors(prev => ({ ...prev, profilePhoto: 'Profile photo is required' }));
                      }
                    }}
                  />
                  <div className="form-text">Upload a professional headshot (JPG, PNG, max 2MB)</div>
                  {errors.profilePhoto && <div className="invalid-feedback">{errors.profilePhoto}</div>}
                  {previewImage && (
                    <div className="mt-3">
                      <img
                        src={previewImage}
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

              {/* Login Credentials */}
              <div className="dashboard-grid grid-cols-1 mb-4">
                <div>
                  <h6 className="text-primary fw-semibold mb-3">
                    <i className="bi bi-shield-lock me-2"></i>Login Credentials
                  </h6>
                </div>
              </div>

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="username" className="form-label">Username <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                </div>
                <div>
                  <label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      aria-describedby="togglePassword"
                      disabled
                    />
                    <button
                      type="button"
                      id="togglePassword"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(prev => !prev)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                  <div className="form-text">Default password is <strong>password123</strong></div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="row mt-4">
                <div className="col-12">
                  <hr className="my-4" />
                  {/* ADDED flex-wrap CLASS HERE */}
                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>Save Professor
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-fill"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <i className="bi bi-x-lg me-2"></i>Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning flex-fill"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>Reset Form
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProfessor;
