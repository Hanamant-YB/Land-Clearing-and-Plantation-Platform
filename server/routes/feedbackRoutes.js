const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  submitFeedback,
  getContractorFeedback,
  getJobFeedback,
  getAllFeedback,
  deleteFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');

router.post('/submit', auth, submitFeedback);
router.get('/contractor', auth, getContractorFeedback);
router.get('/job/:jobId', auth, getJobFeedback);
router.get('/all', auth, adminAuth, getAllFeedback);
router.delete('/:feedbackId', auth, adminAuth, deleteFeedback);
router.get('/stats', auth, adminAuth, getFeedbackStats);

module.exports = router;