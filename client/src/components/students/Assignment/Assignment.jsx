import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFileAlt, FaDownload, FaUpload, FaTimes, FaClock, FaBook, FaInfoCircle, FaEllipsisH } from 'react-icons/fa';
import { API_BASE_URL } from '../../../config/api';

const Assignment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [hasActiveEnrollments, setHasActiveEnrollments] = useState(false);

  const apiBase = API_BASE_URL;

  /**
   * Fetch assignments ONLY for courses where student is currently enrolled
   * This is the primary data fetch that replaces the old method
   * Benefits:
   * - Single API call instead of multiple calls per course
   * - Database filters by enrollment status automatically
   * - Excludes dropped, completed, or inactive courses
   * - Includes submission status for each assignment
   */
  useEffect(() => {
    const fetchEnrolledAssignments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');

        if (!token) {
          console.warn('No access token found in localStorage');
          throw new Error('Not authenticated');
        }

        // New endpoint: fetches assignments only for active enrolled courses
        const response = await fetch(`${apiBase}/api/assignments/student/enrolled`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('You do not have permission to view assignments');
          }
          throw new Error(`Failed to fetch assignments (Status: ${response.status})`);
        }

        const data = await response.json();
        console.debug('Fetched student enrolled assignments:', data);

        // Extract assignments array from response
        const assignmentData = Array.isArray(data.data) ? data.data : [];
        const hasEnrollments = data.hasActiveEnrollments || false;

        setAssignments(assignmentData);
        setHasActiveEnrollments(hasEnrollments);
        setError(null);

        // Show appropriate message if no assignments
        if (assignmentData.length === 0) {
          if (!hasEnrollments) {
            setError('You are not enrolled in any courses yet.');
          } else {
            setError('No assignments available for your current courses.');
          }
        }
      } catch (err) {
        console.error('Error fetching enrolled assignments:', err);
        setError(err.message || 'Failed to load assignments');
        setAssignments([]);
        setHasActiveEnrollments(false);
        // Only show toast for unexpected errors
        if (!err.message?.includes('Not authenticated')) {
          toast.error(err.message || 'Failed to load assignments');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.uuid) {
      fetchEnrolledAssignments();
    }
  }, [user?.uuid]); // Only depend on user UUID

  /**
   * Handle opening upload modal for assignment submission
   * Validates that assignment hasn't already been submitted
   */
  const handleUploadClick = (assignment) => {
    // Check if assignment is already submitted
    if (assignment.studentSubmissionStatus === 'Submitted' || assignment.studentSubmissionStatus === 'Late') {
      toast.warning('You have already submitted this assignment. Resubmission is not allowed.');
      return;
    }

    // Check if assignment is graded (typically can't resubmit)
    if (assignment.status === 'Graded') {
      toast.warning('This assignment is already graded and cannot be resubmitted.');
      return;
    }

    setSelectedAssignment(assignment);
    setSubmissionFile(null);
    setShowUploadModal(true);
  };

  /**
   * Handle file selection with validation
   * - Only allows PDF and Word files
   * - Limits file size to 10MB
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF, Word, etc.)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and Word files are allowed!');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB!');
        return;
      }

      setSubmissionFile(file);
    }
  };

  /**
   * Submit assignment to professor
   * Uploads file to server and updates assignment submission status
   */
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submissionFile) {
      toast.error('Please select a file before submitting');
      return;
    }

    try {
      setSubmittingId(selectedAssignment.id);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('You must be logged in to submit assignments');
        return;
      }

      const formData = new FormData();
      formData.append('submissionFile', submissionFile);

      // Submit to assignment endpoint
      const response = await fetch(`${apiBase}/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Failed to submit assignment';
        throw new Error(errorMessage);
      }

      toast.success('Assignment submitted successfully!');
      setShowUploadModal(false);
      setSelectedAssignment(null);
      setSubmissionFile(null);

      // Update local state to reflect submission
      setAssignments(prev =>
        prev.map(a =>
          a.id === selectedAssignment.id
            ? { ...a, studentSubmissionStatus: 'Submitted', studentSubmittedAt: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      console.error('Error submitting assignment:', err);
      toast.error(err.message || 'Failed to submit assignment');
    } finally {
      setSubmittingId(null);
    }
  };

  /**
   * Download assignment file from server
   */
  const handleDownload = (filePath) => {
    if (filePath) {
      window.open(`${apiBase}/assignments/${filePath}`, '_blank');
    } else {
      toast.info('No file available for download');
    }
  };

  /**
   * Get status badge component with appropriate styling
   * Different colors for different statuses: Pending, Submitted, Late, Graded
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="badge bg-warning">Pending</span>;
      case 'Submitted':
        return <span className="badge bg-success">Submitted</span>;
      case 'Late':
        return <span className="badge bg-danger">Late</span>;
      case 'Graded':
        return <span className="badge bg-info">Graded</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="assignment-container">
      {/* Header Section */}
      <div className="assignment-header d-flex align-items-center justify-content-between flex-wrap">
        <div className="d-flex align-items-center gap-3">
          <div className="icon-box bg-primary text-white d-flex align-items-center justify-content-center rounded" style={{ width: 56, height: 56 }}>
            <FaFileAlt />
          </div>
          <div>
            <h2 className="mb-0">My Assignments</h2>
            <p className="subtitle mb-0">Assignments from your enrolled courses</p>
          </div>
        </div>
        <div className="ms-auto mt-2 mt-sm-0">
          <small className="text-muted">
            <strong>{assignments.length} assignment(s)</strong>
          </small>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <FaClock className="spinner-icon" />
          <span>Loading assignments from your enrolled courses...</span>
        </div>
      )}

      {/* Error/Empty State */}
      {!loading && error && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaFileAlt />
          </div>
          <h4 className="empty-state-title">No Assignments Available</h4>
          <p className="empty-state-message">{error}</p>
          <p className="empty-state-hint">
            {!hasActiveEnrollments
              ? 'Enroll in courses to see their assignments.'
              : 'Check back later for new assignments.'}
          </p>
        </div>
      )}

      {/* Assignments Table */}
      {!loading && assignments.length > 0 && (
        <div className="table-responsive">
          <table className="assignments-table table table-striped table-hover table-bordered" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>
                  <FaFileAlt className="me-1" /> Title
                </th>
                <th>
                  <FaBook className="me-1" /> Course
                </th>
                <th>
                  <FaClock className="me-1" /> Due Date
                </th>
                <th>
                  <FaInfoCircle className="me-1" /> Status
                </th>
                <th>
                  <FaDownload className="me-1" /> File
                </th>
                <th>
                  <FaEllipsisH className="me-1" /> Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id || assignment.uuid}>
                  <td data-label="Title">{assignment.title}</td>
                  <td data-label="Course">
                    <div>
                      <strong>{assignment.courseName || 'N/A'}</strong>
                      <br />
                      <small className="text-muted">{assignment.courseCode}</small>
                    </div>
                  </td>
                  <td data-label="Due Date">
                    {new Date(assignment.dueDate).toLocaleString()}
                  </td>
                  <td data-label="Status">
                    {getStatusBadge(assignment.studentSubmissionStatus || assignment.status)}
                  </td>
                  <td data-label="File">
                    {assignment.filePath ? (
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        onClick={() => handleDownload(assignment.filePath)}
                        title="Download assignment"
                      >
                        <FaDownload /> <span className="ms-2 d-none d-sm-inline">Download</span>
                      </button>
                    ) : (
                      <span className="muted d-inline-flex align-items-center">
                        <FaFileAlt className="me-2" /> —
                      </span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <button
                      className="btn btn-sm btn-primary d-flex align-items-center"
                      onClick={() => handleUploadClick(assignment)}
                      disabled={
                        assignment.status === 'Graded' ||
                        assignment.studentSubmissionStatus === 'Submitted' ||
                        assignment.studentSubmissionStatus === 'Late'
                      }
                      title={
                        (assignment.studentSubmissionStatus === 'Submitted' || assignment.studentSubmissionStatus === 'Late')
                          ? 'Already submitted'
                          : 'Submit assignment'
                      }
                    >
                      <FaUpload /> <span className="ms-2 d-none d-sm-inline">Submit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Submission Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h3 className="mb-0">
                <FaUpload className="me-2" /> Submit Assignment
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowUploadModal(false)}
                aria-label="Close upload modal"
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="assignment-info mb-3 p-3 bg-light rounded">
                <p className="mb-2">
                  <strong>Assignment:</strong> {selectedAssignment?.title}
                </p>
                <p className="mb-0">
                  <strong>Course:</strong> {selectedAssignment?.courseName}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Select File to Upload</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="submissionFile"
                    className="file-input"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx"
                  />
                  <label
                    htmlFor="submissionFile"
                    className="file-input-label d-flex align-items-center gap-2"
                  >
                    <FaFileAlt />{' '}
                    {submissionFile ? `Selected: ${submissionFile.name}` : 'Choose PDF or Word file'}
                  </label>
                </div>
                <small className="form-helper">
                  Allowed formats: PDF, Word (.doc, .docx) - Max size: 10MB
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary d-flex align-items-center"
                onClick={handleSubmitAssignment}
                disabled={submittingId === selectedAssignment?.id || !submissionFile}
              >
                {submittingId === selectedAssignment?.id ? (
                  <>
                    <FaClock className="me-2" /> Submitting...
                  </>
                ) : (
                  <>
                    <FaUpload className="me-2" /> Submit Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .assignment-container {
          padding: 20px;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .assignment-header {
          margin-bottom: 30px;
        }

        .assignment-header h2 {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .alert-info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .alert-danger {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .table-responsive {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: auto;
        }

        .assignments-table {
          width: 100%;
          border-collapse: collapse;
        }

        .assignments-table th {
          background: #f9f9f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e6e6e6;
          color: #333;
        }

        .assignments-table td {
          padding: 12px;
          border-bottom: 1px solid #e6e6e6;
        }

        .assignments-table tbody tr:hover {
          background: #fafafa;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .bg-warning {
          background: #ffc107;
          color: #333;
        }
        .bg-success {
          background: #28a745;
          color: white;
        }
        .bg-danger {
          background: #dc3545;
          color: white;
        }
        .bg-info {
          background: #17a2b8;
          color: white;
        }
        .bg-secondary {
          background: #6c757d;
          color: white;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-primary:disabled:hover {
          background: #ccc;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-sm {
          padding: 6px 10px;
          font-size: 12px;
        }

        .btn-outline-primary {
          border: 1px solid #007bff;
          background: white;
          color: #007bff;
        }

        .btn-outline-primary:hover {
          background: #007bff;
          color: white;
        }

        .muted {
          color: #888;
        }

        /* Responsive stacked rows for assignments table */
        

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 400px;
          max-width: 500px;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e6e6e6;
          background: #f9f9f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
          font-weight: 600;
        }

        .close-btn {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .assignment-info {
          border-left: 4px solid #007bff;
        }

        .assignment-info p {
          margin-bottom: 8px;
        }

        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #e6e6e6;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          background: #f9f9f9;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
        }

        .file-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border: 2px dashed #ddd;
          border-radius: 4px;
          padding: 10px;
          background: #fafafa;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-input-wrapper:hover {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          flex: 1;
          font-size: 14px;
          color: #666;
          cursor: pointer;
        }

        .form-helper {
          display: block;
          font-size: 12px;
          color: #999;
          margin-top: 6px;
        }

        /* Empty State Styles */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-top: 30px;
        }

        .empty-state-icon {
          font-size: 64px;
          color: #ccc;
          margin-bottom: 20px;
        }

        .empty-state-title {
          font-size: 22px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .empty-state-message {
          font-size: 16px;
          color: #666;
          margin-bottom: 8px;
        }

        .empty-state-hint {
          font-size: 14px;
          color: #999;
          margin: 0;
        }

        /* ===================== */
/* MOBILE: HORIZONTAL SCROLL ONLY */
/* ===================== */
@media (max-width: 576px) {

  /* Keep same table layout as desktop */
  .assignments-table {
    min-width: 900px; /* forces horizontal scroll */
  }

  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Prevent content breaking */
  .assignments-table th,
  .assignments-table td {
    white-space: nowrap;
  }

  /* Reduce padding slightly for mobile */
  .assignments-table th,
  .assignments-table td {
    padding: 10px;
  }

  /* Modal full width on mobile */
  .modal-content {
    width: 95%;
    max-width: 95%;
    min-width: auto;
  }
}

      `}</style>
    </div>
  );
};

export default Assignment;
