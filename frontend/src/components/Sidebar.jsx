import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  LayoutDashboard, 
  FileText, 
  BedDouble, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Wrench,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { user, role } = useAuth();

  const renderNavItems = () => {
    if (role === 'student') {
      return (
        <>
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => onSelectTab('complaints')}
          >
            <FileText size={18} />
            <span>My Complaints</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'room' ? 'active' : ''}`}
            onClick={() => onSelectTab('room')}
          >
            <BedDouble size={18} />
            <span>Room & Requests</span>
          </button>
        </>
      );
    }

    if (role === 'warden') {
      return (
        <>
          <button 
            className={`nav-item ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => onSelectTab('complaints')}
          >
            <Wrench size={18} />
            <span>Complaints Triage</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('analytics')}
          >
            <BarChart3 size={18} />
            <span>Analytics & Insights</span>
          </button>
        </>
      );
    }

    if (role === 'admin') {
      return (
        <>
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>System Overview</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => onSelectTab('rooms')}
          >
            <Building2 size={18} />
            <span>Manage Rooms</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => onSelectTab('requests')}
          >
            <BedDouble size={18} />
            <span>Room Requests</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => onSelectTab('users')}
          >
            <Users size={18} />
            <span>User Directory</span>
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <div className="sidebar-brand">SmartHostel</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="sidebar-role-badge">{role}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {renderNavItems()}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>AI Triage Active (TF-IDF + MNB)</span>
        </div>
      </div>
    </aside>
  );
};
