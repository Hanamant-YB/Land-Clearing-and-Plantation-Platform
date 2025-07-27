const express = require('express');
const asyncHandler = require('express-async-handler');
const { auth } = require('../middleware/auth');
const {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  respondToJobSelection,
  getUnreadCount,
  deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

// @route   POST /api/notifications
// @access  Private
router.post('/', auth, asyncHandler(createNotification));

// @route   GET /api/notifications
// @access  Private
router.get('/', auth, asyncHandler(getNotifications));

// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', auth, asyncHandler(getUnreadCount));

// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', auth, asyncHandler(markAsRead));

// @route   PATCH /api/notifications/read-all
// @access  Private
router.patch('/read-all', auth, asyncHandler(markAllAsRead));

// @route   POST /api/notifications/:id/respond
// @access  Private
router.post('/:id/respond', auth, asyncHandler(respondToJobSelection));

// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', auth, asyncHandler(deleteNotification));

module.exports = router; 