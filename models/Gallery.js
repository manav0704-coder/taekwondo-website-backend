const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: [true, 'Please specify media type']
  },
  mediaUrl: {
    type: String,
    required: [true, 'Please provide the media URL']
  },
  thumbnailUrl: {
    type: String,
    required: function() {
      return this.mediaType === 'video';
    }
  },
  category: {
    type: String,
    enum: ['tournament', 'training', 'demonstration', 'celebration', 'belt-ceremony', 'seminar', 'other'],
    default: 'other'
  },
  tags: {
    type: [String],
    default: []
  },
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Gallery', GallerySchema); 