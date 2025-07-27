// fixContractorRatings.js
// Run this script with: node server/scripts/fixContractorRatings.js

const mongoose = require('mongoose');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

const MONGO_URI = 'mongodb://localhost:27017/contractor-platform'; // <-- Direct URI here

async function backfillContractorRatings() {
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
      // Get all feedback for this contractor
      const feedbacks = await Feedback.find({ contractorId: contractor._id, isDeleted: false });
      if (feedbacks.length === 0) continue;
      const avgRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length;
      await User.findByIdAndUpdate(contractor._id, { 'profile.rating': avgRating });
      updatedCount++;
      console.log(`Updated contractor ${contractor.name} (${contractor._id}): avgRating = ${avgRating.toFixed(2)}`);
    }

    console.log(`Done! Updated ${updatedCount} contractors.`);
    process.exit(0);
  } catch (err) {
    console.error('Error backfilling contractor ratings:', err);
    process.exit(1);
  }
}

backfillContractorRatings(); 