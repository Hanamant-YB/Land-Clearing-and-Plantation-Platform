// server/controllers/contractorController.js
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const WorkProgress = require('../models/WorkProgress');
const sendEmail = require('../utils/sendEmail');

// @desc    Apply for a job
// @route   POST /api/contractor/apply
// @access  Private (Contractor only)
async function applyJob(req, res) {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if contractor already applied
    if (job.applicants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Add contractor to applicants
    job.applicants.push(req.user._id);
    await job.save();

    // Send email notification to the landowner
    const landowner = await User.findById(job.postedBy);
    if (landowner && landowner.email) {
      await sendEmail({
        to: landowner.email,
        subject: 'New Application Received',
        text: `A contractor has applied for your job "${job.title}" (${job.workType}) in ${job.location}. Please log in to review the application.`
      });
    }

    res.json({ 
      message: 'Application submitted successfully',
      job: job
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Server error applying for job' });
  }
}

// @desc    Get all available jobs for contractors
// @route   GET /api/contractor/jobs
// @access  Private (Contractor only)
async function getAvailableJobs(req, res) {
  try {
    const jobs = await Job.find({ 
      status: 'open' 
    })
    .populate('postedBy', 'name email phone')
    .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
}

// @desc    Get jobs that contractor has applied for
// @route   GET /api/contractor/applications
// @access  Private (Contractor only)
async function getMyApplications(req, res) {
  try {
    const jobs = await Job.find({ 
      applicants: req.user._id 
    })
    .populate('postedBy', 'name email phone')
    .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
}

// @desc    Withdraw application from a job
// @route   DELETE /api/contractor/apply/:jobId
// @access  Private (Contractor only)
async function withdrawApplication(req, res) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Remove contractor from applicants
    job.applicants = job.applicants.filter(id => id.toString() !== req.user._id.toString());
    
    // Also remove from shortlisted if present
    job.shortlisted = job.shortlisted.filter(id => id.toString() !== req.user._id.toString());
    
    await job.save();

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ message: 'Server error withdrawing application' });
  }
}

// @desc    Get contractor's past works
// @route   GET /api/contractor/pastworks
// @access  Private (Contractor only)
async function getPastWorks(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pastWorks = user.profile?.pastJobs || [];
    res.json(pastWorks);
  } catch (error) {
    console.error('Get past works error:', error);
    res.status(500).json({ message: 'Server error fetching past works' });
  }
}

// @desc    Add a new past work
// @route   POST /api/contractor/pastworks
// @access  Private (Contractor only)
async function addPastWork(req, res) {
  try {
    const { title, type, description, budget, date, rating, landownerFeedback, photos } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    if (budget && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({ message: 'Budget must be a positive number' });
    }

    if (rating && (isNaN(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const newPastWork = {
      title: title.trim(),
      type: type || '',
      description: description.trim(),
      budget: budget ? Number(budget) : null,
      date: date ? new Date(date) : new Date(),
      rating: rating ? Number(rating) : null,
      landownerFeedback: landownerFeedback || '',
      photos: photos || []
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { 'profile.pastJobs': newPastWork } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the newly added past work
    const addedWork = user.profile.pastJobs[user.profile.pastJobs.length - 1];
    res.status(201).json(addedWork);
  } catch (error) {
    console.error('Add past work error:', error);
    res.status(500).json({ message: 'Server error adding past work' });
  }
}

// @desc    Update a past work
// @route   PUT /api/contractor/pastworks/:workId
// @access  Private (Contractor only)
async function updatePastWork(req, res) {
  try {
    const { workId } = req.params;
    const { title, type, description, budget, date, rating, landownerFeedback, photos } = req.body;

    const updateData = {};
    if (title !== undefined) updateData['profile.pastJobs.$.title'] = title.trim();
    if (type !== undefined) updateData['profile.pastJobs.$.type'] = type;
    if (description !== undefined) updateData['profile.pastJobs.$.description'] = description.trim();
    if (budget !== undefined) updateData['profile.pastJobs.$.budget'] = budget ? Number(budget) : null;
    if (date !== undefined) updateData['profile.pastJobs.$.date'] = new Date(date);
    if (rating !== undefined) updateData['profile.pastJobs.$.rating'] = rating ? Number(rating) : null;
    if (landownerFeedback !== undefined) updateData['profile.pastJobs.$.landownerFeedback'] = landownerFeedback;
    if (photos !== undefined) updateData['profile.pastJobs.$.photos'] = photos;

    const user = await User.findOneAndUpdate(
      { 
        _id: req.user._id,
        'profile.pastJobs._id': workId 
      },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Past work not found' });
    }

    const updatedWork = user.profile.pastJobs.find(work => work._id.toString() === workId);
    res.json(updatedWork);
  } catch (error) {
    console.error('Update past work error:', error);
    res.status(500).json({ message: 'Server error updating past work' });
  }
}

// @desc    Delete a past work
// @route   DELETE /api/contractor/pastworks/:workId
// @access  Private (Contractor only)
async function deletePastWork(req, res) {
  try {
    const { workId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'profile.pastJobs': { _id: workId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Past work deleted successfully' });
  } catch (error) {
    console.error('Delete past work error:', error);
    res.status(500).json({ message: 'Server error deleting past work' });
  }
}

// @desc    Upload photo middleware
// @route   POST /api/contractor/photo
// @access  Private (Contractor only)
async function upload(req, res, next) {
  // This would typically handle file upload middleware
  // For now, just pass to next middleware
  next();
}

// @desc    Upload photo
// @route   POST /api/contractor/photo
// @access  Private (Contractor only)
async function uploadPhoto(req, res) {
  // Handle photo upload logic here
  res.json({ message: 'Photo uploaded successfully' });
}

// @desc    Get jobs assigned to the contractor
// @route   GET /api/contractor/assigned-jobs
// @access  Private (Contractor only)
async function getAssignedJobs(req, res) {
  try {
    const jobs = await Job.find({ 
      selectedContractor: req.user._id,
      assignmentAccepted: true
    })
    .populate('postedBy', 'name email phone')
    .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get assigned jobs error:', error);
    res.status(500).json({ message: 'Server error fetching assigned jobs' });
  }
}

// @desc    Get jobs where contractor is AI shortlisted
// @route   GET /api/contractor/ai-shortlisted
// @access  Private (Contractor only)
async function getAiShortlistedJobs(req, res) {
  try {
    const jobs = await Job.find({ 
      aiShortlisted: req.user._id 
    })
    .populate('postedBy', 'name email phone')
    .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get AI shortlisted jobs error:', error);
    res.status(500).json({ message: 'Server error fetching AI shortlisted jobs' });
  }
}

// @desc    Check if contractor is shortlisted for a specific job
// @route   GET /api/contractor/shortlist-status/:jobId
// @access  Private (Contractor only)
async function getShortlistStatus(req, res) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isAiShortlisted = job.aiShortlisted.includes(req.user._id);
    const isSelected = job.selectedContractor?.toString() === req.user._id.toString();
    const hasApplied = job.applicants.includes(req.user._id);

    res.json({
      jobId: job._id,
      jobTitle: job.title,
      isAiShortlisted,
      isSelected,
      hasApplied,
      status: isSelected ? 'assigned' : (isAiShortlisted ? 'ai_shortlisted' : (hasApplied ? 'applied' : 'not_applied'))
    });
  } catch (error) {
    console.error('Get shortlist status error:', error);
    res.status(500).json({ message: 'Server error checking shortlist status' });
  }
}

// @desc    Get contractor profile by ID
// @route   GET /api/contractor/profile/:id
// @access  Private (Landowner, Admin, Contractor)
async function getContractorProfileById(req, res) {
  try {
    const contractor = await User.findById(req.params.id);
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }
    res.json(contractor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// @desc    Update job status (for contractors)
// @route   PATCH /api/contractor/assigned-jobs/:jobId/status
// @access  Private (Contractor only)
async function updateJobStatus(req, res) {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if the contractor is assigned to this job
    if (job.selectedContractor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }
    
    // Validate status
    const validStatuses = ['in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be in_progress or completed' });
    }
    
    job.status = status;
    await job.save();
    
    // If job is completed, try to create past work entry (will only create if payment and review exist)
    if (status === 'completed') {
      await createPastWorkEntry(jobId);
    }
    
    res.json({ message: 'Job status updated successfully', job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Server error updating job status' });
  }
}

// @desc    Get contractor reviews from completed jobs
// @route   GET /api/contractor/reviews
// @access  Private (Contractor only)
async function getContractorReviews(req, res) {
  try {
    // Get all completed jobs where this contractor was selected
    const completedJobs = await Job.find({
      selectedContractor: req.user._id,
      status: 'completed'
    })
    .populate('postedBy', 'name email')
    .sort({ updatedAt: -1 });

    // Transform jobs into reviews format
    const reviews = completedJobs
      .filter(job => job.rating || job.review) // Only include jobs with ratings/reviews
      .map(job => ({
        _id: job._id,
        jobTitle: job.title,
        jobDescription: job.description,
        rating: job.rating || 0,
        review: job.review || '',
        landownerName: job.postedBy?.name || 'Unknown',
        landownerEmail: job.postedBy?.email || '',
        completedDate: job.updatedAt,
        jobImages: job.images || []
      }));

    res.json(reviews);
  } catch (error) {
    console.error('Get contractor reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
}

// @desc    Automatically create past work entry for contractor
// @route   Internal function - called when job is completed with payment and review
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

    // Check if job has a review (required for past work entry)
    if (!job.rating || !job.review) {
      console.log('Job does not have review yet, skipping past work creation:', jobId);
      return;
    }

    // Check if payment is completed
    const payment = await Payment.findOne({ 
      jobId: job._id, 
      status: 'completed' 
    });

    if (!payment) {
      console.log('Payment not completed yet, skipping past work creation:', jobId);
      return;
    }

    // Get work progress to collect photos
    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      console.error('Work progress not found for past work creation:', jobId);
      return;
    }

    // Collect photos from weekly progress (minimum 3)
    let allPhotos = [];
    if (workProgress.weeklyProgress && workProgress.weeklyProgress.length > 0) {
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

module.exports = {
  applyJob,
  getPastWorks,
  addPastWork,
  updatePastWork,
  deletePastWork,
  upload,
  uploadPhoto,
  getAvailableJobs,
  getMyApplications,
  withdrawApplication,
  getAssignedJobs,
  getAiShortlistedJobs,
  getShortlistStatus,
  getContractorProfileById,
  updateJobStatus,
  getContractorReviews
};