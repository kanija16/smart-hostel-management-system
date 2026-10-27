import React, { useState, useEffect } from 'react';
import { statsAPI, roomsAPI } from '../../api/client';
import { Modal } from '../../components/Modal';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Home, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone 
} from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [deletingUser, setDeletingUser] = useState(null);

  // Form state for creating user
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    student_id_number: '',
    contact_number: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, roomsRes] = await Promise.all([
        statsAPI.getUsers(roleFilter ? { role: roleFilter } : undefined),
        roomsAPI.getAvailable()
      ]);
      setUsers(usersRes.data);
      setAvailableRooms(roomsRes.data);
    } catch (err) {
      console.error("Failed to load user directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await statsAPI.createUser(newUserData);
      setMsg({ type: 'success', text: `Account for ${newUserData.full_name} created successfully!` });
      setIsAddOpen(false);
      setNewUserData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        student_id_number: '',
        contact_number: ''
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to create user account.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRoom = async (e) => {
    e.preventDefault();
    if (!assigningUser) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await statsAPI.assignRoom(assigningUser.id, {
        room_id: selectedRoomId ? Number(selectedRoomId) : null
      });
      setMsg({ type: 'success', text: `Room assignment updated for ${assigningUser.full_name}!` });
      setAssigningUser(null);
      setSelectedRoomId('');
      fetchData();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update room assignment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await statsAPI.deleteUser(deletingUser.id);
      setMsg({ type: 'success', text: `User account deleted.` });
      setDeletingUser(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to delete user.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.student_id_number && u.student_id_number.toLowerCase().includes(term)) ||
      (u.room_number && u.room_number.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>User Management Directory</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage student residents, hostel wardens, and administrative accounts
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setMsg({ type: '', text: '' });
            setIsAddOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {msg.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.88rem',
          marginBottom: '20px',
          background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#065f46' : '#b91c1c'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Search and Role Filter */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by name, email, student ID, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['', 'student', 'warden', 'admin'].map(r => (
              <button
                key={r}
                className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setRoleFilter(r)}
                style={{ textTransform: 'capitalize' }}
              >
                {r ? `${r}s` : 'All Users'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>No users found matching query.</div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Student ID</th>
                  <th>Contact</th>
                  <th>Allocated Room</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: u.role === 'admin' ? '#f5f3ff' : u.role === 'warden' ? '#fef3c7' : '#eff6ff',
                        color: u.role === 'admin' ? '#7c3aed' : u.role === 'warden' ? '#d97706' : '#2563eb'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.student_id_number || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td style={{ fontSize: '0.82rem' }}>{u.contact_number || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td>
                      {u.role === 'student' ? (
                        u.room_number ? (
                          <span style={{ fontWeight: 700, color: '#059669' }}>
                            Room {u.room_number}
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '0.82rem', fontWeight: 600 }}>
                            Unallocated
                          </span>
                        )
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Staff (N/A)</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {u.role === 'student' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setAssigningUser(u);
                              setSelectedRoomId(u.room_id ? String(u.room_id) : '');
                            }}
                            title="Assign or Change Room"
                          >
                            <Home size={14} />
                            <span>Room</span>
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDeletingUser(u)}
                          title="Delete User"
                          style={{ color: '#ef4444' }}
                          disabled={u.role === 'admin'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New User to Hostel System"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)} disabled={actionLoading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateUser} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Emily Watson"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Role *</label>
              <select
                className="form-select"
                value={newUserData.role}
                onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="student">Student</option>
                <option value="warden">Hostel Warden</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@hostel.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={newUserData.password}
                onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
          </div>

          {newUserData.role === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Student ID Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., STU2024099"
                  value={newUserData.student_id_number}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, student_id_number: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+1 555-0155"
                  value={newUserData.contact_number}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, contact_number: e.target.value }))}
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Assign Room Modal */}
      {assigningUser && (
        <Modal
          isOpen={!!assigningUser}
          onClose={() => setAssigningUser(null)}
          title={`Assign Room: ${assigningUser.full_name}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAssigningUser(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAssignRoom} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Allocation'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Current allocation: <strong>{assigningUser.room_number ? `Room ${assigningUser.room_number}` : 'None (Unallocated)'}</strong>
            </p>
          </div>

          <form onSubmit={handleAssignRoom}>
            <div className="form-group">
              <label className="form-label">Target Room Allocation</label>
              <select
                className="form-select"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                <option value="">-- Deallocate / No Room Assigned --</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} ({r.block}, {r.room_type}, {r.capacity - r.occupied_count} space left)
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <Modal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          title="Confirm User Deletion"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeletingUser(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteUser} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
            Are you sure you want to delete user account <strong>{deletingUser.full_name}</strong> ({deletingUser.email})?
          </p>
          <p style={{ fontSize: '0.82rem', color: '#ef4444', marginTop: '10px' }}>
            * If this student is currently assigned to a room, the room bed will be freed automatically.
          </p>
        </Modal>
      )}
    </div>
  );
};
