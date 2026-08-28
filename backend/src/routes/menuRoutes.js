const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/categories').get(getCategories).post(createCategory);
router.route('/categories/:id').put(updateCategory).delete(deleteCategory);

router.route('/items').get(getMenuItems).post(createMenuItem);
router.route('/items/:id').get(getMenuItem).put(updateMenuItem).delete(deleteMenuItem);

module.exports = router;
