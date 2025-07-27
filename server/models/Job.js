const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shortlisted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  aiShortlisted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // AI shortlisted contractors
  selectedContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Landowner's final choice
  assignmentAccepted: { type: Boolean, default: false }, // Track if contractor accepted assignment
  status:      { type: String, enum: ['open','in_progress','completed','pending_acceptance'], default: 'open' },
  
  // Additional fields from the frontend form
  landSize:    { type: Number, required: true },
  location:    { type: String, required: true },
  workType:    { type: String, required: true },
  // budget:      { type: Number }, // Removed: budget is now calculated from contractor rates
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  images:      [{ type: String }], // Array of image file paths
  
  // Review and rating fields for completed jobs
  rating:      { type: Number, min: 1, max: 5 }, // Rating from 1-5
  review:      { type: String }, // Review comment from landowner
  
  // AI/ML Enhanced Fields
  requiredSkills: { type: [String], default: [] }, // Skills required for the job
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  complexity: { type: String, enum: ['simple', 'moderate', 'complex', 'expert'], default: 'moderate' },
  estimatedDuration: { type: Number }, // Estimated days to complete
  locationCoordinates: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  // AI shortlist metadata
  aiShortlistGenerated: { type: Boolean, default: false },
  aiShortlistDate: { type: Date },
  aiShortlistScores: [{
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overallScore: { type: Number },
    skillMatchScore: { type: Number },
    reliabilityScore: { type: Number },
    experienceScore: { type: Number },
    locationScore: { type: Number },
    budgetScore: { type: Number },
    explanation: { type: String },
    estimatedCost: { type: Number }
  }],
  // Success tracking for AI recommendations
  wasAISelected: { type: Boolean, default: false }, // Track if AI-recommended contractor was selected
  aiSuccessRate: { type: Number, default: 0 }, // Overall AI success rate for this job type
  
  // Additional metadata
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false },
  isFeedbackGiven: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);