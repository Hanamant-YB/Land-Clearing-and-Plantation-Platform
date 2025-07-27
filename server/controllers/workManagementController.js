const WorkProgress = require('../models/WorkProgress');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// ===== WORK PROGRESS MANAGEMENT =====

// @desc    Create work progress record when contractor accepts job
// @route   POST /api/work-progress/create
// @access  Private
exports.createWorkProgress = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if work progress already exists
    const existingProgress = await WorkProgress.findOne({ jobId });
    if (existingProgress) {
      return res.status(400).json({ message: 'Work progress already exists for this job' });
    }

    const workProgress = await WorkProgress.create({
      jobId,
      contractorId: job.selectedContractor,
      landownerId: job.postedBy,
      startDate: new Date(),
      status: 'in_progress'
    });

    // Create notification for landowner
    await Notification.create({
      recipient: job.postedBy,
      sender: req.user._id,
      type: 'job_selection',
      title: 'Work Started',
      message: `Work has started on your job "${job.title}". You can track progress and communicate with the contractor.`,
      jobId: job._id,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.status(201).json(workProgress);
  } catch (error) {
    console.error('Create work progress error:', error);
    res.status(500).json({ message: 'Server error creating work progress' });
  }
};

// @desc    Get work progress for a job
// @route   GET /api/work-progress/:jobId
// @access  Private
exports.getWorkProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const workProgress = await WorkProgress.findOne({ jobId })
      .populate('contractorId', 'name email phone profile')
      .populate('landownerId', 'name email phone')
      .populate('messages.senderId', 'name');

    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check authorization
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (req.user.role === 'landowner' && job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'contractor' && job.selectedContractor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(workProgress);
  } catch (error) {
    console.error('Get work progress error:', error);
    res.status(500).json({ message: 'Server error fetching work progress' });
  }
};

// @desc    Add progress update
// @route   POST /api/work-progress/:jobId/update
// @access  Private (Contractor only)
exports.addProgressUpdate = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, description, progressPercentage, photos } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the contractor for this job
    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const update = {
      title,
      description,
      progressPercentage,
      photos: photos || [],
      createdAt: new Date()
    };

    workProgress.updates.push(update);
    workProgress.currentProgress = progressPercentage;
    
    if (progressPercentage >= 100) {
      workProgress.status = 'completed';
      workProgress.actualCompletionDate = new Date();
      
      // Also update the job status to completed
      await Job.findByIdAndUpdate(jobId, { 
        status: 'completed',
        updatedAt: new Date()
      });
      
      // Try to create past work entry (will only create if payment and review exist)
      await createPastWorkEntry(jobId);
      // Send email notifications to both contractor and landowner
      const job = await Job.findById(jobId);
      const contractor = await User.findById(workProgress.contractorId);
      const landowner = await User.findById(workProgress.landownerId);
      if (contractor && contractor.email) {
        await sendEmail({
          to: contractor.email,
          subject: 'Job Completed',
          text: `Congratulations! The job "${job.title}" has been marked as completed. Thank you for your work!`
        });
      }
      if (landowner && landowner.email) {
        await sendEmail({
          to: landowner.email,
          subject: 'Job Completed',
          text: `Your job "${job.title}" has been marked as completed by the contractor. Please log in to review and provide feedback.`
        });
      }
    }

    await workProgress.save();

    // Create notification for landowner
    await Notification.create({
      recipient: workProgress.landownerId,
      sender: req.user._id,
      type: 'job_completion',
      title: 'Progress Update',
      message: `Progress update for job: ${title} - ${progressPercentage}% complete`,
      jobId: jobId,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Add progress update error:', error);
    res.status(500).json({ message: 'Server error adding progress update' });
  }
};

// @desc    Add milestone
// @route   POST /api/work-progress/:jobId/milestone
// @access  Private (Contractor only)
exports.addMilestone = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, description, dueDate, photos } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = {
      title,
      description,
      dueDate: new Date(dueDate),
      photos: photos || [],
      createdAt: new Date()
    };

    workProgress.milestones.push(milestone);
    await workProgress.save();

    res.json(workProgress);
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ message: 'Server error adding milestone' });
  }
};

// @desc    Complete milestone
// @route   PATCH /api/work-progress/:jobId/milestone/:milestoneId/complete
// @access  Private (Contractor only)
exports.completeMilestone = async (req, res) => {
  try {
    const { jobId, milestoneId } = req.params;
    const { photos } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = workProgress.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    milestone.completed = true;
    milestone.completedDate = new Date();
    if (photos) {
      milestone.photos = milestone.photos.concat(photos);
    }

    await workProgress.save();

    // Create notification for landowner
    await Notification.create({
      recipient: workProgress.landownerId,
      sender: req.user._id,
      type: 'job_completion',
      title: 'Milestone Completed',
      message: `Milestone "${milestone.title}" has been completed`,
      jobId: jobId,
      actionRequired: true,
      actionType: 'view_details'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({ message: 'Server error completing milestone' });
  }
};

// ===== QUALITY ASSURANCE =====

// @desc    Add quality review
// @route   POST /api/work-progress/:jobId/quality-review
// @access  Private (Landowner only)
exports.addQualityReview = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { rating, comments, photos } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    if (workProgress.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const review = {
      reviewerId: req.user._id,
      reviewerType: 'landowner',
      rating,
      comments,
      photos: photos || [],
      status: 'pending',
      createdAt: new Date()
    };

    workProgress.qualityReviews.push(review);
    await workProgress.save();

    // Create notification for contractor
    await Notification.create({
      recipient: workProgress.contractorId,
      sender: req.user._id,
      type: 'application_status',
      title: 'Quality Review Received',
      message: `You received a quality review for your work (Rating: ${rating}/5)`,
      jobId: jobId,
      actionRequired: false,
      actionType: 'none'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Add quality review error:', error);
    res.status(500).json({ message: 'Server error adding quality review' });
  }
};

// ===== DISPUTE MANAGEMENT =====

// @desc    Report dispute/issue
// @route   POST /api/work-progress/:jobId/dispute
// @access  Private
exports.reportDispute = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { issueType, title, description, severity, photos } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is involved in this job
    const isLandowner = workProgress.landownerId.toString() === req.user._id.toString();
    const isContractor = workProgress.contractorId.toString() === req.user._id.toString();
    
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const dispute = {
      reportedBy: req.user._id,
      reportedByType: isLandowner ? 'landowner' : 'contractor',
      issueType,
      title,
      description,
      severity,
      photos: photos || [],
      status: 'open',
      createdAt: new Date()
    };

    workProgress.disputes.push(dispute);
    await workProgress.save();

    // Create notification for the other party
    const recipientId = isLandowner ? workProgress.contractorId : workProgress.landownerId;
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'application_status',
      title: 'Dispute Reported',
      message: `A dispute has been reported: ${title}`,
      jobId: jobId,
      actionRequired: true,
      actionType: 'view_details'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Report dispute error:', error);
    res.status(500).json({ message: 'Server error reporting dispute' });
  }
};

// @desc    Resolve dispute
// @route   PATCH /api/work-progress/:jobId/dispute/:disputeId/resolve
// @access  Private (Landowner or Admin)
exports.resolveDispute = async (req, res) => {
  try {
    const { jobId, disputeId } = req.params;
    const { resolution } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    const dispute = workProgress.disputes.id(disputeId);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Only landowner or admin can resolve disputes
    const isLandowner = workProgress.landownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isLandowner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();

    await workProgress.save();

    // Create notification for the other party
    const recipientId = dispute.reportedBy;
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'application_status',
      title: 'Dispute Resolved',
      message: `Your dispute has been resolved: ${resolution}`,
      jobId: jobId,
      actionRequired: false,
      actionType: 'none'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Server error resolving dispute' });
  }
};

// ===== WORK MODIFICATION REQUESTS =====

// @desc    Request work modification
// @route   POST /api/work-progress/:jobId/modification-request
// @access  Private
exports.requestModification = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { requestType, title, description, proposedChanges, impact } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is involved in this job
    const isLandowner = workProgress.landownerId.toString() === req.user._id.toString();
    const isContractor = workProgress.contractorId.toString() === req.user._id.toString();
    
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const modificationRequest = {
      requestedBy: req.user._id,
      requestedByType: isLandowner ? 'landowner' : 'contractor',
      requestType,
      title,
      description,
      proposedChanges,
      impact,
      status: 'pending',
      createdAt: new Date()
    };

    workProgress.modificationRequests.push(modificationRequest);
    await workProgress.save();

    // Create notification for the other party
    const recipientId = isLandowner ? workProgress.contractorId : workProgress.landownerId;
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'application_status',
      title: 'Modification Request',
      message: `A modification request has been made: ${title}`,
      jobId: jobId,
      actionRequired: true,
      actionType: 'view_details'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Request modification error:', error);
    res.status(500).json({ message: 'Server error requesting modification' });
  }
};

// @desc    Approve/reject modification request
// @route   PATCH /api/work-progress/:jobId/modification-request/:requestId/respond
// @access  Private
exports.respondToModificationRequest = async (req, res) => {
  try {
    const { jobId, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    const request = workProgress.modificationRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Modification request not found' });
    }

    // Check if user is the other party involved in this job
    const isLandowner = workProgress.landownerId.toString() === req.user._id.toString();
    const isContractor = workProgress.contractorId.toString() === req.user._id.toString();
    
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can't approve/reject your own request
    if (request.requestedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot respond to your own request' });
    }

    request.status = status;
    if (status === 'approved') {
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
    }

    await workProgress.save();

    // Create notification for the requester
    await Notification.create({
      recipient: request.requestedBy,
      sender: req.user._id,
      type: 'application_status',
      title: 'Modification Request Response',
      message: `Your modification request has been ${status}: ${request.title}`,
      jobId: jobId,
      actionRequired: false,
      actionType: 'none'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Respond to modification request error:', error);
    res.status(500).json({ message: 'Server error responding to modification request' });
  }
};

// ===== COMMUNICATION =====

// @desc    Send message
// @route   POST /api/work-progress/:jobId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { message, attachments } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is involved in this job
    const isLandowner = workProgress.landownerId.toString() === req.user._id.toString();
    const isContractor = workProgress.contractorId.toString() === req.user._id.toString();
    
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const newMessage = {
      senderId: req.user._id,
      senderType: isLandowner ? 'landowner' : 'contractor',
      message,
      attachments: attachments || [],
      isRead: false,
      createdAt: new Date()
    };

    workProgress.messages.push(newMessage);
    await workProgress.save();

    // Create notification for the other party
    const recipientId = isLandowner ? workProgress.contractorId : workProgress.landownerId;
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'general',
      title: 'New Message',
      message: `You have a new message about your job`,
      jobId: jobId,
      actionRequired: true,
      actionType: 'view_details'
    });

    res.json(workProgress);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/work-progress/:jobId/messages/read
// @access  Private
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { jobId } = req.params;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Mark all messages from the other party as read
    workProgress.messages.forEach(msg => {
      if (msg.senderId.toString() !== req.user._id.toString()) {
        msg.isRead = true;
      }
    });

    await workProgress.save();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
};

// ===== WEEKLY PROGRESS MANAGEMENT =====

// @desc    Get weekly progress for a job
// @route   GET /api/work-progress/:jobId/weekly
// @access  Private
exports.getWeeklyProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check authorization
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (req.user.role === 'landowner' && job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'contractor' && job.selectedContractor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Sort weekly progress by week number
    const sortedWeeklyProgress = workProgress.weeklyProgress.sort((a, b) => a.weekNumber - b.weekNumber);
    
    res.json(sortedWeeklyProgress);
  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({ message: 'Server error fetching weekly progress' });
  }
};

// @desc    Add weekly progress update
// @route   POST /api/work-progress/:jobId/weekly
// @access  Private (Contractor only)
exports.addWeeklyProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { weekNumber, description, progressPercentage, photos, challenges, nextWeekPlan } = req.body;

    console.log('Received weekly progress data:', {
      jobId,
      weekNumber,
      description,
      progressPercentage,
      photos: photos ? photos.length : 0,
      challenges,
      nextWeekPlan
    });

    // Convert string values to numbers
    const weekNumberNum = parseInt(weekNumber);
    const progressPercentageNum = parseInt(progressPercentage);

    // Validate the converted values
    if (isNaN(weekNumberNum) || weekNumberNum < 1) {
      return res.status(400).json({ message: 'Invalid week number' });
    }

    if (isNaN(progressPercentageNum) || progressPercentageNum < 0 || progressPercentageNum > 100) {
      return res.status(400).json({ message: 'Invalid progress percentage' });
    }

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      console.log('Work progress not found for jobId:', jobId);
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the contractor for this job
    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      console.log('Authorization failed. Contractor ID:', workProgress.contractorId, 'User ID:', req.user._id);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if week number already exists
    const existingWeek = workProgress.weeklyProgress.find(wp => wp.weekNumber === weekNumberNum);
    if (existingWeek) {
      return res.status(400).json({ message: 'Weekly progress for this week already exists' });
    }

    const weeklyUpdate = {
      weekNumber: weekNumberNum,
      description,
      progressPercentage: progressPercentageNum,
      photos: photos || [],
      challenges,
      nextWeekPlan,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    workProgress.weeklyProgress.push(weeklyUpdate);
    workProgress.currentProgress = progressPercentageNum;
    
    if (progressPercentageNum >= 100) {
      workProgress.status = 'completed';
      workProgress.actualCompletionDate = new Date();
    }

    await workProgress.save();
    console.log('Weekly progress saved successfully');

    // Create notification for landowner
    try {
      await Notification.create({
        recipient: workProgress.landownerId,
        sender: req.user._id,
        type: 'weekly_progress',
        title: 'Weekly Progress Update',
        message: `Week ${weekNumberNum} progress update: ${progressPercentageNum}% complete`,
        jobId: jobId,
        actionRequired: false,
        actionType: 'view_details'
      });
      console.log('Notification created successfully');
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the whole request if notification fails
    }

    // Sort and return updated weekly progress
    const sortedWeeklyProgress = workProgress.weeklyProgress.sort((a, b) => a.weekNumber - b.weekNumber);
    res.json(sortedWeeklyProgress);
  } catch (error) {
    console.error('Add weekly progress error:', error);
    res.status(500).json({ message: 'Server error adding weekly progress' });
  }
};

// @desc    Update weekly progress
// @route   PUT /api/work-progress/:jobId/weekly/:progressId
// @access  Private (Contractor only)
exports.updateWeeklyProgress = async (req, res) => {
  try {
    const { jobId, progressId } = req.params;
    const { weekNumber, description, progressPercentage, photos, challenges, nextWeekPlan } = req.body;

    // Convert string values to numbers
    const weekNumberNum = parseInt(weekNumber);
    const progressPercentageNum = parseInt(progressPercentage);

    // Validate the converted values
    if (isNaN(weekNumberNum) || weekNumberNum < 1) {
      return res.status(400).json({ message: 'Invalid week number' });
    }

    if (isNaN(progressPercentageNum) || progressPercentageNum < 0 || progressPercentageNum > 100) {
      return res.status(400).json({ message: 'Invalid progress percentage' });
    }

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the contractor for this job
    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const weeklyProgress = workProgress.weeklyProgress.id(progressId);
    if (!weeklyProgress) {
      return res.status(404).json({ message: 'Weekly progress not found' });
    }

    // Check if week number already exists (excluding current progress)
    const existingWeek = workProgress.weeklyProgress.find(wp => 
      wp.weekNumber === weekNumberNum && wp._id.toString() !== progressId
    );
    if (existingWeek) {
      return res.status(400).json({ message: 'Weekly progress for this week already exists' });
    }

    // Update the weekly progress
    weeklyProgress.weekNumber = weekNumberNum;
    weeklyProgress.description = description;
    weeklyProgress.progressPercentage = progressPercentageNum;
    weeklyProgress.photos = photos || weeklyProgress.photos;
    weeklyProgress.challenges = challenges;
    weeklyProgress.nextWeekPlan = nextWeekPlan;
    weeklyProgress.updatedAt = new Date();

    workProgress.currentProgress = progressPercentageNum;
    
    if (progressPercentageNum >= 100) {
      workProgress.status = 'completed';
      workProgress.actualCompletionDate = new Date();
    }

    await workProgress.save();

    // Sort and return updated weekly progress
    const sortedWeeklyProgress = workProgress.weeklyProgress.sort((a, b) => a.weekNumber - b.weekNumber);
    res.json(sortedWeeklyProgress);
  } catch (error) {
    console.error('Update weekly progress error:', error);
    res.status(500).json({ message: 'Server error updating weekly progress' });
  }
};

// @desc    Delete photo from weekly progress
// @route   DELETE /api/work-progress/:jobId/weekly/:progressId/photo/:photoIndex
// @access  Private (Contractor only)
exports.deleteWeeklyProgressPhoto = async (req, res) => {
  try {
    const { jobId, progressId, photoIndex } = req.params;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the contractor for this job
    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const weeklyProgress = workProgress.weeklyProgress.id(progressId);
    if (!weeklyProgress) {
      return res.status(404).json({ message: 'Weekly progress not found' });
    }

    const photoIndexNum = parseInt(photoIndex);
    if (photoIndexNum < 0 || photoIndexNum >= weeklyProgress.photos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    // Remove the photo
    weeklyProgress.photos.splice(photoIndexNum, 1);
    weeklyProgress.updatedAt = new Date();

    await workProgress.save();

    // Sort and return updated weekly progress
    const sortedWeeklyProgress = workProgress.weeklyProgress.sort((a, b) => a.weekNumber - b.weekNumber);
    res.json(sortedWeeklyProgress);
  } catch (error) {
    console.error('Delete weekly progress photo error:', error);
    res.status(500).json({ message: 'Server error deleting photo' });
  }
};

// ===== EXTENSION REQUESTS =====

// @desc    Request extension for job
// @route   POST /api/work-progress/:jobId/extension-request
// @access  Private (Contractor only)
exports.requestExtension = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason, requestedDays, newEndDate } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the contractor for this job
    if (workProgress.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if there's already a pending extension request
    const pendingRequest = workProgress.extensionRequests.find(req => req.status === 'pending');
    if (pendingRequest) {
      return res.status(400).json({ message: 'You already have a pending extension request' });
    }

    const extensionRequest = {
      requestedBy: req.user._id,
      reason,
      requestedDays,
      newEndDate: new Date(newEndDate),
      status: 'pending',
      createdAt: new Date()
    };
    console.log('Creating extension request:', extensionRequest);

    workProgress.extensionRequests.push(extensionRequest);
    await workProgress.save();

    // Create notification for landowner
    await Notification.create({
      recipient: workProgress.landownerId,
      sender: req.user._id,
      type: 'extension_request',
      title: 'Extension Request',
      message: `Contractor has requested a ${requestedDays}-day extension for your job. Please review and respond.`,
      jobId: jobId,
      actionRequired: true,
      actionType: 'extension_response'
    });

    res.json({ message: 'Extension request sent successfully', extensionRequest });
  } catch (error) {
    console.error('Request extension error:', error);
    res.status(500).json({ message: 'Server error requesting extension' });
  }
};

// @desc    Respond to extension request (Landowner only)
// @route   PATCH /api/work-progress/:jobId/extension-request/:requestId
// @access  Private (Landowner only)
exports.respondToExtensionRequest = async (req, res) => {
  try {
    const { jobId, requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the landowner for this job
    if (workProgress.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const extensionRequest = workProgress.extensionRequests.id(requestId);
    if (!extensionRequest) {
      return res.status(404).json({ message: 'Extension request not found' });
    }

    if (extensionRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Extension request has already been processed' });
    }

    extensionRequest.status = status;
    extensionRequest.approvedBy = req.user._id;
    extensionRequest.approvedAt = new Date();

    // If approved, update job end date
    if (status === 'approved') {
      const job = await Job.findById(jobId);
      if (job) {
        job.endDate = extensionRequest.newEndDate;
        await job.save();
      }
    }

    await workProgress.save();

    // Create notification for contractor
    await Notification.create({
      recipient: extensionRequest.requestedBy,
      sender: req.user._id,
      type: 'extension_response',
      title: `Extension Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your extension request has been ${status} by the landowner.`,
      jobId: jobId,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.json({ message: `Extension request ${status}`, extensionRequest });
  } catch (error) {
    console.error('Respond to extension request error:', error);
    res.status(500).json({ message: 'Server error responding to extension request' });
  }
};

// @desc    Get extension requests for a job
// @route   GET /api/work-progress/:jobId/extension-requests
// @access  Private
exports.getExtensionRequests = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check authorization
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (req.user.role === 'landowner' && job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'contractor' && job.selectedContractor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(workProgress.extensionRequests);
  } catch (error) {
    console.error('Get extension requests error:', error);
    res.status(500).json({ message: 'Server error fetching extension requests' });
  }
};

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