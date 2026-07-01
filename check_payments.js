// check_payments.js - Check what payments exist
const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./server/models/Payment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/contractor-platform';

async function checkPayments() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Get all payments
    const allPayments = await Payment.find();
    console.log(`📊 Total payments in database: ${allPayments.length}`);

    if (allPayments.length === 0) {
      console.log('📭 No payments found');
      return;
    }

    console.log('\n💰 All payments:');
    allPayments.forEach((payment, index) => {
      console.log(`${index + 1}. ₹${payment.amount} - ${payment.status} - Created: ${payment.createdAt.toDateString()}`);
    });

    // Check for fake seeded payments
    const fakeAmounts = [10000, 15000, 20000, 25000, 30000, 35000, 12000, 14000, 16000];
    const fakePayments = allPayments.filter(p => fakeAmounts.includes(p.amount));
    
    if (fakePayments.length > 0) {
      console.log(`\n⚠️ Found ${fakePayments.length} fake seeded payments:`);
      fakePayments.forEach(p => {
        console.log(`   ₹${p.amount} - ${p.status}`);
      });
      
      console.log('\n🗑️ Removing fake payments...');
      const result = await Payment.deleteMany({
        amount: { $in: fakeAmounts }
      });
      console.log(`✅ Removed ${result.deletedCount} fake payments`);
    } else {
      console.log('\n✅ No fake payments found');
    }

    // Show remaining payments
    const remainingPayments = await Payment.find();
    console.log(`\n📊 Remaining payments: ${remainingPayments.length}`);
    
    if (remainingPayments.length > 0) {
      console.log('💰 Real payment amounts:');
      remainingPayments.forEach(p => {
        console.log(`   ₹${p.amount} - ${p.status}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPayments(); 