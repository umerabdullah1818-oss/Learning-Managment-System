import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfessorById, updateProfessor, clearError, clearSuccess } from '../../../redux/slices/professorSlice';
import { fetchDepartments } from '../../../redux/slices/departmentSlice';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import '../../../css/dashboard.css';

const EditProfessor = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProfessor, loading, error, success } = useSelector((state) => state.professor);
  const { departments } = useSelector((state) => state.department);

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
    accountStatus: '',
    officeHours: '',
    highestDegree: '',
    specialization: '',
    university: '',
    graduationYear: '',
    experience: '',
    office: '',
    subjects: '',
    bio: '',
    researchInterests: '',
    publications: '',
    profilePhoto: null
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProfessorById(id));
    }
    dispatch(fetchDepartments());
  }, [id, dispatch]);

  useEffect(() => {
    if (currentProfessor) {
      setFormData({
        title: currentProfessor.title || '',
        firstName: currentProfessor.first_name || '',
        lastName: currentProfessor.last_name || '',
        email: currentProfessor.email || '',
        phone: currentProfessor.phone || '',
        dateOfBirth: currentProfessor.date_of_birth ? currentProfessor.date_of_birth.split('T')[0] : '',
        gender: currentProfessor.gender || '',
        address: currentProfessor.address || '',
        employeeId: currentProfessor.employee_id || '',
        department: currentProfessor.department || '',
        position: currentProfessor.position || '',
        employmentType: currentProfessor.employment_type || '',
        joiningDate: currentProfessor.joining_date ? currentProfessor.joining_date.split('T')[0] : '',
        salary: currentProfessor.salary || '',
        accountStatus: currentProfessor.account_status || '',
        officeHours: currentProfessor.office_hours || '',
        highestDegree: currentProfessor.highest_degree || '',
        specialization: currentProfessor.specialization || '',
        university: currentProfessor.university || '',
        graduationYear: currentProfessor.graduation_year || '',
        experience: currentProfessor.experience || '',
        office: currentProfessor.office || '',
        subjects: currentProfessor.subjects || '',
        bio: currentProfessor.bio || '',
        researchInterests: '', // Not in model, placeholder
        publications: '', // Not in model, placeholder
        profilePhoto: null
      });
      if (currentProfessor.profile_image) {
        setPreviewImage(`${API_BASE_URL}/images/${currentProfessor.profile_image}`);
      }
    }
  }, [currentProfessor]);

  useEffect(() => {
    if (success) {
      toast.success('Professor updated successfully!');
      dispatch(clearSuccess());
      navigate('/all-professors');
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'title', 'firstName', 'lastName', 'email', 'phone',
      'employeeId', 'department', 'position', 'employmentType',
      'joiningDate', 'highestDegree'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.graduationYear && (formData.graduationYear < 1950 || formData.graduationYear > new Date().getFullYear())) {
      newErrors.graduationYear = 'Please enter a valid graduation year';
    }

    if (formData.experience && (formData.experience < 0 || formData.experience > 50)) {
      newErrors.experience = 'Please enter valid years of experience (0-50)';
    }

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

    dispatch(clearError());
    dispatch(clearSuccess());

    const submitData = new FormData();

    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    try {
      await dispatch(updateProfessor({ id, professorData: submitData })).unwrap();
    } catch (error) {
      // Error handled by slice
    }
  };

  const handleCancel = () => {
    navigate('/all-professors');
  };

  const handleViewProfile = () => {
    navigate(`/professors/${id}`);
  };

  if (loading && !currentProfessor) {
    return (
      <div className="container-fluid">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProfessor) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">Professor not found.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 font-bold">Edit Professor</h1>
            <p className="text-muted text-sm">Update faculty member information.</p>
          </div>
          <div className="d-flex gap-2">
            {/* <a href="professor-profile.html" className="btn btn-outline-primary">
              <i className="bi bi-eye me-2"></i>View Profile
            </a> */}
            <a href="/all-professors" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>Back to Professors
            </a>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Professor updated successfully!
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

      {/* Edit Professor Form */}
      <div className="dashboard-row">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="d-flex align-items-center">
              <img
                src={previewImage || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=0d6efd&color=fff`}
                alt={`${formData.title} ${formData.firstName} ${formData.lastName}`}
                className="rounded-circle me-3"
                style={{ width: '48px', height: '48px' }}
                loading="lazy"
              />
              <div>
                <h5 className="dashboard-card-title mb-0">{formData.title} {formData.firstName} {formData.lastName}</h5>
                <small className="text-muted">Employee ID: {formData.employeeId} • {formData.department}</small>
              </div>
            </div>
          </div>
          <div className="dashboard-card-body">
            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
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
                  >
                    <option value="">Choose Department...</option>
                    {departments && departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.departmentName}>
                          {dept.departmentName}
                        </option>
                      ))
                    ) : (
                      <option disabled>No departments available</option>
                    )}
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

              <div className="dashboard-grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label htmlFor="accountStatus" className="form-label">Employment Status</label>
                  <select
                    className="form-select"
                    id="accountStatus"
                    name="accountStatus"
                    value={formData.accountStatus}
                    onChange={handleInputChange}
                  >
                    <option value="">Choose Status...</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="sabbatical">Sabbatical</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="officeHours" className="form-label">Office Hours</label>
                  <input
                    type="text"
                    className="form-control"
                    id="officeHours"
                    name="officeHours"
                    placeholder="e.g., Mon-Wed 2-4 PM, Fri 10-12 PM"
                    value={formData.officeHours}
                    onChange={handleInputChange}
                  />
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
                    className="form-control"
                    id="profilePhoto"
                    name="profilePhoto"
                    required
                    aria-required="true"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="form-text">Upload a professional headshot (JPG, PNG, max 2MB)</div>
                  {previewImage && (
                    <div className="mt-2">
                      <img
                        src={previewImage}
                        alt="Profile Preview"
                        className="img-thumbnail"
                        style={{ maxWidth: '150px', maxHeight: '150px' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="row">
                <div className="col-12">
                  <hr className="my-4" />
                  <div className="d-flex gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>Update Professor
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
                    {/* <button
                      type="button"
                      className="btn btn-outline-info"
                      onClick={handleViewProfile}
                      disabled={loading}
                    >
                      <i className="bi bi-eye me-2"></i>View Profile
                    </button> */}
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

export default EditProfessor;
