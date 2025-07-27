const mongoose = require('mongoose');
const User = require('./models/User');
const aiAnalyticsService = require('./services/aiAnalyticsService');

mongoose.connect('mongodb://localhost:27017/contractor-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testDashboardData() {
  try {
    console.log('🔍 Testing Dashboard Data...\n');

    // Test getTopContractors
    const topContractors = await aiAnalyticsService.getTopContractors(10);
    console.log('📊 Top Contractors Data:');
    topContractors.forEach((contractor, index) => {
      console.log(`  ${index + 1}. ${contractor.name}:`);
      console.log(`     Overall AI Score: ${Math.round(contractor.aiScore * 100)}%`);
      console.log(`     Latest Job Score: ${contractor.latestJobAIScore ? Math.round(contractor.latestJobAIScore * 100) + '%' : 'N/A'}`);
      console.log(`     AI Jobs Count: ${contractor.aiJobsCount}`);
      console.log(`     Rating: ${contractor.rating}/5`);
      console.log(`     Completed Jobs: ${contractor.completedJobs}`);
      console.log('');
    });

    // Test getAverageAIScore
    const avgAIScore = await aiAnalyticsService.getAverageAIScore();
    console.log(`📈 Average AI Score: ${avgAIScore}%`);

    // Test comprehensive analytics
    const analytics = await aiAnalyticsService.getComprehensiveAnalytics();
    console.log('\n📋 Comprehensive Analytics:');
    console.log(`  Average AI Score: ${analytics.metrics?.avgAIScore || 'N/A'}%`);
    console.log(`  Top Contractors: ${analytics.topContractors?.length || 0}`);
    
    if (analytics.topContractors && analytics.topContractors.length > 0) {
      console.log('  Top Contractors Details:');
      analytics.topContractors.forEach((contractor, index) => {
        console.log(`    ${index + 1}. ${contractor.name}: ${Math.round(contractor.aiScore * 100)}% (${contractor.aiJobsCount} AI jobs)`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDashboardData(); 