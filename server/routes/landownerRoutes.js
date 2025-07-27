const express      = require('express');
const asyncHandler = require('express-async-handler');
const { auth }     = require('../middleware/auth');
const upload       = require('../middleware/upload');
const {
  postJob,
  getMyJobs,
  shortlist,
  getShortlisted,
  getAiShortlisted,
  selectContractor,
  pay,
  getJobById,
  getInProgressJobs,
  updateJobStatus,
  submitReview,
  updateJobPayment,
  getCompletedActionRequiredJobs
} = require('../controllers/landownerController');

const router = express.Router();

// @route   POST /api/landowner/post
// @access  Private
router.post(
  '/post',
  auth,
  upload.array('images', 5), // Allow up to 5 images
  asyncHandler(postJob)
);

// @route   GET /api/landowner/jobs
// @access  Private
router.get(
  '/jobs',
  auth,
  asyncHandler(getMyJobs)
);

// @route   POST /api/landowner/shortlist
// @access  Private
router.post(
  '/shortlist',
  auth,
  asyncHandler(shortlist)
);

// @route   GET /api/landowner/shortlist/:jobId
// @access  Private
router.get(
  '/shortlist/:jobId',
  auth,
  asyncHandler(getShortlisted)
);

// @route   GET /api/landowner/ai-shortlist/:jobId
// @access  Private
router.get(
  '/ai-shortlist/:jobId',
  auth,
  asyncHandler(getAiShortlisted)
);

// @route   POST /api/landowner/select-contractor
// @access  Private
router.post(
  '/select-contractor',
  auth,
  asyncHandler(selectContractor)
);

// @route   POST /api/landowner/pay
// @access  Private
router.post(
  '/pay',
  auth,
  asyncHandler(pay)
);

// @route   GET /api/landowner/jobs/:jobId
// @access  Private
router.get('/jobs/:jobId', auth, getJobById);

// @route   GET /api/landowner/in-progress-jobs
// @access  Private
router.get('/in-progress-jobs', auth, asyncHandler(getInProgressJobs));

// @route   PATCH /api/landowner/jobs/:jobId/status
// @access  Private
router.patch('/jobs/:jobId/status', auth, asyncHandler(updateJobStatus));

// @route   PATCH /api/landowner/jobs/:jobId/review
// @access  Private
router.patch('/jobs/:jobId/review', auth, asyncHandler(submitReview));

// @route   PATCH /api/landowner/jobs/:jobId/payment
// @access  Private
router.patch('/jobs/:jobId/payment', auth, asyncHandler(updateJobPayment));

// @route   GET /api/landowner/completed-action-required
// @access  Private
router.get('/completed-action-required', auth, asyncHandler(getCompletedActionRequiredJobs));

module.exports = router;