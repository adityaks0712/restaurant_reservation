import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ReservationCard from '../components/ReservationCard';

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReservations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations/mine');
      setReservations(data.reservations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/reservations/${id}`);
      setMessage('Reservation cancelled.');
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2>Your table awaits</h2>
          <p className="page-subtitle">Everything you've booked with us, in one place.</p>
        </div>
        <Link to="/new">
          <button className="primary">+ Book a Table</button>
        </Link>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🍷</div>
          <h3>No reservations yet</h3>
          <p>When you book a table, it'll show up here as a reservation ticket.</p>
          <Link to="/new">
            <button className="primary" style={{ marginTop: '0.75rem' }}>
              Book your first table
            </button>
          </Link>
        </div>
      ) : (
        reservations.map((r) => <ReservationCard key={r._id} reservation={r} onCancel={handleCancel} />)
      )}
    </div>
  );
};

export default CustomerDashboard;
