const express = require('express');
const asyncHandler = require('express-async-handler');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadPhoto } = require('../controllers/photoController');

const router = express.Router();

// @route   POST /api/photo/upload
// @access  Private
router.post(
  '/upload',
  auth,
  upload.array('photos', 10), // allow up to 10 files
  asyncHandler(uploadPhoto)
);

module.exports = router; 