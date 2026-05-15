import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchDepartmentById, updateDepartment, clearError, resetSuccess } from '../../../redux/slices/departmentSlice';
import '../../../css/dashboard.css';

const EditDepartment = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentDepartment, loading, error, success } = useSelector((state) => state.department);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    departmentStatus: '',
    headName: '',
    headEmail: '',
    headPhone: '',
    officeLocation: '',
    description: '',
  });

  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchDepartmentById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentDepartment && !isFormLoaded) {
      setFormData({
        departmentName: currentDepartment.departmentName || '',
        departmentCode: currentDepartment.departmentCode || '',
        departmentStatus: currentDepartment.departmentStatus || '',
        headName: currentDepartment.headName || '',
        headEmail: currentDepartment.headEmail || '',
        headPhone: currentDepartment.headPhone || '',
        officeLocation: currentDepartment.officeLocation || '',
        description: currentDepartment.description || '',
      });
      setIsFormLoaded(true);
    }
  }, [currentDepartment, isFormLoaded]);

  useEffect(() => {
    if (success) {
      toast.success('Department updated successfully!');
      dispatch(resetSuccess());
      navigate('/departments');
    }
  }, [success, dispatch, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await dispatch(updateDepartment({ id, updateData: formData })).unwrap();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge bg-success-subtle text-success border border-success-subtle"><i className="bi bi-check-circle me-1"></i>Active</span>;
      case 'paused':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle"><i className="bi bi-pause-circle me-1"></i>Paused</span>;
      case 'disabled':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle"><i className="bi bi-x-circle me-1"></i>Disabled</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Unknown</span>;
    }
  };

  if (loading && !currentDepartment) {
    return (
      <div className="dashboard-content">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!currentDepartment) {
    return (
      <div className="dashboard-content">
        <div className="alert alert-warning">Department not found</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3 font-bold">Edit Department</h1>
              <p className="text-muted text-sm">Update department information and manage settings for {currentDepartment.departmentName}.</p>
            </div>
            <div className="d-flex gap-2">
              <button onClick={() => navigate('/departments')} className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>Back to Departments
              </button>
            </div>
          </div>
        </div>

        {/* Department Status Alert */}
        <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <div>
            <strong>Department Status:</strong> This department is currently {currentDepartment.departmentStatus} with {currentDepartment.currentStudents || 0} enrolled students and {currentDepartment.facultyCount || 0} faculty members.
            {/* <a href="#" className="alert-link ms-2">View detailed report</a> */}
          </div>
        </div>

        {/* Edit Form Row */}
        <div className="dashboard-row">
          <div className="dashboard-grid grid-cols-12">
            {/* Main Form Column */}
            <div className="col-span-8">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h5 className="dashboard-card-title mb-0">Department Information</h5>
                </div>
                <div className="dashboard-card-body">
                  <form id="editDepartmentForm" onSubmit={handleSubmit}>
                    <div className="dashboard-grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="deptName" className="form-label">Department Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="deptName"
                          name="departmentName"
                          value={formData.departmentName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="deptCode" className="form-label">Department Code</label>
                        <input
                          type="text"
                          className="form-control"
                          id="deptCode"
                          name="departmentCode"
                          value={formData.departmentCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="dashboard-grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="deptHead" className="form-label">Department Head</label>
                        <input
                          type="text"
                          className="form-control"
                          id="deptHead"
                          name="headName"
                          value={formData.headName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="deptStatus" className="form-label">Status</label>
                        <select
                          className="form-select"
                          id="deptStatus"
                          name="departmentStatus"
                          value={formData.departmentStatus}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>
                    </div>

                    <div className="dashboard-grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="deptEmail" className="form-label">Department Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="deptEmail"
                          name="headEmail"
                          value={formData.headEmail}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="deptPhone" className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="deptPhone"
                          name="headPhone"
                          value={formData.headPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="deptLocation" className="form-label">Building/Location</label>
                      <input
                        type="text"
                        className="form-control"
                        id="deptLocation"
                        name="officeLocation"
                        value={formData.officeLocation}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="deptDesc" className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        id="deptDesc"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-outline-secondary flex-fill" onClick={() => navigate('/departments')}>
                        <i className="bi bi-x-circle me-1"></i> Cancel
                      </button>
                      <button type="submit" className="btn btn-primary flex-fill" disabled={submitting}>
                        <i className="bi bi-check-circle me-1"></i> {submitting ? 'Updating...' : 'Update Department'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Statistics Column */}
            <div className="col-span-4">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h5 className="dashboard-card-title mb-0">Department Statistics</h5>
                </div>
                <div className="dashboard-card-body">
                  {/* Statistics Grid */}
                  <div className="dashboard-grid grid-cols-2 gap-3 text-center mb-4">
                    <div>
                      <div className="p-3 bg-light border rounded shadow-sm">
                        <h4 className="text-primary mb-1">{currentDepartment.currentStudents || 0}</h4>
                        <small className="text-muted">Students</small>
                        <div className="text-success small mt-1">
                          <i className="bi bi-arrow-up"></i> +5.2%
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="p-3 bg-light border rounded shadow-sm">
                        <h4 className="text-success mb-1">{currentDepartment.facultyCount || 0}</h4>
                        <small className="text-muted">Faculty</small>
                        <div className="text-success small mt-1">
                          <i className="bi bi-arrow-up"></i> +2 new
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="p-3 bg-light border rounded shadow-sm">
                        <h4 className="text-info mb-1">15</h4>
                        <small className="text-muted">Programs</small>
                        <div className="text-muted small mt-1">3 Graduate</div>
                      </div>
                    </div>
                    <div>
                      <div className="p-3 bg-light border rounded shadow-sm">
                        <h4 className="text-warning mb-1">89%</h4>
                        <small className="text-muted">Capacity</small>
                        <div className="text-success small mt-1">Healthy</div>
                      </div>
                    </div>
                  </div>

                  {/* Department Info */}
                  <div className="row text-center mb-4">
                    <div className="col-6">
                      <div className="text-muted small">Founded</div>
                      <div className="fw-semibold">{currentDepartment.establishedYear || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Ranking</div>
                      <div className="fw-semibold">#12 National</div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">Contact Information</h6>
                    <div className="small">
                      <div className="mb-1"><i className="bi bi-geo-alt me-2"></i>{currentDepartment.officeLocation || 'N/A'}</div>
                      <div className="mb-1"><i className="bi bi-telephone me-2"></i>{currentDepartment.headPhone || 'N/A'}</div>
                      <div className="mb-1"><i className="bi bi-envelope me-2"></i>{currentDepartment.headEmail || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Recognition Badges */}
                  <div>
                    <h6 className="text-muted mb-2">Recent Recognition</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-primary">Excellence Award 2025</span>
                      <span className="badge bg-success">Top Research Dept</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDepartment;
