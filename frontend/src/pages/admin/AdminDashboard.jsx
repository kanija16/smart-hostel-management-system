import React, { useState, useEffect } from 'react';
import { statsAPI } from '../../api/client';
import { MetricCard } from '../../components/MetricCard';
import { 
  Building2, 
  Users, 
  UserCheck, 
  BedDouble, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Percent, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export const AdminDashboard = ({ onNavigateTab }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsAPI.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading administrative dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Hostel Administration Console</h1>
              <span className="sidebar-role-badge">Super Admin</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
              Real-time monitoring of facility occupancy, user records, and AI complaint triage
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => onNavigateTab('rooms')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Building2 size={16} />
              <span>Manage Rooms</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigateTab('requests')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BedDouble size={16} />
              <span>Room Requests ({stats?.pending_room_requests || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="stats-grid">
        <MetricCard
          title="Total Registered Students"
          value={stats?.total_students || 0}
          icon={Users}
          color="#3b82f6"
          subtitle="Hostel student body"
        />
        <MetricCard
          title="Total Hostel Rooms"
          value={stats?.total_rooms || 0}
          icon={Building2}
          color="#6366f1"
          subtitle={`${stats?.total_capacity || 0} Total Beds`}
        />
        <MetricCard
          title="Overall Occupancy Rate"
          value={`${stats?.occupancy_rate || 0}%`}
          icon={Percent}
          color="#10b981"
          subtitle={`${stats?.total_occupied || 0} / ${stats?.total_capacity || 0} Beds Occupied`}
        />
        <MetricCard
          title="Pending Room Requests"
          value={stats?.pending_room_requests || 0}
          icon={BedDouble}
          color="#f59e0b"
          subtitle="Awaiting allocation approval"
        />
      </div>

      {/* Secondary Metrics: Complaints Overview */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <MetricCard
          title="Total Grievances Logged"
          value={stats?.total_complaints || 0}
          icon={FileText}
          color="#0284c7"
          subtitle="Triaged by AI Model"
        />
        <MetricCard
          title="Active Open Complaints"
          value={stats?.active_complaints || 0}
          icon={Clock}
          color="#f97316"
          subtitle="Submitted & In Progress"
        />
        <MetricCard
          title="Resolved Complaints"
          value={stats?.resolved_complaints || 0}
          icon={CheckCircle2}
          color="#059669"
          subtitle="Successfully fixed"
        />
        <MetricCard
          title="Hostel Wardens"
          value={stats?.total_wardens || 0}
          icon={UserCheck}
          color="#7c3aed"
          subtitle="Active supervisory staff"
        />
      </div>

      {/* Quick Action Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('rooms')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '10px' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Manage Hostel Rooms</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Add, edit, inspect vacancy, or remove rooms</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#3b82f6', fontWeight: 700, marginTop: '16px' }}>
            <span>Go to Room Management</span>
            <ArrowRight size={16} />
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('requests')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{ background: '#fffbeb', color: '#d97706', padding: '12px', borderRadius: '10px' }}>
              <BedDouble size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Review Allocation Requests</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Approve or reject student room transfers</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#d97706', fontWeight: 700, marginTop: '16px' }}>
            <span>Review Pending Requests ({stats?.pending_room_requests || 0})</span>
            <ArrowRight size={16} />
          </div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('users')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '10px' }}>
              <Users size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hostel User Directory</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage student residents and warden accounts</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#059669', fontWeight: 700, marginTop: '16px' }}>
            <span>Open User Directory</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};
