import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { MyComplaints } from './pages/student/MyComplaints';
import { RoomAllocation } from './pages/student/RoomAllocation';

// Warden Pages
import { WardenDashboard } from './pages/warden/WardenDashboard';
import { WardenAnalytics } from './pages/warden/WardenAnalytics';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageRooms } from './pages/admin/ManageRooms';
import { ManageRequests } from './pages/admin/ManageRequests';
import { ManageUsers } from './pages/admin/ManageUsers';

function AppContent() {
  const { user, role, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('');

  // Set default active tab based on role
  useEffect(() => {
    if (role === 'student') {
      setActiveTab('overview');
    } else if (role === 'warden') {
      setActiveTab('complaints');
    } else if (role === 'admin') {
      setActiveTab('overview');
    }
  }, [role]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Smart Hostel System...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const renderActiveContent = () => {
    // Student Views
    if (role === 'student') {
      switch (activeTab) {
        case 'overview':
          return <StudentDashboard onNavigateTab={setActiveTab} />;
        case 'complaints':
          return <MyComplaints />;
        case 'room':
          return <RoomAllocation />;
        default:
          return <StudentDashboard onNavigateTab={setActiveTab} />;
      }
    }

    // Warden Views
    if (role === 'warden') {
      switch (activeTab) {
        case 'complaints':
          return <WardenDashboard />;
        case 'analytics':
          return <WardenAnalytics />;
        default:
          return <WardenDashboard />;
      }
    }

    // Admin Views
    if (role === 'admin') {
      switch (activeTab) {
        case 'overview':
          return <AdminDashboard onNavigateTab={setActiveTab} />;
        case 'rooms':
          return <ManageRooms />;
        case 'requests':
          return <ManageRequests />;
        case 'users':
          return <ManageUsers />;
        default:
          return <AdminDashboard onNavigateTab={setActiveTab} />;
      }
    }

    return <div>Unknown role</div>;
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="main-content">
        <Navbar />
        {renderActiveContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
