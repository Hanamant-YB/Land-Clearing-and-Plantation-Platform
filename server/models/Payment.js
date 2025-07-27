const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  landownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Payment Structure
  paymentType: {
    type: String,
    enum: ['full_payment', 'milestone_payment', 'partial_payment', 'bonus', 'penalty'],
    default: 'full_payment'
  },
  
  // Milestone Payment Details
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkProgress.milestones'
  },
  milestoneTitle: String,
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash', 'cheque', 'online'],
    default: 'online'
  },
  
  // Transaction Details
  transactionId: String,
  transactionReference: String,
  paymentGateway: String,
  
  // Approval Process
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Release Process
  releasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  releasedAt: Date,
  releaseNotes: String,
  
  // Receipt and Documentation
  receiptNumber: String,
  receiptUrl: String,
  invoiceNumber: String,
  invoiceUrl: String,
  
  // Payment Terms
  dueDate: Date,
  paidAt: Date,
  
  // Dispute and Refund
  disputeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkProgress.disputes'
  },
  refundReason: String,
  refundAmount: Number,
  refundedAt: Date,
  
  // Notes and Communication
  notes: String,
  internalNotes: String,
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ jobId: 1 });
paymentSchema.index({ landownerId: 1 });
paymentSchema.index({ contractorId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);