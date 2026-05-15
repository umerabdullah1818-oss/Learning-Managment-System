import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAllStudents, clearError } from '../../../redux/slices/studentSlice';
import { fetchDepartments } from '../../../redux/slices/departmentSlice';
import DeleteStudent from './Delete-Student';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';


const AllStudents = () => {
  const dispatch = useDispatch();
  const { students, loading, error } = useSelector((state) => state.student);
  const { departments } = useSelector((state) => state.department);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Close action dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      const inside = e.target.closest && e.target.closest('.student-action-dropdown');
      if (!inside) setOpenDropdown(null);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const studentsPerPage = 8; // Show 8 students per page (4 columns x 2 rows)

  useEffect(() => {
    dispatch(fetchAllStudents({ limit: 100, offset: 0 })); // Fetch more students for client-side filtering
    dispatch(fetchDepartments()); // Fetch departments for filtering
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Create list of departments that have students
  useEffect(() => {
    if (students.length > 0) {
      const uniqueDepartments = [...new Set(students.map(student => student.department))];
      setAvailableDepartments(uniqueDepartments);
    }
  }, [students]);

  useEffect(() => {
    let filtered = students;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by department
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(student => student.department.toLowerCase() === selectedDepartment.toLowerCase());
    }

    
    if (selectedYear !== 'All Years') {
      filtered = filtered.filter(student => {
        const year = student.student_id.substring(2, 6);
        return year === selectedYear.replace(' Year', '');
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [students, searchTerm, selectedDepartment, selectedYear]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };



  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="container-fluid">
          <div className="alert alert-danger">
            Failed to load students. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="dashboard-row">
          <div className="dashboard-grid grid-cols-1">
            <div className="dashboard-card">
              <div className="dashboard-card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <h4 className="dashboard-card-title mb-0">All Students</h4>
                <div className="d-flex gap-2 flex-wrap">
                  <Link to="/add-student" className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i>Add New Student
                  </Link>
                </div>
              </div>
              
              <div className="dashboard-card-body">
                {/* Search and Filter */}
                <div className="row gx-3 gy-2 mb-3 filters-row">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-search"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option>All Departments</option>
                      {availableDepartments.map(dept => {
                        const departmentInfo = departments.find(d => d.departmentCode === dept);
                        return (
                          <option key={dept} value={dept}>
                            {departmentInfo ? departmentInfo.departmentName : dept}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option>All Years</option>
                      <option>First Year</option>
                      <option>Second Year</option>
                      <option>Third Year</option>
                      <option>Fourth Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="row students-grid">
          {currentStudents.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-info">No students found.</div>
            </div>
          ) : (
            currentStudents.map(student => {
              const age = calculateAge(student.date_of_birth);
              const profileImage = student.profile_image
                ? `${API_BASE_URL}/images/${student.profile_image}?t=${Date.now()}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=6366f1&color=fff`;

              return (
                <div key={student.id} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                  <div className="dashboard-card h-100">
                    <div className="dashboard-card-body text-center">
                      <img
                        src={profileImage}
                        alt={student.full_name}
                        className="mb-3"
                        style={{
                          width: 'min(100px, 22vw)',
                          height: 'min(100px, 22vw)',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          // border: '3px solid #007bff',
                          display: 'block'
                        }}
                        loading="lazy"
                      />
                      <h5 className="mb-1">{student.full_name}</h5>
                      <p className="text-muted mb-2">{student.department}</p>
                      <p className="text-muted small mb-3"><strong>Age:</strong> {age} Years</p>
                      <div className="d-flex gap-2 justify-content-center align-items-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => { setSelectedStudent(student); setShowModal(true); }}
                        >
                          <i className="bi bi-eye"></i>
                          <span className="ms-1 d-none d-sm-inline">View</span>
                        </button>

                        <div className="position-relative student-action-dropdown d-flex align-items-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            aria-expanded={openDropdown === student.id}
                            onClick={() => setOpenDropdown(openDropdown === student.id ? null : student.id)}
                            title="Actions"
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>

                          {openDropdown === student.id && (
                            <ul className="dropdown-menu show p-0" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 2000, minWidth: 160 }}>
                              <li>
                                <Link
                                  to={`/edit-student/${student.id}`}
                                  className="dropdown-item d-flex align-items-center"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <i className="bi bi-pencil me-2"></i>
                                  Edit
                                </Link>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center text-danger"
                                  onClick={() => { setStudentToDelete(student); setShowDeleteModal(true); setOpenDropdown(null); }}
                                >
                                  <i className="bi bi-trash me-2"></i>
                                  Delete
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {/* Student Detail Modal */}
        {showModal && selectedStudent && (
          <div
            className="student-modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
            }}
            onClick={() => { setShowModal(false); setSelectedStudent(null); }}
          >
            <div
              className="student-modal-card"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                borderRadius: 8,
                width: '90%',
                maxWidth: 700,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                padding: '1.25rem',
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0">Student Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => { setShowModal(false); setSelectedStudent(null); }}
                />
              </div>

              <div className="d-flex gap-3">
                <img
                  src={
                    selectedStudent.profile_image
                      ? `http://localhost:5000/images/${selectedStudent.profile_image}?t=${Date.now()}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.full_name)}&background=6366f1&color=fff`
                  }
                  alt={selectedStudent.full_name}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #007bff',
                    display: 'block'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h4 className="mb-1">{selectedStudent.full_name}</h4>
                  <p className="mb-1 text-muted">ID: {selectedStudent.student_id ?? 'N/A'}</p>
                  <p className="mb-1 text-muted">Department: {selectedStudent.department ?? 'N/A'}</p>
                  <p className="mb-1 text-muted">Age: {calculateAge(selectedStudent.date_of_birth)} Years</p>
                  {selectedStudent.email && <p className="mb-1 text-muted">Email: {selectedStudent.email}</p>}
                  {selectedStudent.contact_number && <p className="mb-1 text-muted">Contact: {selectedStudent.contact_number}</p>}
                </div>
              </div>

              <hr />

              <div>
                <h6>Additional Info</h6>
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Date of Birth:</strong> {selectedStudent.date_of_birth ?? 'N/A'}</p>
                    <p className="mb-1"><strong>Gender:</strong> {selectedStudent.gender ?? 'N/A'}</p>
                    <p className="mb-1"><strong>Enrollment Year:</strong> {selectedStudent.enrollment_year ?? 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Address:</strong> {selectedStudent.address ?? 'N/A'}</p>
                    <p className="mb-1"><strong>Status:</strong> {selectedStudent.status ?? 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 d-flex justify-content-end">
                <button className="btn btn-secondary me-2" onClick={() => { setShowModal(false); setSelectedStudent(null); }}>Close</button>
                <button className="btn btn-danger me-2" onClick={() => { setShowModal(false); setStudentToDelete(selectedStudent); setShowDeleteModal(true); }}>
                  <i className="bi bi-trash"></i> Delete
                </button>
                <Link to={`/edit-student/${selectedStudent.id}`} className="btn btn-primary" onClick={() => { setShowModal(false); setSelectedStudent(null); }}>
                  Edit Student
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete confirmation modal */}
        {showDeleteModal && studentToDelete && (
          <DeleteStudent
            studentId={studentToDelete.id}
            studentName={studentToDelete.full_name}
            onClose={() => { setShowDeleteModal(false); setStudentToDelete(null); }}
            onSuccess={() => { setShowDeleteModal(false); setStudentToDelete(null); dispatch(fetchAllStudents({ limit: 100, offset: 0 })); }}
          />
        )}
        {totalPages > 1 && (
          <div className="row mt-4">
            <div className="col-12">
              <nav aria-label="Student pagination">
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
                  {renderPagination()}
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
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default AllStudents;
