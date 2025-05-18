const express = require('express');
const {
  submitContactForm,
  getContactSubmissions,
  getContactSubmission,
  updateContactStatus,
  deleteContactSubmission
} = require('../controllers/contact');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes - none

// Protected routes - require authentication
router
  .route('/')
  .post(protect, submitContactForm) // Only authenticated users can submit forms
  .get(protect, authorize('admin'), getContactSubmissions); // Only admins can view all submissions

router
  .route('/:id')
  .get(protect, authorize('admin'), getContactSubmission)
  .put(protect, authorize('admin'), updateContactStatus)
  .delete(protect, authorize('admin'), deleteContactSubmission);

module.exports = router; 