// server/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  getContractors,
  getContractorById,
  requestPasswordOtp,
  verifyPasswordOtp
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const otpController = require('../controllers/otpController');

const router = express.Router();

// @route   POST /api/users/register
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/users/login
// @access  Public
router.post('/login', authUser);

// @route   GET /api/users/me
// @access  Private
router.get('/me', auth, getUserProfile);

// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', auth, updateUserProfile);

// @route   GET /api/users/contractors
// @access  Private (Admin only) - temporarily removed adminAuth
router.get('/contractors', auth, getContractors);

// @route   GET /api/users/contractors/:id
// @access  Private
router.get('/contractors/:id', auth, getContractorById);

router.post('/request-password-otp', auth, requestPasswordOtp);
router.post('/verify-password-otp', auth, verifyPasswordOtp);
router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);
router.post('/change-password', userController.changePassword);

module.exports = router;