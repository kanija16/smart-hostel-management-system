import React, { useState, useEffect } from 'react';
import { complaintsAPI, statsAPI } from '../../api/client';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { ComplaintDetailModal } from './ComplaintDetailModal';
import { 
  ShieldAlert, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowUpDown,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const WardenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortByPriority, setSortByPriority] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      params.sort_by_priority = sortByPriority;

      const res = await complaintsAPI.getAll(params);
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter, categoryFilter, sortByPriority]);

  const filteredComplaints = complaints.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.room_number.toLowerCase().includes(term) ||
      (c.student_name && c.student_name.toLowerCase().includes(term))
    );
  });

  const criticalCount = complaints.filter(c => c.final_priority === 'Critical' && c.status !== 'Resolved').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const submittedCount = complaints.filter(c => c.status === 'Submitted').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Warden Complaints Triage Dashboard</h1>
            <span className="sidebar-role-badge">Chief Warden</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>
            AI-Prioritized hostel grievance management & rapid dispatch console
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={fetchComplaints}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="stats-grid">
        <MetricCard
          title="Critical / Urgent Hazards"
          value={criticalCount}
          icon={ShieldAlert}
          color="#ef4444"
          subtitle="Immediate response required"
        />
        <MetricCard
          title="New Submitted Tickets"
          value={submittedCount}
          icon={Clock}
          color="#3b82f6"
          subtitle="Pending initial triage"
        />
        <MetricCard
          title="In Progress / Dispatched"
          value={inProgressCount}
          icon={FileText}
          color="#f59e0b"
          subtitle="Technicians on-site"
        />
        <MetricCard
          title="Resolved Complaints"
          value={resolvedCount}
          icon={CheckCircle2}
          color="#10b981"
          subtitle="Successfully closed tickets"
        />
      </div>

      {/* Filter and Control Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by student name, room #, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="form-select"
            style={{ width: '150px' }}
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

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            type="button"
            className={`btn ${sortByPriority ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSortByPriority(!sortByPriority)}
            title="Toggle severity-first ordering"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowUpDown size={14} />
            <span>{sortByPriority ? 'Priority Sorted' : 'Date Sorted'}</span>
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading prioritized complaints feed...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No complaints matched criteria</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '4px' }}>Try clearing filters or checking other categories.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Priority (AI)</th>
                  <th>Category</th>
                  <th>Room & Student</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Logged</th>
                  <th>Triage Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}>
                          #{c.id}
                        </span>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    </td>
                    <td>
                      <PriorityBadge priority={c.final_priority} />
                    </td>
                    <td>
                      <CategoryBadge category={c.final_category} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.room_number}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.student_name || 'Resident'}</div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: c.confidence_score > 0.7 ? '#059669' : c.confidence_score > 0.4 ? '#d97706' : '#64748b'
                      }}>
                        {Math.round(c.confidence_score * 100)}%
                      </span>
                      {c.is_fallback && (
                        <div style={{ fontSize: '0.68rem', color: '#b45309' }}>Fallback</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedComplaint(c)}
                      >
                        Manage & Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Triage Detail & Override Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          complaint={selectedComplaint}
          onUpdated={(updated) => {
            setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelectedComplaint(updated);
          }}
        />
      )}
    </div>
  );
};
