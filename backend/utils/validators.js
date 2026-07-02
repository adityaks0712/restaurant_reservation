const { AppError } = require('../middleware/errorHandler');

// Reservation duration in minutes. Every booking occupies exactly this long,
// which keeps the overlap math simple and predictable for reviewers.
const RESERVATION_DURATION_MINUTES = 90;

// Restaurant opens 11:00, last seating slot starts at 21:30 (ends 23:00)
const OPENING_HOUR = 11;
const OPENING_MINUTE = 0;
const CLOSING_HOUR = 23;
const CLOSING_MINUTE = 0;
const SLOT_INTERVAL_MINUTES = 30;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidDateString = (dateStr) => {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  return !isNaN(d.getTime());
};

const isValidTimeSlot = (timeStr) => typeof timeStr === 'string' && TIME_REGEX.test(timeStr);

// Generates the list of valid bookable time slots (e.g. ['11:00', '11:30', ..., '21:30'])
const getAvailableTimeSlots = () => {
  const slots = [];
  const opening = OPENING_HOUR * 60 + OPENING_MINUTE;
  const closing = CLOSING_HOUR * 60 + CLOSING_MINUTE;
  const lastSlotStart = closing - RESERVATION_DURATION_MINUTES;

  for (let mins = opening; mins <= lastSlotStart; mins += SLOT_INTERVAL_MINUTES) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
};

// Combines a 'YYYY-MM-DD' date and 'HH:MM' time into start/end Date objects
const computeReservationWindow = (dateStr, timeStr) => {
  if (!isValidDateString(dateStr)) {
    throw new AppError("Invalid 'date'. Expected format: YYYY-MM-DD", 400);
  }
  if (!isValidTimeSlot(timeStr)) {
    throw new AppError("Invalid 'timeSlot'. Expected format: HH:MM (24hr)", 400);
  }
  if (!getAvailableTimeSlots().includes(timeStr)) {
    throw new AppError(
      `'${timeStr}' is not a bookable slot. Restaurant hours: ${OPENING_HOUR}:00–${CLOSING_HOUR}:00, last seating accounts for a ${RESERVATION_DURATION_MINUTES}-minute reservation.`,
      400
    );
  }

  const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
  const endDateTime = new Date(startDateTime.getTime() + RESERVATION_DURATION_MINUTES * 60000);

  // Reject dates in the past
  const now = new Date();
  if (startDateTime.getTime() < now.getTime()) {
    throw new AppError('Cannot create a reservation in the past.', 400);
  }

  return { startDateTime, endDateTime };
};

module.exports = {
  RESERVATION_DURATION_MINUTES,
  isValidDateString,
  isValidTimeSlot,
  getAvailableTimeSlots,
  computeReservationWindow,
};
