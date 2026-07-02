const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD' — the reservation's calendar date
    timeSlot: { type: String, required: true }, // e.g. '18:30' — start time of the slot
    startDateTime: { type: Date, required: true }, // computed: date + timeSlot
    endDateTime: { type: Date, required: true }, // computed: startDateTime + duration
    guests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// Speeds up the overlap-conflict query (table + date + status)
reservationSchema.index({ table: 1, date: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
