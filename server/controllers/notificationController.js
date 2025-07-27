const Notification = require('../models/Notification');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, jobId, actionRequired, actionType } = req.body;
    
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message,
      jobId,
      actionRequired: actionRequired || false,
      actionType: actionType || 'none',
      expiresAt: actionRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null // 7 days for action required
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .populate('jobId', 'title workType location budget');

    res.status(201).json(populatedNotification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error creating notification' });
  }
};

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .populate('jobId', 'title workType location budget')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Server error marking all notifications as read' });
  }
};

// @desc    Handle job selection response (accept/reject)
// @route   POST /api/notifications/:id/respond
// @access  Private
exports.respondToJobSelection = async (req, res) => {
  try {
    const { response } = req.body; // 'accept' or 'reject'
    const notification = await Notification.findById(req.params.id)
      .populate('jobId')
      .populate('sender', 'name email');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (notification.type !== 'job_selection' || notification.actionType !== 'accept_reject') {
      return res.status(400).json({ message: 'Invalid notification type for this action' });
    }

    const job = await Job.findById(notification.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (response === 'accept') {
      job.assignmentAccepted = true;
      job.status = 'in_progress';
      await job.save();
      // Job is now assigned, update notification
      notification.isRead = true;
      notification.actionRequired = false;
      await notification.save();

      // Create acceptance notification for landowner
      await Notification.create({
        recipient: job.postedBy,
        sender: req.user._id,
        type: 'job_selection',
        title: 'Contractor Accepted Your Job',
        message: `${req.user.name} has accepted the job "${job.title}". The work can now begin.`,
        jobId: job._id,
        actionRequired: false,
        actionType: 'none'
      });

      res.json({ 
        message: 'Job accepted successfully',
        notification: notification,
        jobStatus: 'accepted'
      });

    } else if (response === 'reject') {
      job.selectedContractor = null;
      job.assignmentAccepted = false;
      job.status = 'open';
      await job.save();
      // Mark notification as read
      notification.isRead = true;
      notification.actionRequired = false;
      await notification.save();

      // Create rejection notification for landowner
      await Notification.create({
        recipient: job.postedBy,
        sender: req.user._id,
        type: 'job_selection',
        title: 'Contractor Declined Your Job',
        message: `${req.user.name} has declined the job "${job.title}". You can select another contractor from your shortlist.`,
        jobId: job._id,
        actionRequired: true,
        actionType: 'view_details'
      });

      res.json({ 
        message: 'Job rejected successfully',
        notification: notification,
        jobStatus: 'rejected'
      });

    } else {
      return res.status(400).json({ message: 'Invalid response. Must be "accept" or "reject"' });
    }

  } catch (error) {
    console.error('Respond to job selection error:', error);
    res.status(500).json({ message: 'Server error responding to job selection' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error getting unread count' });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notification.remove();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error deleting notification' });
  }
}; 