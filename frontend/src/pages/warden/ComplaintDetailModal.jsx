import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../../api/client';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Save, 
  User, 
  Phone, 
  Mail, 
  Building 
} from 'lucide-react';

export const ComplaintDetailModal = ({ isOpen, onClose, complaint, onUpdated }) => {
  if (!complaint) return null;

  const [status, setStatus] = useState(complaint.status);
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolution_notes || '');
  
  // Override classification state
  const [showOverride, setShowOverride] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState(complaint.final_category);
  const [overridePriority, setOverridePriority] = useState(complaint.final_priority);
  const [overrideNote, setOverrideNote] = useState('');

  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    setStatus(complaint.status);
    setResolutionNotes(complaint.resolution_notes || '');
    setOverrideCategory(complaint.final_category);
    setOverridePriority(complaint.final_priority);
    setShowOverride(false);
    setOverrideNote('');
    setMsg({ type: '', text: '' });
  }, [complaint]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await complaintsAPI.updateStatus(complaint.id, {
        status,
        resolution_notes: resolutionNotes.trim()
      });
      setMsg({ type: 'success', text: 'Status and resolution notes updated successfully!' });
      onUpdated?.(res.data);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update status.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleOverrideClassification = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await complaintsAPI.overrideClassification(complaint.id, {
        final_category: overrideCategory,
        final_priority: overridePriority,
        resolution_notes: overrideNote.trim() || undefined
      });
      setMsg({ type: 'success', text: 'AI classification correction saved!' });
      setShowOverride(false);
      onUpdated?.(res.data);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to override classification.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Complaint Triage #${complaint.id}: ${complaint.title}`}
      maxWidth="700px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      {msg.text && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          marginBottom: '16px',
          background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#065f46' : '#b91c1c'
        }}>
          {msg.text}
        </div>
      )}

      {/* Student & Room Metadata */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Student</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{complaint.student_name || 'Student'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Room Location</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{complaint.room_number}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Email</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{complaint.student_email || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
          Complaint Description
        </div>
        <p style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', fontSize: '0.92rem', lineHeight: 1.6 }}>
          {complaint.description}
        </p>
      </div>

      {/* AI Classification & Override Panel */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#4338ca" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e1b4b' }}>
              AI Automated Classification Details
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowOverride(!showOverride)}
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Edit3 size={13} />
            <span>{showOverride ? 'Cancel Override' : 'Correct Classification'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
          <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>ML Category</div>
            <div style={{ marginTop: '4px' }}>
              <CategoryBadge category={complaint.final_category} />
            </div>
            {complaint.final_category !== complaint.predicted_category && (
              <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '2px' }}>
                (Original: {complaint.predicted_category})
              </div>
            )}
          </div>

          <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Assigned Priority</div>
            <div style={{ marginTop: '4px' }}>
              <PriorityBadge priority={complaint.final_priority} />
            </div>
            {complaint.final_priority !== complaint.predicted_priority && (
              <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '2px' }}>
                (Original: {complaint.predicted_priority})
              </div>
            )}
          </div>

          <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>ML Confidence</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '4px' }}>
              {Math.round(complaint.confidence_score * 100)}%
            </div>
          </div>

          <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Fallback Status</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '4px', color: complaint.is_fallback ? '#b45309' : '#059669' }}>
              {complaint.is_fallback ? 'Fallback Used' : 'High Confidence'}
            </div>
          </div>
        </div>

        {/* Override Form */}
        {showOverride && (
          <form onSubmit={handleOverrideClassification} style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Warden Manual Classification Override:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Corrected Category</label>
                <select
                  className="form-select"
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Internet">Internet</option>
                  <option value="Security">Security</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Corrected Priority</label>
                <select
                  className="form-select"
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                >
                  <option value="Critical">Critical (Immediate Emergency)</option>
                  <option value="High">High (Urgent Outage)</option>
                  <option value="Medium">Medium (Standard Repair)</option>
                  <option value="Low">Low (Routine / Cosmetic)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Correction Reason / Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Reclassified from Maintenance to Plumbing due to water leak"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
              <Save size={13} />
              <span>Save Corrected Classification</span>
            </button>
          </form>
        )}
      </div>

      {/* Workflow Status & Notes Update */}
      <form onSubmit={handleUpdateStatus}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Update Workflow Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Submitted">Submitted (Under Triage)</option>
              <option value="In Progress">In Progress (Dispatched)</option>
              <option value="Resolved">Resolved (Completed)</option>
              <option value="Rejected">Rejected (Invalid/Duplicate)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Resolution Notes / Action Taken</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Plumber visited room and replaced faucet washer..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={updating}>
          {updating ? 'Updating...' : 'Update Complaint Status & Notes'}
          <Save size={15} />
        </button>
      </form>
    </Modal>
  );
};
