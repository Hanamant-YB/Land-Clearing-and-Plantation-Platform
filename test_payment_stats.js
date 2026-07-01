// test_payment_stats.js - Test payment stats API
const axios = require('axios');

async function testPaymentStats() {
  try {
    console.log('🔍 Testing payment stats API...');
    
    // You'll need to replace this with a real contractor token
    const token = 'YOUR_CONTRACTOR_TOKEN_HERE';
    const baseURL = 'http://localhost:5000';
    
    const response = await axios.get(`${baseURL}/api/payments/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Payment stats response:', response.data);
    console.log('📊 Breakdown:');
    console.log('  - Total payments:', response.data.totalPayments);
    console.log('  - Pending payments:', response.data.pendingPayments);
    console.log('  - Pending amount: ₹', response.data.pendingAmount);
    console.log('  - Completed payments:', response.data.completedPayments);
    console.log('  - Completed amount: ₹', response.data.completedAmount);
    
  } catch (error) {
    console.error('❌ Error testing payment stats:', error.response?.data || error.message);
  }
}

testPaymentStats(); 