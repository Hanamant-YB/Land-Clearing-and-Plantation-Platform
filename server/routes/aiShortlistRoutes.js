const express = require('express');
const router = express.Router();
const {
  generateAIShortlist,
  getAIShortlist,
  getAIAnalytics,
  getComprehensiveAIAnalytics,
  updateAISuccessTracking,
  updateContractorAIScores,
  getContractorAIScoreBreakdown
} = require('../controllers/aiShortlistController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const landownerAuth = require('../middleware/landownerAuth');

// Generate AI shortlist for a job (landowners and admins)
router.post('/generate/:jobId', auth, generateAIShortlist);

// Get AI shortlist for a job
router.get('/job/:jobId', auth, getAIShortlist);

// Get AI analytics and insights (admin only)
router.get('/analytics', auth, adminAuth, getAIAnalytics);

// Get comprehensive AI analytics (admin only)
router.get('/comprehensive-analytics', auth, adminAuth, getComprehensiveAIAnalytics);

// Update AI success tracking when contractor is selected
router.post('/update-success-tracking', auth, updateAISuccessTracking);

// Update contractor AI scores (admin only)
router.put('/contractor/:contractorId/scores', auth, adminAuth, updateContractorAIScores);

// Get contractor AI score breakdown
router.get('/contractor/:contractorId/breakdown', auth, getContractorAIScoreBreakdown);

module.exports = router; 