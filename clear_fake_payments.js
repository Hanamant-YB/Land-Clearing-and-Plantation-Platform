// clear_fake_payments.js - Remove fake seeded payments
const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./server/models/Payment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/contractor-platform';

async function clearFakePayments() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Remove all seeded payments (those created by the seed script)
    const result = await Payment.deleteMany({
      amount: { $in: [10000, 15000, 20000, 25000, 30000, 35000, 12000, 14000, 16000] }
    });

    console.log(`✅ Removed ${result.deletedCount} fake seeded payments`);
    console.log('🎯 Now only real contractor payments will show');

    // Show remaining payments
    const remainingPayments = await Payment.find();
    console.log(`📊 Remaining real payments: ${remainingPayments.length}`);
    
    if (remainingPayments.length > 0) {
      console.log('💰 Real payment amounts:', remainingPayments.map(p => `₹${p.amount} (${p.status})`));
    } else {
      console.log('📭 No real payments found - database is clean');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearFakePayments(); 