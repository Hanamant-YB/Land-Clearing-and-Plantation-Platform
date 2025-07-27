// server/models/User.js

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['landowner','contractor','admin'], required: true },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  username: { type: String, unique: true, sparse: true },
  profile:  {
    photo:         { type: String, default: '' },
    bio:           { type: String, default: '' },
    skills:        { type: [String], default: [] },
    pastJobs: [{
      title:       { type: String },
      type:        { type: String },
      description: { type: String },
      budget:      { type: Number },
      date:        { type: Date },
      rating:      { type: Number },
      photos:      [{ type: String }],
      landownerFeedback: { type: String },
      // Enhanced fields for automatically created entries
      landownerName: { type: String },
      landownerEmail: { type: String },
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      location: { type: String },
      landSize: { type: Number },
      startDate: { type: Date },
      endDate: { type: Date },
      completionDate: { type: Date }
    }],
    availability:  { type: String, default: 'Available' },
    rating:        { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    pendingJobs:   { type: Number, default: 0 },
    activeJobs:    { type: Number, default: 0 },
    postedJobs:    { type: Number, default: 0 },
    totalSpent:    { type: Number, default: 0 },
    // AI/ML Enhanced Fields
    aiScore:       { type: Number, default: 0 }, // Overall AI confidence score
    skillMatchScore: { type: Number, default: 0 }, // Skill matching score
    reliabilityScore: { type: Number, default: 0 }, // Based on completion rate, ratings
    experienceScore: { type: Number, default: 0 }, // Based on years, job count
    locationScore: { type: Number, default: 0 }, // Proximity to job location
    budgetCompatibility: { type: Number, default: 0 }, // Budget range compatibility
    responseTime: { type: Number, default: 0 }, // Average response time in hours
    cancellationRate: { type: Number, default: 0 }, // Percentage of cancelled jobs
    onTimeCompletion: { type: Number, default: 0 }, // Percentage of on-time completions
    qualityScore: { type: Number, default: 0 }, // Based on reviews and ratings
    // Location data for proximity calculations
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    // Work preferences and constraints
    preferredWorkTypes: { type: [String], default: [] },
    minBudget: { type: Number, default: 0 },
    maxBudget: { type: Number, default: 999999 },
    maxDistance: { type: Number, default: 50 }, // km
    // AI shortlist history
    shortlistHistory: [{
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      score: { type: Number },
      rank: { type: Number },
      selected: { type: Boolean, default: false },
      date: { type: Date, default: Date.now }
    }],
    otp: { type: String },
    otpExpiry: { type: Date },
    otpVerified: { type: Boolean, default: false },
    // Add ratesPerAcre for contractor pricing per work type
    ratesPerAcre: {
      type: Map,
      of: Number,
      default: {}
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password to hashed password in DB
userSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// Calculate distance between two points (Haversine formula)
userSchema.methods.calculateDistance = function(lat2, lon2) {
  const lat1 = this.profile.location.coordinates[1];
  const lon1 = this.profile.location.coordinates[0];
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('User', userSchema);