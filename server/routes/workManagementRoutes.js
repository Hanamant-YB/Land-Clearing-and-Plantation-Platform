const express = require('express');
const router = express.Router();
const workManagementController = require('../controllers/workManagementController');
const { auth } = require('../middleware/auth');
const contractorAuth = require('../middleware/contractorAuth');
const landownerAuth = require('../middleware/landownerAuth');

// ===== WORK PROGRESS ROUTES =====

// Create work progress record
router.post('/create', auth, workManagementController.createWorkProgress);

// Get work progress for a job
router.get('/:jobId', auth, workManagementController.getWorkProgress);

// Add progress update (contractor only)
router.post('/:jobId/update', auth, contractorAuth, workManagementController.addProgressUpdate);

// Add milestone (contractor only)
router.post('/:jobId/milestone', auth, contractorAuth, workManagementController.addMilestone);

// Complete milestone (contractor only)
router.patch('/:jobId/milestone/:milestoneId/complete', auth, contractorAuth, workManagementController.completeMilestone);

// ===== WEEKLY PROGRESS ROUTES =====

// Get weekly progress for a job
router.get('/:jobId/weekly', auth, workManagementController.getWeeklyProgress);

// Add weekly progress update (contractor only)
router.post('/:jobId/weekly', auth, contractorAuth, workManagementController.addWeeklyProgress);

// Update weekly progress (contractor only)
router.put('/:jobId/weekly/:progressId', auth, contractorAuth, workManagementController.updateWeeklyProgress);

// Delete photo from weekly progress (contractor only)
router.delete('/:jobId/weekly/:progressId/photo/:photoIndex', auth, contractorAuth, workManagementController.deleteWeeklyProgressPhoto);

// ===== EXTENSION REQUEST ROUTES =====

// Request extension (contractor only)
router.post('/:jobId/extension-request', auth, contractorAuth, workManagementController.requestExtension);

// Respond to extension request (landowner only)
router.patch('/:jobId/extension-request/:requestId', auth, landownerAuth, workManagementController.respondToExtensionRequest);

// Get extension requests for a job
router.get('/:jobId/extension-requests', auth, workManagementController.getExtensionRequests);

// ===== QUALITY ASSURANCE ROUTES =====

// Add quality review (landowner only)
router.post('/:jobId/quality-review', auth, landownerAuth, workManagementController.addQualityReview);

// ===== DISPUTE MANAGEMENT ROUTES =====

// Report dispute/issue
router.post('/:jobId/dispute', auth, workManagementController.reportDispute);

// Resolve dispute (landowner or admin only)
router.patch('/:jobId/dispute/:disputeId/resolve', auth, workManagementController.resolveDispute);

// ===== WORK MODIFICATION ROUTES =====

// Request work modification
router.post('/:jobId/modification-request', auth, workManagementController.requestModification);

// Respond to modification request
router.patch('/:jobId/modification-request/:requestId/respond', auth, workManagementController.respondToModificationRequest);

// ===== COMMUNICATION ROUTES =====

// Send message
router.post('/:jobId/message', auth, workManagementController.sendMessage);

// Mark messages as read
router.patch('/:jobId/messages/read', auth, workManagementController.markMessagesAsRead);

module.exports = router; 