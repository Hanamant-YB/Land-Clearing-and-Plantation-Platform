const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Job = require('../models/Job');
const aiShortlistService = require('../services/aiShortlistService');
const aiAnalyticsService = require('../services/aiAnalyticsService');

// Generate AI shortlist for a specific job
const generateAIShortlist = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { limit = 10, includeScores = true } = req.query;

  try {
    // Get the job
    const job = await Job.findById(jobId).populate('postedBy', 'name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get all available contractors
    const contractors = await User.find({ 
      role: 'contractor',
      'profile.availability': { $ne: 'Unavailable' }
    }).select('-password');

    if (contractors.length === 0) {
      return res.status(404).json({ message: 'No available contractors found' });
    }

    // Generate AI shortlist
    const shortlist = await aiShortlistService.generateShortlistWithAI(job, contractors);
    
    // Limit results
    const limitedShortlist = shortlist.slice(0, parseInt(limit));

    // Update job with AI shortlist data
    const validShortlist = limitedShortlist.filter(item => item.contractor && item.contractor._id);
    const aiShortlistScores = validShortlist.map(item => ({
      contractorId: item._id,
      overallScore: item.overallScore,
      skillMatchScore: item.skillMatchScore,
      reliabilityScore: item.reliabilityScore,
      experienceScore: item.experienceScore,
      locationScore: item.locationScore,
      budgetScore: item.budgetCompatibility,
      explanation: item.explanation,
      estimatedCost: item.estimatedCost // <-- Use the value from the service!
    }));

    await Job.findByIdAndUpdate(jobId, {
      aiShortlisted: limitedShortlist.map(item => item.contractor._id),
      aiShortlistGenerated: true,
      aiShortlistDate: new Date(),
      aiShortlistScores
    });

    // Update contractor scores in database
    for (const item of limitedShortlist) {
      await aiShortlistService.updateContractorScores(item.contractor._id, item.scores);
    }

    // Prepare response
    const response = {
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        workType: job.workType,
        location: job.location
      },
      shortlist: limitedShortlist.map(item => {
        return {
          contractor: {
            id: item._id,
            name: item.name,
            email: item.email,
            phone: item.phone,
            profile: item.profile
          },
          rank: item.rank,
          scores: includeScores === 'true' ? item.scores : undefined,
          explanation: item.explanation,
          estimatedCost: item.estimatedCost,
          ratePerAcre: item.ratePerAcre
        };
      }),
      metadata: {
        totalContractors: contractors.length,
        shortlistSize: limitedShortlist.length,
        generatedAt: new Date(),
        algorithm: 'AI/ML Multi-Factor Scoring'
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating AI shortlist:', error);
    res.status(500).json({ message: 'Error generating AI shortlist', error: error.message });
  }
});

// Get AI shortlist for a job (if already generated)
const getAIShortlist = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findById(jobId)
      .populate('aiShortlisted', 'name email phone profile.photo profile.bio profile.skills profile.rating profile.completedJobs profile.availability')
      .populate('postedBy', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.aiShortlistGenerated) {
      return res.status(404).json({ message: 'AI shortlist not generated for this job' });
    }

    // Map shortlisted contractors with their scores
    const shortlist = job.aiShortlisted.map(contractor => {
      const scoreData = job.aiShortlistScores.find(score => 
        score.contractorId.toString() === contractor._id.toString()
      );

      return {
        contractor: {
          id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          profile: contractor.profile
        },
        scores: scoreData ? {
          overall: scoreData.overallScore,
          skillMatch: scoreData.skillMatchScore,
          reliability: scoreData.reliabilityScore,
          experience: scoreData.experienceScore,
          location: scoreData.locationScore,
          budget: scoreData.budgetScore
        } : null,
        explanation: scoreData ? scoreData.explanation : null
      };
    });

    res.status(200).json({
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        workType: job.workType,
        budget: job.budget,
        location: job.location
      },
      shortlist,
      metadata: {
        generatedAt: job.aiShortlistDate,
        shortlistSize: shortlist.length
      }
    });
  } catch (error) {
    console.error('Error getting AI shortlist:', error);
    res.status(500).json({ message: 'Error retrieving AI shortlist', error: error.message });
  }
});

// Get AI analytics and insights
const getAIAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get overall statistics
    const totalJobs = await Job.countDocuments();
    const jobsWithAIShortlist = await Job.countDocuments({ aiShortlistGenerated: true });
    const totalContractors = await User.countDocuments({ role: 'contractor' });

    // Get contractor performance metrics
    const contractors = await User.find({ role: 'contractor' }).select('profile.aiScore profile.rating profile.completedJobs');
    
    const avgAIScore = contractors.reduce((sum, c) => sum + (c.profile.aiScore || 0), 0) / contractors.length;
    const avgRating = contractors.reduce((sum, c) => sum + (c.profile.rating || 0), 0) / contractors.length;
    const avgCompletedJobs = contractors.reduce((sum, c) => sum + (c.profile.completedJobs || 0), 0) / contractors.length;

    // Get top performing contractors by AI score
    const topContractors = await User.find({ role: 'contractor' })
      .select('name profile.aiScore profile.rating profile.completedJobs')
      .sort({ 'profile.aiScore': -1 })
      .limit(10);

    // Get recent AI shortlists
    const recentShortlists = await Job.find({ aiShortlistGenerated: true })
      .populate('postedBy', 'name')
      .populate('aiShortlisted', 'name')
      .sort({ aiShortlistDate: -1 })
      .limit(5);

    // Calculate success rate (jobs where AI shortlisted contractor was selected)
    const jobsWithSelection = await Job.find({ 
      aiShortlistGenerated: true, 
      selectedContractor: { $exists: true, $ne: null } 
    });
    
    const successCount = jobsWithSelection.filter(job => 
      job.aiShortlisted.includes(job.selectedContractor)
    ).length;
    
    const successRate = jobsWithSelection.length > 0 ? (successCount / jobsWithSelection.length) * 100 : 0;

    res.status(200).json({
      overview: {
        totalJobs,
        jobsWithAIShortlist,
        aiShortlistRate: totalJobs > 0 ? (jobsWithAIShortlist / totalJobs) * 100 : 0,
        totalContractors,
        successRate: Math.round(successRate)
      },
      metrics: {
        avgAIScore: Math.round(avgAIScore),
        avgRating: Math.round(avgRating * 10) / 10,
        avgCompletedJobs: Math.round(avgCompletedJobs)
      },
      topContractors: topContractors.map(c => ({
        name: c && c.name ? c.name : 'Unknown',
        aiScore: c.profile && c.profile.aiScore ? c.profile.aiScore : 0,
        rating: c.profile && c.profile.rating ? c.profile.rating : 0,
        completedJobs: c.profile && c.profile.completedJobs ? c.profile.completedJobs : 0
      })),
      recentShortlists: recentShortlists.map(job => ({
        jobTitle: job.title,
        postedBy: job.postedBy && job.postedBy.name ? job.postedBy.name : 'Unknown',
        shortlistSize: job.aiShortlisted ? job.aiShortlisted.length : 0,
        generatedAt: job.aiShortlistDate
      }))
    });
  } catch (error) {
    console.error('Error getting AI analytics:', error);
    res.status(500).json({ message: 'Error retrieving AI analytics', error: error.message });
  }
});

// Update contractor AI scores manually (for admin use)
const updateContractorAIScores = asyncHandler(async (req, res) => {
  const { contractorId } = req.params;
  const { scores } = req.body;

  try {
    const contractor = await User.findById(contractorId);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    if (contractor.role !== 'contractor') {
      return res.status(400).json({ message: 'User is not a contractor' });
    }

    await aiShortlistService.updateContractorScores(contractorId, scores);

    res.status(200).json({ 
      message: 'Contractor AI scores updated successfully',
      contractorId,
      updatedScores: scores
    });
  } catch (error) {
    console.error('Error updating contractor AI scores:', error);
    res.status(500).json({ message: 'Error updating contractor AI scores', error: error.message });
  }
});

// Get contractor AI score breakdown
const getContractorAIScoreBreakdown = asyncHandler(async (req, res) => {
  const { contractorId } = req.params;

  try {
    const contractor = await User.findById(contractorId).select('-password');
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    if (contractor.role !== 'contractor') {
      return res.status(400).json({ message: 'User is not a contractor' });
    }

    const profile = contractor.profile;
    
    res.status(200).json({
      contractor: {
        id: contractor._id,
        name: contractor.name,
        email: contractor.email
      },
      scores: {
        overall: profile.aiScore || 0,
        skillMatch: profile.skillMatchScore || 0,
        reliability: profile.reliabilityScore || 0,
        experience: profile.experienceScore || 0,
        location: profile.locationScore || 0,
        budgetCompatibility: profile.budgetCompatibility || 0,
        quality: profile.qualityScore || 0
      },
      metrics: {
        rating: profile.rating || 0,
        completedJobs: profile.completedJobs || 0,
        totalSpent: profile.totalSpent || 0,
        availability: profile.availability || 'Unknown'
      },
      shortlistHistory: profile.shortlistHistory || []
    });
  } catch (error) {
    console.error('Error getting contractor AI score breakdown:', error);
    res.status(500).json({ message: 'Error retrieving contractor AI score breakdown', error: error.message });
  }
});

// Get comprehensive AI analytics (new endpoint)
const getComprehensiveAIAnalytics = asyncHandler(async (req, res) => {
  try {
    const analytics = await aiAnalyticsService.getComprehensiveAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error getting comprehensive AI analytics:', error);
    res.status(500).json({ message: 'Error retrieving comprehensive AI analytics', error: error.message });
  }
});

// Update AI success tracking when contractor is selected
const updateAISuccessTracking = asyncHandler(async (req, res) => {
  const { jobId, selectedContractorId } = req.body;

  try {
    await aiAnalyticsService.updateAISuccessTracking(jobId, selectedContractorId);
    res.status(200).json({ 
      message: 'AI success tracking updated successfully',
      jobId,
      selectedContractorId
    });
  } catch (error) {
    console.error('Error updating AI success tracking:', error);
    res.status(500).json({ message: 'Error updating AI success tracking', error: error.message });
  }
});

module.exports = {
  generateAIShortlist,
  getAIShortlist,
  getAIAnalytics,
  getComprehensiveAIAnalytics,
  updateAISuccessTracking,
  updateContractorAIScores,
  getContractorAIScoreBreakdown
}; 