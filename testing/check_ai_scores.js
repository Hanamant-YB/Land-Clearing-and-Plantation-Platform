const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkAIScores() {
  try {
    console.log('🔍 Checking AI Scores in Contractor Profiles...\n');

    // Get all contractors
    const contractors = await User.find({ role: 'contractor' }).select('name profile.aiScore profile.rating profile.completedJobs profile.skillMatchScore profile.reliabilityScore profile.experienceScore profile.locationScore profile.qualityScore profile.budgetCompatibility');
    
    console.log(`📊 Found ${contractors.length} contractors:\n`);
    
    let contractorsWithAIScore = 0;
    let totalAIScore = 0;
    
    contractors.forEach(contractor => {
      const aiScore = contractor.profile?.aiScore || 0;
      const aiScorePercent = Math.round(aiScore * 100);
      
      console.log(`👤 ${contractor.name}:`);
      console.log(`   AI Score: ${aiScorePercent}% (${aiScore})`);
      console.log(`   Rating: ${contractor.profile?.rating || 'N/A'}`);
      console.log(`   Completed Jobs: ${contractor.profile?.completedJobs || 0}`);
      
      // Check individual scores
      if (contractor.profile?.skillMatchScore) {
        console.log(`   Skill Match: ${Math.round(contractor.profile.skillMatchScore * 100)}%`);
      }
      if (contractor.profile?.reliabilityScore) {
        console.log(`   Reliability: ${Math.round(contractor.profile.reliabilityScore * 100)}%`);
      }
      if (contractor.profile?.experienceScore) {
        console.log(`   Experience: ${Math.round(contractor.profile.experienceScore * 100)}%`);
      }
      if (contractor.profile?.locationScore) {
        console.log(`   Location: ${Math.round(contractor.profile.locationScore * 100)}%`);
      }
      if (contractor.profile?.qualityScore) {
        console.log(`   Quality: ${Math.round(contractor.profile.qualityScore * 100)}%`);
      }
      if (contractor.profile?.budgetCompatibility) {
        console.log(`   Budget: ${Math.round(contractor.profile.budgetCompatibility * 100)}%`);
      }
      
      console.log('');
      
      if (aiScore > 0) {
        contractorsWithAIScore++;
        totalAIScore += aiScore;
      }
    });
    
    const avgAIScore = contractorsWithAIScore > 0 ? totalAIScore / contractorsWithAIScore : 0;
    const avgAIScorePercent = Math.round(avgAIScore * 100);
    
    console.log('📈 Summary:');
    console.log(`  Total Contractors: ${contractors.length}`);
    console.log(`  Contractors with AI Score: ${contractorsWithAIScore}`);
    console.log(`  Average AI Score: ${avgAIScorePercent}%`);
    
    if (contractorsWithAIScore === 0) {
      console.log('\n⚠️  No contractors have AI scores yet!');
      console.log('   To update AI scores:');
      console.log('   1. Generate an AI shortlist for any job');
      console.log('   2. The AI scores will be automatically updated in contractor profiles');
    } else {
      console.log('\n✅ AI scores are being updated correctly!');
      console.log('   The scores are stored in contractor profiles and will be used in admin analytics.');
    }
    
  } catch (error) {
    console.error('❌ Error checking AI scores:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAIScores(); 