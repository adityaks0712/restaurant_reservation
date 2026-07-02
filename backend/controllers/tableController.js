const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { AppError } = require('../middleware/errorHandler');

// @route GET /api/tables
// @desc  List all active tables. Accessible to any authenticated user
//        (customers need this to know what party sizes are supported).
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
    res.status(200).json({ tables });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/tables  (admin only)
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (tableNumber === undefined || capacity === undefined) {
      throw new AppError('tableNumber and capacity are required.', 400);
    }
    if (Number(capacity) < 1) {
      throw new AppError('capacity must be at least 1.', 400);
    }

    const existing = await Table.findOne({ tableNumber });
    if (existing) {
      throw new AppError(`Table number ${tableNumber} already exists.`, 409);
    }

    const table = await Table.create({ tableNumber, capacity });
    res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/tables/:id  (admin only)
const updateTable = async (req, res, next) => {
  try {
    const { capacity, isActive, tableNumber } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) throw new AppError('Table not found.', 404);

    if (capacity !== undefined) {
      if (Number(capacity) < 1) throw new AppError('capacity must be at least 1.', 400);
      table.capacity = capacity;
    }
    if (isActive !== undefined) table.isActive = isActive;
    if (tableNumber !== undefined) table.tableNumber = tableNumber;

    await table.save();
    res.status(200).json({ table });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/tables/:id  (admin only)
// Soft-delete: marks the table inactive rather than removing it, so
// historical reservations that reference it remain intact.
const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) throw new AppError('Table not found.', 404);

    const activeReservations = await Reservation.countDocuments({
      table: table._id,
      status: 'confirmed',
      startDateTime: { $gte: new Date() },
    });
    if (activeReservations > 0) {
      throw new AppError(
        `Cannot remove table ${table.tableNumber}: it has ${activeReservations} upcoming confirmed reservation(s). Cancel or reassign them first.`,
        409
      );
    }

    table.isActive = false;
    await table.save();
    res.status(200).json({ message: `Table ${table.tableNumber} deactivated.` });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTables, createTable, updateTable, deleteTable };
