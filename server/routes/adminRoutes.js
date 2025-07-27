// server/routes/adminRoutes.js
const express = require('express');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getJobs,
  getPayments,
  getUsers,
  deleteUser,
  deleteJob,
  aiShortlistContractors,
  getJobApplicants,
  getLandowners,
  getContractors,
  getContractorReviews,
  getWorks,
  getAnalytics,
  updateJobReview,
  changeAdminPassword,
  getMonthlyRevenueTrend
} = require('../controllers/adminController');
const {
  generateAIShortlist,
  getAIShortlist,
  getAIAnalytics
} = require('../controllers/aiShortlistController');

const router = express.Router();

// Test route without middleware
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// @route   GET /api/admin/jobs
router.get('/jobs', auth, adminAuth, getJobs);

// @route   GET /api/admin/payments
router.get('/payments', auth, adminAuth, getPayments);

// @route   GET /api/admin/users
router.get('/users', auth, adminAuth, getUsers);

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminAuth, deleteUser);

// @route   DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', auth, adminAuth, deleteJob);

// @route   POST /api/admin/ai-shortlist/:jobId
router.post('/ai-shortlist/:jobId', auth, adminAuth, aiShortlistContractors);

// @route   GET /api/admin/jobs/:jobId/applicants
router.get('/jobs/:jobId/applicants', auth, adminAuth, getJobApplicants);

// @route   GET /api/admin/landowners
router.get('/landowners', auth, adminAuth, getLandowners);

// @route   GET /api/admin/contractors
router.get('/contractors', auth, adminAuth, getContractors);

// @route   GET /api/admin/contractor-reviews
router.get('/contractor-reviews', auth, adminAuth, getContractorReviews);

// @route   GET /api/admin/works
router.get('/works', auth, adminAuth, getWorks);

// @route   GET /api/admin/analytics
router.get('/analytics', auth, adminAuth, getAnalytics);

// @route   PUT /api/admin/jobs/:id/review
router.put('/jobs/:id/review', auth, adminAuth, updateJobReview);

// AI Shortlist management
router.get('/ai-shortlist', auth, adminAuth, getAIAnalytics);
router.post('/ai-shortlist/regenerate/:jobId', auth, adminAuth, generateAIShortlist);

// Add route for monthly revenue trend
router.get('/monthly-revenue-trend', auth, adminAuth, getMonthlyRevenueTrend);

// @route   PUT /api/admin/change-password
router.put('/change-password', auth, adminAuth, changeAdminPassword);

module.exports = router;