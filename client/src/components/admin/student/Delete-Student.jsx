import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteStudent, clearError, resetSuccess } from '../../../redux/slices/studentSlice';
import { toast } from 'react-toastify';

const DeleteStudent = ({ studentId, studentName, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.student);
  const [showModal, setShowModal] = useState(true);

  const prevSuccess = useRef(false);

  useEffect(() => {
    // Show success toast only on transition from false -> true
    if (success && !prevSuccess.current) {
      toast.success('Student deleted successfully!');
      dispatch(resetSuccess());
    }
    if (error) {
      // prevent duplicate error toasts in strict mode by checking prev state
      toast.error(error);
      dispatch(clearError());
    }
    prevSuccess.current = success;
  }, [success, error, dispatch]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteStudent(studentId)).unwrap();
      setShowModal(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const handleClose = () => {
    setShowModal(false);
    dispatch(clearError());
    dispatch(resetSuccess());
    if (onClose) {
      onClose();
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title" id="deleteModalLabel">
              <i className="bi bi-exclamation-triangle me-2"></i>Confirm Delete
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={handleClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete <strong>{studentName}</strong>?</p>
            <p className="text-danger"><strong>This action cannot be undone!</strong></p>
            {error && <div className="alert alert-danger">{error}</div>}
            {/* {success && <div className="alert alert-success">Student deleted successfully!</div>} */}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudent;
