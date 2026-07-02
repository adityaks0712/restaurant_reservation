const mongoose = require('mongoose');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { AppError } = require('../middleware/errorHandler');
const { computeReservationWindow } = require('../utils/validators');
const { hasConflict } = require('./reservationController');

// @route GET /api/admin/reservations?date=YYYY-MM-DD
// @desc  Admin views all reservations, optionally filtered by date.
const getAllReservations = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate('user', 'name email')
      .populate('table')
      .sort({ startDateTime: 1 });

    res.status(200).json({ count: reservations.length, reservations });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/admin/reservations/:id
// @desc  Admin updates any reservation (date/timeSlot/guests/table/status).
//        Re-validates capacity and conflicts whenever the schedule changes.
const updateReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError('Reservation not found.', 404);

    const { date, timeSlot, guests, tableId, status } = req.body;

    if (status !== undefined) {
      if (!['confirmed', 'cancelled'].includes(status)) {
        throw new AppError("status must be 'confirmed' or 'cancelled'.", 400);
      }
      reservation.status = status;
    }

    const nextDate = date !== undefined ? date : reservation.date;
    const nextTimeSlot = timeSlot !== undefined ? timeSlot : reservation.timeSlot;
    const nextGuests = guests !== undefined ? Number(guests) : reservation.guests;
    const nextTableId = tableId !== undefined ? tableId : reservation.table.toString();

    const scheduleChanged =
      date !== undefined || timeSlot !== undefined || guests !== undefined || tableId !== undefined;

    if (scheduleChanged && reservation.status !== 'cancelled') {
      if (!Number.isInteger(nextGuests) || nextGuests < 1) {
        throw new AppError('guests must be a positive integer.', 400);
      }
      if (!mongoose.Types.ObjectId.isValid(nextTableId)) {
        throw new AppError('Invalid tableId.', 400);
      }

      const table = await Table.findById(nextTableId);
      if (!table || !table.isActive) throw new AppError('Selected table does not exist or is inactive.', 404);
      if (table.capacity < nextGuests) {
        throw new AppError(
          `Table ${table.tableNumber} seats ${table.capacity}, below requested party size of ${nextGuests}.`,
          400
        );
      }

      const { startDateTime, endDateTime } = computeReservationWindow(nextDate, nextTimeSlot);

      const conflict = await hasConflict(
        table._id,
        nextDate,
        startDateTime,
        endDateTime,
        reservation._id
      );
      if (conflict) {
        throw new AppError(
          `Table ${table.tableNumber} already has an overlapping reservation on ${nextDate}.`,
          409
        );
      }

      reservation.date = nextDate;
      reservation.timeSlot = nextTimeSlot;
      reservation.guests = nextGuests;
      reservation.table = table._id;
      reservation.startDateTime = startDateTime;
      reservation.endDateTime = endDateTime;
    }

    await reservation.save();
    const populated = await reservation.populate(['table', { path: 'user', select: 'name email' }]);
    res.status(200).json({ reservation: populated });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/admin/reservations/:id
// @desc  Admin cancels any reservation regardless of owner.
const cancelAnyReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError('Reservation not found.', 404);

    if (reservation.status === 'cancelled') {
      throw new AppError('This reservation is already cancelled.', 400);
    }

    reservation.status = 'cancelled';
    await reservation.save();
    res.status(200).json({ message: 'Reservation cancelled.', reservation });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllReservations, updateReservation, cancelAnyReservation };
