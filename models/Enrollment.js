const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    required: [true, 'Please specify gender'],
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  address: {
    type: String,
    required: [true, 'Please provide address'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Please provide city'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'Please provide state'],
    default: 'Maharashtra'
  },
  pincode: {
    type: String,
    required: [true, 'Please provide PIN code'],
    trim: true
  },
  emergencyContact: {
    type: String,
    required: [true, 'Please provide emergency contact name'],
    trim: true
  },
  emergencyPhone: {
    type: String,
    required: [true, 'Please provide emergency contact phone'],
    trim: true
  },
  program: {
    type: String,
    required: [true, 'Please select a program'],
    enum: [
      'beginners',
      'intermediate',
      'advanced',
      'competitive',
      'childrens',
      'teens',
      'adults'
    ]
  },
  experience: {
    type: String,
    required: [true, 'Please specify previous experience'],
    enum: [
      'none',
      'less-than-1',
      '1-3',
      '3-5',
      '5-plus'
    ]
  },
  medicalConditions: {
    type: String,
    trim: true
  },
  howDidYouHear: {
    type: String,
    required: [true, 'Please specify how you heard about us'],
    enum: [
      'friend',
      'social-media',
      'search-engine',
      'event',
      'advertisement',
      'other'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  referenceNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a unique reference number before saving
EnrollmentSchema.pre('save', async function(next) {
  if (!this.referenceNumber) {
    // Generate a random alphanumeric string
    this.referenceNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema); 