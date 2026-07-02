const mongoose = require('mongoose');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { AppError } = require('../middleware/errorHandler');
const {
  computeReservationWindow,
  getAvailableTimeSlots,
} = require('../utils/validators');

// Core conflict check: does `tableId` already have a confirmed reservation
// on `date` whose window overlaps [startDateTime, endDateTime)?
// Two intervals [s1,e1) and [s2,e2) overlap iff s1 < e2 AND s2 < e1.
// `excludeReservationId` lets admin-updates ignore the reservation being edited.
const hasConflict = async (tableId, date, startDateTime, endDateTime, excludeReservationId = null) => {
  const query = {
    table: tableId,
    date,
    status: 'confirmed',
    startDateTime: { $lt: endDateTime },
    endDateTime: { $gt: startDateTime },
  };
  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }
  const conflict = await Reservation.findOne(query);
  return !!conflict;
};

// Finds the best-fit available table for a given date/time/party size.
// "Best fit" = smallest capacity that still seats the party, to leave
// larger tables free for larger parties.
const findAvailableTable = async (date, startDateTime, endDateTime, guests, excludeReservationId = null) => {
  const candidateTables = await Table.find({
    isActive: true,
    capacity: { $gte: guests },
  }).sort({ capacity: 1 });

  for (const table of candidateTables) {
    const conflict = await hasConflict(table._id, date, startDateTime, endDateTime, excludeReservationId);
    if (!conflict) return table;
  }
  return null;
};

// @route GET /api/reservations/slots?date=YYYY-MM-DD&guests=2
// @desc  Returns every bookable time slot for that date and whether at least
//        one table can seat the requested party size at that time.
//        Lets the frontend show only real, currently-available options.
const getAvailability = async (req, res, next) => {
  try {
    const { date, guests } = req.query;
    const partySize = Number(guests) || 1;

    if (!date) throw new AppError("Query parameter 'date' (YYYY-MM-DD) is required.", 400);

    const slots = getAvailableTimeSlots();
    const results = [];

    for (const slot of slots) {
      let window;
      try {
        window = computeReservationWindow(date, slot);
      } catch (e) {
        // Past slots on the current date are simply marked unavailable, not an error
        results.push({ timeSlot: slot, available: false });
        continue;
      }
      const table = await findAvailableTable(date, window.startDateTime, window.endDateTime, partySize);
      results.push({ timeSlot: slot, available: !!table });
    }

    res.status(200).json({ date, guests: partySize, slots: results });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/reservations
// @desc  Customer creates a reservation. Auto-assigns the best-fit table
//        unless a specific tableId is supplied.
const createReservation = async (req, res, next) => {
  try {
    const { date, timeSlot, guests, tableId } = req.body;

    if (!date || !timeSlot || !guests) {
      throw new AppError('date, timeSlot, and guests are required.', 400);
    }
    const partySize = Number(guests);
    if (!Number.isInteger(partySize) || partySize < 1) {
      throw new AppError('guests must be a positive integer.', 400);
    }

    const { startDateTime, endDateTime } = computeReservationWindow(date, timeSlot);

    let table;
    if (tableId) {
      if (!mongoose.Types.ObjectId.isValid(tableId)) {
        throw new AppError('Invalid tableId.', 400);
      }
      table = await Table.findOne({ _id: tableId, isActive: true });
      if (!table) throw new AppError('Selected table does not exist or is inactive.', 404);
      if (table.capacity < partySize) {
        throw new AppError(
          `Table ${table.tableNumber} seats ${table.capacity}, which is below the requested party size of ${partySize}.`,
          400
        );
      }
      const conflict = await hasConflict(table._id, date, startDateTime, endDateTime);
      if (conflict) {
        throw new AppError(
          `Table ${table.tableNumber} is already booked for an overlapping time on ${date}.`,
          409
        );
      }
    } else {
      table = await findAvailableTable(date, startDateTime, endDateTime, partySize);
      if (!table) {
        throw new AppError(
          `No table available for ${partySize} guest(s) at ${timeSlot} on ${date}. Please try a different time or party size.`,
          409
        );
      }
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      table: table._id,
      date,
      timeSlot,
      startDateTime,
      endDateTime,
      guests: partySize,
      status: 'confirmed',
    });

    const populated = await reservation.populate('table');
    res.status(201).json({ reservation: populated });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/reservations/mine
const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('table')
      .sort({ startDateTime: -1 });
    res.status(200).json({ reservations });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/reservations/:id  (customer cancels their own reservation)
const cancelMyReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError('Reservation not found.', 404);

    if (reservation.user.toString() !== req.user._id.toString()) {
      throw new AppError('You are not authorized to cancel this reservation.', 403);
    }
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

module.exports = {
  getAvailability,
  createReservation,
  getMyReservations,
  cancelMyReservation,
  hasConflict,
  findAvailableTable,
};
