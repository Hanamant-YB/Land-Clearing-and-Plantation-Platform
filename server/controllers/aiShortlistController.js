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
      estimatedCost: item.estimatedCost,
      aiPrediction: item.aiPrediction
    }));

    await Job.findByIdAndUpdate(jobId, {
      aiShortlisted: limitedShortlist.map(item => item.contractor._id),
      aiShortlistGenerated: true,
      aiShortlistDate: new Date(),
      aiShortlistScores
    });

    // Update contractor scores in database
    for (const item of limitedShortlist) {
      await aiShortlistService.updateContractorScores(item._id, {
        overall: item.overallScore / 100, // Convert back to 0-1 scale
        skillMatch: item.skillMatchScore / 100,
        reliability: item.reliabilityScore / 100,
        experience: item.experienceScore / 100,
        location: item.locationScore / 100,
        budget: item.budgetCompatibility / 100,
        quality: item.qualityScore / 100
      });
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
          scores: includeScores === 'true' ? {
            overall: item.overallScore,
            skillMatch: item.skillMatchScore,
            reliability: item.reliabilityScore,
            experience: item.experienceScore,
            location: item.locationScore,
            budget: item.budgetCompatibility,
            quality: item.qualityScore,
            aiPrediction: item.aiPrediction
          } : undefined,
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
          budget: scoreData.budgetScore,
          quality: scoreData.qualityScore,
          aiPrediction: scoreData.aiPrediction
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
    // Use the aiAnalyticsService for consistent data
    const analytics = await aiAnalyticsService.getComprehensiveAnalytics();
    
    // Get recent AI shortlists
    const recentShortlists = await Job.find({ aiShortlistGenerated: true })
      .populate('postedBy', 'name')
      .populate('aiShortlisted', 'name')
      .sort({ aiShortlistDate: -1 })
      .limit(5);

    res.status(200).json({
      overview: {
        totalJobs: analytics.usageStats?.totalJobs || 0,
        jobsWithAIShortlist: analytics.usageStats?.jobsWithAI || 0,
        aiShortlistRate: analytics.usageStats?.aiUsageRate || 0,
        totalContractors: analytics.usageStats?.totalContractors || 0,
        successRate: analytics.successRate || 0
      },
      metrics: {
        avgAIScore: analytics.metrics?.avgAIScore || 0,
        avgRating: analytics.metrics?.avgRating || 0,
        avgCompletedJobs: analytics.metrics?.avgCompletedJobs || 0
      },
      topContractors: analytics.topContractors || [],
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