// server/controllers/adminController.js

const mongoose = require('mongoose');
const Job      = require('../models/Job');
const Payment  = require('../models/Payment');
const User     = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * GET /api/admin/jobs
 * List all jobs, newest-first, with postedBy populated (name & email).
 */
async function getJobs(req, res) {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Server error fetching jobs' });
  }
}

/**
 * GET /api/admin/payments
 * List all payments, newest-first, with landownerId & contractorId populated.
 */
async function getPayments(req, res) {
  try {
    const payments = await Payment.find()
      .populate('landownerId contractorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
}

/**
 * GET /api/admin/users
 * List all users (admins, landowners, contractors), newest-first, excluding passwords.
 */
async function getUsers(req, res) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Delete a user by ID (admin-only), with ID validation and self-deletion guard.
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  if (req.user._id.toString() === id) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }

  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully', id });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
}

/**
 * DELETE /api/admin/jobs/:id
 * Delete a job by ID (admin-only), with ID validation.
 */
async function deleteJob(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid job ID' });
  }

  try {
    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully', id });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ message: 'Server error deleting job' });
  }
}

/**
 * POST /api/admin/ai-shortlist/:jobId
 * Use AI to shortlist contractors for a specific job based on their skills, past work, and job requirements
 */
async function aiShortlistContractors(req, res) {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    const job = await Job.findById(jobId).populate('postedBy', 'name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get all contractors
    const contractors = await User.find({ role: 'contractor' }).populate('profile');

    // Simple AI shortlisting algorithm (can be enhanced later)
    const shortlistedContractors = contractors.filter(contractor => {
      const profile = contractor.profile;
      
      // Check if contractor has relevant skills
      const hasRelevantSkills = profile.skills && profile.skills.some(skill => 
        job.workType.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(job.workType.toLowerCase())
      );

      // Check if contractor has past work experience
      const hasExperience = profile.pastJobs && profile.pastJobs.length > 0;

      // Check if contractor is available
      const isAvailable = profile.availability === 'Available';

      // Check if contractor has good rating
      const hasGoodRating = !profile.rating || profile.rating >= 3.5;

      return hasRelevantSkills && hasExperience && isAvailable && hasGoodRating;
    });

    // Sort by rating and experience (more past jobs = more experience)
    shortlistedContractors.sort((a, b) => {
      const aScore = (a.profile.rating || 0) + (a.profile.pastJobs?.length || 0) * 0.1;
      const bScore = (b.profile.rating || 0) + (b.profile.pastJobs?.length || 0) * 0.1;
      return bScore - aScore;
    });

    // Take top 5 contractors
    const topContractors = shortlistedContractors.slice(0, 5);

    // Update job with AI shortlisted contractors
    job.aiShortlisted = topContractors.map(c => c._id);
    await job.save();

    res.json({
      message: `AI shortlisted ${topContractors.length} contractors for this job`,
      shortlistedContractors: topContractors.map(c => ({
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        profile: {
          skills: c.profile.skills,
          rating: c.profile.rating,
          completedJobs: c.profile.completedJobs,
          pastJobs: c.profile.pastJobs?.length || 0,
          availability: c.profile.availability
        }
      })),
      job: job
    });

  } catch (error) {
    console.error('AI shortlist error:', error);
    res.status(500).json({ message: 'Server error during AI shortlisting' });
  }
}

/**
 * GET /api/admin/jobs/:jobId/applicants
 * Get all applicants and AI shortlisted contractors for a specific job
 */
async function getJobApplicants(req, res) {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

    const job = await Job.findById(jobId)
      .populate('postedBy', 'name email')
      .populate('applicants', 'name email phone profile')
      .populate('aiShortlisted', 'name email phone profile')
      .populate('selectedContractor', 'name email phone');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      job: job,
      totalApplicants: job.applicants.length,
      totalAiShortlisted: job.aiShortlisted.length,
      hasSelectedContractor: !!job.selectedContractor
    });

  } catch (error) {
    console.error('Get job applicants error:', error);
    res.status(500).json({ message: 'Server error fetching job applicants' });
  }
}

// Get all landowners (admins only)
async function getLandowners(req, res) {
  try {
    const landowners = await User.find({ role: 'landowner' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(landowners);
  } catch (err) {
    console.error('Error fetching landowners:', err);
    res.status(500).json({ message: 'Server error fetching landowners' });
  }
}

// Get all contractors (admins only)
async function getContractors(req, res) {
  try {
    const contractors = await User.find({ role: 'contractor' })
      .select('-password')
      .populate('profile')
      .sort({ createdAt: -1 });
    res.json(contractors);
  } catch (err) {
    console.error('Error fetching contractors:', err);
    res.status(500).json({ message: 'Server error fetching contractors' });
  }
}

// Get contractor reviews (from completed jobs)
async function getContractorReviews(req, res) {
  try {
    // Get completed jobs with selected contractors
    const completedJobs = await Job.find({ 
      status: 'completed',
      selectedContractor: { $exists: true, $ne: null }
    })
    .populate('postedBy', 'name email')
    .populate('selectedContractor', 'name email')
    .sort({ updatedAt: -1 });

    // Transform jobs into reviews format
    const reviews = completedJobs.map(job => ({
      _id: job._id,
      contractor: job.selectedContractor,
      job: {
        _id: job._id,
        title: job.title
      },
      rating: job.rating || 0, // Assuming rating is stored in job
      comment: job.review || '', // Assuming review comment is stored in job
      createdAt: job.updatedAt // When job was completed
    }));

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching contractor reviews:', err);
    res.status(500).json({ message: 'Server error fetching contractor reviews' });
  }
}

// Get all works/jobs (admins only)
async function getWorks(req, res) {
  try {
    const works = await Job.find()
      .populate('postedBy', 'name email')
      .populate('selectedContractor', 'name email')
      .sort({ createdAt: -1 });
    // Add budget field using estimatedCost or overallScore from aiShortlistScores
    const worksWithBudget = works.map(work => {
      let budget = null;
      if (work.selectedContractor && Array.isArray(work.aiShortlistScores)) {
        const score = work.aiShortlistScores.find(s =>
          s.contractorId?.toString() === work.selectedContractor._id?.toString()
        );
        if (score) {
          budget = score.estimatedCost || score.overallScore || null;
        }
      }
      return {
        ...work.toObject(),
        budget
      };
    });
    res.json(worksWithBudget);
  } catch (err) {
    console.error('Error fetching works:', err);
    res.status(500).json({ message: 'Server error fetching works' });
  }
}

// Get analytics data for dashboard
async function getAnalytics(req, res) {
  try {
    // Get counts
    const totalJobs = await Job.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalPayments = await Payment.countDocuments();
    
    // Get job status counts
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const pendingJobs = await Job.countDocuments({ status: 'open' });
    const inProgressJobs = await Job.countDocuments({ status: 'in_progress' });
    
    // Calculate total revenue
    const payments = await Payment.find();
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate average rating
    const jobsWithRatings = await Job.find({ rating: { $exists: true, $ne: null } });
    const avgRating = jobsWithRatings.length > 0 
      ? jobsWithRatings.reduce((sum, job) => sum + (job.rating || 0), 0) / jobsWithRatings.length 
      : 0;
    
    res.json({
      totalJobs,
      totalUsers,
      totalPayments,
      completedJobs,
      pendingJobs,
      inProgressJobs,
      totalRevenue,
      avgRating
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
}

// Update job review and rating
async function updateJobReview(req, res) {
  const { id } = req.params;
  const { rating, review } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid job ID' });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Update rating and review
    if (rating !== undefined) job.rating = rating;
    if (review !== undefined) job.review = review;
    
    await job.save();

    // Recalculate and update contractor's average rating and completed jobs
    if (job.selectedContractor) {
      const allFeedback = await Job.find({ selectedContractor: job.selectedContractor, rating: { $exists: true } });
      const avgRating = allFeedback.length > 0 ? (allFeedback.reduce((sum, j) => sum + (j.rating || 0), 0) / allFeedback.length) : 0;
      const completedJobs = await Job.countDocuments({ selectedContractor: job.selectedContractor, status: 'completed' });
      await User.findByIdAndUpdate(job.selectedContractor, { 'profile.rating': avgRating, 'profile.completedJobs': completedJobs });
    }
    
    res.json({ 
      message: 'Review updated successfully', 
      job: {
        _id: job._id,
        title: job.title,
        rating: job.rating,
        review: job.review
      }
    });
  } catch (err) {
    console.error('Error updating job review:', err);
    res.status(500).json({ message: 'Server error updating job review' });
  }
}

// @desc    Change admin password (no OTP)
// @route   PUT /api/admin/change-password
// @access  Private (Admin only)
async function changeAdminPassword(req, res) {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change password here.' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    // Check current password
    const valid = await user.matchPassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    // Password validation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Admin password changed successfully.' });
  } catch (err) {
    console.error('Admin password change error:', err);
    res.status(500).json({ message: 'Failed to change admin password.' });
  }
}

// Get monthly revenue trend for the last 6 months
async function getMonthlyRevenueTrend(req, res) {
  try {
    const Payment = require('../models/Payment');
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: month.toLocaleString('default', { month: 'short' }),
        year: month.getFullYear(),
        month: month.getMonth()
      });
    }
    // Aggregate payments by month
    const payments = await Payment.find({ status: 'completed' });
    const monthlyRevenue = months.map(({ label, year, month }) => {
      const monthPayments = payments.filter(p => {
        const d = p.createdAt;
        return d.getFullYear() === year && d.getMonth() === month;
      });
      const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      return { month: label, revenue };
    });
    res.json(monthlyRevenue);
  } catch (err) {
    console.error('Error fetching monthly revenue trend:', err);
    res.status(500).json({ message: 'Server error fetching monthly revenue trend' });
  }
}

// Export all handlers as named properties
module.exports = {
  getJobs,
  getPayments,
  getUsers,
  deleteUser,
  deleteJob,
  aiShortlistContractors,
  getJobApplicants,
  getLandowners,
  getContractors,
  getContractorReviews,
  getWorks,
  getAnalytics,
  updateJobReview,
  changeAdminPassword,
  getMonthlyRevenueTrend,
};