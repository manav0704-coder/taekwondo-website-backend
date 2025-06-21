const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Create a robust user schema with validation
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true, // Store email in lowercase for better uniqueness
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required if using Google auth
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'instructor', 'admin'],
    default: 'user'
  },
  beltRank: {
    type: String,
    enum: ['white', 'yellow', 'orange', 'green', 'blue', 'red', 'black'],
    default: 'white'
  },
  memberSince: {
    type: Date,
    default: Date.now
  },
  phoneNumber: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dob: {
    type: Date
  },
  // Google Auth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values for non-Google users
  },
  photoURL: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Encrypt password using bcrypt - but only if password is modified or new
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    console.log('Hashing password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    if (!this.password) {
      console.log('No password found for user:', this.email);
      return false;
    }
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`Password match result for ${this.email}: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

// Create a compound index on email and googleId for better query performance
UserSchema.index({ email: 1, googleId: 1 });

module.exports = mongoose.model('User', UserSchema); 