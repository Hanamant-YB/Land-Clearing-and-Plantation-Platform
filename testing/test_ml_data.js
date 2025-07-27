// Test script to check ML API data
const axios = require('axios');

async function testMLData() {
  try {
    console.log('🧪 Testing ML API Data...\n');

    // Sample data that should be sent to ML API
    const testData = [
      {
        job_budget: 0,
        completed_jobs: 5,
        contractor_rating: 4.5,
        contractor_experience: 3,
        location_score: 0.8,
        reliability_score: 0.9,
        experience_score: 0.7,
        skill_match_score: 0.85,
        ai_score: 0.75,
        skill_overlap: 3,
        skill_overlap_pct: 0.75,
        budget_diff: 0
      }
    ];

    console.log('📊 Sending test data to ML API:');
    console.log(JSON.stringify(testData, null, 2));

    // Test the ML API
    const response = await axios.post('http://localhost:5001/predict', testData);
    console.log('\n✅ ML API Response:');
    console.log('Predictions:', response.data.predictions);

    // Test the debug endpoint
    const testResponse = await axios.get('http://localhost:5001/test');
    console.log('\n🔍 ML API Status:');
    console.log(testResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the ML API is running:');
      console.log('   python debug_ml_api.py');
    }
  }
}

testMLData(); 