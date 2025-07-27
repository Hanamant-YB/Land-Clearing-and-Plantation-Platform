const mongoose = require('mongoose');
const Job = require('./models/Job');

mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkSuccessRate() {
  try {
    console.log('🔍 Checking AI Success Rate...\n');

    // Check all jobs with AI shortlists
    const jobsWithAI = await Job.find({ aiShortlistGenerated: true });
    console.log(`📊 Total jobs with AI shortlists: ${jobsWithAI.length}`);

    // Check jobs where contractors were selected
    const jobsWithSelection = await Job.find({ 
      aiShortlistGenerated: true,
      selectedContractor: { $exists: true, $ne: null }
    });
    console.log(`📋 Jobs where contractors were selected: ${jobsWithSelection.length}`);

    // Check each job and fix wasAISelected field
    let fixedCount = 0;
    for (const job of jobsWithSelection) {
      const wasAISelected = job.aiShortlisted.includes(job.selectedContractor);
      
      if (job.wasAISelected !== wasAISelected) {
        await Job.findByIdAndUpdate(job._id, {
          wasAISelected: wasAISelected
        });
        fixedCount++;
        console.log(`✅ Fixed job "${job.title}": wasAISelected = ${wasAISelected}`);
      }
    }

    // Recalculate success rate
    const updatedJobsWithSelection = await Job.find({ 
      aiShortlistGenerated: true,
      selectedContractor: { $exists: true, $ne: null }
    });
    
    const aiSelected = updatedJobsWithSelection.filter(job => job.wasAISelected);
    const successRate = updatedJobsWithSelection.length > 0 ? 
      (aiSelected.length / updatedJobsWithSelection.length) * 100 : 0;

    console.log('\n📈 Success Rate Analysis:');
    console.log(`   Total jobs with AI shortlists: ${jobsWithAI.length}`);
    console.log(`   Jobs with contractor selection: ${updatedJobsWithSelection.length}`);
    console.log(`   Jobs where AI contractor was selected: ${aiSelected.length}`);
    console.log(`   Success Rate: ${Math.round(successRate)}%`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} jobs with incorrect wasAISelected field`);
    } else {
      console.log('\n✅ All jobs already have correct wasAISelected field');
    }

    // Show some examples
    if (aiSelected.length > 0) {
      console.log('\n🏆 Successful AI selections:');
      aiSelected.slice(0, 3).forEach(job => {
        console.log(`   - "${job.title}" (${job.workType})`);
      });
    }

    if (updatedJobsWithSelection.length > aiSelected.length) {
      console.log('\n❌ Non-AI selections:');
      const nonAISelected = updatedJobsWithSelection.filter(job => !job.wasAISelected);
      nonAISelected.slice(0, 3).forEach(job => {
        console.log(`   - "${job.title}" (${job.workType})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking success rate:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkSuccessRate(); 