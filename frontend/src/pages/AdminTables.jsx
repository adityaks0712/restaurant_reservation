import { useEffect, useState } from 'react';
import api from '../api/axios';

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ tableNumber: '', capacity: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tables');
      setTables(data.tables);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/tables', {
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
      });
      setMessage('Table created.');
      setForm({ tableNumber: '', capacity: '' });
      loadTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create table.');
    }
  };

  const handleDeactivate = async (id, tableNumber) => {
    if (!window.confirm(`Deactivate table ${tableNumber}?`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/tables/${id}`);
      setMessage(`Table ${tableNumber} deactivated.`);
      loadTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate table.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Tables</h2>
          <p className="page-subtitle">Add tables and retire ones no longer in service.</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      <div className="card">
        <h3>Add a new table</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Table number</label>
            <input
              type="number"
              min={1}
              value={form.tableNumber}
              onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Capacity</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
          </div>
          <button className="primary" type="submit">
            Add Table
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Table #</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t._id}>
                <td>{t.tableNumber}</td>
                <td>{t.capacity}</td>
                <td>
                  <button className="danger" onClick={() => handleDeactivate(t._id, t.tableNumber)}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminTables;
