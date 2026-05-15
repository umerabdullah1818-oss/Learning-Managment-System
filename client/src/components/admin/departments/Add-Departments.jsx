import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, clearError, resetSuccess } from '../../../redux/slices/departmentSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../../css/dashboard-layout.css';
import '../../../css/dashboard.css';

const AddDepartments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state) => state.department);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    establishedYear: '',
    departmentStatus: '',
    description: '',
    headName: '',
    headTitle: 'Professor',
    headEmail: '',
    headPhone: '',
    officeLocation: '',
    appointmentDate: '',
    currentStudents: 0,
    maxCapacity: '',
    facultyCount: 0,
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (success) {
      toast.success('Department created successfully!');
      // Reset form
      setFormData({
        departmentName: '',
        departmentCode: '',
        establishedYear: '',
        departmentStatus: '',
        description: '',
        headName: '',
        headTitle: 'Professor',
        headEmail: '',
        headPhone: '',
        officeLocation: '',
        appointmentDate: '',
        currentStudents: 0,
        maxCapacity: '',
        facultyCount: 0,
        annualBudget: '',
        budgetYear: '2025',
      });
      dispatch(resetSuccess());
      navigate('/departments');
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'departmentCode') {
      // Auto-uppercase department code
      const upperValue = value.toUpperCase().replace(/[^A-Z]/g, '');
      setFormData(prev => ({ ...prev, [name]: upperValue }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const applyTemplate = () => {
    const templates = {
      engineering: {
        name: 'Computer Science',
        code: 'CS',
        head: 'Dr. John Smith',
        email: 'john.smith@kiaalap.edu',
        maxCapacity: 2000,
        description: 'The Computer Science department focuses on software engineering, artificial intelligence, cybersecurity, and computer systems.'
      },
      business: {
        name: 'Business Administration',
        code: 'BBA',
        head: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@kiaalap.edu',
        maxCapacity: 1500,
        description: 'The Business Administration department offers comprehensive programs in management, finance, marketing, and entrepreneurship.'
      },
      science: {
        name: 'Biology',
        code: 'BIO',
        head: 'Dr. Michael Brown',
        email: 'michael.brown@kiaalap.edu',
        maxCapacity: 800,
        description: 'The Biology department provides cutting-edge education in life sciences, biotechnology, and medical research.'
      },
      'liberal-arts': {
        name: 'English Literature',
        code: 'ENG',
        head: 'Dr. Emma Davis',
        email: 'emma.davis@kiaalap.edu',
        maxCapacity: 600,
        description: 'The English Literature department offers comprehensive studies in literature, creative writing, and linguistic analysis.'
      }
    };

    const template = templates[selectedTemplate];
    if (template) {
      setFormData(prev => ({
        ...prev,
        departmentName: template.name,
        departmentCode: template.code,
        headName: template.head,
        headEmail: template.email,
        maxCapacity: template.maxCapacity,
        description: template.description,
        departmentStatus: 'active'
      }));
    }
  };

  const generatePreview = () => {
    setShowPreview(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.departmentName || !formData.departmentCode || !formData.headName || !formData.headEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    dispatch(createDepartment(formData));
  };

  const saveDraft = () => {
    localStorage.setItem('departmentDraft', JSON.stringify(formData));
    toast.success('Draft saved successfully!');
  };

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('departmentDraft');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
  }, []);

  // Calculate progress
  const getProgress = () => {
    const requiredFields = ['departmentName', 'departmentCode', 'headName', 'headEmail', 'departmentStatus'];
    const filledFields = requiredFields.filter(field => formData[field]).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const progress = getProgress();
  const progressStep = progress < 50 ? 'Step 1 of 2' : 'Step 2 of 2';

  return (
    <>
      {/* Page Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 font-bold">Add New Department</h1>
            <p className="text-muted text-sm">Create a new academic department with comprehensive information and settings.</p>
          </div>
          <div className="d-flex gap-2">
            <a href="/departments" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>Back to Departments
            </a>
          </div>
        </div>
      </div>

      {/* Form Progress */}
      <div className="dashboard-row">
        <div className="dashboard-card mb-4">
          <div className="dashboard-card-body py-3">
            <div className="progress-header d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Form Progress</h6>
              <span className="badge bg-primary progress-badge">{progressStep}</span>
            </div>
            <div className="progress" style={{height: '8px'}}>
              <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                   role="progressbar" style={{width: `${progress}%`}}
                   aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Department Form */}
      <form id="addDepartmentForm" className="needs-validation" noValidate onSubmit={handleSubmit}>
        {/* Department Information */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="d-flex align-items-center">
                <div className="form-step-icon bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                  <i className="bi bi-building text-primary"></i>
                </div>
                <div>
                  <h5 className="mb-0">Department Information</h5>
                  <p className="text-muted small mb-0">Basic department details and identification</p>
                </div>
              </div>
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="departmentName" className="form-label">Department Name *</label>
                  <input type="text"
                         className="form-control"
                         id="departmentName"
                         name="departmentName"
                         placeholder="e.g., Computer Science"
                         value={formData.departmentName}
                         onChange={handleInputChange}
                         required />
                  <div className="invalid-feedback">
                    Please provide a valid department name.
                  </div>
                </div>
                <div>
                  <label htmlFor="departmentCode" className="form-label">Department Code *</label>
                  <input type="text"
                         className="form-control"
                         id="departmentCode"
                         name="departmentCode"
                         placeholder="e.g., CS"
                         pattern="[A-Z]{2,5}"
                         maxLength="5"
                         style={{textTransform: 'uppercase'}}
                         value={formData.departmentCode}
                         onChange={handleInputChange}
                         required />
                  <div className="form-text">2-5 uppercase letters (e.g., CS, MECH, BBA)</div>
                  <div className="invalid-feedback">
                    Please provide a valid department code (2-5 uppercase letters).
                  </div>
                </div>
                <div>
                  <label htmlFor="establishedYear" className="form-label">Established Year</label>
                  <input type="number"
                         className="form-control"
                         id="establishedYear"
                         name="establishedYear"
                         min="1900"
                         max="2025"
                         placeholder="e.g., 1995"
                         value={formData.establishedYear}
                         onChange={handleInputChange} />
                  <div className="invalid-feedback">
                    Please provide a valid year between 1900 and 2025.
                  </div>
                </div>
                <div>
                  <label htmlFor="departmentStatus" className="form-label">Status *</label>
                  <select className="form-select" id="departmentStatus" name="departmentStatus" value={formData.departmentStatus} onChange={handleInputChange} required>
                    <option value="">Choose status...</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning Phase</option>
                    <option value="paused">Temporarily Paused</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <div className="invalid-feedback">
                    Please select a department status.
                  </div>
                </div>
                <div className="col-12">
                  <label htmlFor="description" className="form-label">Department Description</label>
                  <textarea className="form-control"
                            id="description"
                            name="description"
                            rows="4"
                            placeholder="Provide a comprehensive description of the department, its mission, and objectives..."
                            value={formData.description}
                            onChange={handleInputChange}></textarea>
                  <div className="form-text">Optional: Describe the department's mission, vision, and primary objectives.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Head Information */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="d-flex align-items-center">
                <div className="form-step-icon bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                  <i className="bi bi-person-badge text-success"></i>
                </div>
                <div>
                  <h5 className="mb-0">Department Head Information</h5>
                  <p className="text-muted small mb-0">Contact and leadership details</p>
                </div>
              </div>
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="headName" className="form-label">Department Head Name *</label>
                  <input type="text"
                         className="form-control"
                         id="headName"
                         name="headName"
                         placeholder="e.g., Dr. John Smith"
                         value={formData.headName}
                         onChange={handleInputChange}
                         required />
                  <div className="invalid-feedback">
                    Please provide the department head's name.
                  </div>
                </div>
                <div>
                  <label htmlFor="headTitle" className="form-label">Title/Position</label>
                  <input type="text"
                         className="form-control"
                         id="headTitle"
                         name="headTitle"
                         placeholder="e.g., Professor, Associate Professor"
                         value={formData.headTitle}
                         onChange={handleInputChange} />
                </div>
                <div>
                  <label htmlFor="headEmail" className="form-label">Email Address *</label>
                  <input type="email"
                         className="form-control"
                         id="headEmail"
                         name="headEmail"
                         placeholder="john.smith@kiaalap.edu"
                         value={formData.headEmail}
                         onChange={handleInputChange}
                         required />
                  <div className="invalid-feedback">
                    Please provide a valid email address.
                  </div>
                </div>
                <div>
                  <label htmlFor="headPhone" className="form-label">Phone Number</label>
                  <input type="tel"
                         className="form-control"
                         id="headPhone"
                         name="headPhone"
                         placeholder="+1-555-0123"
                         pattern="[\+]?[0-9\-\s\(\)]+"
                         maxLength="20"
                         value={formData.headPhone}
                         onChange={handleInputChange} />
                  <div className="invalid-feedback">
                    Please provide a valid phone number.
                  </div>
                </div>
                <div>
                  <label htmlFor="officeLocation" className="form-label">Office Location</label>
                  <input type="text"
                         className="form-control"
                         id="officeLocation"
                         name="officeLocation"
                         placeholder="e.g., Building A, Room 301"
                         value={formData.officeLocation}
                         onChange={handleInputChange} />
                </div>
                <div>
                  <label htmlFor="appointmentDate" className="form-label">Appointment Date</label>
                  <input type="date"
                         className="form-control"
                         id="appointmentDate"
                         name="appointmentDate"
                         value={formData.appointmentDate}
                         onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Metrics & Budget */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="d-flex align-items-center">
                <div className="form-step-icon bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                  <i className="bi bi-graph-up text-info"></i>
                </div>
                <div>
                  <h5 className="mb-0">Department Metrics & Budget</h5>
                  <p className="text-muted small mb-0">Financial and enrollment information</p>
                </div>
              </div>
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="currentStudents" className="form-label">Current Students</label>
                  <input type="number"
                         className="form-control"
                         id="currentStudents"
                         name="currentStudents"
                         min="0"
                         placeholder="0"
                         value={formData.currentStudents}
                         onChange={handleInputChange} />
                </div>
                <div>
                  <label htmlFor="maxCapacity" className="form-label">Maximum Capacity</label>
                  <input type="number"
                         className="form-control"
                         id="maxCapacity"
                         name="maxCapacity"
                         min="1"
                         placeholder="e.g., 2000"
                         value={formData.maxCapacity}
                         onChange={handleInputChange} />
                </div>
                <div>
                  <label htmlFor="facultyCount" className="form-label">Faculty Members</label>
                  <input type="number"
                         className="form-control"
                         id="facultyCount"
                         name="facultyCount"
                         min="0"
                         placeholder="0"
                         value={formData.facultyCount}
                         onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="dashboard-card-body">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <div className="form-text">
                  <i className="bi bi-info-circle me-1"></i>
                  Fields marked with * are required. You can edit all information later.
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={saveDraft}>
                    <i className="bi bi-file-earmark me-2"></i>Save as Draft
                  </button>
                  <button type="button" className="btn btn-outline-info" onClick={generatePreview}>
                    <i className="bi bi-eye me-2"></i>Preview
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <i className="bi bi-check-circle me-2"></i>{loading ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Template Modal */}
      <div className="modal fade" id="templateModal" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Choose Department Template</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className={`template-card card h-100 ${selectedTemplate === 'engineering' ? 'border-primary' : ''}`} onClick={() => handleTemplateSelect('engineering')}>
                    <div className="card-body text-center">
                      <i className="bi bi-cpu text-primary" style={{fontSize: '2rem'}}></i>
                      <h6 className="mt-2">Computer Science</h6>
                      <p className="text-muted small">Technical department template</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className={`template-card card h-100 ${selectedTemplate === 'business' ? 'border-primary' : ''}`} onClick={() => handleTemplateSelect('business')}>
                    <div className="card-body text-center">
                      <i className="bi bi-graph-up text-success" style={{fontSize: '2rem'}}></i>
                      <h6 className="mt-2">Business Administration</h6>
                      <p className="text-muted small">Business department template</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className={`template-card card h-100 ${selectedTemplate === 'science' ? 'border-primary' : ''}`} onClick={() => handleTemplateSelect('science')}>
                    <div className="card-body text-center">
                      <i className="bi bi-flask text-info" style={{fontSize: '2rem'}}></i>
                      <h6 className="mt-2">Biology</h6>
                      <p className="text-muted small">Science department template</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className={`template-card card h-100 ${selectedTemplate === 'liberal-arts' ? 'border-primary' : ''}`} onClick={() => handleTemplateSelect('liberal-arts')}>
                    <div className="card-body text-center">
                      <i className="bi bi-book text-warning" style={{fontSize: '2rem'}}></i>
                      <h6 className="mt-2">English Literature</h6>
                      <p className="text-muted small">Liberal arts department template</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-primary" onClick={applyTemplate} disabled={!selectedTemplate} data-bs-dismiss="modal">Apply Template</button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Department Preview</h5>
                <button type="button" className="btn-close" onClick={() => setShowPreview(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Department Information</h6>
                    <table className="table table-sm">
                      <tr><th>Name:</th><td>{formData.departmentName || 'Not specified'}</td></tr>
                      <tr><th>Code:</th><td>{formData.departmentCode || 'Not specified'}</td></tr>
                      <tr><th>Status:</th><td><span className={`badge bg-${formData.departmentStatus === 'active' ? 'success' : 'warning'}`}>{formData.departmentStatus || 'Not specified'}</span></td></tr>
                      <tr><th>Established:</th><td>{formData.establishedYear || 'Not specified'}</td></tr>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6>Department Head</h6>
                    <table className="table table-sm">
                      <tr><th>Name:</th><td>{formData.headName || 'Not specified'}</td></tr>
                      <tr><th>Email:</th><td>{formData.headEmail || 'Not specified'}</td></tr>
                      <tr><th>Phone:</th><td>{formData.headPhone || 'Not specified'}</td></tr>
                      <tr><th>Office:</th><td>{formData.officeLocation || 'Not specified'}</td></tr>
                    </table>
                  </div>
                  <div className="col-12 mt-3">
                    <h6>Description</h6>
                    <p className="text-muted">{formData.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger mt-3">
          {error}
        </div>
      )}
    </>
  );
};

export default AddDepartments;
