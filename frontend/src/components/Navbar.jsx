import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, ShieldCheck, UserCheck, ArrowRightLeft } from 'lucide-react';

export const Navbar = () => {
  const { user, role, login, logout } = useAuth();

  const handleQuickSwitchRole = async (targetRole) => {
    if (targetRole === 'warden') {
      await login('warden@hostel.com', 'Warden@123');
    } else if (targetRole === 'student') {
      await login('student1@hostel.com', 'Student@123');
    } else if (targetRole === 'admin') {
      await login('admin@hostel.com', 'Admin@123');
    }
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Quick Role Switcher Pill in Top Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f1f5f9',
          padding: '3px 6px',
          borderRadius: '9999px',
          border: '1px solid #e2e8f0'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>
            Switch:
          </span>
          {role !== 'warden' && (
            <button
              onClick={() => handleQuickSwitchRole('warden')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.74rem',
                padding: '3px 8px',
                borderRadius: '9999px',
                color: '#d97706',
                borderColor: '#fde68a',
                background: '#fff'
              }}
              title="Quick switch to Warden Account"
            >
              <ShieldCheck size={12} />
              <span>Warden</span>
            </button>
          )}
          {role !== 'student' && (
            <button
              onClick={() => handleQuickSwitchRole('student')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.74rem',
                padding: '3px 8px',
                borderRadius: '9999px',
                color: '#2563eb',
                borderColor: '#bfdbfe',
                background: '#fff'
              }}
              title="Quick switch to Student Account"
            >
              <span>Student</span>
            </button>
          )}
          {role !== 'admin' && (
            <button
              onClick={() => handleQuickSwitchRole('admin')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.74rem',
                padding: '3px 8px',
                borderRadius: '9999px',
                color: '#7c3aed',
                borderColor: '#ddd6fe',
                background: '#fff'
              }}
              title="Quick switch to Admin Account"
            >
              <span>Admin</span>
            </button>
          )}
        </div>

        {user?.room_number && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#eff6ff',
            color: '#1d4ed8',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}>
            <Home size={14} /> Room: {user.room_number}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: role === 'warden' ? '#fef3c7' : role === 'admin' ? '#f5f3ff' : '#e0e7ff',
            color: role === 'warden' ? '#d97706' : role === 'admin' ? '#7c3aed' : '#4338ca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.88rem'
          }}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {user?.full_name || 'User'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
              {user?.role}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fecaca' }}
          title="Sign out of system to login page"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
