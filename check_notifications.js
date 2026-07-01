// check_notifications.js - Check and create sample notifications
const mongoose = require('mongoose');
require('dotenv').config();

const Notification = require('./server/models/Notification');
const User = require('./server/models/User');
const Job = require('./server/models/Job');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/contractor-platform';

async function checkNotifications() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Get all notifications
    const allNotifications = await Notification.find()
      .populate('recipient', 'name email role')
      .populate('sender', 'name email role')
      .populate('jobId', 'title workType')
      .sort({ createdAt: -1 });

    console.log(`📊 Total notifications in database: ${allNotifications.length}`);

    if (allNotifications.length === 0) {
      console.log('📭 No notifications found - creating sample notifications...');
      
      // Find a contractor and landowner for sample notifications
      const contractor = await User.findOne({ role: 'contractor' });
      const landowner = await User.findOne({ role: 'landowner' });
      const job = await Job.findOne();

      if (!contractor || !landowner || !job) {
        console.log('❌ Need at least one contractor, landowner, and job in database');
        console.log('Contractor found:', !!contractor);
        console.log('Landowner found:', !!landowner);
        console.log('Job found:', !!job);
        await mongoose.disconnect();
        return;
      }

      console.log('✅ Found users and job for sample notifications');

      // Create sample notifications
      const sampleNotifications = [
        {
          recipient: contractor._id,
          sender: landowner._id,
          type: 'job_selection',
          title: 'Job Assignment Confirmed',
          message: `You have been selected for the job: ${job.title}. Please review the details and start working.`,
          jobId: job._id,
          isRead: false,
          actionRequired: true,
          actionType: 'view_details'
        },
        {
          recipient: contractor._id,
          sender: landowner._id,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment of ₹${job.budget?.toLocaleString()} has been received for ${job.title}.`,
          jobId: job._id,
          isRead: false,
          actionRequired: false,
          actionType: 'none'
        },
        {
          recipient: contractor._id,
          sender: landowner._id,
          type: 'feedback_received',
          title: 'New Feedback Received',
          message: `You received 5-star feedback for your work on ${job.title}. Great job!`,
          jobId: job._id,
          isRead: false,
          actionRequired: false,
          actionType: 'none'
        },
        {
          recipient: contractor._id,
          sender: landowner._id,
          type: 'weekly_progress',
          title: 'Weekly Progress Update',
          message: `Time to submit your weekly progress report for ${job.title}.`,
          jobId: job._id,
          isRead: false,
          actionRequired: true,
          actionType: 'submit_feedback'
        },
        {
          recipient: contractor._id,
          sender: landowner._id,
          type: 'general',
          title: 'System Maintenance Notice',
          message: 'The platform will be under maintenance tonight from 2-4 AM. Please plan accordingly.',
          jobId: null,
          isRead: false,
          actionRequired: false,
          actionType: 'none'
        }
      ];

      await Notification.insertMany(sampleNotifications);
      console.log('✅ Created 5 sample notifications for testing');
      console.log('📋 Sample notification types:');
      console.log('  - Job Assignment (Action Required)');
      console.log('  - Payment Received');
      console.log('  - Feedback Received');
      console.log('  - Weekly Progress (Action Required)');
      console.log('  - System Notice');

    } else {
      console.log('\n💰 Existing notifications:');
      allNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.type} - ${notification.title}`);
        console.log(`   From: ${notification.sender?.name || 'System'}`);
        console.log(`   To: ${notification.recipient?.name || 'Unknown'}`);
        console.log(`   Job: ${notification.jobId?.title || 'N/A'}`);
        console.log(`   Read: ${notification.isRead ? 'Yes' : 'No'}`);
        console.log(`   Action Required: ${notification.actionRequired ? 'Yes' : 'No'}`);
        console.log(`   Created: ${notification.createdAt.toLocaleDateString()}`);
        console.log('');
      });

      // Count by type
      const typeCounts = {};
      allNotifications.forEach(n => {
        typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
      });

      console.log('📊 Notification breakdown by type:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      // Count unread notifications
      const unreadCount = allNotifications.filter(n => !n.isRead).length;
      console.log(`\n🔔 Unread notifications: ${unreadCount}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNotifications(); 