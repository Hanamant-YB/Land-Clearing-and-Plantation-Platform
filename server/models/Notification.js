const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'job_selection',
      'job_completion',
      'payment_received',
      'application_status',
      'general',
      'extension_request',
      'extension_response',
      'payment',
      'weekly_progress',
      'feedback_request',
      'feedback_received',
      'feedback_deleted'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: [
      'accept_reject',
      'view_details',
      'none',
      'extension_response',
      'submit_feedback'
    ],
    default: 'none'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 