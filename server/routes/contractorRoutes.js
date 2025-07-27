// server/routes/contractorRoutes.js
const express = require('express');
const asyncHandler = require('express-async-handler');
const { auth } = require('../middleware/auth');
const isContractor = require('../middleware/contractorAuth'); // default export

const { 
  applyJob, 
  getPastWorks, 
  addPastWork, 
  updatePastWork, 
  deletePastWork,
  getAvailableJobs,
  getMyApplications,
  withdrawApplication,
  getAssignedJobs,
  getAiShortlistedJobs,
  getShortlistStatus,
  getContractorProfileById,
  updateJobStatus,
  getContractorReviews
} = require('../controllers/contractorController');

const router = express.Router();

// Job browsing and applications
router.get(
  '/jobs',
  auth,
  isContractor,
  asyncHandler(getAvailableJobs)
);

router.get(
  '/applications',
  auth,
  isContractor,
  asyncHandler(getMyApplications)
);

router.get(
  '/assigned-jobs',
  auth,
  isContractor,
  asyncHandler(getAssignedJobs)
);

router.get(
  '/ai-shortlisted',
  auth,
  isContractor,
  asyncHandler(getAiShortlistedJobs)
);

router.get(
  '/shortlist-status/:jobId',
  auth,
  isContractor,
  asyncHandler(getShortlistStatus)
);

// Job application
router.post(
  '/apply',
  auth,
  isContractor,
  asyncHandler(applyJob)
);

// Past works management
router.get(
  '/pastworks',
  auth,
  isContractor,
  asyncHandler(getPastWorks)
);

router.post(
  '/pastworks',
  auth,
  isContractor,
  asyncHandler(addPastWork)
);

router.put(
  '/pastworks/:workId',
  auth,
  isContractor,
  asyncHandler(updatePastWork)
);

router.delete(
  '/pastworks/:workId',
  auth,
  isContractor,
  asyncHandler(deletePastWork)
);

router.delete(
  '/apply/:jobId',
  auth,
  isContractor,
  asyncHandler(withdrawApplication)
);

router.get(
  '/profile/:id',
  auth,
  asyncHandler(getContractorProfileById)
);

// Update job status
router.patch(
  '/assigned-jobs/:jobId/status',
  auth,
  isContractor,
  asyncHandler(updateJobStatus)
);

// Get contractor reviews
router.get(
  '/reviews',
  auth,
  isContractor,
  asyncHandler(getContractorReviews)
);

module.exports = router;