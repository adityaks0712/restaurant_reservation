const express = require('express');
const { getTables, createTable, updateTable, deleteTable } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTables); // any authenticated user
router.post('/', authorize('admin'), createTable);
router.put('/:id', authorize('admin'), updateTable);
router.delete('/:id', authorize('admin'), deleteTable);

module.exports = router;
