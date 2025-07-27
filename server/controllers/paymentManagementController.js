const Payment = require('../models/Payment');
const WorkProgress = require('../models/WorkProgress');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const sendEmail = require('../utils/sendEmail');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Automatically create past work entry for contractor
// @route   Internal function - called when payment is completed and review exists
// @access  Private
const createPastWorkEntry = async (jobId) => {
  try {
    // Get the job with all related data
    const job = await Job.findById(jobId)
      .populate('postedBy', 'name email')
      .populate('selectedContractor', 'name email');
    
    if (!job) {
      console.error('Job not found for past work creation:', jobId);
      return;
    }

    // Check if job has a review (required for past work entry)
    if (!job.rating || !job.review) {
      console.log('Job does not have review yet, skipping past work creation:', jobId);
      return;
    }

    // Get work progress to collect photos
    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      console.error('Work progress not found for past work creation:', jobId);
      return;
    }

    // Collect photos from weekly progress (minimum 3)
    let allPhotos = [];
    if (workProgress.weeklyProgress && workProgress.weeklyProgress.length > 0) {
      workProgress.weeklyProgress.forEach(progress => {
        if (progress.photos && progress.photos.length > 0) {
          allPhotos = [...allPhotos, ...progress.photos];
        }
      });
    }

    // Ensure minimum 3 photos, if less than 3, duplicate some
    while (allPhotos.length < 3 && allPhotos.length > 0) {
      allPhotos.push(...allPhotos.slice(0, 3 - allPhotos.length));
    }

    // If no photos at all, use job images as fallback
    if (allPhotos.length === 0 && job.images && job.images.length > 0) {
      allPhotos = job.images.slice(0, 3);
    }

    // Create past work entry
    const pastWorkEntry = {
      title: job.title,
      type: job.workType,
      description: job.description,
      budget: job.budget,
      date: job.updatedAt || new Date(), // Use job completion date
      rating: job.rating || 0,
      photos: allPhotos.slice(0, 10), // Limit to 10 photos
      landownerFeedback: job.review || '',
      landownerName: job.postedBy?.name || 'Unknown',
      landownerEmail: job.postedBy?.email || '',
      jobId: job._id,
      location: job.location,
      landSize: job.landSize,
      startDate: job.startDate,
      endDate: job.endDate,
      completionDate: job.updatedAt || new Date()
    };

    // Add to contractor's past jobs
    await User.findByIdAndUpdate(
      job.selectedContractor,
      { 
        $push: { 'profile.pastJobs': pastWorkEntry },
        $inc: { 'profile.completedJobs': 1 }
      }
    );

    console.log('Past work entry created successfully for job:', jobId);
    return pastWorkEntry;
  } catch (error) {
    console.error('Error creating past work entry:', error);
  }
};

// ===== PAYMENT MANAGEMENT =====

// @desc    Create payment record
// @route   POST /api/payments/create
// @access  Private (Landowner only)
exports.createPayment = async (req, res) => {
  try {
    const { 
      jobId, 
      amount, 
      paymentType, 
      milestoneId, 
      milestoneTitle,
      paymentMethod,
      dueDate,
      notes 
    } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the landowner for this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Razorpay max is 50000000 paise (₹5,00,000)
    if (amount * 100 > 50000000) {
      return res.status(400).json({ message: 'Amount exceeds Razorpay maximum allowed per order (₹5,00,000).' });
    }

    const payment = await Payment.create({
      jobId,
      landownerId: req.user._id,
      contractorId: job.selectedContractor,
      amount,
      paymentType,
      milestoneId,
      milestoneTitle,
      paymentMethod,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      createdBy: req.user._id
    });

    // Send email notifications to both contractor and landowner
    const contractor = await User.findById(job.selectedContractor);
    const landowner = await User.findById(job.postedBy);
    if (contractor && contractor.email) {
      await sendEmail({
        to: contractor.email,
        subject: 'Payment Received',
        text: `A payment of ₹${amount} has been made for the job "${job.title}". Please log in to view details.`
      });
    }
    if (landowner && landowner.email) {
      await sendEmail({
        to: landowner.email,
        subject: 'Payment Processed',
        text: `Your payment of ₹${amount} for the job "${job.title}" has been processed successfully.`
      });
    }

    // Create notification for contractor
    await Notification.create({
      recipient: job.selectedContractor,
      sender: req.user._id,
      type: 'payment',
      title: 'Payment Created',
      message: `A payment of ₹${amount} has been created for your work`,
      jobId: job._id,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error creating payment' });
  }
};

// @desc    Get payments for a job
// @route   GET /api/payments/job/:jobId
// @access  Private
exports.getJobPayments = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check authorization
    const isLandowner = job.postedBy.toString() === req.user._id.toString();
    const isContractor = job.selectedContractor.toString() === req.user._id.toString();
    
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const payments = await Payment.find({ jobId })
      .populate('landownerId', 'name email')
      .populate('contractorId', 'name email')
      .populate('approvedBy', 'name')
      .populate('releasedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get job payments error:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};

// @desc    Get user's payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'landowner') {
      query.landownerId = req.user._id;
    } else if (req.user.role === 'contractor') {
      query.contractorId = req.user._id;
    }

    console.log('User:', req.user);
    console.log('Query:', query);

    const payments = await Payment.find(query)
      .populate('jobId', 'title')
      .populate('landownerId', 'name email')
      .populate('contractorId', 'name email')
      .sort({ createdAt: -1 });

    console.log('Payments found:', payments.length, payments.map(p => p.status));

    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
};

// @desc    Approve payment
// @route   PATCH /api/payments/:paymentId/approve
// @access  Private (Landowner only)
exports.approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { approvalNotes } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is the landowner for this payment
    if (payment.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment is not in pending status' });
    }

    payment.status = 'approved';
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    payment.approvalNotes = approvalNotes;

    await payment.save();

    // Create notification for contractor
    await Notification.create({
      recipient: payment.contractorId,
      sender: req.user._id,
      type: 'payment',
      title: 'Payment Approved',
      message: `Your payment of ₹${payment.amount} has been approved`,
      jobId: payment.jobId,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.json(payment);
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ message: 'Server error approving payment' });
  }
};

// @desc    Release payment
// @route   PATCH /api/payments/:paymentId/release
// @access  Private (Landowner only)
exports.releasePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { releaseNotes, transactionId, transactionReference } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is the landowner for this payment
    if (payment.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (payment.status !== 'approved') {
      return res.status(400).json({ message: 'Payment must be approved before release' });
    }

    payment.status = 'completed';
    payment.releasedBy = req.user._id;
    payment.releasedAt = new Date();
    payment.paidAt = new Date();
    payment.releaseNotes = releaseNotes;
    payment.transactionId = transactionId;
    payment.transactionReference = transactionReference;

    // Generate receipt number
    payment.receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await payment.save();

    // Create notification for contractor
    await Notification.create({
      recipient: payment.contractorId,
      sender: req.user._id,
      type: 'payment',
      title: 'Payment Released',
      message: `Your payment of ₹${payment.amount} has been released. Receipt: ${payment.receiptNumber}`,
      jobId: payment.jobId,
      actionRequired: false,
      actionType: 'view_details'
    });

    // Create notification for landowner to submit feedback
    await Notification.create({
      recipient: payment.landownerId,
      sender: req.user._id,
      type: 'feedback_request',
      title: 'Submit Feedback',
      message: `Payment completed! Please submit feedback for the contractor's work on this job.`,
      jobId: payment.jobId,
      actionRequired: true,
      actionType: 'submit_feedback'
    });

    // Try to create past work entry (will only create if review exists)
    await createPastWorkEntry(payment.jobId);

    res.json(payment);
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ message: 'Server error releasing payment' });
  }
};

// @desc    Create milestone payment
// @route   POST /api/payments/milestone
// @access  Private (Landowner only)
exports.createMilestonePayment = async (req, res) => {
  try {
    const { jobId, milestoneId, amount, paymentMethod, notes } = req.body;

    const workProgress = await WorkProgress.findOne({ jobId });
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress not found' });
    }

    // Check if user is the landowner for this job
    if (workProgress.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = workProgress.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (!milestone.completed) {
      return res.status(400).json({ message: 'Milestone must be completed before payment' });
    }

    const payment = await Payment.create({
      jobId,
      landownerId: req.user._id,
      contractorId: workProgress.contractorId,
      amount,
      paymentType: 'milestone_payment',
      milestoneId,
      milestoneTitle: milestone.title,
      paymentMethod,
      notes,
      status: 'pending',
      createdBy: req.user._id
    });

    // Create notification for contractor
    await Notification.create({
      recipient: workProgress.contractorId,
      sender: req.user._id,
      type: 'payment',
      title: 'Milestone Payment Created',
      message: `A milestone payment of ₹${amount} has been created for "${milestone.title}"`,
      jobId: jobId,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create milestone payment error:', error);
    res.status(500).json({ message: 'Server error creating milestone payment' });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
exports.getPaymentStats = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'landowner') {
      query.landownerId = req.user._id;
    } else if (req.user.role === 'contractor') {
      query.contractorId = req.user._id;
    }

    const payments = await Payment.find(query);

    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      pendingAmount: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, payment) => sum + payment.amount, 0),
      completedPayments: payments.filter(p => p.status === 'completed').length,
      completedAmount: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0),
      thisMonth: payments
        .filter(p => {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);
          return p.createdAt >= thisMonth;
        })
        .reduce((sum, payment) => sum + payment.amount, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Server error fetching payment statistics' });
  }
};

// @desc    Request payment refund
// @route   PATCH /api/payments/:paymentId/refund
// @access  Private (Landowner only)
exports.requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { refundReason, refundAmount } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is the landowner for this payment
    if (payment.landownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    payment.status = 'refunded';
    payment.refundReason = refundReason;
    payment.refundAmount = refundAmount || payment.amount;
    payment.refundedAt = new Date();

    await payment.save();

    // Create notification for contractor
    await Notification.create({
      recipient: payment.contractorId,
      sender: req.user._id,
      type: 'payment',
      title: 'Payment Refunded',
      message: `A refund of ₹${payment.refundAmount} has been processed for your payment`,
      jobId: payment.jobId,
      actionRequired: false,
      actionType: 'view_details'
    });

    res.json(payment);
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ message: 'Server error requesting refund' });
  }
};

// @desc    Download payment receipt
// @route   GET /api/payments/:paymentId/receipt
// @access  Private
exports.downloadReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('jobId', 'title')
      .populate('landownerId', 'name email')
      .populate('contractorId', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    const isLandowner = payment.landownerId._id.toString() === req.user._id.toString();
    const isContractor = payment.contractorId._id.toString() === req.user._id.toString();
    if (!isLandowner && !isContractor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt-${payment.receiptNumber || payment._id}.pdf`
    );

    doc.fontSize(20).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${payment.receiptNumber || '-'}`);
    doc.text(`Date: ${payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}`);
    doc.text(`Job Title: ${payment.jobId.title}`);
    doc.text(`Landowner: ${payment.landownerId.name} (${payment.landownerId.email})`);
    doc.text(`Contractor: ${payment.contractorId.name} (${payment.contractorId.email})`);
    doc.text(`Amount: ₹${payment.amount} ${payment.currency}`);
    doc.text(`Payment Method: ${payment.paymentMethod}`);
    doc.text(`Transaction ID: ${payment.transactionId || '-'}`);
    doc.moveDown();
    doc.text('Thank you for using our platform!', { align: 'center' });

    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ message: 'Server error downloading receipt' });
  }
};

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, jobId } = req.body;
    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ message: 'Invalid amount for Razorpay order. Must be a positive integer.' });
    }
    let receipt = `job_${jobId}_${Date.now()}`;
    if (receipt.length > 40) {
      receipt = receipt.slice(0, 40);
    }
    const options = {
      amount: amount * 100, // amount in paise, must be integer
      currency: 'INR',
      receipt,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ message: 'Failed to create Razorpay order' });
  }
};

// Verify Razorpay payment
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { jobId, orderId, paymentId, signature, amount } = req.body;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Mark job as paid (example)
    const job = await Job.findById(jobId);
    if (job) {
      job.isPaid = true;
      await job.save();
    }
    // Mark payment as completed or create if missing
    let payment = await Payment.findOne({ jobId, status: { $ne: 'completed' } });
    if (payment) {
      payment.status = 'completed';
      if (!payment.receiptNumber) {
        payment.receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      payment.razorpayPaymentId = paymentId;
      payment.razorpayOrderId = orderId;
      await payment.save();
    } else if (job) {
      payment = await Payment.create({
        jobId,
        landownerId: job.postedBy,
        contractorId: job.selectedContractor,
        amount: amount, // Use the amount from the request
        paymentType: 'full_payment',
        paymentMethod: 'online',
        status: 'completed',
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        createdBy: job.postedBy
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
}; 

// @desc    Delete a payment
// @route   DELETE /api/payments/:paymentId
// @access  Private (Admin only)
exports.deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const deleted = await Payment.findByIdAndDelete(paymentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error deleting payment' });
  }
}; 