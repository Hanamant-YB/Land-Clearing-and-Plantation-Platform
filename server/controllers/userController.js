// server/controllers/userController.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();
const OtpToken = require('../models/OtpToken');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcrypt');

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Gmail validation
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed.' });
    }
    // Password validation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Auto-generate username from name
    let baseUsername = name.toLowerCase().replace(/\s+/g, '');
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const user = await User.create({ name, email, password, role, username });
    res.status(201).json({
      token: signToken(user._id),
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
exports.authUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  // Gmail validation
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
    return res.status(400).json({ message: 'Only Gmail addresses are allowed.' });
  }
  // Password validation
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
  }

  const user = await User.findOne({ email });
  const valid = user && (await user.matchPassword(password));
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({
    token: signToken(user._id),
    user
  });
};

// @desc    Get logged-in user profile
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = async (req, res) => {
  // auth middleware has already set req.user
  const user = req.user;
  // Convert ratesPerAcre Map to plain object for frontend
  if (user.profile && user.profile.ratesPerAcre instanceof Map) {
    user.profile.ratesPerAcre = Object.fromEntries(user.profile.ratesPerAcre.entries());
  }
  res.json({ user });
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, username, phone, address, bio, skills, availability, email, location, ratesPerAcre } = req.body;
    
    console.log('Profile update request:', { name, username, phone, address, bio, skills, availability, ratesPerAcre });
    
    // Check for duplicate username if username is being updated
    if (username !== undefined && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }
    }
    
    // Validation for professional details
    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ message: 'Skills must be an array' });
      }
      // Filter out empty skills and trim whitespace
      const validSkills = skills.filter(skill => skill && skill.trim() !== '').map(skill => skill.trim());
      if (validSkills.length > 10) {
        return res.status(400).json({ message: 'Maximum 10 skills allowed' });
      }
    }
    
    if (availability !== undefined) {
      const validAvailabilities = ['Available', 'Busy', 'On Leave', 'Part-time'];
      if (!validAvailabilities.includes(availability)) {
        return res.status(400).json({ message: 'Invalid availability status' });
      }
    }
    
    // Gmail validation if email is being updated
    if (email !== undefined) {
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
        return res.status(400).json({ message: 'Only Gmail addresses are allowed.' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    
    // Handle profile subdocument fields
    if (bio !== undefined) {
      updateData['profile.bio'] = bio;
    }
    if (skills !== undefined) {
      const validSkills = skills.filter(skill => skill && skill.trim() !== '').map(skill => skill.trim());
      updateData['profile.skills'] = validSkills;
      console.log('Updating skills:', validSkills);
    }
    if (availability !== undefined) {
      updateData['profile.availability'] = availability;
      console.log('Updating availability:', availability);
    }
    if (location !== undefined) {
      updateData['profile.location'] = location;
      console.log('Updating location:', location);
    }
    // Handle ratesPerAcre for contractors
    if (ratesPerAcre !== undefined) {
      if (typeof ratesPerAcre !== 'object' || Array.isArray(ratesPerAcre)) {
        return res.status(400).json({ message: 'ratesPerAcre must be an object mapping work types to rates.' });
      }
      // Validate all rates are positive numbers
      for (const [workType, rate] of Object.entries(ratesPerAcre)) {
        if (rate === '' || rate === null || rate === undefined) continue; // allow blank
        if (typeof rate !== 'number' || rate < 0) {
          return res.status(400).json({ message: `Rate for ${workType} must be a non-negative number or blank.` });
        }
      }
      updateData['profile.ratesPerAcre'] = ratesPerAcre;
      console.log('Updating ratesPerAcre:', ratesPerAcre);
    }

    console.log('Final updateData:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert ratesPerAcre Map to plain object for frontend
    if (user.profile && user.profile.ratesPerAcre instanceof Map) {
      user.profile.ratesPerAcre = Object.fromEntries(user.profile.ratesPerAcre.entries());
    }

    console.log('Updated user profile:', {
      name: user.name,
      username: user.username,
      phone: user.phone,
      address: user.address,
      profile: user.profile
    });

    res.json({
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Get all contractors with professional details
// @route   GET /api/users/contractors
// @access  Private (Admin only)
exports.getContractors = async (req, res) => {
  try {
    const contractors = await User.find({ role: 'contractor' })
      .select('name username email phone address profile.skills profile.avgBudget profile.availability profile.rating profile.completedJobs profile.bio')
      .sort({ 'profile.rating': -1, 'profile.completedJobs': -1 });

    res.json({
      contractors: contractors.map(contractor => ({
        _id: contractor._id,
        name: contractor.name,
        username: contractor.username,
        email: contractor.email,
        phone: contractor.phone,
        address: contractor.address,
        skills: contractor.profile?.skills || [],
        avgBudget: contractor.profile?.avgBudget || null,
        availability: contractor.profile?.availability || 'Available',
        rating: contractor.profile?.rating || 0,
        completedJobs: contractor.profile?.completedJobs || 0,
        bio: contractor.profile?.bio || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ message: 'Server error fetching contractors' });
  }
};

// @desc    Get contractor by ID with full details
// @route   GET /api/users/contractors/:id
// @access  Private
exports.getContractorById = async (req, res) => {
  try {
    const contractor = await User.findOne({ 
      _id: req.params.id, 
      role: 'contractor' 
    }).select('-password');

    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    res.json({ contractor });
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({ message: 'Server error fetching contractor' });
  }
};

// @desc    Request OTP for password change
// @route   POST /api/users/request-password-otp
// @access  Private
exports.requestPasswordOtp = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'landowner' && user.role !== 'contractor')) {
      return res.status(403).json({ message: 'OTP password change is only for landowners and contractors.' });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    // Remove any existing OTPs for this user
    await OtpToken.deleteMany({ userId: user._id });
    // Save new OTP
    await OtpToken.create({ userId: user._id, otp, expiresAt });
    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: 'Your OTP for Password Change',
      text: `Your OTP for password change is: ${otp}\nThis OTP is valid for 10 minutes.`,
      heading: 'Password Change OTP',
      greeting: `Hello ${user.name},`,
      buttonText: 'Change Password',
      buttonUrl: '#'
    });
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};

// @desc    Verify OTP and change password
// @route   POST /api/users/verify-password-otp
// @access  Private
exports.verifyPasswordOtp = async (req, res) => {
  try {
    const user = req.user;
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'OTP and new password are required.' });
    }
    // Password validation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }
    // Find OTP
    const otpDoc = await OtpToken.findOne({ userId: user._id, otp });
    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (otpDoc.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: 'OTP expired.' });
    }
    // Update password
    user.password = newPassword;
    await user.save();
    // Delete OTP after use
    await OtpToken.deleteOne({ _id: otpDoc._id });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
};

// Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.otpVerified = false;
  await user.save();

  console.log("Sending OTP to:", user.email);
  await sendEmail({
    to: user.email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`
  });
  res.json({ message: "OTP sent" });
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || Date.now() > user.otpExpiry) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  user.otp = null;
  user.otpExpiry = null;
  user.otpVerified = true;
  await user.save();
  res.json({ message: "OTP verified" });
};

// Change Password
exports.changePassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if OTP was verified
  if (!user.profile.otpVerified) {
    return res.status(400).json({ message: 'OTP not verified' });
  }

  // Update password
  user.password = newPassword;
  user.profile.otpVerified = false; // Reset after password change
  await user.save();

  res.json({ message: 'Password changed successfully!' });
};