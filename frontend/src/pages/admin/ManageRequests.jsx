import React, { useState, useEffect } from 'react';
import { roomRequestsAPI, roomsAPI } from '../../api/client';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  BedDouble, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  AlertCircle, 
  Filter 
} from 'lucide-react';

export const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Action modals
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, roomsRes] = await Promise.all([
        roomRequestsAPI.getAll(),
        roomsAPI.getAvailable()
      ]);
      setRequests(reqRes.data);
      setAvailableRooms(roomsRes.data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) {
      alert("Please select a room to allocate to this student.");
      return;
    }
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await roomRequestsAPI.updateStatus(approvingRequest.id, {
        status: 'Approved',
        allocated_room_id: Number(selectedRoomId),
        admin_remarks: adminRemarks.trim() || 'Approved by hostel administration.'
      });
      setMsg({ type: 'success', text: `Request #${approvingRequest.id} approved successfully! Room allocated.` });
      setApprovingRequest(null);
      setSelectedRoomId('');
      setAdminRemarks('');
      fetchData();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to approve request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await roomRequestsAPI.updateStatus(rejectingRequest.id, {
        status: 'Rejected',
        admin_remarks: adminRemarks.trim() || 'Request declined by administration.'
      });
      setMsg({ type: 'success', text: `Request #${rejectingRequest.id} marked as Rejected.` });
      setRejectingRequest(null);
      setAdminRemarks('');
      fetchData();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to reject request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (!statusFilter) return true;
    return r.status === statusFilter;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Review Room Allocation Requests</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Process student room allotment and transfer applications
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['Pending', 'Approved', 'Rejected', ''].map(st => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setStatusFilter(st)}
            >
              {st || 'All Requests'}
            </button>
          ))}
        </div>
      </div>

      {msg.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.88rem',
          marginBottom: '20px',
          background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#065f46' : '#b91c1c'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            <BedDouble size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
            <p>No room requests found for this filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Req #</th>
                  <th>Student Details</th>
                  <th>Current Room</th>
                  <th>Type & Preference</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Allocated Room</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#64748b' }}>
                        #{req.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.student_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{req.student_email}</div>
                    </td>
                    <td>
                      {req.current_room_number ? (
                        <span style={{ fontWeight: 600 }}>{req.current_room_number}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unallocated</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.request_type}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Prefers: {req.preferred_room_type} ({req.preferred_block || 'Any Block'})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                        {req.reason}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      {req.allocated_room_number ? (
                        <span style={{ fontWeight: 700, color: '#059669' }}>
                          {req.allocated_room_number}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {req.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setApprovingRequest(req);
                              setAdminRemarks('');
                              setSelectedRoomId('');
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setRejectingRequest(req);
                              setAdminRemarks('');
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Request Modal */}
      {approvingRequest && (
        <Modal
          isOpen={!!approvingRequest}
          onClose={() => setApprovingRequest(null)}
          title={`Approve Room Request #${approvingRequest.id}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setApprovingRequest(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? 'Assigning...' : 'Confirm & Allocate Room'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
              <div>Student: <strong>{approvingRequest.student_name}</strong></div>
              <div>Preference: <strong>{approvingRequest.preferred_room_type} ({approvingRequest.preferred_block || 'Any'})</strong></div>
              <div style={{ marginTop: '4px', color: '#64748b' }}>Reason: "{approvingRequest.reason}"</div>
            </div>
          </div>

          <form onSubmit={handleApprove}>
            <div className="form-group">
              <label className="form-label">Select Room to Assign *</label>
              <select
                className="form-select"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                required
              >
                <option value="">-- Choose an Available Room --</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} ({r.block}, {r.room_type}, {r.capacity - r.occupied_count} space left)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Approval Remarks</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Allocated based on academic year and availability"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Request Modal */}
      {rejectingRequest && (
        <Modal
          isOpen={!!rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          title={`Reject Room Request #${rejectingRequest.id}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setRejectingRequest(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
            Are you sure you want to decline this room request from <strong>{rejectingRequest.student_name}</strong>?
          </p>

          <form onSubmit={handleReject}>
            <div className="form-group">
              <label className="form-label">Rejection Remarks / Reason</label>
              <textarea
                className="form-textarea"
                placeholder="Explain why this request is being rejected (e.g., No single rooms vacant in Block A this semester)..."
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={3}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
