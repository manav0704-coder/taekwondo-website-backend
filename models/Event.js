const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  eventType: {
    type: String,
    required: [true, 'Please specify the event type'],
    enum: ['tournament', 'seminar', 'belt-test', 'training-camp', 'workshop', 'demonstration', 'other']
  },
  location: {
    address: String,
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    state: {
      type: String,
      required: [true, 'Please add a state']
    },
    zipCode: String,
    country: {
      type: String,
      required: [true, 'Please add a country']
    },
    venueDetails: String
  },
  date: {
    startDate: {
      type: Date,
      required: [true, 'Please add a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date']
    },
    startTime: String,
    endTime: String
  },
  eligibility: {
    beltRanks: [{
      type: String,
      enum: ['white', 'yellow', 'orange', 'green', 'blue', 'red', 'black', 'all']
    }],
    ageGroups: [{
      type: String,
      enum: ['kids', 'teens', 'adults', 'seniors', 'all']
    }]
  },
  registrationInfo: {
    isRegistrationRequired: {
      type: Boolean,
      default: true
    },
    registrationLink: String,
    registrationDeadline: Date,
    fee: {
      amount: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    }
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String
  },
  image: {
    type: String,
    default: 'default-event.jpg'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema); 