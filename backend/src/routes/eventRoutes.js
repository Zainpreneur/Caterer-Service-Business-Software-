const express = require('express');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  assignStaff,
  removeStaffAssignment,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getEvents).post(createEvent);
router.route('/:id').get(getEvent).put(updateEvent).delete(deleteEvent);
router.route('/:id/staff').post(assignStaff);
router.route('/:id/staff/:staffId').delete(removeStaffAssignment);

module.exports = router;
