const express = require('express');
const {
  getEvents,
  getEvent,
  getUpcomingEvents
} = require('../controllers/events');

const router = express.Router();

router.route('/upcoming').get(getUpcomingEvents);

router
  .route('/')
  .get(getEvents);

router
  .route('/:id')
  .get(getEvent);

module.exports = router; 