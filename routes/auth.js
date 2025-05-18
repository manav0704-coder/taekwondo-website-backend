const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  googleAuth,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  changePassword
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Test route to check if auth routes are working
router.get('/test', (req, res) => {
  console.log('Auth test route hit');
  res.status(200).json({ success: true, message: 'Auth routes are working' });
});

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token/verify', verifyResetToken);
router.post('/reset-password/:token', resetPassword);

// Change password route (when logged in)
router.post('/change-password', protect, changePassword);

module.exports = router; 