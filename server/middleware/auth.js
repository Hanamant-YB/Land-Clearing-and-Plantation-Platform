const jwt  = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const token = header.split(' ')[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
}

module.exports = { auth };