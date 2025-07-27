const User = require('../models/User');

// @desc    Upload profile photo
// @route   POST /api/photo/upload
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const photoUrls = req.files.map(file => {
      const photoPath = `/uploads/${file.filename}`;
      return `${req.protocol}://${req.get('host')}${photoPath}`;
    });

    res.json({
      message: 'Photos uploaded successfully',
      urls: photoUrls
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Server error uploading photo' });
  }
}; 