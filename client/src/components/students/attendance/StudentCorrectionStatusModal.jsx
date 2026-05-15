import React from 'react';

const styles = `
.status-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}
.status-modal{background:#fff;padding:20px;border-radius:8px;max-width:520px;width:100%;}
.status-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.status-body{padding:8px 0}
.status-row{display:flex;justify-content:space-between;margin:8px 0}
.badge{padding:6px 10px;border-radius:20px;font-weight:700}
.badge.pending{background:#f39c12;color:#fff}
.badge.approved{background:#27ae60;color:#fff}
.badge.rejected{background:#e74c3c;color:#fff}
`;

export default function StudentCorrectionStatusModal({ correction, onClose }) {
  if (!correction) return null;

  const statusClass = correction.status === 'Approved' ? 'approved' : correction.status === 'Rejected' ? 'rejected' : 'pending';

  return (
    <div className="status-overlay" onClick={onClose}>
      <style>{styles}</style>
      <div className="status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="status-header">
          <h3>Correction Request Status</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20}}>✕</button>
        </div>

        <div className="status-body">
          <div className="status-row">
            <strong>Status:</strong>
            <span className={`badge ${statusClass}`}>{correction.status}</span>
          </div>

          <div className="status-row">
            <strong>Requested Status:</strong>
            <span>{correction.requested_status || '-'}</span>
          </div>

          <div className="status-row">
            <strong>Submitted On:</strong>
            <span>{correction.created_at ? new Date(correction.created_at).toLocaleString() : '-'}</span>
          </div>

          {correction.status === 'Approved' && (
            <div className="status-row">
              <strong>Approved At:</strong>
              <span>{correction.approved_at ? new Date(correction.approved_at).toLocaleString() : '-'}</span>
            </div>
          )}

          {correction.status === 'Rejected' && (
            <div style={{marginTop:12,padding:12,background:'#fff5f5',borderRadius:6}}>
              <strong>Rejection Remarks:</strong>
              <p style={{margin:6}}>{correction.rejection_remarks || 'No remarks provided'}</p>
            </div>
          )}

          <div style={{marginTop:12,padding:12,background:'#f8f9fa',borderRadius:6}}>
            <strong>Reason:</strong>
            <p style={{margin:6}}>{correction.reason || '-'}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
