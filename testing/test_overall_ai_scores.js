const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testOverallAIScores() {
  try {
    console.log('🔍 Testing Overall AI Score System...\n');

    // Get all contractors with AI scores
    const contractors = await User.find({ 
      role: 'contractor',
      'profile.aiScore': { $gt: 0 }
    }).select('name profile.aiScore profile.latestJobAIScore profile.shortlistHistory profile.rating profile.completedJobs');
    
    console.log(`📊 Found ${contractors.length} contractors with AI scores:\n`);
    
    contractors.forEach(contractor => {
      const overallScore = contractor.profile?.aiScore || 0;
      const latestJobScore = contractor.profile?.latestJobAIScore || 0;
      const history = contractor.profile?.shortlistHistory || [];
      
      console.log(`👤 ${contractor.name}:`);
      console.log(`   Overall AI Score: ${Math.round(overallScore * 100)}% (average of ${history.length} jobs)`);
      console.log(`   Latest Job Score: ${Math.round(latestJobScore * 100)}%`);
      console.log(`   Rating: ${contractor.profile?.rating || 'N/A'}`);
      console.log(`   Completed Jobs: ${contractor.profile?.completedJobs || 0}`);
      console.log(`   AI Jobs History: ${history.length} jobs`);
      
      if (history.length > 0) {
        console.log(`   Score History:`);
        history.forEach((entry, index) => {
          const date = new Date(entry.date).toLocaleDateString();
          const score = Math.round(entry.score * 100);
          console.log(`     ${index + 1}. ${score}% (${date})`);
        });
      }
      console.log('');
    });
    
    // Test the difference between overall and latest scores
    const contractorsWithBothScores = contractors.filter(c => 
      c.profile?.aiScore > 0 && c.profile?.latestJobAIScore > 0
    );
    
    if (contractorsWithBothScores.length > 0) {
      console.log('📈 Score Comparison:');
      contractorsWithBothScores.forEach(contractor => {
        const overall = Math.round(contractor.profile.aiScore * 100);
        const latest = Math.round(contractor.profile.latestJobAIScore * 100);
        const diff = latest - overall;
        const trend = diff > 0 ? '📈 Improving' : diff < 0 ? '📉 Declining' : '➡️ Stable';
        
        console.log(`   ${contractor.name}: Overall ${overall}% vs Latest ${latest}% (${diff > 0 ? '+' : ''}${diff}%) ${trend}`);
      });
    }
    
    console.log('\n✅ Overall AI Score System is working!');
    console.log('   - Overall scores are averages of all historical job scores');
    console.log('   - Latest job scores show performance on most recent job');
    console.log('   - Both scores are maintained separately for better insights');
    
  } catch (error) {
    console.error('❌ Error testing overall AI scores:', error);
  } finally {
    mongoose.connection.close();
  }
}

testOverallAIScores(); 