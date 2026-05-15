import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfessors, deleteProfessor, clearError, clearSuccess } from '../../../redux/slices/professorSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import '../../../css/dashboard.css';

const AllProfessor = () => {
  const dispatch = useDispatch();
  const { professors, loading, error, success } = useSelector((state) => state.professor);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const limit = 10; // Items per page

  useEffect(() => {
    dispatch(fetchProfessors({ limit, offset: (currentPage - 1) * limit }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (success) {
      toast.success('Professor deleted successfully!');
      dispatch(clearSuccess());
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleDelete = (id) => {
    setProfessorToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (professorToDelete) {
      dispatch(deleteProfessor(professorToDelete));
      setShowDeleteModal(false);
      setProfessorToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProfessorToDelete(null);
  };

  if (loading) return <div className="text-center">Loading...</div>;

  // Compute stats
  const totalProfessors = professors.length;
  const fullTime = professors.filter(p => p.employmentType === 'Full-Time').length;
  const partTime = professors.filter(p => p.employmentType === 'Part-Time').length;
  const departments = new Set(professors.map(p => p.department)).size;

  // Featured professors (first 4)
  const featuredProfessors = professors.slice(0, 4);

  // Filtered professors
  const filteredProfessors = (professors || []).filter(p => {
    if (!p) return false;
    const name = (p.name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const department = (p.department || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      department.includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'full-time' && p.employmentType === 'Full-Time') ||
      (filter === 'part-time' && p.employmentType === 'Part-Time') ||
      (filter === 'senior' && p.position === 'Professor') ||
      (filter === 'associate' && p.position === 'Associate Professor') ||
      (filter === 'assistant' && p.position === 'Assistant Professor');
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredProfessors.length / limit);
  const paginatedProfessors = filteredProfessors.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 font-bold">All Professors</h1>
              <p className="text-muted text-sm">Manage and view all faculty members in your institution.</p>
            </div>
            <div>
              <Link to="/add-professor" className="btn btn-primary">
                <i className="bi bi-plus-lg me-2"></i>Add Professor
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="d-flex flex-wrap gap-3 mb-3" style={{ justifyContent: "space-between" }}>
  <div className="stats-card flex-fill" style={{ minWidth: "150px" }}>
    <div className="stats-card-label">Total Professors</div>
    <div className="stats-card-value">{totalProfessors}</div>
  </div>

  <div className="stats-card flex-fill" style={{ minWidth: "150px" }}>
    <div className="stats-card-label">Full-Time</div>
    <div className="stats-card-value">{fullTime}</div>
  </div>

  <div className="stats-card flex-fill" style={{ minWidth: "150px" }}>
    <div className="stats-card-label">Part-Time</div>
    <div className="stats-card-value">{partTime}</div>
  </div>

  <div className="stats-card flex-fill" style={{ minWidth: "150px" }}>
    <div className="stats-card-label">Departments</div>
    <div className="stats-card-value">{departments}</div>
  </div>
</div>


        {/* Featured Professors Cards */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h5 className="dashboard-card-title mb-0">Featured Professors</h5>
              {/* <Link to="#" className="text-primary text-sm">View All</Link> */}
            </div>

            <div className="dashboard-card-body">

              {/* FLEX VERSION */}
              <div className="d-flex flex-wrap gap-3">

                {featuredProfessors.map((prof) => (
                  <div key={prof.id} className="professor-card flex-fill p-3"
                    style={{ minWidth: "200px", maxWidth: "260px", flex: "1 1 auto" }}>

                    <div className="text-center mb-3">
                      <img
                        src={
                          prof.avatar
                            ? `http://localhost:5000/images/${prof.avatar}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              prof.name
                            )}&background=0d6efd&color=fff`
                        }
                        alt={prof.name}
                        className="rounded-circle"
                        style={{ width: "80px", height: "80px" }}
                      />
                    </div>

                    <div className="text-center">
                      <h6 className="mb-1">{prof.name}</h6>
                      <p className="text-muted text-sm mb-2">{prof.department}</p>

                      <div className="mb-2">
                        <span
                          className={`badge ${prof.employmentType === "Full-Time"
                              ? "bg-success"
                              : "bg-warning"
                            }`}
                        >
                          {prof.employmentType}
                        </span>
                      </div>

                      <div className="d-flex gap-2 justify-content-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => { setSelectedProfessor(prof); setShowProfileModal(true); }}
                        >
                          View
                        </button>

                        <Link
                          to={`/${prof.id}`}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>
        </div>


        {/* Professors Table */}
        <div className="dashboard-row">
          <div className="prof-dir-container bg-white p-2 rounded-3 shadow-sm">
            <div className="dashboard-card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="dashboard-card-title mb-0">Professors Directory</h5>
                <div className="d-flex gap-2 flex-wrap">
                  <div className="dropdown">
                    <button className="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      <i className="bi bi-funnel me-1"></i>Filter
                    </button>
                    <ul className="dropdown-menu">
                      <li><a className="dropdown-item"  onClick={() => setFilter('all')}>All Professors</a></li>
                      <li><a className="dropdown-item"  onClick={() => setFilter('full-time')}>Full-Time</a></li>
                      <li><a className="dropdown-item"  onClick={() => setFilter('part-time')}>Part-Time</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><a className="dropdown-item"  onClick={() => setFilter('senior')}>Senior Level</a></li>
                      <li><a className="dropdown-item"  onClick={() => setFilter('associate')}>Associate Level</a></li>
                      <li><a className="dropdown-item"  onClick={() => setFilter('assistant')}>Assistant Level</a></li>
                    </ul>
                  </div>
                  <div className="input-group" style={{ width: '250px' }}>
                    <input type="text" className="form-control form-control-sm" placeholder="Search professors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <button className="btn btn-outline-secondary btn-sm" type="button">
                      <i className="bi bi-search"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="dashboard-card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="border-0">Professor</th>
                      <th scope="col" className="border-0">Department</th>
                      <th scope="col" className="border-0">Position</th>
                      <th scope="col" className="border-0">Employment Type</th>
                      <th scope="col" className="border-0">Courses</th>
                      <th scope="col" className="border-0">Status</th>
                      <th scope="col" className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProfessors.map((prof) => (
                      <tr key={prof.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img src={prof.avatar ? `${API_BASE_URL}/images/${prof.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=0d6efd&color=fff`} alt={prof.name} className="rounded-circle me-3" style={{ width: '40px', height: '40px' }} />
                            <div>
                              <div className="fw-medium">{prof.name}</div>
                              <small className="text-muted">{prof.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{prof.department}</td>
                        <td>{prof.position}</td>
                        <td><span className={`badge ${prof.employmentType === 'Full-Time' ? 'bg-success' : 'bg-warning'}`}>{prof.employmentType}</span></td>
                        <td>{prof.courses}</td>
                        <td><span className={`badge ${prof.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>{prof.status || 'Active'}</span></td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-link text-decoration-none p-1" type="button" data-bs-toggle="dropdown">
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li><button type="button" className="dropdown-item" onClick={() => { setSelectedProfessor(prof); setShowProfileModal(true); }}><i className="bi bi-eye me-2"></i>View Profile</button></li>
                              <li><Link className="dropdown-item" to={`/${prof.id}`}><i className="bi bi-pencil me-2"></i>Edit</Link></li>
                              {/* <li><a className="dropdown-item" href="#"><i className="bi bi-envelope me-2"></i>Send Message</a></li> */}
                              <li><hr className="dropdown-divider" /></li>
                              <li><a className="dropdown-item text-danger" onClick={() => handleDelete(prof.id)}><i className="bi bi-trash me-2"></i>Remove</a></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="dashboard-card-footer">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, filteredProfessors.length)} of {filteredProfessors.length} professors</small>
                </div>
                <nav aria-label="Professors pagination">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                          aria-label="Previous"
                          disabled={currentPage === 1}
                        >
                          <span aria-hidden="true" className="">«</span>
                          <span className="visually-hidden">Previous</span>
                        </button>
                      </li>

                      {Array.from({ length: totalPages }, (_, i) => (
                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(i + 1)} aria-current={currentPage === i + 1 ? 'page' : undefined}>{i + 1}</button>
                        </li>
                      ))}

                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                          aria-label="Next"
                          disabled={currentPage === totalPages}
                        >
                          <span aria-hidden="true" className="">»</span>
                          <span className="visually-hidden">Next</span>
                        </button>
                      </li>
                    </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={cancelDelete} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                
                <p>Are you sure you want to delete this professor? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDelete}><i className="bi bi-x-lg me-2" aria-hidden="true"></i>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}><i className="bi bi-trash me-2" aria-hidden="true"></i>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Professor Details Modal */}
      {showProfileModal && selectedProfessor && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Professor Details</h5>
                <button type="button" className="btn-close" onClick={() => { setShowProfileModal(false); setSelectedProfessor(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex gap-3 align-items-start">
                  <div style={{ minWidth: 120 }}>
                    <img
                      src={
                        selectedProfessor.avatar
                          ? `http://localhost:5000/images/${selectedProfessor.avatar}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfessor.name)}&background=0d6efd&color=fff`
                      }
                      alt={selectedProfessor.name}
                      className="rounded-circle"
                      style={{ width: 110, height: 110 }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{selectedProfessor.name}</h5>
                    <p className="text-muted mb-1">{selectedProfessor.position} — {selectedProfessor.department}</p>
                    <p className="mb-2"><strong>Email:</strong> {selectedProfessor.email}</p>
                    {selectedProfessor.phone && <p className="mb-2"><strong>Phone:</strong> {selectedProfessor.phone}</p>}
                    {selectedProfessor.employmentType && <p className="mb-2"><strong>Employment:</strong> {selectedProfessor.employmentType}</p>}
                    {selectedProfessor.status && <p className="mb-2"><strong>Status:</strong> {selectedProfessor.status}</p>}
                    {selectedProfessor.courses && <p className="mb-2"><strong>Courses:</strong> {selectedProfessor.courses}</p>}
                    {selectedProfessor.bio && <p className="mt-2"><strong>About:</strong> {selectedProfessor.bio}</p>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowProfileModal(false); setSelectedProfessor(null); }}>Close</button>
                <Link to={`/${selectedProfessor.id}`} className="btn btn-primary">Edit Professor</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProfessor;
