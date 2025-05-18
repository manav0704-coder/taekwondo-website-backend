const express = require('express');
const router = express.Router();
const { 
  createEnrollment, 
  getUserEnrollments, 
  getEnrollment, 
  getAllEnrollments,
  updateEnrollmentStatus
} = require('../controllers/enrollment');
const { protect, authorize } = require('../middleware/auth');

// Debug endpoint to check if enrollment routes are accessible
router.get('/health', (req, res) => {
  console.log('Enrollment routes health check accessed');
  res.status(200).json({ 
    success: true, 
    message: 'Enrollment API is working properly',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for direct enrollment without auth
router.post('/test', (req, res) => {
  console.log('Test enrollment endpoint accessed');
  console.log('Request body:', req.body);
  
  // Return success with the data received
  res.status(200).json({
    success: true,
    message: 'Test enrollment received',
    data: {
      referenceNumber: 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      ...req.body
    }
  });
});

// User enrollment routes
router.post('/', protect, createEnrollment);
router.get('/', protect, getUserEnrollments);
router.get('/:id', protect, getEnrollment);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllEnrollments);
router.put('/:id', protect, authorize('admin'), updateEnrollmentStatus);

// Log that routes are being registered
console.log('Enrollment routes registered');

module.exports = router; 