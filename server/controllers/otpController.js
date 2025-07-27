const OtpToken = require('../models/OtpToken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Send OTP email
  try {
    await sendEmail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
      // You can add more options if you want
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send email' });
  }

  // Save OTP to DB (remove old OTPs for this user)
  await OtpToken.deleteMany({ userId: user._id });
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await OtpToken.create({ userId: user._id, otp, expiresAt });

  res.json({ message: 'OTP sent' });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Find OTP token
  const otpToken = await OtpToken.findOne({ userId: user._id, otp });
  if (!otpToken) return res.status(400).json({ message: 'Invalid or expired OTP' });

  // Check if expired
  if (otpToken.expiresAt < new Date()) {
    await OtpToken.deleteOne({ _id: otpToken._id }); // Clean up expired OTP
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // OTP is valid, delete it (one-time use)
  await OtpToken.deleteOne({ _id: otpToken._id });

  // Set user's profile.otpVerified = true
  user.profile.otpVerified = true;
  await user.save();

  res.json({ message: 'OTP verified' });
};
