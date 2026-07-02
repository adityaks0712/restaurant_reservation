const express = require('express');
const {
  getAvailability,
  createReservation,
  getMyReservations,
  cancelMyReservation,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every reservation route requires authentication

router.get('/slots', getAvailability);
router.get('/mine', getMyReservations);
router.post('/', createReservation);
router.delete('/:id', cancelMyReservation);

module.exports = router;
