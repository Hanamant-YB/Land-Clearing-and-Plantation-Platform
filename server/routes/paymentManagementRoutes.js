const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const landownerAuth = require('../middleware/landownerAuth');
const paymentManagementController = require('../controllers/paymentManagementController');

// ===== PAYMENT ROUTES =====

// Create payment record (landowner only)
router.post('/create', auth, landownerAuth, paymentManagementController.createPayment);

// Get payments for a job
router.get('/job/:jobId', auth, paymentManagementController.getJobPayments);

// Get user's payment history
router.get('/history', auth, paymentManagementController.getPaymentHistory);

// Approve payment (landowner only)
router.patch('/:paymentId/approve', auth, landownerAuth, paymentManagementController.approvePayment);

// Release payment (landowner only)
router.patch('/:paymentId/release', auth, landownerAuth, paymentManagementController.releasePayment);

// Create milestone payment (landowner only)
router.post('/milestone', auth, landownerAuth, paymentManagementController.createMilestonePayment);

// Get payment statistics
router.get('/stats', auth, paymentManagementController.getPaymentStats);

// Request payment refund (landowner only)
router.patch('/:paymentId/refund', auth, landownerAuth, paymentManagementController.requestRefund);

// Download payment receipt
router.get('/:paymentId/receipt', auth, paymentManagementController.downloadReceipt);

// Create Razorpay order
router.post('/razorpay/order', auth, paymentManagementController.createRazorpayOrder);

// Verify Razorpay payment
router.post('/razorpay/verify', auth, paymentManagementController.verifyRazorpayPayment);

// Delete payment (admin only)
router.delete('/:paymentId', auth, /*adminAuth,*/ paymentManagementController.deletePayment);

module.exports = router; 