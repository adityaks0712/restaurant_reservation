const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const ReservationCard = ({ reservation, onCancel }) => {
  const { date, timeSlot, guests, table, status } = reservation;

  // date is 'YYYY-MM-DD' — parse without timezone surprises
  const [year, month, day] = date.split('-').map(Number);

  return (
    <div className="ticket">
      <div className="ticket-stub">
        <span className="month">{MONTHS[month - 1]}</span>
        <span className="day">{day}</span>
        <span className="time">{timeSlot}</span>
      </div>
      <div className="ticket-divider" />
      <div className="ticket-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '1.05rem' }}>Reservation for {guests}</strong>
          <span className={`status-pill ${status}`}>{status}</span>
        </div>
        <div className="ticket-meta">
          <span>
            🗓️ {year}-{String(month).padStart(2, '0')}-{String(day).padStart(2, '0')}
          </span>
          <span>👥 {guests} guests</span>
          <span>
            🪑 Table {table?.tableNumber ?? '—'} <span style={{ opacity: 0.7 }}>(seats {table?.capacity ?? '—'})</span>
          </span>
        </div>
        {status === 'confirmed' && onCancel && (
          <div style={{ marginTop: '0.9rem' }}>
            <button className="danger" onClick={() => onCancel(reservation._id)}>
              Cancel reservation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationCard;
