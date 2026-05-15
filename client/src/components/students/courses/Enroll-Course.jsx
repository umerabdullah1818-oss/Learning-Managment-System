
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses } from '../../../redux/slices/courseSlice';
import {
  fetchStudentEnrollments,
  enrollInCourse,
  unenrollFromCourse,
  checkEnrollmentStatus,
  clearError,
  clearSuccess
} from '../../../redux/slices/enrollmentSlice';
import { toast } from 'react-toastify';
import { FaBook, FaPlusCircle, FaMinusCircle, FaCheckCircle, FaExclamationTriangle, FaCode, FaBuilding, FaUser, FaStar, FaUsers, FaEllipsisH, FaEye } from 'react-icons/fa';

const EnrollCourse = () => {
  const dispatch = useDispatch();
  const { courses, loading: coursesLoading, error: coursesError } = useSelector((state) => state.course);
  const {
    enrollments,
    enrollmentStatus,
    loading: enrollmentLoading,
    error: enrollmentError,
    success
  } = useSelector((state) => state.enrollment);

  const [enrollmentChecks, setEnrollmentChecks] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [courseToView, setCourseToView] = useState(null);
  const [mobileMenuOpenFor, setMobileMenuOpenFor] = useState(null);

  useEffect(() => {
    // Fetch all available courses (backend filters for students: active and created by admin)
    // Using a high limit to ensure all courses are loaded
    dispatch(fetchCourses({ limit: 1000, offset: 0 }));

    // Fetch student's current enrollments
    dispatch(fetchStudentEnrollments());
  }, [dispatch]);

  useEffect(() => {
    // Clear success/error messages after 3 seconds
    if (success || enrollmentError) {
      const timer = setTimeout(() => {
        dispatch(clearError());
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, enrollmentError, dispatch]);

  const handleEnroll = async (courseId) => {
    try {
      await dispatch(enrollInCourse(courseId)).unwrap();
      // Refresh enrollments and courses after successful enrollment
      dispatch(fetchStudentEnrollments());
      dispatch(fetchCourses({ limit: 1000, offset: 0 }));
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    try {
      await dispatch(unenrollFromCourse(enrollmentId)).unwrap();
      // Refresh enrollments and courses after successful unenrollment
      dispatch(fetchStudentEnrollments());
      dispatch(fetchCourses({ limit: 1000, offset: 0 }));
    } catch (error) {
      console.error('Unenrollment failed:', error);
    
    }
  };

  const confirmUnenroll = async () => {
    if (selectedEnrollment) {
      await handleUnenroll(selectedEnrollment);
      setShowConfirmModal(false);
      setSelectedEnrollment(null);
    }
  };

  const cancelUnenroll = () => {
    setShowConfirmModal(false);
    setSelectedEnrollment(null);
  };

  const isEnrolled = (courseId) => {
    return enrollments.some(enrollment =>
      enrollment.course_id === courseId && enrollment.status === 'active'
    );
  };

  const getEnrollmentCount = (course) => {
    return course.enrolledStudents || 0;
  };

  const getEnrollmentId = (courseId) => {
    const e = enrollments.find(en => en.course_id === courseId && en.status === 'active');
    return e ? e.id : null;
  };

  const toggleMobileMenu = (id) => {
    setMobileMenuOpenFor(prev => (prev === id ? null : id));
  };

  if (coursesLoading || enrollmentLoading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading courses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalCourses = courses.length;

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="row">
        <div className="col-12">
          <h4 className="page-title">COURSE ENROLLMENT</h4>
          <p className="text-muted">Browse and enroll in available courses</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="row mb-4">
        <div className="col-md-6 mx-auto">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center flex-column">
                <div className="fs-1 mb-2">
                  <FaBook />
                </div>
                <div>
                  <h5 className="card-title mb-1">Total Courses</h5>
                  <h2 className="mb-0">{totalCourses}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
              <FaCheckCircle className="me-2" />
              <div className="me-auto">Operation completed successfully!</div>
              <button type="button" className="btn-close" onClick={() => dispatch(clearSuccess())}></button>
            </div>
          </div>
        </div>
      )}

      {(coursesError || enrollmentError) && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <FaExclamationTriangle className="me-2" />
              <div className="me-auto">{coursesError || enrollmentError}</div>
              <button type="button" className="btn-close" onClick={() => dispatch(clearError())}></button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Available Courses</h5>
            </div>
            <div className="card-body">
              {courses.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-book display-4 text-muted"></i>
                  <p className="mt-2 text-muted">No courses available at the moment.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th className="d-none d-sm-table-cell"><FaCode className="me-1"/> Course Code</th>
                        <th><FaBook className="me-1"/> Course Name</th>
                        <th className="d-none d-sm-table-cell"><FaBuilding className="me-1"/> Department</th>
                        <th className="d-none d-sm-table-cell"><FaUser className="me-1"/> Professor</th>
                        <th className="d-none d-sm-table-cell"><FaStar className="me-1"/> Credits</th>
                        <th className="d-none d-sm-table-cell"><FaUsers className="me-1"/> Students</th>
                        <th><FaEllipsisH className="me-1"/> Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id}>
                          <td className="d-none d-sm-table-cell" data-label="Course Code">
                            <code>{course.courseCode}</code>
                          </td>
                            <td data-label="Course Name">
                            <strong>{course.courseName}</strong>
                            {course.courseDescription && (
                              <div className="small text-muted mt-1">
                                {course.courseDescription.length > 50
                                  ? `${course.courseDescription.substring(0, 50)}...`
                                  : course.courseDescription}
                              </div>
                            )}
                          </td>
                          <td className="d-none d-sm-table-cell" data-label="Department">{course.department}</td>
                          <td className="d-none d-sm-table-cell" data-label="Professor">{course.professorName || 'TBD'}</td>
                          <td className="d-none d-sm-table-cell" data-label="Credits">{course.credits}</td>
                          <td className="d-none d-sm-table-cell" data-label="Students">{getEnrollmentCount(course)}</td>
                          <td data-label="Actions" style={{ position: 'relative' }}>
                            {/* Mobile-only three-dots menu */}
                            <button
                              className="btn btn-outline-secondary btn-sm d-inline d-sm-none me-2"
                              onClick={() => toggleMobileMenu(`course-${course.id}`)}
                              aria-haspopup="true"
                              aria-expanded={mobileMenuOpenFor === `course-${course.id}`}
                            >
                              <FaEllipsisH />
                            </button>
                            {mobileMenuOpenFor === `course-${course.id}` && (
                              <div className="mobile-action-menu shadow-sm bg-white border rounded p-2" style={{ position: 'absolute', right: 0, zIndex: 1050, minWidth: 140, overflow: 'visible' }}>
                                <button className="btn btn-sm btn-light w-100 mb-1 text-start" onClick={() => { setCourseToView(course); setMobileMenuOpenFor(null); }}>
                                  <FaEye className="me-2"/> View
                                </button>
                                {isEnrolled(course.id) ? (
                                  <button className="btn btn-sm btn-danger w-100 text-start" onClick={() => { const enrollment = enrollments.find(e => e.course_id === course.id && e.status === 'active'); if (enrollment) { setSelectedEnrollment(enrollment.id); setShowConfirmModal(true); } setMobileMenuOpenFor(null); }}>
                                    <FaMinusCircle className="me-2"/> Drop
                                  </button>
                                ) : (
                                  <button className="btn btn-sm btn-success w-100 text-start" onClick={() => { handleEnroll(course.id); setMobileMenuOpenFor(null); }}>
                                    <FaPlusCircle className="me-2"/> Enroll
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Desktop / small-up action buttons */}
                            {isEnrolled(course.id) ? (
                            <button
                              className="btn btn-outline-danger btn-sm d-none d-sm-inline d-flex align-items-center"
                              onClick={() => {
                                const enrollment = enrollments.find(e => e.course_id === course.id && e.status === 'active');
                                if (enrollment) {
                                  setSelectedEnrollment(enrollment.id);
                                  setShowConfirmModal(true);
                                }
                              }}
                              disabled={enrollmentLoading}
                            >
                              <FaMinusCircle /> <span className="ms-2 d-none d-sm-inline">Drop</span>
                            </button>
                            ) : (
                              <button
                                className="btn btn-outline-success btn-sm d-none d-sm-inline d-flex align-items-center"
                                onClick={() => handleEnroll(course.id)}
                                disabled={enrollmentLoading}
                              >
                                <FaPlusCircle /> <span className="ms-2 d-none d-sm-inline">Enroll</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Enrollments Section */}
      {enrollments.filter(e => e.status === 'active').length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">My Enrolled Courses</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th className="d-none d-sm-table-cell"><FaCode className="me-1"/> Course Code</th>
                        <th><FaBook className="me-1"/> Course Name</th>
                        <th className="d-none d-sm-table-cell"><FaBuilding className="me-1"/> Department</th>
                        <th className="d-none d-sm-table-cell"><FaUser className="me-1"/> Professor</th>
                        <th className="d-none d-sm-table-cell"><FaStar className="me-1"/> Credits</th>
                        <th className="d-none d-sm-table-cell"><FaUsers className="me-1"/> Students</th>
                        <th><FaEllipsisH className="me-1"/> Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.filter(e => e.status === 'active').map((enrollment) => (
                        <tr key={enrollment.id}>
                          <td className="d-none d-sm-table-cell" data-label="Course Code">
                            <code>{enrollment.courseCode}</code>
                          </td>
                          <td data-label="Course Name">
                            <strong>{enrollment.courseName}</strong>
                          </td>
                          <td className="d-none d-sm-table-cell" data-label="Department">{enrollment.department}</td>
                          <td className="d-none d-sm-table-cell" data-label="Professor">{enrollment.professorName || 'TBD'}</td>
                          <td className="d-none d-sm-table-cell" data-label="Credits">{enrollment.credits}</td>
                          <td className="d-none d-sm-table-cell" data-label="Students">{enrollment.enrolled_count || 0}</td>
                          <td data-label="Actions" style={{ position: 'relative' }}>
                            <button
                              className="btn btn-outline-secondary btn-sm d-inline d-sm-none me-2"
                              onClick={() => toggleMobileMenu(`enroll-${enrollment.id}`)}
                              aria-haspopup="true"
                              aria-expanded={mobileMenuOpenFor === `enroll-${enrollment.id}`}
                            >
                              <FaEllipsisH />
                            </button>
                            {mobileMenuOpenFor === `enroll-${enrollment.id}` && (
                              <div className="mobile-action-menu shadow-sm bg-white border rounded p-2" style={{ position: 'absolute', right: 0, zIndex: 1050, minWidth: 140, overflow: 'visible' }}>
                                <button className="btn btn-sm btn-light w-100 mb-1 text-start" onClick={() => { setCourseToView(enrollment); setMobileMenuOpenFor(null); }}>
                                  <FaEye className="me-2"/> View
                                </button>
                                <button className="btn btn-sm btn-danger w-100 text-start" onClick={() => { handleUnenroll(enrollment.id); setMobileMenuOpenFor(null); }}>
                                  <FaMinusCircle className="me-2"/> Drop
                                </button>
                              </div>
                            )}

                            <button
                              className="btn btn-outline-danger btn-sm d-none d-sm-inline"
                              onClick={() => handleUnenroll(enrollment.id)}
                              disabled={enrollmentLoading}
                            >
                              <FaMinusCircle /> <span className="ms-2 d-none d-sm-inline">Drop</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Course Details Modal */}
       {courseToView && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title d-flex align-items-center">
                  <FaBook className="me-2 text-primary"/> 
                  {courseToView.courseName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setCourseToView(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Top Header Section inside Modal */}
                  <div className="col-md-12 mb-2">
                     <span className="badge bg-primary fs-6 me-2">{courseToView.courseCode}</span>
                     <span className="badge bg-secondary fs-6">{courseToView.department}</span>
                  </div>
              
                  {/* Details Grid */}
                  <div className="col-12 col-md-4">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center p-2">
                        <FaUser className="text-primary mb-1 fs-5"/>
                        <div className="small text-muted">Professor</div>
                        <div className="fw-bold">{courseToView.professorName || 'TBD'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center p-2">
                        <FaStar className="text-warning mb-1 fs-5"/>
                        <div className="small text-muted">Credits</div>
                        <div className="fw-bold">{courseToView.credits}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center p-2">
                        <FaUsers className="text-info mb-1 fs-5"/>
                        <div className="small text-muted">Enrolled Students</div>
                        <div className="fw-bold">{getEnrollmentCount(courseToView)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setCourseToView(null)}>
                  Close
                </button>
                {/* Action button inside modal for convenience */}
                {isEnrolled(courseToView.id) ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const eId = getEnrollmentId(courseToView.id);
                      if(eId) { setSelectedEnrollment(eId); setShowConfirmModal(true); setCourseToView(null); }
                    }}
                  >
                    <FaMinusCircle className="me-2"/> Drop Course
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => handleEnroll(courseToView.id)}
                  >
                    <FaPlusCircle className="me-2"/> Enroll Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
       <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">
          <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
          Confirm Course Drop
        </h5>
        <button type="button" className="btn-close" onClick={cancelUnenroll}></button>
      </div>

      <div className="modal-body">
        <p>Are you sure you want to drop this course? This action cannot be undone.</p>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={cancelUnenroll}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={confirmUnenroll}>
          <i className="bi bi-trash-fill me-2"></i>
          Drop Course
        </button>
      </div>
    </div>
  </div>
</div>

      )}
      <style>{`
        /* Mobile stacked rows for course tables */
        @media (max-width: 575px) {
          .table thead { display: none; }
          .table, .table tbody, .table tr, .table td { display: block; width: 100%; }
          .table tr { margin-bottom: 0.75rem; border: 2px solid #dee2e6; border-radius: .25rem; padding: .5rem; }
          .table td { text-align: right; padding-left: 50%; position: relative; border-bottom: 1px solid #dee2e6; padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .table td:last-child { border-bottom: none; }
          .table td::before { content: attr(data-label); position: absolute; left: 0; width: 45%; padding-left: .75rem; font-weight: 600; text-align: left; }
          .d-none.d-sm-inline { display: none !important; }
          .card-header { display: block !important; }
          /* Mobile heading styling for enrolled courses */
          .mobile-heading { background: #f8f9fa; border-radius: .25rem; margin-bottom: 0.5rem; padding: 0.5rem 1rem; }
          .mobile-heading-grid { display: grid; grid-template-columns: 38% 62%; gap: 0.25rem 0.5rem; align-items: center; }
          .mobile-heading .label { color: #6c757d; font-weight: 600; text-align: left; }
          .mobile-heading .value { text-align: right; }
          .mobile-heading .value .btn { min-width: 36px; }
        }
        .mobile-action-menu button { white-space: nowrap; }
      `}</style>
    </div>
  );
};

export default EnrollCourse;
