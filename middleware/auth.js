const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  console.log('Auth middleware running');
  console.log('Request headers:', req.headers);
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in Authorization header:', token.substring(0, 10) + '...');
  } else if (req.cookies?.token) {
    // Set token from cookie
    token = req.cookies.token;
    console.log('Token found in cookies:', token.substring(0, 10) + '...');
  } else {
    console.log('No token found in request');
  }

  // Make sure token exists
  if (!token) {
    console.log('Authentication failed: No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    console.log('Verifying token with secret:', process.env.JWT_SECRET ? 'Secret exists' : 'No secret found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, decoded ID:', decoded.id);

    // Get user from the token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log('User not found with ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User authenticated:', req.user.name);
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
}; 