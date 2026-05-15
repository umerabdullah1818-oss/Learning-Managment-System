import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDepartments, fetchDepartmentStats, deleteDepartment, clearError, resetSuccess } from '../../../redux/slices/departmentSlice';
// import '../../css/dashboard-layout.css';
import '../../../css/dashboard.css';
import { toast } from 'react-toastify';


const AllDepartments = () => {
  const dispatch = useDispatch();
  const { departments, stats, loading, error } = useSelector((state) => state.department);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchDepartmentStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = (dept.departmentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || dept.departmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDepartments = filteredDepartments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const totalStudents = departments.reduce((sum, dept) => sum + (dept.currentStudents || 0), 0);
  const totalFaculty = departments.reduce((sum, dept) => sum + (dept.facultyCount || 0), 0);

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

  const getDepartmentIcon = (name) => {
    const icons = {
      'Computer Science': 'bi-laptop',
      'Mechanical Engineering': 'bi-gear',
      'Business Administration': 'bi-briefcase',
      'Medicine': 'bi-heart-pulse',
      'Fine Arts': 'bi-palette'
    };
    return icons[name] || 'bi-building';
  };

  const getDepartmentColor = (name) => {
    const colors = {
      'Computer Science': 'primary',
      'Mechanical Engineering': 'warning',
      'Business Administration': 'success',
      'Medicine': 'info',
      'Fine Arts': 'secondary'
    };
    return colors[name] || 'primary';
  };

  // Export currently visible departments (filtered) to CSV
  const exportToCSV = (data = filteredDepartments, filename = 'departments.csv') => {
    if (!data || data.length === 0) {
      toast.info('No data available to export');
      return;
    }

    const rows = data.map(d => ({
      ID: d.id,
      Department: d.departmentName || '',
      Status: d.departmentStatus || '',
      Head: d.headName || '',
      Email: d.headEmail || '',
      Phone: d.headPhone || '',
      Students: d.currentStudents ?? 0,
      Faculty: d.facultyCount ?? 0,
      Established: d.establishedYear ?? ''
    }));

    const header = Object.keys(rows[0]);
    const csv = [header.join(',')].concat(
      rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
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

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="mb-4">
          <div className="d-flex flex-column flex-sm-row  justify-content-between align-items-center">
            <div>
              <h1 className="h3 font-bold">Departments Management</h1>
              <p className="text-muted text-sm">Manage academic departments, staff, and student enrollment across your institution.</p>
            </div>
            <div className="d-flex gap-2 ">
              <button className="btn btn-outline-secondary" onClick={() => exportToCSV()}>
                <i className="bi bi-download me-2"></i>Export Data
              </button>
              <a href="/add-department" className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i>Add Department
              </a>
            </div>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="dashboard-row">
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="dashboard-card">
              <div className="dashboard-card-body text-center">
                <div className="mb-3">
                  <div className="stat-icon-large bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-building" style={{ fontSize: '24px', color: '#0d6efd' }}></i>
                  </div>
                </div>
                <div className="stat-value text-primary fw-bold mb-1" style={{ fontSize: '2rem' }}>{departments.length}</div>
                <div className="stat-label text-muted mb-2">Total Departments</div>
                <div className="stat-change text-success small fw-semibold">
                  {/* <i className="bi bi-arrow-up" style={{ fontSize: '12px' }}></i> +2 this year */}
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-body text-center">
                <div className="mb-3">
                  <div className="stat-icon-large bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-check-circle" style={{ fontSize: '24px', color: '#198754' }}></i>
                  </div>
                </div>
                <div className="stat-value text-success fw-bold mb-1" style={{ fontSize: '2rem' }}>{departments.filter(d => d.departmentStatus === 'active').length}</div>
                <div className="stat-label text-muted mb-2">Active Departments</div>
                <div className="stat-change text-success small fw-semibold">
                  {/* <i className="bi bi-arrow-up" style={{ fontSize: '12px' }}></i> 100% operational */}
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-body text-center">
                <div className="mb-3">
                  <div className="stat-icon-large bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-people" style={{ fontSize: '24px', color: '#0dcaf0' }}></i>
                  </div>
                </div>
                <div className="stat-value text-info fw-bold mb-1" style={{ fontSize: '2rem' }}>{totalStudents}</div>
                <div className="stat-label text-muted mb-2">Total Students</div>
                <div className="stat-change text-success small fw-semibold">
                  {/* <i className="bi bi-arrow-up" style={{ fontSize: '12px' }}></i> +12.5% this semester */}
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-body text-center">
                <div className="mb-3">
                  <div className="stat-icon-large bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person-badge" style={{ fontSize: '24px', color: '#ffc107' }}></i>
                  </div>
                </div>
                <div className="stat-value text-warning fw-bold mb-1" style={{ fontSize: '2rem' }}>{totalFaculty}</div>
                <div className="stat-label text-muted mb-2">Faculty Members</div>
                <div className="stat-change text-success small fw-semibold">
                  {/* <i className="bi bi-arrow-up" style={{ fontSize: '12px' }}></i> +8 new hires */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Departments Table */}
        <div className="dashboard-row">
          <div className="prof-dir-container bg-white p-1 rounded-3 shadow-sm">
            <div className="dashboard-card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">All Departments</h5>
                <div className="d-flex gap-2">
                  <div className="input-group" style={{ width: '300px' }}>
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search departments..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page when search changes
                      }}
                    />
                  </div>
                  <select
                    className="form-select"
                    style={{ width: 'auto' }}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="dashboard-card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Department</th>
                      <th scope="col">Status</th>
                      <th scope="col">Department Head</th>
                      <th scope="col">Contact</th>
                      <th scope="col">Students</th>
                      <th scope="col">Faculty</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDepartments.length > 0 ? (
                      currentDepartments.map((dept, index) => (
                      <tr key={dept.id}>
                        <td className="fw-bold">{startIndex + index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className={`department-icon bg-${getDepartmentColor(dept.departmentName)} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3`} style={{ width: '40px', height: '40px' }}>
                              <i className={`bi ${getDepartmentIcon(dept.departmentName)} text-${getDepartmentColor(dept.departmentName)}`}></i>
                            </div>
                            <div>
                              <div className="fw-semibold">{dept.departmentName}</div>
                              <div className="text-muted small">Established {dept.establishedYear}</div>
                            </div>
                          </div>
                        </td>
                        <td>{getStatusBadge(dept.departmentStatus)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dept.headName)}&background=${getDepartmentColor(dept.departmentName) === 'primary' ? '0d6efd' : getDepartmentColor(dept.departmentName) === 'warning' ? 'ffc107' : getDepartmentColor(dept.departmentName) === 'success' ? '198754' : getDepartmentColor(dept.departmentName) === 'info' ? '0dcaf0' : '6c757d'}&color=fff`}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                              alt={dept.headName}
                            />
                            <div>
                              <div className="fw-semibold small">{dept.headName}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{dept.headEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div><i className="bi bi-envelope me-1"></i>{dept.headEmail}</div>
                            <div className="text-muted"><i className="bi bi-phone me-1"></i>{dept.headPhone}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-center">
                            <div className="fw-bold text-primary">{dept.currentStudents}</div>
                            <div className="text-muted small">enrolled</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-center">
                            <div className="fw-bold text-info">{dept.facultyCount}</div>
                            <div className="text-muted small">faculty</div>
                          </div>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-light btn-sm" data-bs-toggle="dropdown">
                              <i className="bi bi-three-dots"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li><button className="dropdown-item" onClick={() => { setSelectedDept(dept); setShowModal(true); }}><i className="bi bi-eye me-2"></i>View Details</button></li>
                              <li><Link className="dropdown-item" to={`/departments/edit/${dept.id}`}><i className="bi bi-pencil me-2"></i>Edit Department</Link></li>
                              {/* <li><a className="dropdown-item" href="#"><i className="bi bi-people me-2"></i>Manage Faculty</a></li> */}
                              <li><hr className="dropdown-divider" /></li>
                              <li><button className="dropdown-item text-danger" onClick={() => { setDepartmentToDelete(dept); setShowDeleteModal(true); }}><i className="bi bi-trash me-2"></i>Delete</button></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          {searchTerm || statusFilter ? (
                            <div>
                              <p className="mb-2">No departments match your filters.</p>              
                            </div>
                          ) : (
                            <div>
                              <p className="mb-0">No departments available.</p>                              
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Departments pagination" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Department Details Modal */}
        {showModal && selectedDept && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Department Details</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowModal(false); setSelectedDept(null); }}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Basic Information</h6>
                      <p><strong>Name:</strong> {selectedDept.departmentName}</p>
                      <p><strong>Code:</strong> {selectedDept.departmentCode}</p>
                      <p><strong>Established:</strong> {selectedDept.establishedYear}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedDept.departmentStatus)}</p>
                      <p><strong>Description:</strong> {selectedDept.description || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Head Information</h6>
                      <p><strong>Name:</strong> {selectedDept.headName}</p>
                      <p><strong>Title:</strong> {selectedDept.headTitle}</p>
                      <p><strong>Email:</strong> {selectedDept.headEmail}</p>
                      <p><strong>Phone:</strong> {selectedDept.headPhone}</p>
                      <p><strong>Appointment Date:</strong> {selectedDept.appointmentDate || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <h6>Enrollment & Capacity</h6>
                      <p><strong>Current Students:</strong> {selectedDept.currentStudents}</p>
                      <p><strong>Max Capacity:</strong> {selectedDept.maxCapacity}</p>
                      <p><strong>Faculty Count:</strong> {selectedDept.facultyCount}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Additional Details</h6>
                      <p><strong>Office Location:</strong> {selectedDept.officeLocation || 'N/A'}</p>
                      <p><strong>Website:</strong> {selectedDept.departmentWebsite ? <a href={selectedDept.departmentWebsite} target="_blank" rel="noopener noreferrer">{selectedDept.departmentWebsite}</a> : 'N/A'}</p>
                    </div>
                  </div>
                  
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedDept(null); }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && departmentToDelete && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-danger">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowDeleteModal(false); setDepartmentToDelete(null); }}></button>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h6 className="text-center mb-3">Are you sure you want to delete this department?</h6>
                  <div className="alert alert-danger">
                    <strong>Department:</strong> {departmentToDelete.departmentName}<br />
                    <strong>Code:</strong> {departmentToDelete.departmentCode}<br />
                    <strong>Students:</strong> {departmentToDelete.currentStudents}<br />
                    <strong>Faculty:</strong> {departmentToDelete.facultyCount}
                  </div>
                  <p className="text-muted small">
                    This action cannot be undone. All associated data including student records, faculty assignments, and course information will be permanently removed.
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setDepartmentToDelete(null); }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={async () => {
                      try {
                        await dispatch(deleteDepartment(departmentToDelete.id)).unwrap();
                        toast.success('Department deleted successfully!');
                        setShowDeleteModal(false);
                        setDepartmentToDelete(null);
                        // Refresh the departments list
                        dispatch(fetchDepartments());
                      } catch (err) {
                        console.error('Delete failed:', err);
                        toast.error('Failed to delete department. Please try again.');
                      }
                    }}
                  >
                    <i className="bi bi-trash me-2"></i>Delete Department
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDepartments;
