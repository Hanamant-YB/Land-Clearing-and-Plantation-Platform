// Simple test to check AI scores without mongoose dependency
const axios = require('axios');

async function testAIScores() {
  try {
    console.log('🔍 Testing AI Scores via API...\n');

    // Test the analytics endpoint
    const response = await axios.get('http://localhost:5000/api/admin/analytics');
    
    console.log('📊 Analytics Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.aiAnalytics) {
      console.log('\n✅ AI Analytics found!');
      console.log(`Average AI Score: ${response.data.aiAnalytics.metrics?.avgAIScore || 'N/A'}%`);
      console.log(`Top Contractors: ${response.data.aiAnalytics.topContractors?.length || 0}`);
    } else {
      console.log('\n⚠️  No AI Analytics found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing AI scores:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAIScores(); 