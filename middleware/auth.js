const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Default JWT secret for local development - Same as in auth.js
const DEFAULT_JWT_SECRET = 'taekwondo-local-development-secret-key-123456';

// Protect routes
exports.protect = async (req, res, next) => {
  console.log('Auth middleware running');
  console.log('Request headers:', req.headers);
  let token;

  try {
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Set token from Bearer token
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header:', token ? (token.substring(0, 10) + '...') : 'Invalid token format');
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

    // Use JWT_SECRET from env or fallback to default
    const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    console.log('Using JWT secret:', jwtSecret ? 'Secret is defined' : 'SECRET NOT DEFINED');

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log('Token verified, decoded ID:', decoded.id);
    } catch (jwtError) {
      // Specific handling for different JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        console.log('Token expired');
        return res.status(401).json({
          success: false,
          message: 'Token expired, please login again'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        console.log('Invalid token:', jwtError.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      } else {
        console.error('JWT verification error:', jwtError);
        return res.status(401).json({
          success: false,
          message: 'Authentication error'
        });
      }
    }

    // Check if decoded.id exists
    if (!decoded || !decoded.id) {
      console.error('Invalid token payload: missing user ID');
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Get user from the token
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('User not found with ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found or deleted'
      });
    }

    // Store user in request for later use
    req.user = user;
    console.log('User authenticated:', req.user.name);
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This should never happen as it means protect middleware was bypassed
      console.error('User object missing in request for authorization');
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed: User role '${req.user.role}' not in allowed roles:`, roles);
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    console.log(`User authorized with role: ${req.user.role}`);
    next();
  };
}; 