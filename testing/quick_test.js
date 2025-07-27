const mongoose = require('mongoose');
const User = require('./server/models/User');

mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function quickTest() {
  try {
    console.log('🔍 Quick Test - Current AI Score State\n');
    
    const contractors = await User.find({ role: 'contractor' })
      .select('name profile.aiScore profile.latestJobAIScore profile.shortlistHistory');
    
    contractors.forEach(c => {
      console.log(`${c.name}:`);
      console.log(`  Overall: ${Math.round((c.profile?.aiScore || 0) * 100)}%`);
      console.log(`  Latest: ${c.profile?.latestJobAIScore ? Math.round(c.profile.latestJobAIScore * 100) + '%' : 'N/A'}`);
      console.log(`  History: ${c.profile?.shortlistHistory?.length || 0} entries`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

quickTest(); 