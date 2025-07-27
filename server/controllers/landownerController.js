// server/controllers/landownerController.js
const Job = require('../models/Job');
const Payment = require('../models/Payment');
const User = require('../models/User');
const aiShortlistService = require('../services/aiShortlistService');
const Notification = require('../models/Notification');
const WorkProgress = require('../models/WorkProgress');
const sendEmail = require('../utils/sendEmail');

// @desc    Post a new job
// @route   POST /api/landowner/post
// @access  Private (Landowner only)
exports.postJob = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      landSize, 
      location, 
      workType, 
      startDate, 
      endDate 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !landSize || !location || !workType || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'All fields are required: title, description, landSize, location, workType, startDate, endDate' 
      });
    }
    // Validate date order
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: 'End date must be after start date'
      });
    }

    // Handle image uploads
    const images = req.files ? req.files.map(file => file.path) : [];

    const job = await Job.create({
      title,
      description,
      landSize: parseFloat(landSize),
      location,
      workType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      images,
      postedBy: req.user._id,
      status: 'open'
    });

    // --- AI Shortlist Generation ---
    // 1. Get all contractors
    const contractors = await User.find({ role: 'contractor' });
    // 2. Generate shortlist
    const shortlist = await aiShortlistService.AIShortlistService.generateShortlistWithAI(job, contractors);
    console.log('AI Shortlist:', shortlist);
    
    // 3. Update contractor scores in database
    for (const item of shortlist) {
      await aiShortlistService.AIShortlistService.updateContractorScores(item._id, {
        overall: item.overallScore / 100, // Convert back to 0-1 scale
        skillMatch: item.skillMatchScore / 100,
        reliability: item.reliabilityScore / 100,
        experience: item.experienceScore / 100,
        location: item.locationScore / 100,
        budget: item.budgetCompatibility / 100,
        quality: item.qualityScore / 100
      });
    }
    
    // 4. Save shortlist and scores to job
    job.aiShortlisted = shortlist.map(item => item._id);
    job.aiShortlistScores = shortlist.map(item => ({
      ...item, // This copies all fields, including estimatedCost
      contractorId: item._id // Optionally, add/rename fields as needed
    }));
    job.aiShortlistGenerated = true;
    job.aiShortlistDate = new Date();
    await job.save();
    // ---

    console.log('Job posted successfully:', {
      id: job._id,
      title: job.title,
      postedBy: job.postedBy,
      workType: job.workType
    });

    res.status(201).json({
      message: 'Job posted successfully',
      job,
      aiShortlist: shortlist.map(item => ({
        id: item._id,
        name: item.name,
        aiPrediction: item.aiPrediction, // <-- Show AI prediction score in response
        rank: item.rank,
        email: item.email,
        phone: item.phone,
        profile: item.profile
      }))
    });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({ message: 'Server error posting job' });
  }
};

// @desc    Get all jobs posted by the current landowner
// @route   GET /api/landowner/jobs
// @access  Private (Landowner only)
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate('applicants', 'name email phone profile')
      .populate('aiShortlisted', 'name email phone profile')
      .populate('selectedContractor', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
};

// @desc    Shortlist a contractor for a job
// @route   POST /api/landowner/shortlist
// @access  Private (Landowner only)
exports.shortlist = async (req, res) => {
  try {
    const { jobId, contractorId, action } = req.body;
    
    if (!jobId || !contractorId) {
      return res.status(400).json({ message: 'Job ID and contractor ID are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the current landowner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this job' });
    }

    // Check if contractor has applied for this job
    if (!job.applicants.includes(contractorId)) {
      return res.status(400).json({ message: 'Contractor has not applied for this job' });
    }

    if (action === 'remove') {
      // Remove from shortlist
      job.shortlisted = job.shortlisted.filter(id => id.toString() !== contractorId);
    } else {
      // Add to shortlist if not already there
      if (!job.shortlisted.includes(contractorId)) {
        job.shortlisted.push(contractorId);
      }
    }

    await job.save();

    // Return updated job with populated data
    const updatedJob = await Job.findById(jobId)
      .populate('applicants', 'name email phone profile')
      .populate('shortlisted', 'name email phone profile');

    res.json({
      message: action === 'remove' ? 'Contractor removed from shortlist' : 'Contractor added to shortlist',
      job: updatedJob
    });
  } catch (error) {
    console.error('Shortlist error:', error);
    res.status(500).json({ message: 'Server error shortlisting contractor' });
  }
};

// @desc    Get shortlisted contractors for a job
// @route   GET /api/landowner/shortlist/:jobId
// @access  Private (Landowner only)
exports.getShortlisted = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate('shortlisted', 'name email phone profile')
      .populate('applicants', 'name email phone profile');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the current landowner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this job' });
    }

    res.json({
      shortlisted: job.shortlisted,
      applicants: job.applicants,
      totalApplicants: job.applicants.length,
      totalShortlisted: job.shortlisted.length
    });
  } catch (error) {
    console.error('Get shortlisted error:', error);
    res.status(500).json({ message: 'Server error fetching shortlisted contractors' });
  }
};

// @desc    Make a payment to a contractor
// @route   POST /api/landowner/pay
// @access  Private (Landowner only)
exports.pay = async (req, res) => {
  try {
    const { jobId, contractorId, amount } = req.body;
    
    if (!jobId || !contractorId || !amount) {
      return res.status(400).json({ message: 'Job ID, contractor ID, and amount are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the current landowner
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this job' });
    }

    // Create payment record
    const payment = await Payment.create({
      jobId,
      landownerId: req.user._id,
      contractorId,
      amount,
      status: 'completed'
    });

    // Update job status
    job.status = 'in_progress';
    job.isPaid = true;
    await job.save();

    res.json(payment);
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
};

// @desc    Get AI shortlisted contractors for a job
// @route   GET /api/landowner/ai-shortlist/:jobId
// @access  Private (Landowner only)
exports.getAiShortlisted = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate('aiShortlisted', 'name email phone profile')
      .populate('postedBy', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the job belongs to the current landowner
    if (job.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this job' });
    }

    res.json({
      job: job,
      aiShortlisted: job.aiShortlisted,
      totalAiShortlisted: job.aiShortlisted.length
    });
  } catch (error) {
    console.error('Get AI shortlisted error:', error);
    res.status(500).json({ message: 'Server error fetching AI shortlisted contractors' });
  }
};

// @desc    Select a contractor for a job
// @route   POST /api/landowner/select-contractor
// @access  Private (Landowner only)
exports.selectContractor = async (req, res) => {
  try {
    const { jobId, contractorId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    job.selectedContractor = contractorId;
    job.assignmentAccepted = false;
    job.status = 'pending_acceptance';
    await job.save();

    // Parallelize DB writes
    await Promise.all([
      WorkProgress.create({
        jobId,
        contractorId,
        landownerId: req.user._id,
        startDate: new Date(),
        status: 'in_progress'
      }),
      Notification.create({
        recipient: contractorId,
        sender: req.user._id,
        type: 'job_selection',
        title: 'You Have Been Selected for a Job!',
        message: `Congratulations! You have been selected for the job "${job.title}" (${job.workType}) in ${job.location}. Please accept or reject this assignment.`,
        jobId: job._id,
        actionRequired: true,
        actionType: 'accept_reject'
      })
    ]);

    // Respond to frontend immediately
    res.json({ message: 'Contractor selected and job started', job });

    // Send email in background (no await)
    const contractor = await User.findById(contractorId);
    if (contractor && contractor.email) {
      sendEmail({
        to: contractor.email,
        subject: 'You have been selected for a job!',
        heading: 'You have been selected for a job!',
        greeting: `Hello, ${contractor.name || 'Contractor'}!`,
        text: `Congratulations! You have been selected for the job "${job.title}" (${job.workType}) in ${job.location}. Please log in to view details.`,
        buttonText: 'View Job Details',
        buttonUrl: '#'
      }).catch(console.error);
    }
  } catch (err) {
    console.error('Select contractor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get in-progress jobs for a landowner
// @route   GET /api/landowner/in-progress-jobs
// @access  Private (Landowner only)
exports.getInProgressJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ 
      postedBy: req.user._id, 
      status: 'in_progress',
      selectedContractor: { $exists: true, $ne: null }
    })
    .populate('selectedContractor', 'name email phone profile')
    .sort({ updatedAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Get in-progress jobs error:', err);
    res.status(500).json({ message: 'Server error fetching in-progress jobs' });
  }
};

// @desc    Update job status (for contractors)
// @route   PATCH /api/landowner/jobs/:jobId/status
// @access  Private (Landowner only)
exports.updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    job.status = status;
    await job.save();
    
    res.json({ message: 'Job status updated', job });
  } catch (err) {
    console.error('Update job status error:', err);
    res.status(500).json({ message: 'Server error updating job status' });
  }
};

// @desc    Get a single job by ID (for the current landowner)
// @route   GET /api/landowner/jobs/:jobId
// @access  Private (Landowner only)
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    // Only allow the landowner who posted the job to view it
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this job' });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Automatically create past work entry for contractor
// @route   Internal function - called when job is completed with payment and feedback
// @access  Private
const createPastWorkEntry = async (jobId) => {
  try {
    // Get the job with all related data
    const job = await Job.findById(jobId)
      .populate('postedBy', 'name email')
      .populate('selectedContractor', 'name email');
    
    if (!job) {
      console.error('Job not found for past work creation:', jobId);
      return;
    }

    // Get work progress to collect photos (optional)
    const workProgress = await WorkProgress.findOne({ jobId });
    
    // Collect photos from weekly progress (minimum 3)
    let allPhotos = [];
    if (workProgress && workProgress.weeklyProgress && workProgress.weeklyProgress.length > 0) {
      workProgress.weeklyProgress.forEach(progress => {
        if (progress.photos && progress.photos.length > 0) {
          allPhotos = [...allPhotos, ...progress.photos];
        }
      });
    }

    // Ensure minimum 3 photos, if less than 3, duplicate some
    while (allPhotos.length < 3 && allPhotos.length > 0) {
      allPhotos.push(...allPhotos.slice(0, 3 - allPhotos.length));
    }

    // If no photos at all, use job images as fallback
    if (allPhotos.length === 0 && job.images && job.images.length > 0) {
      allPhotos = job.images.slice(0, 3);
    }

    // Create past work entry
    const pastWorkEntry = {
      title: job.title,
      type: job.workType,
      description: job.description,
      budget: job.budget,
      date: job.updatedAt || new Date(), // Use job completion date
      rating: job.rating || 0,
      photos: allPhotos.slice(0, 10), // Limit to 10 photos
      landownerFeedback: job.review || '',
      landownerName: job.postedBy?.name || 'Unknown',
      landownerEmail: job.postedBy?.email || '',
      jobId: job._id,
      location: job.location,
      landSize: job.landSize,
      startDate: job.startDate,
      endDate: job.endDate,
      completionDate: job.updatedAt || new Date()
    };

    // Add to contractor's past jobs
    await User.findByIdAndUpdate(
      job.selectedContractor,
      { 
        $push: { 'profile.pastJobs': pastWorkEntry },
        $inc: { 'profile.completedJobs': 1 }
      }
    );

    console.log('Past work entry created successfully for job:', jobId);
    return pastWorkEntry;
  } catch (error) {
    console.error('Error creating past work entry:', error);
  }
};

// @desc    Submit a review for a completed job
// @route   PATCH /api/landowner/jobs/:jobId/review
// @access  Private (Landowner only)
exports.submitReview = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { rating, review } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the landowner for this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this job' });
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed jobs' });
    }

    // Check if payment is completed (optional for testing)
    const payment = await Payment.findOne({ 
      jobId: job._id, 
      status: 'completed' 
    });

    // For now, we'll allow reviews without payment for testing
    // In production, you can uncomment the following lines:
    /*
    if (!payment) {
      return res.status(400).json({ message: 'Payment must be completed before submitting review' });
    }
    */

    // Update job with review
    job.rating = rating;
    job.review = review || '';
    job.reviewedAt = new Date();
    job.isFeedbackGiven = true;
    await job.save();

    // Create notification for contractor
    await Notification.create({
      recipient: job.selectedContractor,
      sender: req.user._id,
      type: 'job_review',
      title: 'New Review Received!',
      message: `You received a ${rating}-star review for your work on "${job.title}". ${review ? 'Check your feedback page for details.' : ''}`,
      jobId: job._id,
      actionRequired: false,
      actionType: 'view_details'
    });

    // Automatically create past work entry
    await createPastWorkEntry(job._id);

    // Recalculate and update contractor's average rating and completed jobs
    if (job.selectedContractor) {
      const allFeedback = await Job.find({ selectedContractor: job.selectedContractor, rating: { $exists: true } });
      const avgRating = allFeedback.length > 0 ? (allFeedback.reduce((sum, j) => sum + (j.rating || 0), 0) / allFeedback.length) : 0;
      const completedJobs = await Job.countDocuments({ selectedContractor: job.selectedContractor, status: 'completed' });
      await User.findByIdAndUpdate(job.selectedContractor, { 'profile.rating': avgRating, 'profile.completedJobs': completedJobs });
    }

    res.json({
      message: 'Review submitted successfully',
      job: {
        _id: job._id,
        title: job.title,
        rating: job.rating,
        review: job.review
      }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Server error submitting review' });
  }
};

// @desc    Update job with payment ID for feedback linking
// @route   PATCH /api/landowner/jobs/:jobId/payment
// @access  Private (Landowner only)
exports.updateJobPayment = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { paymentId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the landowner for this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    // Verify payment exists and belongs to this job
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.jobId.toString() !== jobId) {
      return res.status(400).json({ message: 'Payment does not belong to this job' });
    }

    // Update job with payment ID
    job.paymentId = paymentId;
    await job.save();

    res.json({
      message: 'Job updated with payment ID successfully',
      job: {
        _id: job._id,
        title: job.title,
        paymentId: job.paymentId
      }
    });
  } catch (error) {
    console.error('Update job payment error:', error);
    res.status(500).json({ message: 'Server error updating job payment' });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const photoUrls = req.files.map(file => {
      const photoPath = `/uploads/${file.filename}`;
      return `${req.protocol}://${req.get('host')}${photoPath}`;
    });

    res.json({
      message: 'Photos uploaded successfully',
      urls: photoUrls
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Server error uploading photo' });
  }
};

// @desc    Get completed jobs needing payment or feedback
// @route   GET /api/landowner/completed-action-required
// @access  Private (Landowner only)
exports.getCompletedActionRequiredJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      postedBy: req.user._id,
      status: 'completed',
      selectedContractor: { $exists: true, $ne: null },
      $or: [
        { isPaid: false },
        { isFeedbackGiven: false }
      ]
    })
    .populate('selectedContractor', 'name email phone profile')
    .sort({ updatedAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Get completed action required jobs error:', err);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
}; 