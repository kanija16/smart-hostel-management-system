import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI, roomsAPI } from '../../api/client';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { SubmitComplaintModal } from './SubmitComplaintModal';
import { 
  Home, 
  FileText, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  BedDouble,
  User,
  ArrowRight
} from 'lucide-react';

export const StudentDashboard = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await complaintsAPI.getAll();
      setComplaints(res.data);
    } catch (err) {
      console.error("Error loading complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const totalCount = complaints.length;
  const activeCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="page-container">
      {/* Resident Welcome & Profile Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome, {user?.full_name}!</h1>
              <span className="sidebar-role-badge">Student</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
              Hostel Student ID: <strong>{user?.student_id_number || 'STU-NEW'}</strong> • Contact: {user?.contact_number || 'N/A'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Allocated Room</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
                {user?.room_number ? user.room_number : 'Not Allocated'}
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setIsSubmitOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlusCircle size={18} />
              <span>Submit Complaint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid">
        <MetricCard
          title="Total Complaints Submitted"
          value={totalCount}
          icon={FileText}
          color="#3b82f6"
        />
        <MetricCard
          title="Active / Under Review"
          value={activeCount}
          icon={Clock}
          color="#f59e0b"
          subtitle="Submitted or In Progress"
        />
        <MetricCard
          title="Resolved Complaints"
          value={resolvedCount}
          icon={CheckCircle2}
          color="#10b981"
          subtitle="Fixed by Maintenance"
        />
        <MetricCard
          title="Room Requests"
          value={user?.room_number ? "Allocated" : "Action Needed"}
          icon={BedDouble}
          color="#6366f1"
          subtitle={user?.room_number ? "Room is assigned" : "Request room change/allocation"}
        />
      </div>

      {/* Recent Complaints Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Complaint Submissions</h2>
            <p className="card-subtitle">Real-time status updates and AI categorization of your tickets</p>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('complaints')}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
            <p>You have not submitted any complaints yet.</p>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ marginTop: '12px' }}
              onClick={() => setIsSubmitOpen(true)}
            >
              Submit Your First Complaint
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category (AI)</th>
                  <th>Priority</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    </td>
                    <td>
                      <CategoryBadge category={c.final_category} />
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                        {Math.round(c.confidence_score * 100)}% conf
                      </div>
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
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SubmitComplaintModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        defaultRoom={user?.room_number || ''}
        onSuccess={() => {
          fetchComplaints();
        }}
      />
    </div>
  );
};
