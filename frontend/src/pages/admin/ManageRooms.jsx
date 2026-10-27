import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../../api/client';
import { Modal } from '../../components/Modal';
import { 
  Building2, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);

  // Form state
  const [roomFormData, setRoomFormData] = useState({
    room_number: '',
    block: 'Block A',
    floor: 1,
    capacity: 2,
    room_type: 'Double',
    status: 'Available'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomsAPI.getAll();
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await roomsAPI.create(roomFormData);
      setMsg({ type: 'success', text: `Room ${roomFormData.room_number} created successfully!` });
      setIsAddOpen(false);
      setRoomFormData({
        room_number: '',
        block: 'Block A',
        floor: 1,
        capacity: 2,
        room_type: 'Double',
        status: 'Available'
      });
      fetchRooms();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to create room.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await roomsAPI.update(editingRoom.id, {
        room_number: editingRoom.room_number,
        block: editingRoom.block,
        floor: Number(editingRoom.floor),
        capacity: Number(editingRoom.capacity),
        room_type: editingRoom.room_type,
        status: editingRoom.status
      });
      setMsg({ type: 'success', text: `Room ${editingRoom.room_number} updated successfully!` });
      setEditingRoom(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update room.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await roomsAPI.delete(deletingRoom.id);
      setMsg({ type: 'success', text: `Room ${deletingRoom.room_number} deleted successfully!` });
      setDeletingRoom(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to delete room.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchSearch = r.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBlock = !blockFilter || r.block === blockFilter;
    const matchType = !typeFilter || r.room_type === typeFilter;
    return matchSearch && matchBlock && matchType;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Manage Hostel Rooms</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Add, configure capacity, view real-time occupancy, or update room status
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
          <PlusCircle size={18} />
          <span>Add New Room</span>
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by room number (e.g. A-101)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
          >
            <option value="">All Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
          </select>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Room Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
          </select>

          {(searchTerm || blockFilter || typeFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setBlockFilter('');
                setTypeFilter('');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Rooms Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading rooms directory...</div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>No rooms found matching filters.</div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Room #</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Room Type</th>
                  <th>Capacity</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {r.room_number}
                      </span>
                    </td>
                    <td>{r.block}</td>
                    <td>Floor {r.floor}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.room_type}</span>
                    </td>
                    <td>{r.capacity} Beds</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={14} color="#64748b" />
                        <span style={{ fontWeight: 700 }}>
                          {r.occupied_count} / {r.capacity}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ({Math.round((r.occupied_count / r.capacity) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: r.status === 'Available' ? '#ecfdf5' : r.status === 'Full' ? '#fef3c7' : '#fee2e2',
                        color: r.status === 'Available' ? '#059669' : r.status === 'Full' ? '#d97706' : '#dc2626'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingRoom(r)}
                          title="Edit Room Details"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDeletingRoom(r)}
                          title="Delete Room"
                          style={{ color: '#ef4444' }}
                          disabled={r.occupied_count > 0}
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

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Hostel Room"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)} disabled={actionLoading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateRoom} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Room'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRoom}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., A-301"
                value={roomFormData.room_number}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, room_number: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Block / Wing *</label>
              <select
                className="form-select"
                value={roomFormData.block}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, block: e.target.value }))}
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={roomFormData.floor}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, floor: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Capacity (Beds)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="6"
                value={roomFormData.capacity}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select
                className="form-select"
                value={roomFormData.room_type}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, room_type: e.target.value }))}
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-select"
              value={roomFormData.status}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="Available">Available</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Edit Room Modal */}
      {editingRoom && (
        <Modal
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          title={`Edit Room ${editingRoom.room_number}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingRoom(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateRoom} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <form onSubmit={handleUpdateRoom}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingRoom.room_number}
                  onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Block</label>
                <select
                  className="form-select"
                  value={editingRoom.block}
                  onChange={(e) => setEditingRoom({ ...editingRoom, block: e.target.value })}
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={editingRoom.floor}
                  onChange={(e) => setEditingRoom({ ...editingRoom, floor: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (Beds)</label>
                <input
                  type="number"
                  className="form-input"
                  min={editingRoom.occupied_count}
                  max="6"
                  value={editingRoom.capacity}
                  onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Min: {editingRoom.occupied_count} (Current residents)</span>
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-select"
                  value={editingRoom.room_type}
                  onChange={(e) => setEditingRoom({ ...editingRoom, room_type: e.target.value })}
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Room Status</label>
              <select
                className="form-select"
                value={editingRoom.status}
                onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Full">Full</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Room Confirmation Modal */}
      {deletingRoom && (
        <Modal
          isOpen={!!deletingRoom}
          onClose={() => setDeletingRoom(null)}
          title="Confirm Room Deletion"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeletingRoom(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteRoom} disabled={actionLoading}>
                {actionLoading ? 'Deleting...' : 'Delete Room'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete room <strong>{deletingRoom.room_number}</strong> ({deletingRoom.block})?
          </p>
          <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#ef4444' }}>
            * This action cannot be undone. Rooms with active residents cannot be deleted.
          </div>
        </Modal>
      )}
    </div>
  );
};
