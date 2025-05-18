const express = require('express');
const {
  updatePassword
} = require('../controllers/users');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/updatepassword').put(protect, updatePassword);

module.exports = router; 