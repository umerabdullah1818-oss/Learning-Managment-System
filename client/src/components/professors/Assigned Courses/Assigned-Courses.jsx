import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from "../../../config/api";
import { FaEye, FaImage, FaTimesCircle, FaCalendarAlt, FaBook, FaListOl, FaCode, FaBuilding, FaStar, FaTag, FaUsers, FaInfoCircle, FaFileAlt, FaClock, FaEllipsisH } from 'react-icons/fa';

const AssignedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null); // NEW for modal
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchAssignedCourses = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/courses/professor/${user.uuid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },

        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // API sometimes returns an array directly or an object like { data: [...] }
        const coursesPayload = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        console.log('Fetched assigned courses:', { raw: data, normalizedCount: coursesPayload.length });
        setCourses(coursesPayload);
      } catch (err) {
        setError('Failed to fetch assigned courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.uuid) {
      fetchAssignedCourses();
    }
  }, [user]);

  // Inject small responsive styles for the table and modal (one-time)
  useEffect(() => {
    const id = 'assigned-courses-responsive-styles';
    if (typeof document === 'undefined' || document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      .assigned-courses-table img { width: 100px; height: 64px; object-fit: cover; }
      .assigned-courses-table td, .assigned-courses-table th { vertical-align: middle; }
      @media (max-width: 991px) {
        .assigned-courses-table img { width: 80px; height: 56px; }
      }
      @media (max-width: 575px) {
        .assigned-courses-table thead { display: none; }
        .assigned-courses-table { width: 100%; }
        .assigned-courses-table tbody { display: block; }
        /* Each row becomes a 2-column grid: Name | Action */
        .assigned-courses-table tr {
          display: grid;
          grid-template-columns: 1fr 110px;
          gap: 8px;
          margin-bottom: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: .5rem;
          padding: .5rem;
          background: #fff;
        }
        .assigned-courses-table td {
          display: block;
          position: static;
          border: 0;
          padding: .25rem .5rem;
          background: transparent;
          text-align: left;
        }
        /* Heading label above the content */
        .assigned-courses-table td::before {
          content: attr(data-label);
          display: block;
          font-weight: 700;
          color: #333;
          margin-bottom: .25rem;
          text-align: left;
        }
        /* Show only Name and Action on phones */
        .assigned-courses-table td:not([data-label="Name"]):not([data-label="Action"]) { display: none; }
        /* Name column */
        .assigned-courses-table td[data-label="Name"] { grid-column: 1; white-space: normal; overflow: hidden; text-overflow: ellipsis; }
        /* Action column */
        .assigned-courses-table td[data-label="Action"] { grid-column: 2; text-align: center; }
        .assigned-courses-table td[data-label="Action"]::before { text-align: center; }
        .assigned-courses-table td[data-label="Action"] .btn { width: 100%; min-height: 40px; }
        /* Prevent table container horizontal scroll on small screens */
        .table-responsive { overflow-x: hidden; }
      }
      /* Make modal wider on large screens */
      .modal-xl { max-width: 1100px; }

      /* Assigned course modal custom styles */
      .assigned-course-modal .modal-content { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.18); }
      .assigned-course-modal .modal-header { padding: 18px 20px; border-bottom: 1px solid #eef2f6; display:flex; align-items:center; gap:12px; }
      .assigned-course-modal .modal-icon { width:48px; height:48px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:18px; }
      .assigned-course-modal .modal-body { padding: 20px; }
      .assigned-course-modal .modal-body .course-left { text-align:center; }
      .assigned-course-modal .modal-body .course-left img { width:100%; height:auto; max-height:220px; object-fit:cover; border-radius:8px; }
      .assigned-course-modal .meta-row { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
      .assigned-course-modal .meta-row .badge { margin:4px 4px; }
      .assigned-course-modal .details-list p { margin:6px 0; }
      .assigned-course-modal .detail-label { color:#556; font-weight:600; margin-right:6px; }
      .assigned-course-modal .details-table th { width:36%; font-weight:700; color:#3b5568; vertical-align:top; padding-top:8px; }
      .assigned-course-modal .details-table td { color:#2c3e50; }
      .assigned-course-modal .modal-footer { padding: 14px 20px; border-top: 1px solid #eef2f6; display:flex; justify-content:flex-end; gap:8px; }
      @media (max-width: 575px) {
        .assigned-course-modal .modal-header { gap:8px; padding:12px; }
        .assigned-course-modal .modal-icon { width:40px; height:40px; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleViewDetails = (course) => {
    setSelectedCourse(course);  // open modal
  };

  const closeModal = () => {
    setSelectedCourse(null);
  };

  if (loading) return <div className="text-center">Loading assigned courses...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const activeCourses = courses.filter(course => course.courseStatus === 'active');

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title"><FaBook className="me-2" /> Assigned Courses</h4>
        </div>

        <div className="card-body">
          {activeCourses.length === 0 ? (
            <p>No active courses assigned yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover assigned-courses-table">
                <thead>
                  <tr>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 40 }}><FaListOl className="me-1" /></th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 120 }}><FaImage className="me-1" />Image</th>
                    <th style={{ minWidth: 220 }}><FaBook className="me-1" />Name</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 120 }}><FaCode className="me-1" />Code</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 160 }}><FaBuilding className="me-1" />Department</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 80 }}><FaStar className="me-1" />Credits</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 100 }}><FaCalendarAlt className="me-1" />Semester</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 100 }}><FaTag className="me-1" />Type</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 100 }}><FaUsers className="me-1" />Enrolled</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 100 }}><FaInfoCircle className="me-1" />Status</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 220 }}><FaFileAlt className="me-1" />Description</th>
                    <th className="d-none d-sm-table-cell" style={{ minWidth: 140 }}><FaClock className="me-1" />Created At</th>
                    <th style={{ minWidth: 120, textAlign: 'center' }}><FaEllipsisH className="me-1" />Action</th>
                  </tr>
                </thead>

                <tbody>
                  {activeCourses.map((course, index) => (
                    <tr key={course.id}>
                      <td className="d-none d-sm-table-cell" data-label="#">{index + 1}</td>
                      <td className="d-none d-sm-table-cell" data-label="Course Image">
                        {course.courseImage ? (
                          (() => {

                            const img = String(course.courseImage || '');
                            const imageSrc = img.startsWith('http://') || img.startsWith('https://')
                              ? img
                              : img.startsWith('/')
                                ? `${API_BASE_URL}${img}`
                                : `${API_BASE_URL}/images/${img}`;
                            return (
                              <img
                                src={imageSrc}
                                alt={course.courseName}
                                className="rounded"
                              />
                            );
                          })()
                        ) : (
                          <div className="text-muted d-flex align-items-center"><FaImage className="me-2" /> No Image</div>
                        )}
                      </td>
                      <td data-label="Name">{course.courseName}</td>
                      <td className="d-none d-sm-table-cell" data-label="Code">{course.courseCode}</td>
                      <td className="d-none d-sm-table-cell" data-label="Department">{course.department}</td>
                      <td className="d-none d-sm-table-cell" data-label="Credits">{course.credits}</td>
                      <td className="d-none d-sm-table-cell" data-label="Semester">{course.semester}</td>
                      <td className="d-none d-sm-table-cell" data-label="Type">{course.courseType}</td>
                      <td className="d-none d-sm-table-cell" data-label="Enrolled">{course.enrolledStudents}</td>
                      <td className="d-none d-sm-table-cell" data-label="Status">
                        <span className={`badge ${course.courseStatus === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {course.courseStatus}
                        </span>
                      </td>
                      <td className="d-none d-sm-table-cell" data-label="Description">
                        {course.courseDescription
                          ? course.courseDescription.length > 80
                            ? course.courseDescription.substring(0, 80) + '...'
                            : course.courseDescription
                          : '—'}
                      </td>
                      <td className="d-none d-sm-table-cell" data-label="Created At">{new Date(course.createdAt).toLocaleDateString()}</td>
                      <td data-label="Action" className="text-center">
                        <button
                          className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                          onClick={() => handleViewDetails(course)}
                          title={`View ${course.courseName}`}
                        >
                          <FaEye /> <span className="ms-2 d-none d-sm-inline">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL ====================== */}
      {selectedCourse && (
        <div className="modal fade show assigned-course-modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">

              <div className="modal-header">
                <div className="d-flex align-items-center">
                  <div className="modal-icon bg-primary text-white me-3"><FaBook /></div>
                  <div>
                    <h5 className="modal-title mb-0">{selectedCourse.courseName}</h5>
                    <small className="text-muted">{selectedCourse.courseCode}</small>
                  </div>
                </div>
                <button className="btn-close ms-auto" onClick={closeModal} aria-label="Close"></button>
              </div>

              <div className="modal-body">
                <div className="row gy-3">

                  <div className="col-12 col-md-4 course-left">
                    {selectedCourse.courseImage ? (
                      (() => {
                        const img = String(selectedCourse.courseImage || '');
                        const imageSrc = img.startsWith('http://') || img.startsWith('https://')
                          ? img
                          : img.startsWith('/')
                            ? `${API_BASE_URL}${img}`
                            : `${API_BASE_URL}/images/${img}`;
                        return (
                          <img
                            src={imageSrc}
                            alt="Course"
                          />
                        );
                      })()
                    ) : (
                      <div className="text-muted d-flex align-items-center justify-content-center" style={{ height: 160 }}>
                        <FaImage className="me-2" /> No Image
                      </div>
                    )}
                    <div className="meta-row mt-3">
                      <span className="badge bg-info text-dark"><FaCalendarAlt className="me-1" /> {selectedCourse.semester}</span>
                      <span className="badge bg-primary">{selectedCourse.credits} credits</span>
                      <span className="badge bg-secondary">{selectedCourse.courseType}</span>
                    </div>
                  </div>

                  <div className="col-12 col-md-8">
                    <div className="details-list">
                      <table className="table table-sm details-table mb-0">
                        <tbody>
                          <tr>
                            <th>Course Code</th>
                            <td>{selectedCourse.courseCode}</td>
                          </tr>
                          <tr>
                            <th>Department</th>
                            <td>{selectedCourse.department}</td>
                          </tr>
                          <tr>
                            <th>Credits</th>
                            <td>{selectedCourse.credits}</td>
                          </tr>
                          <tr>
                            <th>Semester</th>
                            <td>{selectedCourse.semester}</td>
                          </tr>
                          <tr>
                            <th>Course Type</th>
                            <td>{selectedCourse.courseType}</td>
                          </tr>
                          <tr>
                            <th>Enrolled</th>
                            <td>{selectedCourse.enrolledStudents}</td>
                          </tr>
                          <tr>
                            <th>Status</th>
                            <td><span className={`badge ${selectedCourse.courseStatus === 'active' ? 'bg-success' : 'bg-secondary'}`}>{selectedCourse.courseStatus}</span></td>
                          </tr>
                          <tr>
                            <th>Description</th>
                            <td>{selectedCourse.courseDescription || '—'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <div className="d-flex gap-2">

                  <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssignedCourses;
