import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [tables, setTables] = useState([]);

  const loadReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/reservations', { params });
      setReservations(data.reservations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data.tables);
    } catch {
      // non-critical for this view
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/reservations/${id}`);
      setMessage('Reservation cancelled.');
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setEditForm({
      date: r.date,
      timeSlot: r.timeSlot,
      guests: r.guests,
      tableId: r.table?._id || '',
    });
    setError('');
    setMessage('');
  };

  const submitEdit = async (id) => {
    setError('');
    setMessage('');
    try {
      await api.put(`/admin/reservations/${id}`, {
        date: editForm.date,
        timeSlot: editForm.timeSlot,
        guests: Number(editForm.guests),
        tableId: editForm.tableId,
      });
      setMessage('Reservation updated.');
      setEditingId(null);
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reservation.');
    }
  };

  const stats = useMemo(() => {
    const confirmed = reservations.filter((r) => r.status === 'confirmed').length;
    const cancelled = reservations.filter((r) => r.status === 'cancelled').length;
    const totalGuests = reservations
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.guests, 0);
    return { confirmed, cancelled, totalGuests };
  }, [reservations]);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Reservations</h2>
          <p className="page-subtitle">View, filter, and manage every booking across the restaurant.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="num">{stats.confirmed}</div>
          <div className="label">Confirmed{dateFilter ? ` on ${dateFilter}` : ''}</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.totalGuests}</div>
          <div className="label">Guests expected</div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.cancelled}</div>
          <div className="label">Cancelled</div>
        </div>
      </div>

      <div className="card filter-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <button
            className="secondary"
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Table</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r._id}>
                <td>
                  {r.user?.name}
                  <br />
                  <small style={{ color: '#666' }}>{r.user?.email}</small>
                </td>
                {editingId === r._id ? (
                  <>
                    <td>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="HH:MM"
                        value={editForm.timeSlot}
                        onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                        style={{ width: '70px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={editForm.guests}
                        onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })}
                        style={{ width: '60px' }}
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.tableId}
                        onChange={(e) => setEditForm({ ...editForm, tableId: e.target.value })}
                      >
                        {tables.map((t) => (
                          <option key={t._id} value={t._id}>
                            #{t.tableNumber} ({t.capacity})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{r.status}</td>
                    <td>
                      <button className="primary" onClick={() => submitEdit(r._id)} style={{ marginRight: 6 }}>
                        Save
                      </button>
                      <button className="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.date}</td>
                    <td>{r.timeSlot}</td>
                    <td>{r.guests}</td>
                    <td>
                      #{r.table?.tableNumber} ({r.table?.capacity} seats)
                    </td>
                    <td>
                      <span className={`status-pill ${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status === 'confirmed' && (
                        <>
                          <button className="secondary" onClick={() => startEdit(r)} style={{ marginRight: 6 }}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => handleCancel(r._id)}>
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
