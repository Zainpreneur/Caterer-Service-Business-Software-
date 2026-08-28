const express = require('express');
const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createTransaction,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getInventoryItems).post(createInventoryItem);
router.route('/:id').get(getInventoryItem).put(updateInventoryItem).delete(deleteInventoryItem);
router.route('/:id/transactions').post(createTransaction);

module.exports = router;
