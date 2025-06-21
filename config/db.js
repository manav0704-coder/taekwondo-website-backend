const mongoose = require('mongoose');

// Global variable to track connection status
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// Update to use MongoDB Atlas connection string with improved connection parameters
const FALLBACK_MONGO_URI = 'mongodb+srv://hibronpluse:A3hq0n82ty2ZGKnd@cluster0.zhx1zl5.mongodb.net/taekwondo?retryWrites=true&w=majority&appName=Cluster0';

/**
 * Connect to MongoDB with enhanced error handling and auto-reconnect
 * Modified for better cloud deployment support (like Render)
 */
const connectDatabase = async () => {
  // If already connected, don't connect again
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }
  
  // Print environment information for debugging in cloud environments
  console.log(`Node environment: ${process.env.NODE_ENV}`);
  console.log(`Running on platform: ${process.platform}`);
  console.log(`Node.js version: ${process.version}`);

  try {
    // Connection options for better reliability - removed deprecated options
    const options = {
      serverSelectionTimeoutMS: 60000, // Increased to 60 seconds
      socketTimeoutMS: 60000, // Increased to 60 seconds
      connectTimeoutMS: 60000, // Increased to 60 seconds
      maxPoolSize: 10,
      bufferCommands: false,
      // Add retry options
      retryWrites: true,
      retryReads: true,
      // Remove unsupported autoReconnect option
      // Add connection pool monitoring
      monitorCommands: true
    };
    
    console.log('Initializing MongoDB connection...');
    
    // Try to get MongoDB URI from environment variables or use Atlas fallback
    const mongoURI = process.env.MONGO_URI || FALLBACK_MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not available - neither from environment variables nor fallback');
    }
    
    // Mask the connection string for logging - fixed regex
    const maskedURI = mongoURI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://USERNAME:PASSWORD@');
    console.log(`Attempting MongoDB connection to: ${maskedURI}`);
    console.log(`Connection timeout set to: ${options.connectTimeoutMS}ms`);
    console.log(`Server selection timeout set to: ${options.serverSelectionTimeoutMS}ms`);
    
    // Create connection - force a new connection if previous one failed
    if (mongoose.connection.readyState !== 1) {
      // Cleanup any existing connection that might be in a bad state
      if (mongoose.connection.readyState !== 0) {
        try {
          await mongoose.disconnect();
          console.log('Disconnected from previous MongoDB connection');
        } catch (disconnectErr) {
          console.log('Error disconnecting from MongoDB:', disconnectErr.message);
          // Continue anyway
        }
      }
      
      // Make a fresh connection with simpler options directly in the connect call
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 60000
      });
    }
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    isConnected = true;
    connectionRetries = 0;
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
      
      // Log more detailed error information based on error type
      if (err.name === 'MongoNetworkError') {
        console.error('Network error detected. Please check your internet connection and MongoDB Atlas network access settings.');
      } else if (err.name === 'MongoServerSelectionError') {
        console.error('Server selection timeout. The MongoDB server may be down or unreachable.');
      } else if (err.name === 'MongoTimeoutError') {
        console.error('Connection timeout. The operation timed out before it could complete.');
      } else if (err.message.includes('authentication failed')) {
        console.error('Authentication failed. Please check your MongoDB username and password.');
      } else if (err.message.includes('not authorized')) {
        console.error('Authorization failed. Please check if your user has the correct permissions.');
      }
      
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
      isConnected = false;
      
      if (connectionRetries < MAX_RETRIES) {
        connectionRetries++;
        console.log(`MongoDB reconnection attempt ${connectionRetries} of ${MAX_RETRIES}`);
        // Use exponential backoff for reconnection attempts
        setTimeout(() => connectDatabase(), Math.min(1000 * Math.pow(2, connectionRetries), 30000)); 
      } else {
        console.error(`MongoDB reconnection failed after ${MAX_RETRIES} attempts`);
      }
    });
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
      isConnected = true;
      connectionRetries = 0;
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    isConnected = false;
    
    // Check if it's a connection string issue
    if (error.name === 'MongoParseError') {
      console.error('Invalid MongoDB connection string. Please check your MONGO_URI environment variable.');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server. Please check if MongoDB is running and accessible.');
    }
    
    // Don't exit in production, attempt to continue
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      console.log(`MongoDB connection retry ${connectionRetries} of ${MAX_RETRIES} in 5 seconds...`);
      // Use exponential backoff for reconnection attempts
      setTimeout(() => connectDatabase(), Math.min(1000 * Math.pow(2, connectionRetries), 30000));
    } else {
      console.error(`MongoDB connection failed after ${MAX_RETRIES} attempts`);
    }
    
    // Return null to indicate connection failure
    return null;
  }
};

/**
 * Check if MongoDB is connected
 */
const isConnectedToDB = () => {
  // Check both our internal flag and the actual connection state
  return isConnected && mongoose.connection.readyState === 1;
};

// Force a database reconnection - useful when connection becomes stale
const reconnectDatabase = async () => {
  console.log('Forcing MongoDB reconnection...');
  isConnected = false;
  connectionRetries = 0;
  
  try {
    await mongoose.disconnect();
  } catch (err) {
    console.log('Error during forced disconnect:', err.message);
    // Continue anyway
  }
  
  return connectDatabase();
};

module.exports = { connectDatabase, isConnectedToDB, reconnectDatabase };