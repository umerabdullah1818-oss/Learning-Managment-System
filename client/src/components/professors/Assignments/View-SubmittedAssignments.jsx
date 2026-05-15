import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaDownload, FaArrowLeft, FaUser, FaEnvelope, FaFileAlt, FaBook, FaClock, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL } from '../../../config/api';

const ViewSubmittedAssignments = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const apiBase = API_BASE_URL;

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${apiBase}/api/assignments/${assignmentId}/submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch submissions');
        }

        const data = await response.json();
        setAssignment(data.data.assignment);
        setSubmissions(data.data.submissions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'Failed to load submissions');
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId && user?.uuid) {
      fetchSubmissions();
    }
  }, [assignmentId, user]);

  const getStatusBadge = (status) => {
    switch (status) {
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

  const handleDownload = (filePath) => {
    if (filePath) {
      window.open(`${apiBase}/submissions/${filePath}`, '_blank');
    } else {
      toast.info('No file available for Viewin');
    }
  };

  return (
    <div className="view-submissions-container">
      <div className="submissions-header">
        <button 
          className="btn btn-secondary d-flex align-items-center"
          onClick={() => navigate('/professor/assignments')}
          aria-label="Back to assignments"
        >
          <FaArrowLeft className="me-2" /> Back to Assignments
        </button>
        <h2><FaFileAlt className="me-2" /> Assignment Submissions</h2>
      </div>

      {assignment && (
        <div className="assignment-info">
          <div className="info-item">
              <label><FaFileAlt className="me-1"/> Title:</label>
              <span>{assignment.title}</span>
            </div>
            <div className="info-item">
              <label><FaBook className="me-1"/> Course:</label>
              <span>{assignment.courseName || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label><FaClock className="me-1"/> Due Date:</label>
              <span>{new Date(assignment.dueDate).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label><FaUsers className="me-1"/> Total Submissions:</label>
              <span>{submissions.length}</span>
            </div>
            <div className="info-item">
              <label><FaExclamationTriangle className="me-1"/> Late Submissions:</label>
              <span className="late-count">{submissions.filter(s => s.status === 'Late').length}</span>
            </div>
        </div>
      )}

      {loading && <div className="alert alert-info">Loading submissions...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && submissions.length === 0 && (
        <div className="submissions-empty-state">
          <div className="submissions-empty-icon">
            <FaUsers />
          </div>
          <h4 className="submissions-empty-title">No submissions yet for this assignment</h4>
          <p className="submissions-empty-message">Students have not submitted their work yet. Check back later.</p>
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <div className="table-responsive">
          <table className="submissions-table table table-striped table-hover" style={{ minWidth: 950 }}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td data-label="Student Name">
                    <div className="d-flex align-items-center gap-2">
                      <FaUser />
                      <span>{(() => {
                        // Prefer separate first + last name fields returned by API
                        const first = submission.studentFirstName || '';
                        const last = submission.studentLastName || '';
                        const combined = `${first} ${last}`.trim();
                        return combined || submission.studentName || 'Unknown';
                      })()}</span>
                    </div>
                  </td>
                  <td data-label="Email">
                    <div className="d-flex align-items-center gap-2"><FaEnvelope /> <span>{submission.studentEmail || 'N/A'}</span></div>
                  </td>
                  <td data-label="Status">{getStatusBadge(submission.status)}</td>
                  <td data-label="Submitted At">{new Date(submission.submittedAt).toLocaleString()}</td>
                  <td data-label="File">
                    {submission.filePath ? (
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        onClick={() => handleDownload(submission.filePath)}
                        title="View submission"
                      >
                        <FaDownload /> <span className="ms-2 d-none d-sm-inline">View</span>
                      </button>
                    ) : (
                      <span className="muted d-inline-flex align-items-center"><FaFileAlt className="me-2"/> —</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .view-submissions-container {
          padding: 20px;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .submissions-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .submissions-header h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #333;
          flex: 1;
        }

        .submissions-header .btn { display:inline-flex; align-items:center; gap:8px; }

        .assignment-info {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-item label {
          font-weight: 700;
          color: #333;
          font-size: 13px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .late-count {
          color: #dc3545;
          font-weight: 600;
        }

        .info-item span {
          color: #555;
          font-size: 14px;
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

        .table-responsive {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: auto;
        }

        /* Submissions empty state */
        .submissions-empty-state {
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:40px 20px;
          background:white;
          border-radius:8px;
          box-shadow:0 2px 8px rgba(0,0,0,0.08);
          margin-top:20px;
          text-align:center;
        }

        .submissions-empty-icon { font-size:48px; color:#ced4da; margin-bottom:12px; }
        .submissions-empty-title { font-size:20px; font-weight:600; color:#333; margin:0 0 8px 0; }
        .submissions-empty-message { font-size:14px; color:#666; margin:0; }

        .submissions-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
          border: 1px solid #e6e6e6;
        }

        .submissions-table th {
          background: #f9f9f9;
          padding: 12px;
          text-align: left;
          font-weight: 700;
          border: 1px solid #e6e6e6;
          color: #333;
        }

        .submissions-table td {
          padding: 12px;
          border: 1px solid #e6e6e6;
        }

        .submissions-table td .me-2 { margin-right: .5rem; }

        .submissions-table tbody tr:hover {
          background: #fafafa;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .bg-success { background: #28a745; color: white; }
        .bg-danger { background: #dc3545; color: white; }
        .bg-info { background: #17a2b8; color: white; }
        .bg-secondary { background: #6c757d; color: white; }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
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

        .btn-link {
          background: transparent;
          color: #007bff;
          text-decoration: underline;
          padding: 0;
        }

        .btn-link:hover {
          color: #0056b3;
        }

        .muted {
          color: #888;
        }

        /* Mobile stacked table */
        @media (max-width: 575px) {
          /* Stack header actions and title on small screens */
          .submissions-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .submissions-header h2 { font-size: 20px; }
          .submissions-header .btn { width: auto; }

          /* allow table to shrink under small screens */
          .table-responsive { overflow-x: auto; }
          .submissions-table thead { display: none; }
          .submissions-table, .submissions-table tbody, .submissions-table tr, .submissions-table td { display: block; width: 100%; }
          .submissions-table tr { margin-bottom: 0.75rem; border: 1px solid #e9ecef; border-radius: .25rem; padding: .5rem; }
          .submissions-table td { text-align: right; padding-left: 50%; position: relative; border: none; }
          .submissions-table td::before { content: attr(data-label); position: absolute; left: 0; width: 45%; padding-left: .75rem; font-weight: 600; text-align: left; }
          .submissions-table td .d-none.d-sm-inline { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ViewSubmittedAssignments;
