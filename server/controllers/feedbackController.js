const Feedback = require('../models/Feedback');
const Job = require('../models/Job');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Submit feedback for a completed job (after payment confirmation)
// @route   POST /api/feedback/submit
// @access  Private (Landowner only)
exports.submitFeedback = async (req, res) => {
  try {
    const { 
      jobId, 
      paymentId: reqPaymentId,
      rating, 
      review,
      qualityOfWork,
      communication,
      timeliness,
      professionalism,
      strengths,
      areasForImprovement,
      wouldRecommend,
      jobBudget: reqJobBudget
    } = req.body;

    // Validate required fields (except paymentId and jobBudget for now)
    if (!jobId || !rating || !review) {
      return res.status(400).json({ 
        message: 'Job ID, rating, and review are required' 
      });
    }

    // Check if job exists and belongs to the landowner
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this job' });
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed jobs' });
    }

    // Find paymentId if not provided
    let paymentId = reqPaymentId;
    if (!paymentId) {
      const latestPayment = await Payment.findOne({ jobId, landownerId: req.user._id, status: 'completed' }).sort({ createdAt: -1 });
      if (latestPayment) paymentId = latestPayment._id;
    }
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required and no completed payment found for this job.' });
    }

    // Check if payment is completed
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Payment must be completed before submitting feedback' });
    }
    if (payment.jobId.toString() !== jobId || payment.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Payment does not match this job' });
    }

    // Check if feedback already exists for this job
    const existingFeedback = await Feedback.findOne({ 
      jobId, 
      landownerId: req.user._id,
      isDeleted: false 
    });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this job' });
    }

    // Use jobBudget from request, fallback to job.budget
    const jobBudget = reqJobBudget || job.budget;
    if (!jobBudget) {
      return res.status(400).json({ message: 'jobBudget is required and not found.' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      jobId,
      contractorId: job.selectedContractor,
      landownerId: req.user._id,
      paymentId,
      jobTitle: job.title,
      jobDescription: job.description,
      jobType: job.workType,
      jobBudget,
      jobLocation: job.location,
      rating: parseInt(rating),
      review,
      qualityOfWork: parseInt(qualityOfWork) || rating,
      communication: parseInt(communication) || rating,
      timeliness: parseInt(timeliness) || rating,
      professionalism: parseInt(professionalism) || rating,
      strengths: strengths || '',
      areasForImprovement: areasForImprovement || '',
      wouldRecommend: wouldRecommend || true
    });

    // Update job with basic rating and review (for backward compatibility)
    await Job.updateOne(
      { _id: job._id },
      { $set: { isFeedbackGiven: true, rating, review, reviewedAt: new Date() } }
    );

    // Recalculate and update contractor's average rating
    const allFeedback = await Feedback.find({ contractorId: job.selectedContractor, isDeleted: false });
    const avgRating = allFeedback.length > 0 ? (allFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / allFeedback.length) : 0;
    // Count completed jobs for this contractor
    const completedJobs = await Job.countDocuments({ selectedContractor: job.selectedContractor, status: 'completed' });
    await User.findByIdAndUpdate(job.selectedContractor, { 'profile.rating': avgRating, 'profile.completedJobs': completedJobs });

    // Create notification for contractor
    await Notification.create({
      recipient: job.selectedContractor,
      sender: req.user._id,
      type: 'feedback_received',
      title: 'New Feedback Received!',
      message: `You received ${rating}-star feedback for your work on "${job.title}". Check your feedback page for details.`,
      jobId: job._id,
      actionRequired: false,
      actionType: 'view_details'
    });

    // Populate feedback with user details
    await feedback.populate('landownerId', 'name email');
    await feedback.populate('contractorId', 'name email');

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
};

// @desc    Get feedback for a contractor
// @route   GET /api/feedback/contractor
// @access  Private (Contractor only)
exports.getContractorFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      contractorId: req.user._id,
      isDeleted: false
    })
    .populate('landownerId', 'name email')
    .populate('jobId', 'title description workType budget location images')
    .populate('paymentId', 'amount receiptNumber')
    .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalFeedback: feedback.length,
      averageRating: feedback.length > 0 
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
        : 0,
      averageQuality: feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + f.qualityOfWork, 0) / feedback.length).toFixed(1)
        : 0,
      averageCommunication: feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + f.communication, 0) / feedback.length).toFixed(1)
        : 0,
      averageTimeliness: feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + f.timeliness, 0) / feedback.length).toFixed(1)
        : 0,
      averageProfessionalism: feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + f.professionalism, 0) / feedback.length).toFixed(1)
        : 0,
      recommendationRate: feedback.length > 0
        ? Math.round((feedback.filter(f => f.wouldRecommend).length / feedback.length) * 100)
        : 0
    };

    res.json({
      feedback,
      stats
    });
  } catch (error) {
    console.error('Get contractor feedback error:', error);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
};

// @desc    Get feedback for a specific job
// @route   GET /api/feedback/job/:jobId
// @access  Private (Job participants only)
exports.getJobFeedback = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is involved in this job
    const isLandowner = job.postedBy.toString() === req.user._id.toString();
    const isContractor = job.selectedContractor?.toString() === req.user._id.toString();
    
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized to view this job feedback' });
    }

    const feedback = await Feedback.findOne({
      jobId,
      isDeleted: false
    })
    .populate('landownerId', 'name email')
    .populate('contractorId', 'name email')
    .populate('paymentId', 'amount receiptNumber');

    if (!feedback) {
      return res.status(404).json({ message: 'No feedback found for this job' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Get job feedback error:', error);
    res.status(500).json({ message: 'Server error fetching job feedback' });
  }
};

// @desc    Get all feedback (Admin only)
// @route   GET /api/feedback/all
// @access  Private (Admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, contractorId, landownerId, rating } = req.query;

    let query = { isDeleted: false };

    if (contractorId) query.contractorId = contractorId;
    if (landownerId) query.landownerId = landownerId;
    if (rating) query.rating = parseInt(rating);

    const feedback = await Feedback.find(query)
      .populate('landownerId', 'name email')
      .populate('contractorId', 'name email')
      .populate('jobId', 'title workType')
      .populate('paymentId', 'amount')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ message: 'Server error fetching all feedback' });
  }
};

// @desc    Delete feedback (Admin only)
// @route   DELETE /api/feedback/:feedbackId
// @access  Private (Admin only)
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { reason } = req.body;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Soft delete
    feedback.isDeleted = true;
    feedback.deletedBy = req.user._id;
    feedback.deletedAt = new Date();
    await feedback.save();

    // Create notification for contractor
    await Notification.create({
      recipient: feedback.contractorId,
      sender: req.user._id,
      type: 'feedback_deleted',
      title: 'Feedback Removed',
      message: `A feedback for "${feedback.jobTitle}" has been removed by admin.`,
      jobId: feedback.jobId,
      actionRequired: false,
      actionType: 'none'
    });

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error deleting feedback' });
  }
};

// @desc    Get feedback statistics (Admin only)
// @route   GET /api/feedback/stats
// @access  Private (Admin only)
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments({ isDeleted: false });
    const totalDeleted = await Feedback.countDocuments({ isDeleted: true });
    
    const ratingDistribution = await Feedback.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const averageRatings = await Feedback.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgQuality: { $avg: '$qualityOfWork' },
          avgCommunication: { $avg: '$communication' },
          avgTimeliness: { $avg: '$timeliness' },
          avgProfessionalism: { $avg: '$professionalism' }
        }
      }
    ]);

    const recommendationRate = await Feedback.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          recommended: { $sum: { $cond: ['$wouldRecommend', 1, 0] } }
        }
      }
    ]);

    res.json({
      totalFeedback,
      totalDeleted,
      ratingDistribution,
      averageRatings: averageRatings[0] || {},
      recommendationRate: recommendationRate[0] 
        ? Math.round((recommendationRate[0].recommended / recommendationRate[0].total) * 100)
        : 0
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ message: 'Server error fetching feedback statistics' });
  }
};
