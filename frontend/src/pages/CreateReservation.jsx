import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const todayStr = () => new Date().toISOString().split('T')[0];

const CreateReservation = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayStr());
  const [guests, setGuests] = useState(2);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadSlots = async () => {
    setLoadingSlots(true);
    setError('');
    setSelectedSlot(null);
    try {
      const { data } = await api.get('/reservations/slots', { params: { date, guests } });
      setSlots(data.slots);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load availability.');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, guests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/reservations', { date, timeSlot: selectedSlot, guests: Number(guests) });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h2>Book a table</h2>
      <p className="page-subtitle">Pick a date and party size to see what's open.</p>
      {error && <div className="error-msg">{error}</div>}

      <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Number of guests</label>
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Available time slots</label>
          {loadingSlots ? (
            <p>Checking availability...</p>
          ) : (
            <div className="slots-grid">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.timeSlot}
                  disabled={!s.available}
                  className={`slot-btn ${!s.available ? 'unavailable' : ''} ${
                    selectedSlot === s.timeSlot ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedSlot(s.timeSlot)}
                >
                  {s.timeSlot}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="primary" type="submit" disabled={submitting || !selectedSlot} style={{ width: '100%' }}>
          {submitting ? 'Booking...' : 'Confirm reservation'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default CreateReservation;
