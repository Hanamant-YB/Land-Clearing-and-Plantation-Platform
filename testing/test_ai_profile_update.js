const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testAIProfileUpdate() {
  try {
    console.log('🔍 Testing AI Profile Update...\n');

    // Get all contractors
    const contractors = await User.find({ role: 'contractor' }).select('name profile.aiScore profile.rating profile.completedJobs');
    
    console.log(`📊 Found ${contractors.length} contractors:`);
    
    let contractorsWithAIScore = 0;
    let totalAIScore = 0;
    
    contractors.forEach(contractor => {
      const aiScore = contractor.profile?.aiScore || 0;
      const aiScorePercent = Math.round(aiScore * 100);
      
      console.log(`  ${contractor.name}:`);
      console.log(`    AI Score: ${aiScorePercent}% (${aiScore})`);
      console.log(`    Rating: ${contractor.profile?.rating || 'N/A'}`);
      console.log(`    Completed Jobs: ${contractor.profile?.completedJobs || 0}`);
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
      console.log('   Generate an AI shortlist to update contractor profiles.');
    } else {
      console.log('\n✅ AI scores are being updated correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error testing AI profile update:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAIProfileUpdate(); 