const Job = require('../models/Job');
const User = require('../models/User');

class AIAnalyticsService {
  // Get overall AI success rate
  async getAISuccessRate() {
    try {
      const jobsWithAI = await Job.find({ 
        aiShortlistGenerated: true,
        selectedContractor: { $exists: true, $ne: null }
      });
      
      const aiSelected = jobsWithAI.filter(job => job.wasAISelected);
      
      return {
        totalJobs: jobsWithAI.length,
        aiSelected: aiSelected.length,
        successRate: jobsWithAI.length > 0 ? (aiSelected.length / jobsWithAI.length) * 100 : 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting AI success rate:', error);
      return { totalJobs: 0, aiSelected: 0, successRate: 0, lastUpdated: new Date() };
    }
  }

  // Get success rate by job type
  async getSuccessRateByJobType() {
    try {
      const jobsWithAI = await Job.find({ 
        aiShortlistGenerated: true,
        selectedContractor: { $exists: true, $ne: null }
      });

      const jobTypeStats = {};
      
      jobsWithAI.forEach(job => {
        const workType = job.workType.toLowerCase();
        if (!jobTypeStats[workType]) {
          jobTypeStats[workType] = { total: 0, aiSelected: 0 };
        }
        
        jobTypeStats[workType].total++;
        if (job.wasAISelected) {
          jobTypeStats[workType].aiSelected++;
        }
      });

      // Calculate success rates
      const result = {};
      for (const [workType, stats] of Object.entries(jobTypeStats)) {
        result[workType] = {
          total: stats.total,
          aiSelected: stats.aiSelected,
          successRate: (stats.aiSelected / stats.total) * 100
        };
      }

      return result;
    } catch (error) {
      console.error('Error getting success rate by job type:', error);
      return {};
    }
  }

  // Get top performing contractors by AI score
  async getTopContractors(limit = 10) {
    try {
      const contractors = await User.find({ 
        role: 'contractor',
        'profile.aiScore': { $gt: 0 }
      })
      .select('name profile.aiScore profile.rating profile.completedJobs')
      .sort({ 'profile.aiScore': -1 })
      .limit(limit);

      return contractors.map(c => ({
        name: c.name,
        aiScore: c.profile.aiScore,
        rating: c.profile.rating,
        completedJobs: c.profile.completedJobs
      }));
    } catch (error) {
      console.error('Error getting top contractors:', error);
      return [];
    }
  }

  // Get AI usage statistics
  async getAIUsageStats() {
    try {
      const totalJobs = await Job.countDocuments();
      const jobsWithAI = await Job.countDocuments({ aiShortlistGenerated: true });
      const recentJobs = await Job.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });
      const recentJobsWithAI = await Job.countDocuments({ 
        aiShortlistGenerated: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      return {
        totalJobs,
        jobsWithAI,
        aiUsageRate: totalJobs > 0 ? (jobsWithAI / totalJobs) * 100 : 0,
        recentJobs,
        recentJobsWithAI,
        recentAIUsageRate: recentJobs > 0 ? (recentJobsWithAI / recentJobs) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting AI usage stats:', error);
      return {
        totalJobs: 0,
        jobsWithAI: 0,
        aiUsageRate: 0,
        recentJobs: 0,
        recentJobsWithAI: 0,
        recentAIUsageRate: 0
      };
    }
  }

  // Update AI success tracking when contractor is selected
  async updateAISuccessTracking(jobId, selectedContractorId) {
    try {
      const job = await Job.findById(jobId);
      if (!job || !job.aiShortlistGenerated) return;

      // Check if selected contractor was in AI shortlist
      const wasAISelected = job.aiShortlisted.includes(selectedContractorId);
      
      await Job.findByIdAndUpdate(jobId, {
        selectedContractor: selectedContractorId,
        wasAISelected,
        updatedAt: new Date()
      });

      // Update overall AI success rate for this job type
      await this.updateJobTypeSuccessRate(job.workType);
      
    } catch (error) {
      console.error('Error updating AI success tracking:', error);
    }
  }

  // Update success rate for specific job type
  async updateJobTypeSuccessRate(workType) {
    try {
      const jobsWithAI = await Job.find({ 
        workType,
        aiShortlistGenerated: true,
        selectedContractor: { $exists: true, $ne: null }
      });

      const aiSelected = jobsWithAI.filter(job => job.wasAISelected);
      const successRate = jobsWithAI.length > 0 ? (aiSelected.length / jobsWithAI.length) * 100 : 0;

      // Update all jobs of this type with the new success rate
      await Job.updateMany(
        { workType, aiShortlistGenerated: true },
        { aiSuccessRate: successRate }
      );

    } catch (error) {
      console.error('Error updating job type success rate:', error);
    }
  }

  // Get comprehensive AI analytics
  async getComprehensiveAnalytics() {
    try {
      const [successRate, jobTypeStats, topContractors, usageStats] = await Promise.all([
        this.getAISuccessRate(),
        this.getSuccessRateByJobType(),
        this.getTopContractors(),
        this.getAIUsageStats()
      ]);

      return {
        successRate,
        jobTypeStats,
        topContractors,
        usageStats,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting comprehensive analytics:', error);
      return {
        successRate: { totalJobs: 0, aiSelected: 0, successRate: 0 },
        jobTypeStats: {},
        topContractors: [],
        usageStats: { totalJobs: 0, jobsWithAI: 0, aiUsageRate: 0 },
        generatedAt: new Date()
      };
    }
  }
}

module.exports = new AIAnalyticsService(); 