const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Create a new enrollment
// @route   POST /api/enrollments
// @access  Private
exports.createEnrollment = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      emergencyPhone,
      program,
      experience,
      medicalConditions,
      howDidYouHear
    } = req.body;

    // Validate the required fields
    if (!fullName || !email || !phone || !dateOfBirth || !gender || !address || 
        !city || !state || !pincode || !emergencyContact || !emergencyPhone || 
        !program || !experience || !howDidYouHear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create enrollment with the user's ID
    const enrollment = await Enrollment.create({
      userId: req.user.id,
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      emergencyPhone,
      program,
      experience,
      medicalConditions,
      howDidYouHear
    });

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Enrollment submitted successfully'
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit enrollment'
    });
  }
};

// @desc    Get user's enrollments
// @route   GET /api/enrollments
// @access  Private
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.id });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get enrollments'
    });
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if the enrollment belongs to the user or user is admin
    if (enrollment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get enrollment'
    });
  }
};

// @desc    Get all enrollments (admin only)
// @route   GET /api/enrollments/all
// @access  Private/Admin
exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find().populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Get all enrollments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get enrollments'
    });
  }
};

// @desc    Update enrollment status (admin only)
// @route   PUT /api/enrollments/:id
// @access  Private/Admin
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (pending, approved, or rejected)'
      });
    }

    // Find enrollment and update
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update the status
    enrollment.status = status;
    await enrollment.save();

    res.status(200).json({
      success: true,
      data: enrollment,
      message: `Enrollment status updated to ${status}`
    });
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update enrollment status'
    });
  }
}; 