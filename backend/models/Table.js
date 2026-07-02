const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true }, // allows "soft delete" of a table
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
