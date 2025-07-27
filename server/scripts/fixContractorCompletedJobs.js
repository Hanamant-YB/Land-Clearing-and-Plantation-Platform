// fixContractorCompletedJobs.js
// Run this script with: node server/scripts/fixContractorCompletedJobs.js

const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const MONGO_URI = 'mongodb://localhost:27017/contractor-platform'; // Update if needed

async function backfillCompletedJobs() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to DB');

    // Get all contractors
    const contractors = await User.find({ role: 'contractor' });
    let updatedCount = 0;

    for (const contractor of contractors) {
      // Count completed jobs where this contractor was selected
      const completedJobs = await Job.countDocuments({
        selectedContractor: contractor._id,
        status: 'completed'
      });
      await User.findByIdAndUpdate(contractor._id, { 'profile.completedJobs': completedJobs });
      updatedCount++;
      console.log(`Updated contractor ${contractor.name} (${contractor._id}): completedJobs = ${completedJobs}`);
    }

    console.log(`Done! Updated ${updatedCount} contractors.`);
    process.exit(0);
  } catch (err) {
    console.error('Error backfilling contractor completedJobs:', err);
    process.exit(1);
  }
}

backfillCompletedJobs(); 