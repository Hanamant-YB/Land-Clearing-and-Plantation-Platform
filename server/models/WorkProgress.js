const mongoose = require('mongoose');

const workProgressSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  contractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Weekly Progress Updates
  weeklyProgress: [{
    weekNumber: { type: Number, required: true },
    description: { type: String, required: true },
    progressPercentage: { type: Number, min: 0, max: 100, required: true },
    photos: [{ type: String }], // Array of photo URLs
    challenges: { type: String }, // Optional challenges faced
    nextWeekPlan: { type: String }, // Optional plan for next week
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // Extension Requests
  extensionRequests: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    requestedDays: { type: Number, required: true, min: 1, max: 30 },
    newEndDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Progress Updates (Legacy - keeping for backward compatibility)
  updates: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    progressPercentage: { type: Number, min: 0, max: 100 },
    photos: [{ type: String }], // Array of photo URLs
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Milestones and Checkpoints
  milestones: [{
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedDate: { type: Date },
    photos: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Quality Assurance
  qualityReviews: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewerType: { type: String, enum: ['landowner', 'admin'], required: true },
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    photos: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Disputes and Issues
  disputes: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedByType: { type: String, enum: ['landowner', 'contractor'], required: true },
    issueType: { 
      type: String, 
      enum: ['quality_issue', 'delay', 'communication', 'payment', 'other'],
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { 
      type: String, 
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    photos: [{ type: String }],
    resolution: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Work Modification Requests
  modificationRequests: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedByType: { type: String, enum: ['landowner', 'contractor'], required: true },
    requestType: { 
      type: String, 
      enum: ['scope_change', 'timeline_change', 'budget_change', 'quality_improvement', 'other'],
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    proposedChanges: { type: String },
    impact: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'under_review'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Overall Progress
  currentProgress: { type: Number, min: 0, max: 100, default: 0 },
  startDate: { type: Date },
  estimatedCompletionDate: { type: Date },
  actualCompletionDate: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'not_started'
  },
  
  // Communication
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderType: { type: String, enum: ['landowner', 'contractor'], required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }], // Array of file URLs
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
workProgressSchema.index({ jobId: 1 });
workProgressSchema.index({ contractorId: 1 });
workProgressSchema.index({ landownerId: 1 });
workProgressSchema.index({ status: 1 });

module.exports = mongoose.model('WorkProgress', workProgressSchema); 