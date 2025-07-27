const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugCurrentState() {
  try {
    console.log('🔍 Debugging Current AI Score State...\n');

    // Get all contractors
    const contractors = await User.find({ role: 'contractor' }).select('name profile.aiScore profile.latestJobAIScore profile.shortlistHistory profile.rating profile.completedJobs');
    
    console.log(`📊 Found ${contractors.length} contractors:\n`);
    
    contractors.forEach(contractor => {
      const aiScore = contractor.profile?.aiScore || 0;
      const latestJobScore = contractor.profile?.latestJobAIScore || 0;
      const history = contractor.profile?.shortlistHistory || [];
      
      console.log(`👤 ${contractor.name}:`);
      console.log(`   Overall AI Score: ${Math.round(aiScore * 100)}%`);
      console.log(`   Latest Job Score: ${latestJobScore > 0 ? Math.round(latestJobScore * 100) + '%' : 'N/A'}`);
      console.log(`   Shortlist History: ${history.length} entries`);
      console.log(`   Rating: ${contractor.profile?.rating || 'N/A'}`);
      console.log(`   Completed Jobs: ${contractor.profile?.completedJobs || 0}`);
      
      if (history.length > 0) {
        console.log(`   History Details:`);
        history.forEach((entry, index) => {
          const date = new Date(entry.date).toLocaleDateString();
          const score = Math.round(entry.score * 100);
          console.log(`     ${index + 1}. ${score}% (${date})`);
        });
      }
      console.log('');
    });
    
    // Check if there are any jobs with AI shortlists
    const Job = require('./server/models/Job');
    const jobsWithAI = await Job.find({ aiShortlistGenerated: true });
    console.log(`📋 Jobs with AI shortlists: ${jobsWithAI.length}`);
    
    if (jobsWithAI.length > 0) {
      console.log('Recent AI shortlists:');
      jobsWithAI.slice(0, 5).forEach(job => {
        console.log(`   - ${job.title} (${job.workType}) - ${new Date(job.aiShortlistDate || job.createdAt).toLocaleDateString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging state:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCurrentState(); 