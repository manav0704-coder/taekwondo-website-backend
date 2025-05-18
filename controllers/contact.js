const Contact = require('../models/Contact');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res, next) => {
  try {
    const contact = await Contact.create(req.body);

    // Here you would normally send an email notification
    // Using a service like NodeMailer (not implemented in this example)
    
    // For example:
    // await sendEmail({
    //   email: process.env.ADMIN_EMAIL,
    //   subject: `New Contact Form Submission: ${req.body.subject}`,
    //   message: `You have received a new contact form submission from ${req.body.name} (${req.body.email}): ${req.body.message}`
    // });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact submissions
// @route   GET /api/contact
// @access  Private (Admin only)
exports.getContactSubmissions = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contact submission
// @route   GET /api/contact/:id
// @access  Private (Admin only)
exports.getContactSubmission = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact submission status
// @route   PUT /api/contact/:id
// @access  Private (Admin only)
exports.updateContactStatus = async (req, res, next) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Only update status and responded fields
    const updateData = {
      status: req.body.status,
      respondedBy: req.user.id,
      responseDate: req.body.status === 'replied' || req.body.status === 'closed' ? Date.now() : undefined
    };

    contact = await Contact.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contact submission
// @route   DELETE /api/contact/:id
// @access  Private (Admin only)
exports.deleteContactSubmission = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
}; 