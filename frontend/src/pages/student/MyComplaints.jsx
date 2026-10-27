import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { SubmitComplaintModal } from './SubmitComplaintModal';
import { Modal } from '../../components/Modal';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await complaintsAPI.getAll(params);
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const filteredComplaints = complaints.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.room_number.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My Complaints History</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Track maintenance progress, AI triage decisions, and resolution notes
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsSubmitOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusCircle size={18} />
          <span>New Complaint</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by keywords, room or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="form-select"
              style={{ width: '160px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Internet">Internet</option>
              <option value="Security">Security</option>
              <option value="Other">Other</option>
            </select>

            {(statusFilter || categoryFilter || searchTerm) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStatusFilter('');
                  setCategoryFilter('');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No complaints found</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '4px' }}>
              {statusFilter || categoryFilter || searchTerm
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'You have not submitted any complaints yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Issue Details</th>
                  <th>Category (AI)</th>
                  <th>Priority</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Logged Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#64748b' }}>
                        #{c.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    </td>
                    <td>
                      <CategoryBadge category={c.final_category} />
                    </td>
                    <td>
                      <PriorityBadge priority={c.final_priority} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.room_number}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedComplaint(c)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Complaint #${selectedComplaint.id}: ${selectedComplaint.title}`}
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedComplaint(null)}>
              Close
            </button>
          }
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <StatusBadge status={selectedComplaint.status} />
              <PriorityBadge priority={selectedComplaint.final_priority} />
              <CategoryBadge category={selectedComplaint.final_category} />
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Room: <strong>{selectedComplaint.room_number}</strong>
              </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Description
              </div>
              <p style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {selectedComplaint.description}
              </p>
            </div>

            {/* AI Classification Audit Box */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                <Sparkles size={16} />
                <span>AI Prediction Audit Trail</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#14532d', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Original ML Category: <strong>{selectedComplaint.predicted_category}</strong></div>
                <div>Original Severity: <strong>{selectedComplaint.predicted_priority}</strong></div>
                <div>Confidence Metric: <strong>{Math.round(selectedComplaint.confidence_score * 100)}%</strong></div>
                <div>Fallback Triggered: <strong>{selectedComplaint.is_fallback ? 'Yes (Triage)' : 'No (High ML Confidence)'}</strong></div>
              </div>
            </div>

            {/* Resolution Notes */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Warden Resolution Notes
              </div>
              {selectedComplaint.resolution_notes ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px 16px', borderRadius: '8px', color: '#92400e', fontSize: '0.88rem' }}>
                  {selectedComplaint.resolution_notes}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No resolution notes added by the warden yet.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <SubmitComplaintModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={() => {
          fetchComplaints();
        }}
      />
    </div>
  );
};
