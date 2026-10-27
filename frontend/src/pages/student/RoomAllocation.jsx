import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { roomsAPI, roomRequestsAPI } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  BedDouble, 
  Building2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users,
  Home
} from 'lucide-react';

export const RoomAllocation = () => {
  const { user, refreshUser } = useAuth();
  const [availableRooms, setAvailableRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [requestType, setRequestType] = useState(user?.room_number ? 'Change' : 'Allocation');
  const [preferredType, setPreferredType] = useState('Double');
  const [preferredBlock, setPreferredBlock] = useState('Block A');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, reqRes] = await Promise.all([
        roomsAPI.getAvailable(),
        roomRequestsAPI.getAll()
      ]);
      setAvailableRooms(roomsRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      console.error("Failed to load room allocation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a clear reason for your room request.' });
      return;
    }

    setSubmitting(true);
    try {
      await roomRequestsAPI.submit({
        request_type: requestType,
        preferred_room_type: preferredType,
        preferred_block: preferredBlock,
        reason: reason.trim()
      });
      setMessage({ type: 'success', text: 'Room request submitted successfully! Awaiting administrator review.' });
      setReason('');
      loadData();
      refreshUser();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to submit room request. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Room Allocation & Requests</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Check real-time room availability across hostel blocks and submit allocation or transfer requests
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Current Status & Request Form */}
        <div>
          {/* Current Room Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Home size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Your Allocated Accommodation</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned living quarters</p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Room Number</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: user?.room_number ? '#0f172a' : '#94a3b8' }}>
                  {user?.room_number || 'Unallocated'}
                </div>
              </div>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '9999px',
                background: user?.room_number ? '#ecfdf5' : '#fffbeb',
                color: user?.room_number ? '#059669' : '#d97706'
              }}>
                {user?.room_number ? 'Active Resident' : 'Pending Allocation'}
              </div>
            </div>
          </div>

          {/* Room Request Form */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Submit Room Request
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '18px' }}>
              Apply for new room allotment or request a room transfer
            </p>

            {message.text && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: message.type === 'success' ? '#065f46' : '#b91c1c'
              }}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label className="form-label">Request Type</label>
                <select
                  className="form-select"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                >
                  <option value="Allocation">New Room Allocation</option>
                  <option value="Change">Room Change / Transfer</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Preferred Room Type</label>
                  <select
                    className="form-select"
                    value={preferredType}
                    onChange={(e) => setPreferredType(e.target.value)}
                  >
                    <option value="Single">Single (1 Person)</option>
                    <option value="Double">Double (2 Sharing)</option>
                    <option value="Triple">Triple (3 Sharing)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Block</label>
                  <select
                    className="form-select"
                    value={preferredBlock}
                    onChange={(e) => setPreferredBlock(e.target.value)}
                  >
                    <option value="Block A">Block A (North)</option>
                    <option value="Block B">Block B (East)</option>
                    <option value="Block C">Block C (West)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Request *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain why you are requesting this allocation or change (e.g., quiet study requirements, medical grounds, roommate preference)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting Request...' : 'Submit Room Request'}
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Available Rooms Directory & Request History */}
        <div>
          {/* Available Rooms Directory */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Hostel Room Availability</h3>
                <p className="card-subtitle">Rooms with vacancies currently accepting allocations</p>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '9999px' }}>
                {availableRooms.length} Available Rooms
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading room vacancy data...</div>
            ) : availableRooms.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No rooms currently available.</div>
            ) : (
              <div className="table-responsive">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Room #</th>
                      <th>Block</th>
                      <th>Floor</th>
                      <th>Room Type</th>
                      <th>Occupancy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableRooms.map(r => (
                      <tr key={r.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.room_number}</span>
                        </td>
                        <td>{r.block}</td>
                        <td>Floor {r.floor}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{r.room_type}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={14} color="#64748b" />
                            <span>{r.occupied_count} / {r.capacity}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: '#ecfdf5',
                            color: '#059669'
                          }}>
                            {r.capacity - r.occupied_count} Beds Free
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Request History */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '4px' }}>My Room Request History</h3>
            <p className="card-subtitle" style={{ marginBottom: '16px' }}>Past requests and administrator remarks</p>

            {requests.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                No past room requests found.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Request Type</th>
                      <th>Preference</th>
                      <th>Status</th>
                      <th>Allocated</th>
                      <th>Admin Remarks</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{req.request_type}</span>
                        </td>
                        <td>
                          {req.preferred_room_type} ({req.preferred_block || 'Any Block'})
                        </td>
                        <td>
                          <StatusBadge status={req.status} />
                        </td>
                        <td>
                          {req.allocated_room_number ? (
                            <span style={{ fontWeight: 700, color: '#10b981' }}>{req.allocated_room_number}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', maxWidth: '200px' }}>
                          {req.admin_remarks || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending review</span>}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(req.created_at).toLocaleDateString()}
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
  );
};
