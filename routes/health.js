const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to verify server and database status
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Check server status
    const serverStatus = {
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    };

    // Check database connection status
    const dbStatus = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown',
      readyState: mongoose.connection.readyState
    };

    // If database is connected, try a simple query to verify it's working
    if (dbStatus.status === 'connected') {
      try {
        // Ping the database with a timeout
        const adminDb = mongoose.connection.db.admin();
        const pingResult = await Promise.race([
          adminDb.ping(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database ping timeout')), 5000)
          )
        ]);
        
        dbStatus.ping = pingResult ? 'successful' : 'failed';
        dbStatus.responseTime = 'ok';
      } catch (pingError) {
        dbStatus.ping = 'failed';
        dbStatus.pingError = pingError.message;
      }
    }

    // Return combined health status
    return res.status(200).json({
      success: true,
      server: serverStatus,
      database: dbStatus,
      config: {
        mongoUriConfigured: !!process.env.MONGO_URI,
        corsOriginsConfigured: !!process.env.CORS_ORIGINS,
        jwtSecretConfigured: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during health check',
      message: error.message
    });
  }
});

module.exports = router;