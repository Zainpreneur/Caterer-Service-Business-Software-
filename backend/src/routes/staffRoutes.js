const express = require('express');
const {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getStaff).post(createStaff);
router.route('/:id').get(getStaffMember).put(updateStaff).delete(deleteStaff);

module.exports = router;
