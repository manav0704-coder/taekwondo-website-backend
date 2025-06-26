const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Default JWT secret for local development - DO NOT use in production
const DEFAULT_JWT_SECRET = 'taekwondo-local-development-secret-key-123456';
// Setting JWT to essentially never expire (100 years)
const DEFAULT_JWT_EXPIRE = '36500d';

// Generate JWT Token
const generateToken = (id) => {
  // Use environment variable or fallback to default
  const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE || DEFAULT_JWT_EXPIRE;
  
  console.log(`Using JWT secret: ${jwtSecret ? 'Secret is defined' : 'SECRET NOT DEFINED'}`);
  console.log(`Token will never expire (set to 100 years)`);
  
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire
  });
};

// Email sending function
const sendEmail = async (options) => {
  try {
    console.log('Creating email transport');
    
    // Get email configuration from environment variables or use defaults
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_USER || 'hibronpluse@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'rnduxuarkjxezhtw';
    const emailFrom = process.env.EMAIL_FROM || 'Maharashtra Taekwondo Federation <hibronpluse@gmail.com>';
    
    // Use SMTP configuration with better error handling
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      },
      // Add timeout to prevent hanging connections
      connectionTimeout: 10000,
      // Enable STARTTLS for security
      requireTLS: true,
      // Increase logging for debugging
      debug: process.env.NODE_ENV === 'development'
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('Email transport created and verified successfully');

    // Message options
    const mailOptions = {
      from: emailFrom,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
      // Add priority header
      priority: 'high'
    };

    console.log('Sending email to:', options.email);
    
    // Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    console.log(`Register attempt for email: ${email}`);
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user already exists with enhanced error handling and retries
    let existingUser;
    let retryCount = 0;
    const maxRetries = 2; // Maximum number of retry attempts
    
    while (retryCount <= maxRetries) {
      try {
        // Use lean() for better performance and set a timeout
        existingUser = await User.findOne({ email })
          .lean()
          .maxTimeMS(5000); // 5 second timeout for this query
          
        console.log(`Existing user check for ${email}: ${existingUser ? 'Found' : 'Not found'}`);
        
        // We know the result, exit the retry loop
        break;
        
      } catch (dbError) {
        console.error(`Database error when checking for existing user (attempt ${retryCount + 1}/${maxRetries + 1}):`, dbError);
        
        if (retryCount === maxRetries) {
          // Give up after max retries
          return res.status(500).json({
            success: false,
            message: 'Database connection error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
        
        // Increment retry count and try again
        retryCount++;
        console.log(`Retrying database query, attempt ${retryCount} of ${maxRetries}`);
        
        // Short delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (existingUser) {
      console.log(`Registration failed: Email already in use - ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Create user with error handling and retry logic
    let user;
    retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        user = await User.create({
          name,
          email,
          password,
          role: role || 'user',
          phoneNumber
        });
        console.log(`User created successfully: ${user._id}`);
        break; // Exit the loop if successful
        
      } catch (dbError) {
        console.error(`Database error when creating user (attempt ${retryCount + 1}/${maxRetries + 1}):`, dbError);
        
        // Handle validation errors
        if (dbError.name === 'ValidationError') {
          const messages = Object.values(dbError.errors).map(val => val.message);
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: messages
          });
        }
        
        if (retryCount === maxRetries) {
          // Give up after max retries
          return res.status(500).json({
            success: false,
            message: 'Error creating user account. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
        
        // Increment retry count and try again
        retryCount++;
        console.log(`Retrying user creation, attempt ${retryCount} of ${maxRetries}`);
        
        // Short delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);
    console.log(`MongoDB URI: ${process.env.MONGO_URI ? 'Configured' : 'NOT CONFIGURED'}`);

    // Validate email & password
    if (!email || !password) {
      console.log('Login attempt missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user with enhanced error handling and retries
    let user;
    let retryCount = 0;
    const maxRetries = 2; // Maximum number of retry attempts
    
    while (retryCount <= maxRetries) {
      try {
        // Use lean() for better performance and set a timeout
        user = await User.findOne({ email })
          .select('+password')
          .lean()
          .maxTimeMS(5000); // 5 second timeout for this query
          
        console.log(`User lookup for ${email}: ${user ? 'Found' : 'Not found'}`);
        
        if (user) {
          break; // If user found, exit the retry loop
        } else if (retryCount === maxRetries) {
          // If this was the last retry and no user found
          console.log(`Login failed: Invalid email - ${email}`);
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
        
        retryCount++;
        console.log(`User not found, retry attempt ${retryCount} of ${maxRetries}`);
        
      } catch (dbError) {
        console.error(`Database error when finding user (attempt ${retryCount + 1}/${maxRetries + 1}):`, dbError);
        
        if (retryCount === maxRetries) {
          // Give up after max retries
          return res.status(500).json({
            success: false,
            message: 'Database connection error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
        
        // Increment retry count and try again
        retryCount++;
        console.log(`Retrying database query, attempt ${retryCount} of ${maxRetries}`);
        
        // Short delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Get the full user document for password check (if we're working with lean result)
    if (user && !user.matchPassword) {
      try {
        const fullUser = await User.findById(user._id).select('+password');
        
        if (!fullUser) {
          console.log(`Login failed: User found in initial query but not when fetching full document - ${email}`);
          return res.status(401).json({
            success: false,
            message: 'Authentication error. Please try again.'
          });
        }
        
        user = fullUser;
      } catch (fetchError) {
        console.error('Error when fetching full user document:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Authentication error. Please try again later.',
          error: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
        });
      }
    }

    // Check if password matches
    let isMatch;
    try {
      isMatch = await user.matchPassword(password);
      console.log(`Password match for ${email}: ${isMatch ? 'Success' : 'Failed'}`);
    } catch (passwordError) {
      console.error('Error when matching password:', passwordError);
      return res.status(500).json({
        success: false,
        message: 'Authentication error. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? passwordError.message : undefined
      });
    }

    if (!isMatch) {
      console.log(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`User logged in successfully: ${user._id}`);
    
    // Generate token
    const token = generateToken(user._id);
    
    // Update last login timestamp
    try {
      user.lastLogin = Date.now();
      await user.save();
    } catch (updateError) {
      // Non-critical error, just log it
      console.error(`Error updating last login timestamp for ${user._id}:`, updateError);
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Google authentication
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  console.log('Google auth request received', req.body.email ? { email: req.body.email } : 'No email provided');
  
  try {
    const { name, email, googleId, photoURL, idToken } = req.body;

    // Validate required fields
    if (!email || (!googleId && !idToken)) {
      console.error('Google auth missing required fields:', { email: !!email, googleId: !!googleId, idToken: !!idToken });
      return res.status(400).json({
        success: false,
        message: 'Please provide email and Google ID or token'
      });
    }

    console.log(`Google auth: Processing for ${email}`);
    
    // Check if user exists with this email
    let user;
    try {
      user = await User.findOne({ email }).maxTimeMS(5000);
      console.log(`Google auth: User lookup for ${email}: ${user ? 'Found' : 'Not found'}`);
    } catch (dbError) {
      console.error('Google auth: Database error when looking up user:', dbError);
      // Continue with null user, we'll create one
    }

    if (user) {
      // If user exists but doesn't have googleId, update it
      if (!user.googleId && googleId) {
        console.log(`Google auth: Adding googleId to existing user ${user._id}`);
        user.googleId = googleId;
        user.photoURL = photoURL || user.photoURL;
        try {
          await user.save();
          console.log(`Google auth: Updated existing user ${user._id} with Google credentials`);
        } catch (saveError) {
          console.error('Google auth: Error saving updated user:', saveError);
          // Continue anyway, the important part is authentication
        }
      }
    } else {
      // Create new user with Google credentials
      console.log(`Google auth: Creating new user for ${email}`);
      try {
        user = await User.create({
          name,
          email,
          googleId,
          photoURL,
          role: 'user'
        });
        console.log(`Google auth: Created new user ${user._id}`);
      } catch (createError) {
        console.error('Google auth: Error creating user:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user account. Please try again.'
        });
      }
    }

    // Generate token
    console.log(`Google auth: Generating token for user ${user._id}`);
    const token = generateToken(user._id);

    console.log('Google auth: Authentication successful');
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check for legacy phone field and update it to phoneNumber if needed
    if (user && user.phone && !user.phoneNumber) {
      console.log('Migrating legacy phone field for user:', user._id);
      user.phoneNumber = user.phone;
      await User.findByIdAndUpdate(user._id, { phoneNumber: user.phone });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user information'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    // Log the logout event
    console.log(`User logout: ${userId || 'Unknown user'}`);
    
    // If using JWT blacklist or token invalidation, you could add that here
    // For example, invalidate the current token by adding it to a blacklist
    // Or update the user's tokenVersion in the database
    
    // Clear cookie if using cookies for auth
    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    console.log('Forgot password request received:', req.body);
    const { email } = req.body;

    if (!email) {
      console.log('No email provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    console.log('Searching for user with email:', email);
    
    // Add timeout to the database query
    const user = await User.findOne({ email }).maxTimeMS(10000);
    
    // Always return success even if email not found for security
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent'
      });
    }

    console.log('User found, generating reset token');
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and set expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 60 minutes (increased from 30)
    
    try {
      await user.save();
      console.log('Reset token saved to user');
    } catch (saveError) {
      console.error('Error saving reset token to user:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Database error. Please try again later.'
      });
    }

    // Create reset URL - use the actual frontend URL if available
    // First check headers for origin, then env var, then fallback
    const origin = req.headers.origin || '';
    const frontendURL = process.env.FRONTEND_URL || 
                      (origin.includes('localhost') || origin.includes('127.0.0.1') ? 'http://localhost:3000' : origin) || 
                      'https://taekwondo-website.onrender.com';
                      
    const resetUrl = `${frontendURL}/reset-password/${resetToken}`;
    console.log('Reset URL created:', resetUrl);
    
    // Create message with better formatting
    const message = `You are receiving this email because you (or someone else) has requested a password reset for your Maharashtra Taekwondo Federation account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 60 minutes.

If you did not request this, please ignore this email and your password will remain unchanged.`;
    
    // HTML version with better styling
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        .button {
          display: inline-block;
          background-color: #FF5722;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .header {
          background-color: #FF5722;
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        <p>Hello,</p>
        <p>You are receiving this email because you (or someone else) has requested a password reset for your Maharashtra Taekwondo Federation account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>This link will expire in 60 minutes.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Maharashtra Taekwondo Federation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      // Log email attempt with all details
      console.log('Attempting to send email with the following details:');
      console.log('- To:', user.email);
      console.log('- Subject: Password Reset Request');
      console.log('- Reset URL:', resetUrl);
      
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - Maharashtra Taekwondo Federation',
        message,
        html
      });

      console.log('Password reset email sent successfully');
      res.status(200).json({
        success: true,
        message: 'Password reset email sent to your email address'
      });
    } catch (err) {
      console.error('Email sending failed:', err);
      
      // Log detailed error information
      console.error('Email error details:', {
        error: err.message,
        stack: err.stack,
        code: err.code,
        response: err.response
      });
      
      // Don't clear the token - let the user try again without regenerating
      // user.resetPasswordToken = undefined;
      // user.resetPasswordExpire = undefined;
      // await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later or contact support.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify reset token
// @route   GET /api/auth/reset-password/:token/verify
// @access  Public
exports.verifyResetToken = async (req, res, next) => {
  try {
    console.log('Verifying reset token:', req.params.token);
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('Looking for user with hashed token:', resetPasswordToken);
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    console.log('Token is valid for user:', user.email);
    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error verifying token'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    console.log('Password reset request received for token:', req.params.token);
    
    if (!req.body.password) {
      console.log('No password provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('Looking for user with hashed token');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    console.log('Valid token found, updating password for user:', user.email);
    // Set new password and clear reset fields
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    console.log('Password updated successfully');

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Password reset failed'
    });
  }
};

// @desc    Change password (when already logged in)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    console.log('Change password request received');
    const { currentPassword, newPassword } = req.body;

    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    
    console.log('Password changed successfully for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};