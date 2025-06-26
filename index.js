const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { connectDatabase, isConnectedToDB, reconnectDatabase } = require('./config/db');
const errorHandler = require('./middleware/error');


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Debug middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// Add middleware to check MongoDB connection before proceeding
app.use(async (req, res, next) => {
  // Skip DB check for health endpoint and static resources
  if (req.path === '/api/health' || req.path.startsWith('/public/') || req.method === 'OPTIONS') {
    return next();
  }
  
  // Check if connected to MongoDB for all other routes
  if (!isConnectedToDB()) {
    console.log('MongoDB not connected, attempting reconnection before proceeding');
    
    try {
      // Try to reconnect with a timeout
      const reconnectPromise = reconnectDatabase();
      
      // Set a timeout for the reconnection attempt
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database reconnection timeout')), 10000);
      });
      
      // Race between reconnection and timeout
      await Promise.race([reconnectPromise, timeoutPromise]);
      
      // Check if reconnection was successful
      if (!isConnectedToDB()) {
        console.log('MongoDB reconnection failed, returning error');
        return res.status(503).json({
          success: false, 
          message: 'Database unavailable. Please try again later.'
        });
      }
      
      console.log('MongoDB reconnection successful, proceeding with request');
    } catch (dbError) {
      console.error('MongoDB reconnection error:', dbError);
      return res.status(503).json({
        success: false, 
        message: 'Database connection error. Please try again later.'
      });
    }
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Updated CORS configuration to fix authentication issues
app.use(cors({
  origin: '*', // Allow all origins temporarily for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Disable helmet temporarily to fix CORS issues
// app.use(helmet({
//   crossOriginResourcePolicy: false,
//   contentSecurityPolicy: false
// }));
app.use(morgan('dev'));

// Add detailed request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Body:`, 
    req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : 'no body');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes import
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const galleryRoutes = require('./routes/gallery');
const contactRoutes = require('./routes/contact');
const enrollmentRoutes = require('./routes/enrollments');
const healthRoutes = require('./routes/health');

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/enrollments', enrollmentRoutes);
console.log('Enrollment routes registered');

// Register health check route
app.use('/api/health', healthRoutes);

// Default route with more detailed information
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Maharashtra Taekwondo Federation API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          .endpoint { background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Maharashtra Taekwondo Federation API</h1>
        <p>The API is running successfully. Below are the available endpoints:</p>
        <div class="endpoint">/api/health - Health check endpoint</div>
        <div class="endpoint">/api/auth - Authentication endpoints</div>
        <div class="endpoint">/api/users - User management endpoints</div>
        <div class="endpoint">/api/events - Event management endpoints</div>
        <div class="endpoint">/api/gallery - Gallery management endpoints</div>
        <div class="endpoint">/api/contact - Contact form endpoints</div>
        <div class="endpoint">/api/enrollments - Enrollment management endpoints</div>
      </body>
    </html>
  `);
});

// Use the custom error handler middleware
app.use(errorHandler);

// Start server function with database connection
const startServer = async () => {
  try {
    // First, connect to the database
    console.log('Connecting to database...');
    await connectDatabase();
    
    // Once connected or if connection fails but we want to proceed anyway,
    // start the Express server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Set up a periodic database connection check
      setInterval(async () => {
        if (!isConnectedToDB()) {
          console.log('Periodic check: MongoDB connection lost, attempting to reconnect...');
          try {
            await reconnectDatabase();
          } catch (err) {
            console.error('Failed to reconnect to MongoDB during periodic check:', err);
          }
        }
      }, 30000); // Check every 30 seconds
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();