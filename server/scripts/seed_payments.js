// contractor-platform/server/scripts/seed_payments.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Payment = require('../models/Payment');
const User = require('../models/User');
const Job = require('../models/Job');

// Change this to your actual MongoDB URI if needed
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/contractor-platform';

async function seedPayments() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Find real users and jobs
  const landowner = await User.findOne({ role: 'landowner' });
  const contractor = await User.findOne({ role: 'contractor' });
  const job = await Job.findOne();

  if (!landowner || !contractor || !job) {
    console.log('❌ Need at least one landowner, contractor, and job in database');
    console.log('Landowner found:', !!landowner);
    console.log('Contractor found:', !!contractor);
    console.log('Job found:', !!job);
    await mongoose.disconnect();
    return;
  }

  console.log('✅ Found real users and job for seeding payments');

  const now = new Date();
  const baseAmount = 10000;
  const landownerId = landowner._id;
  const contractorId = contractor._id;
  const jobId = job._id;

  const payments = [];
  
  // Create completed payments for the last 6 months
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

  // Create pending payments for current month
  for (let i = 1; i <= 3; i++) {
    const pendingDate = new Date(now.getFullYear(), now.getMonth(), i * 5, 12, 0, 0, 0);
    payments.push({
      jobId,
      landownerId,
      contractorId,
      amount: baseAmount + i * 2000,
      currency: 'INR',
      paymentType: 'milestone_payment',
      status: 'pending',
      paymentMethod: 'online',
      createdBy: landownerId,
      createdAt: pendingDate,
      updatedAt: pendingDate
    });
  }

  await Payment.insertMany(payments);
  console.log('✅ Seeded payments: 6 completed + 3 pending payments!');
  console.log('💰 Total amount seeded:', payments.reduce((sum, p) => sum + p.amount, 0));
  console.log('📊 Pending amount:', payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0));
  await mongoose.disconnect();
}

seedPayments().catch(err => {
  console.error(err);
  process.exit(1);
}); 