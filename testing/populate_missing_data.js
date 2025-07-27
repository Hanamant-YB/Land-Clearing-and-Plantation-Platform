const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');

mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function populateMissingData() {
  try {
    console.log('🔄 Populating Missing AI Score Data...\n');

    // Get all contractors with AI scores
    const contractors = await User.find({ 
      role: 'contractor',
      'profile.aiScore': { $gt: 0 }
    });

    console.log(`📊 Found ${contractors.length} contractors with AI scores\n`);

    for (const contractor of contractors) {
      const currentAIScore = contractor.profile?.aiScore || 0;
      const shortlistHistory = contractor.profile?.shortlistHistory || [];
      const latestJobAIScore = contractor.profile?.latestJobAIScore || 0;
      
      console.log(`👤 Processing ${contractor.name}:`);
      console.log(`   Current AI Score: ${Math.round(currentAIScore * 100)}%`);
      console.log(`   Has Latest Job Score: ${latestJobAIScore > 0 ? 'Yes' : 'No'}`);
      console.log(`   Has History: ${shortlistHistory.length > 0 ? 'Yes' : 'No'}`);

      // Check if contractor has been in any AI shortlists
      const jobsWithContractor = await Job.find({
        aiShortlisted: contractor._id,
        aiShortlistGenerated: true
      });

      console.log(`   Found ${jobsWithContractor.length} jobs with AI shortlists`);

      if (jobsWithContractor.length > 0) {
        // Create history from actual job data
        const history = [];
        let latestScore = 0;

        for (const job of jobsWithContractor) {
          const shortlistEntry = job.aiShortlistScores?.find(score => 
            score.contractorId?.toString() === contractor._id.toString()
          );

          if (shortlistEntry) {
            const score = shortlistEntry.overallScore / 100; // Convert from percentage to 0-1
            history.push({
              score: score,
              date: job.aiShortlistDate || job.createdAt
            });
            
            // Keep track of the most recent score
            if (!latestScore || job.aiShortlistDate > latestScore.date) {
              latestScore = score;
            }
          }
        }

        // Sort history by date
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate overall average
        const totalScore = history.reduce((sum, entry) => sum + entry.score, 0);
        const overallAIScore = history.length > 0 ? totalScore / history.length : currentAIScore;

        // Update contractor
        await User.findByIdAndUpdate(contractor._id, {
          'profile.shortlistHistory': history,
          'profile.aiScore': overallAIScore,
          'profile.latestJobAIScore': latestScore || currentAIScore
        });

        console.log(`   ✅ Updated with ${history.length} real job entries`);
        console.log(`   📈 New Overall Score: ${Math.round(overallAIScore * 100)}%`);
        console.log(`   📅 Latest Job Score: ${Math.round((latestScore || currentAIScore) * 100)}%`);

      } else {
        // No real job data, create realistic dummy data
        const history = [];
        const baseScore = currentAIScore;
        
        // Generate 2-4 historical entries with slight variations
        const numEntries = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < numEntries; i++) {
          const variation = (Math.random() - 0.5) * 0.15; // ±7.5%
          const score = Math.max(0.1, Math.min(1.0, baseScore + variation));
          
          const daysAgo = (numEntries - i) * 10 + Math.floor(Math.random() * 20);
          const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          
          history.push({
            score: score,
            date: date
          });
        }
        
        // Calculate new overall score
        const totalScore = history.reduce((sum, entry) => sum + entry.score, 0);
        const newOverallScore = totalScore / history.length;
        
        // Update contractor
        await User.findByIdAndUpdate(contractor._id, {
          'profile.shortlistHistory': history,
          'profile.aiScore': newOverallScore,
          'profile.latestJobAIScore': currentAIScore
        });
        
        console.log(`   ✅ Created ${history.length} dummy entries`);
        console.log(`   📈 New Overall Score: ${Math.round(newOverallScore * 100)}%`);
        console.log(`   📅 Latest Job Score: ${Math.round(currentAIScore * 100)}%`);
      }
      
      console.log('');
    }
    
    console.log('✅ Data population completed!');
    console.log('   - All contractors now have proper AI score history');
    console.log('   - Latest job scores are populated');
    console.log('   - AI Jobs count will update correctly');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateMissingData(); 