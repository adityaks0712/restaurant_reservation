const express = require('express');
const {
  getAllReservations,
  updateReservation,
  cancelAnyReservation,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin')); // every route here is admin-only

router.get('/reservations', getAllReservations);
router.put('/reservations/:id', updateReservation);
router.delete('/reservations/:id', cancelAnyReservation);

module.exports = router;
