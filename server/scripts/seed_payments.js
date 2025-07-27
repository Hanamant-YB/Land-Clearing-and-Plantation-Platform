// contractor-platform/server/scripts/seed_payments.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Payment = require('../models/Payment');

// Change this to your actual MongoDB URI if needed
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/contractor-platform';

async function seedPayments() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const now = new Date();
  const baseAmount = 10000;
  const landownerId = '000000000000000000000001'; // Replace with a real landownerId
  const contractorId = '000000000000000000000002'; // Replace with a real contractorId
  const jobId = '000000000000000000000003'; // Replace with a real jobId

  const payments = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 10, 12, 0, 0, 0);
    payments.push({
      jobId,
      landownerId,
      contractorId,
      amount: baseAmount + i * 5000,
      currency: 'INR',
      paymentType: 'full_payment',
      status: 'completed',
      paymentMethod: 'online',
      createdBy: landownerId,
      createdAt: monthDate,
      updatedAt: monthDate
    });
  }

  await Payment.insertMany(payments);
  console.log('Seeded payments for the last 6 months!');
  await mongoose.disconnect();
}

seedPayments().catch(err => {
  console.error(err);
  process.exit(1);
}); 