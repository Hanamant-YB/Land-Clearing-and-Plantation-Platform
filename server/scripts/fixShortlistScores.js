// fixShortlistScores.js
// Run this script with: node fixShortlistScores.js

const mongoose = require('mongoose');
const Job = require('../models/Job');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name'; // Update as needed

async function fixShortlistScores() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const jobs = await Job.find({ 'aiShortlistScores._id': { $exists: true }, 'aiShortlistScores.contractorId': { $exists: false } });
  let updatedCount = 0;

  for (const job of jobs) {
    let changed = false;
    job.aiShortlistScores = job.aiShortlistScores.map(item => {
      if (item._id && !item.contractorId) {
        changed = true;
        const { _id, ...rest } = item.toObject ? item.toObject() : item;
        return { ...rest, contractorId: _id };
      }
      return item;
    });
    if (changed) {
      await job.save();
      updatedCount++;
      console.log(`Updated job ${job._id}`);
    }
  }
  console.log(`Done. Updated ${updatedCount} jobs.`);
  await mongoose.disconnect();
}

fixShortlistScores().catch(err => {
  console.error('Error updating jobs:', err);
  process.exit(1);
}); 