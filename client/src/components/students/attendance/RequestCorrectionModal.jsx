import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const requestCorrectionModalStyles = `
/* Overlay */
.correction-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* Modal */
.correction-modal {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  max-width: 760px;
  width: min(760px, 100%);
  border: 1px solid #e8edf3;
  overflow: hidden;
  animation: popupIn 0.3s ease;
}

/* Popup animation */
@keyframes popupIn {
  from {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #95a5a6;
  transition: color 0.2s ease;
}

.btn-close:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.record-info .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-info label {
  font-weight: 600;
  color: #2c3e50;
}

.record-info span {
  color: #7f8c8d;
}

.status-badge {
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 5px;
  font-size: 14px;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  margin-top: 5px;
  font-size: 12px;
  text-align: right;
  color: #95a5a6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.modal-footer {
  padding: 15px 25px;
  border-top: 1px solid #ecf0f1;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.modal-footer p {
  margin: 0;
  font-size: 12px;
  color: #7f8c8d;
}

/* Desktop refinements */
@media (min-width: 900px) {
  .correction-modal {
    transform: translateY(-6px);
  }

  .modal-body {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    align-items: start;
    gap: 24px;
  }

  .record-info {
    height: 100%;
  }

  .modal-body form {
    display: grid;
    gap: 18px;
  }

  .form-group,
  .form-actions {
    margin: 0;
  }
}

/* Tablet */
@media (max-width: 768px) {
  .correction-modal-overlay {
    padding: 15px;
  }

  .correction-modal {
    max-width: 95%;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-header h3 {
    font-size: 17px;
  }

  .modal-body {
    padding: 20px;
    gap: 18px;
  }

  .record-info {
    padding: 12px;
  }

  .form-group select,
  .form-group textarea {
    font-size: 15px;
    padding: 12px;
  }

  .form-actions .btn {
    padding: 12px 18px;
    font-size: 15px;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .correction-modal-overlay {
    padding: 10px;
    align-items: flex-end;
  }

  .correction-modal {
    max-width: 100%;
    width: 100%;
    border-radius: 12px 12px 0 0;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    padding: 16px;
    border-bottom: 2px solid #ecf0f1;
  }

  .modal-header h3 {
    font-size: 16px;
    font-weight: 700;
  }

  .btn-close {
    font-size: 28px;
    padding: 4px;
  }

  .modal-body {
    padding: 16px;
    gap: 16px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .record-info {
    padding: 14px;
    gap: 12px;
    border-radius: 8px;
    border: 1px solid #e8edf3;
  }

  .record-info .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .record-info label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #7f8c8d;
  }

  .record-info span {
    font-size: 15px;
    font-weight: 600;
    color: #2c3e50;
  }

  .status-badge {
    padding: 4px 10px;
    background-color: #ffebee;
    border-radius: 4px;
    font-size: 13px;
  }

  .form-group {
    margin-bottom: 18px;
  }

  .form-group label {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .form-group select,
  .form-group textarea {
    font-size: 15px;
    padding: 14px;
    border-radius: 8px;
    border: 2px solid #e8edf3;
  }

  .form-group select:focus,
  .form-group textarea:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
  }

  .form-group textarea {
    min-height: 120px;
  }

  .char-count {
    font-size: 13px;
    margin-top: 8px;
    color: #7f8c8d;
  }

  .form-actions {
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .form-actions .btn {
    width: 100%;
    padding: 14px 20px;
    font-size: 15px;
    border-radius: 8px;
    font-weight: 700;
  }

  .btn-primary {
    order: -1;
  }

  .modal-footer {
    padding: 14px 16px;
    border-top: 2px solid #ecf0f1;
  }

  .modal-footer p {
    font-size: 13px;
    line-height: 1.5;
    color: #7f8c8d;
  }
}
`;

const RequestCorrectionModal = ({ record, courseId, onSubmit, onClose }) => {
  const [requestedStatus, setRequestedStatus] = useState('Present');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔒 Lock background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for the correction request');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        courseId,
        attendanceId: record.attendance_id,
        date: record.attendance_date,
        requestedStatus,
        reason,
      });
      toast.success('Correction request submitted successfully');
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit correction request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="correction-modal-overlay" onClick={onClose}>
      <style>{requestCorrectionModalStyles}</style>

      <div className="correction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Attendance Correction</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="record-info">
            <div className="info-item">
              <label>Date:</label>
              <span>
                {new Date(record.attendance_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="info-item">
              <label>Current Status:</label>
              <span className="status-badge" style={{ color: '#f44336' }}>
                {record.status}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Requested Status</label>
              <select
                value={requestedStatus}
                onChange={(e) => setRequestedStatus(e.target.value)}
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reason for Request</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                placeholder="Please explain why you request this correction..."
              />
              <div className="char-count">{reason.length}/500</div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary flex-fill" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <p>
            Your request will be reviewed by your instructor. You will be notified
            once it has been processed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestCorrectionModal;
