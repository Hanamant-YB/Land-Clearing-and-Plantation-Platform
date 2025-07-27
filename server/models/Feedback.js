const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  // Job details for reference
  jobTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    required: true
  },
  jobBudget: {
    type: Number,
    required: true
  },
  jobLocation: {
    type: String,
    required: true
  },
  // Feedback details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true,
    trim: true
  },
  // Quality assessment
  qualityOfWork: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  timeliness: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  // Additional feedback
  strengths: {
    type: String,
    trim: true
  },
  areasForImprovement: {
    type: String,
    trim: true
  },
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  // Metadata
  isVerified: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ contractorId: 1, createdAt: -1 });
feedbackSchema.index({ jobId: 1 });
feedbackSchema.index({ isDeleted: 1 });

// Virtual for overall score
feedbackSchema.virtual('overallScore').get(function() {
  return ((this.qualityOfWork + this.communication + this.timeliness + this.professionalism) / 4).toFixed(1);
});

// Ensure virtuals are included in JSON
feedbackSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Feedback', feedbackSchema); 