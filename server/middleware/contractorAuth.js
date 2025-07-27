// server/middleware/contractorAuth.js
module.exports = (req, res, next) => {
  if (req.user.role !== 'contractor') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};