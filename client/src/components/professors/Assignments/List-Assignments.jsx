import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignmentsByProfessor, deleteAssignment } from '../../../redux/slices/assignmentSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import '../../../css/dashboard.css';
import { FaPlus, FaEye, FaEdit, FaTrash, FaDownload, FaFileAlt, FaBook, FaClock, FaInfoCircle, FaUsers, FaEllipsisH } from 'react-icons/fa';

const ListAssignments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const { assignmentsByProfessor = [], loading, error } = useSelector((state) => state.assignment);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.uuid) dispatch(fetchAssignmentsByProfessor(user.uuid));
  }, [dispatch, user]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleCreate = () => navigate('/add-assignment');

  const handleDeleteClick = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAssignmentId) {
      dispatch(deleteAssignment(selectedAssignmentId));
      setShowConfirmModal(false);
      setSelectedAssignmentId(null);
      toast.success('Assignment deleted successfully!');
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setSelectedAssignmentId(null);
    toast.info('Delete cancelled');
  };

  const apiBase = API_BASE_URL;

  return (
    <div className="list-assignments-container">
      <div className="list-header">
        <h2>Assignments</h2>
        <button className="btn btn-primary d-inline-flex align-items-center" onClick={handleCreate}>
          <FaPlus className="me-2"/> Create Assignment
        </button>
      </div>

      {loading && <p>Loading assignments...</p>}
      {!loading && error && <p className="error-text">{error}</p>}

      {!loading && assignmentsByProfessor.length === 0 && (
        <div className="prof-empty-state">
          <div className="prof-empty-icon"><FaFileAlt /></div>
          <h4 className="prof-empty-title">No assignments found</h4>
          <p className="prof-empty-message">Click <strong>Create Assignment</strong> to add one.</p>
        </div>
      )}

      {!loading && assignmentsByProfessor.length > 0 && (
        <div className="table-responsive-scroll">
          <table className="assignments-table table table-striped table-hover">
            <thead>
              <tr>
                <th><FaFileAlt className="me-1"/> Title</th>
                <th><FaBook className="me-1"/> Course</th>
                <th><FaClock className="me-1"/> Due Date</th>
                <th><FaInfoCircle className="me-1"/> Status</th>
                <th><FaDownload className="me-1"/> File</th>
                <th><FaUsers className="me-1"/> Submissions</th>
                <th><FaEllipsisH className="me-1"/> Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignmentsByProfessor.map((a) => (
                <tr key={a.uuid || a.id}>
                  <td>{a.title}</td>
                  <td>{a.courseName || ''}</td>
                  <td>{new Date(a.dueDate).toLocaleString()}</td>
                  <td>{a.status}</td>
                  <td>
                    {a.filePath ? (
                      <a href={`${apiBase}/assignments/${a.filePath}`} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center">
                        <FaDownload className="me-2" /> Download
                      </a>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-success d-flex align-items-center"
                      onClick={() => navigate(`/professor/assignments/${a.id}/submissions`)}
                    >
                      <FaEye /> <span className="ms-2">See Submitted</span>
                    </button>
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      <button 
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        onClick={() => navigate(`/add-assignment?id=${a.id}`)}
                      >
                        <FaEdit /> 
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger d-flex align-items-center"
                        onClick={() => handleDeleteClick(a.id)}
                      >
                        <FaTrash /> 
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><FaTrash className="text-danger me-2"/> Delete Assignment</h5>
                <button type="button" className="btn-close" onClick={handleCancelDelete}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this assignment? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCancelDelete}>Cancel</button>
                <button className="btn btn-danger" onClick={handleConfirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .list-assignments-container { padding: 20px; }
        .list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:12px; flex-wrap: wrap; }
        .assignments-table { width:100%; border-collapse:collapse; min-width: 600px; }
        .assignments-table th, .assignments-table td { padding:10px; border:1px solid #e6e6e6; text-align:left; }
        .assignments-table th { background:#fafafa; font-weight:600; }
        .error-text { color: #c00; }
        .muted { color:#888; }
        .list-header .btn { display: inline-flex; align-items:center; gap:8px; }

        .prof-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 20px; background:white; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); margin-top:24px; text-align:center; }
        .prof-empty-icon { font-size:48px; color:#ced4da; margin-bottom:14px; }
        .prof-empty-title { font-size:20px; font-weight:600; color:#333; margin:0 0 8px 0; }
        .prof-empty-message { font-size:14px; color:#666; margin:0; }

        /* Scrollable table wrapper for mobile */
        .table-responsive-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 575px) {
          .assignments-table { min-width: 600px; }
        }

        /* Modal Styles */
        .modal-header { padding: 16px 20px; border-bottom: 1px solid #e6e6e6; background: #f9f9f9; }
        .modal-body { padding: 18px 20px; color: #555; font-size: 14px; line-height: 1.5; }
        .modal-footer { padding: 12px 16px; border-top: 1px solid #e6e6e6; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
        .modal-footer .btn { padding: 8px 16px; font-size: 14px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s ease; }
        .btn-secondary { background: #e6e6e6; color: #333; }
        .btn-secondary:hover { background: #d6d6d6; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
      `}</style>
    </div>
  );
};

export default ListAssignments;
