import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck,
  User,
  Building2,
  Zap
} from 'lucide-react';

export const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('student'); // 'student', 'warden', 'admin'
  const [email, setEmail] = useState('student1@hostel.com');
  const [password, setPassword] = useState('Student@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Switch role tabs and preload matching demo credentials
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'warden') {
      setEmail('warden@hostel.com');
      setPassword('Warden@123');
    } else if (role === 'admin') {
      setEmail('admin@hostel.com');
      setPassword('Admin@123');
    } else {
      setEmail('student1@hostel.com');
      setPassword('Student@123');
    }
  };

  const executeLogin = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  const handleInstantDemoLogin = (demoEmail, demoPassword, role) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPassword);
    executeLogin(demoEmail, demoPassword);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {/* Brand Header */}
        <div className="auth-brand">
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            margin: '0 auto 14px',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
          }}>
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Smart Hostel Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            AI-Powered Complaint Classification & Management System
          </p>
        </div>

        {/* Prominent Role Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => handleSelectRole('student')}
            style={{
              padding: '8px 10px',
              borderRadius: '7px',
              border: 'none',
              background: selectedRole === 'student' ? '#fff' : 'transparent',
              color: selectedRole === 'student' ? '#1d4ed8' : '#64748b',
              fontWeight: selectedRole === 'student' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: selectedRole === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={14} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('warden')}
            style={{
              padding: '8px 10px',
              borderRadius: '7px',
              border: 'none',
              background: selectedRole === 'warden' ? '#fff' : 'transparent',
              color: selectedRole === 'warden' ? '#d97706' : '#64748b',
              fontWeight: selectedRole === 'warden' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: selectedRole === 'warden' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={15} />
            <span>Warden</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            style={{
              padding: '8px 10px',
              borderRadius: '7px',
              border: 'none',
              background: selectedRole === 'admin' ? '#fff' : 'transparent',
              color: selectedRole === 'admin' ? '#7c3aed' : '#64748b',
              fontWeight: selectedRole === 'admin' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: selectedRole === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Building2 size={14} />
            <span>Admin</span>
          </button>
        </div>

        {/* Role Portal Indicator Banner */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '18px',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: selectedRole === 'warden' ? '#fffbeb' : selectedRole === 'admin' ? '#f5f3ff' : '#eff6ff',
          border: `1px solid ${selectedRole === 'warden' ? '#fde68a' : selectedRole === 'admin' ? '#ddd6fe' : '#bfdbfe'}`,
          color: selectedRole === 'warden' ? '#92400e' : selectedRole === 'admin' ? '#5b21b6' : '#1e40af'
        }}>
          <div>
            <strong>{selectedRole === 'warden' ? 'Hostel Warden Portal' : selectedRole === 'admin' ? 'Administrator Console' : 'Student Resident Portal'}</strong>
            <div style={{ fontSize: '0.74rem', opacity: 0.85, marginTop: '1px' }}>
              {selectedRole === 'warden' 
                ? 'Review complaints triage, prioritize emergencies & resolve tickets' 
                : selectedRole === 'admin' 
                ? 'Manage room allotments, occupancy and facility operations' 
                : 'Submit grievances with AI classification & view room status'}
            </div>
          </div>
        </div>

        {/* One-Click Instant Sign-In Button for Current Role */}
        <div style={{ marginBottom: '18px' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              width: '100%',
              background: selectedRole === 'warden' 
                ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' 
                : selectedRole === 'admin' 
                ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' 
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '11px 16px',
              fontSize: '0.92rem'
            }}
            disabled={loading}
            onClick={() => {
              if (selectedRole === 'warden') {
                handleInstantDemoLogin('warden@hostel.com', 'Warden@123', 'warden');
              } else if (selectedRole === 'admin') {
                handleInstantDemoLogin('admin@hostel.com', 'Admin@123', 'admin');
              } else {
                handleInstantDemoLogin('student1@hostel.com', 'Student@123', 'student');
              }
            }}
          >
            <Zap size={16} />
            <span>
              {loading ? 'Authenticating...' : `Instant 1-Click ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`}
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or Sign In With Password
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#ef4444',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            <ArrowRight size={15} />
          </button>
        </form>

        {selectedRole === 'student' && (
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#64748b' }}>
            New resident student?{' '}
            <button
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Register Student Account
            </button>
          </div>
        )}

        {/* Fast Account Switcher Buttons at Bottom */}
        <div className="demo-account-pills" style={{ marginTop: '20px', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
            One-Click Account Switcher
          </div>
          <div className="demo-btn-group" style={{ marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleInstantDemoLogin('student1@hostel.com', 'Student@123', 'student')}
              title="Sign in as Student Alex Johnson"
            >
              🎓 Student
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleInstantDemoLogin('warden@hostel.com', 'Warden@123', 'warden')}
              title="Sign in as Warden Dr. Robert Miller"
              style={{ fontWeight: 700, color: '#d97706', borderColor: '#fde68a' }}
            >
              🛡️ Warden
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleInstantDemoLogin('admin@hostel.com', 'Admin@123', 'admin')}
              title="Sign in as System Administrator"
              style={{ color: '#7c3aed' }}
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
