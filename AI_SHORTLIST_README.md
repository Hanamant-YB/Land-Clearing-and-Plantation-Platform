# AI Shortlist Feature Documentation

## Overview

The AI Shortlist feature is a sophisticated machine learning system that automatically ranks and recommends the best contractors for specific jobs based on multiple factors including skills, reliability, experience, location, and budget compatibility.

## Features

### 🧠 AI/ML Capabilities
- **Multi-Factor Scoring**: Evaluates contractors across 7 key dimensions
- **Natural Language Processing**: Extracts skills from job descriptions using NLP
- **String Similarity Matching**: Finds skill matches even with different terminology
- **Location-Based Scoring**: Calculates proximity using Haversine formula
- **Reliability Analysis**: Considers completion rates, ratings, and feedback
- **Budget Compatibility**: Matches contractor preferences with job budgets

### 📊 Scoring Dimensions
1. **Skill Match (25%)**: How well contractor skills align with job requirements
2. **Reliability (20%)**: Based on completion rate, ratings, and track record
3. **Experience (15%)**: Number of completed jobs and project complexity
4. **Location (15%)**: Proximity to job site
5. **Budget (10%)**: Compatibility with job budget range
6. **Availability (10%)**: Current workload and availability status
7. **Quality (5%)**: Based on reviews and feedback analysis

### 🎯 Key Benefits
- **Time Saving**: Automatically shortlists top contractors
- **Better Matches**: AI considers multiple factors beyond just skills
- **Transparency**: Shows detailed scoring breakdown and explanations
- **Learning System**: Improves recommendations over time
- **Analytics**: Track success rates and performance metrics

## Technical Architecture

### Backend Components

#### 1. AI Service (`server/services/aiShortlistService.js`)
```javascript
// Main scoring algorithm
const scores = await aiShortlistService.calculateContractorScores(job, contractor);
const overallScore = aiShortlistService.calculateOverallScore(scores);
const explanation = aiShortlistService.generateExplanation(scores, contractor, job);
```

#### 2. Enhanced Data Models
- **User Model**: Added AI scoring fields and location data
- **Job Model**: Added required skills, complexity, and location coordinates
- **AI Metadata**: Tracks shortlist history and performance

#### 3. API Endpoints
```
POST /api/ai-shortlist/generate/:jobId - Generate new shortlist
GET  /api/ai-shortlist/job/:jobId     - Get existing shortlist
GET  /api/ai-shortlist/analytics      - Get AI performance metrics
PUT  /api/ai-shortlist/contractor/:id/scores - Update contractor scores
```

### Frontend Components

#### 1. Admin Dashboard Integration
- **AI Shortlist Tab**: Full-featured management interface
- **Analytics Dashboard**: Performance metrics and insights
- **Job Management**: Generate and view shortlists for all jobs

#### 2. Reusable Widget (`AIShortlistWidget.js`)
- **Embeddable Component**: Can be used in any page
- **Landowner Integration**: View AI recommendations for their jobs
- **Interactive Features**: Toggle scores, generate new shortlists

## Setup Instructions

### 1. Install Dependencies
```bash
cd contractor-platform/server
npm install natural ml-matrix ml-regression compromise string-similarity
```

### 2. Database Schema Updates
The system automatically adds new fields to existing models:
- User profiles get AI scoring fields
- Jobs get location coordinates and skill requirements
- AI metadata is stored for analytics

### 3. Environment Configuration
No additional environment variables required. The system works with existing setup.

## Usage Examples

### For Admins

#### Generate AI Shortlist
```javascript
// In AdminDashboard.js
const generateShortlist = async (jobId) => {
  const response = await fetch(`/api/ai-shortlist/generate/${jobId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  // Handle shortlist data
};
```

#### View Analytics
```javascript
// Access AI analytics in admin dashboard
const analytics = await fetch('/api/ai-shortlist/analytics');
// Shows success rates, top contractors, performance metrics
```

### For Landowners

#### Embed AI Widget
```javascript
import AIShortlistWidget from '../components/AIShortlistWidget';

// In your job details page
<AIShortlistWidget 
  jobId={jobId} 
  onContractorSelect={(contractor) => {
    // Handle contractor selection
  }}
/>
```

#### Generate Recommendations
```javascript
// Landowners can generate AI shortlists for their jobs
const generateShortlist = async () => {
  const response = await fetch(`/api/ai-shortlist/generate/${jobId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

## AI Algorithm Details

### Skill Matching Algorithm
```javascript
// Uses NLP to extract skills from job description
const jobSkills = extractSkills(job.description + ' ' + job.workType);

// Compares with contractor skills using string similarity
const similarity = stringSimilarity.compareTwoStrings(
  jobSkill.toLowerCase(), 
  contractorSkill.toLowerCase()
);
```

### Location Scoring
```javascript
// Haversine formula for distance calculation
const distance = contractor.calculateDistance(lat2, lon2);

// Score based on distance (closer = higher score)
if (distance <= 5) return 100;
if (distance <= 10) return 90;
// ... etc
```

### Reliability Scoring
```javascript
// Base score from rating
let score = (profile.rating || 0) * 20;

// Completion rate bonus
const completionRate = profile.completedJobs / totalJobs;
score += completionRate * 30;

// Penalty for cancellation rate
if (profile.cancellationRate) {
  score -= profile.cancellationRate * 50;
}
```

## Performance Optimization

### Caching Strategy
- AI shortlists are cached in the database
- Regeneration only when requested
- Scores are updated incrementally

### Scalability Considerations
- Algorithm is O(n) where n = number of contractors
- Parallel processing for large contractor pools
- Efficient database queries with proper indexing

## Monitoring and Analytics

### Success Metrics
- **Success Rate**: Percentage of AI recommendations accepted
- **Average AI Score**: Overall contractor quality
- **Shortlist Generation Rate**: Usage statistics
- **Top Performing Contractors**: AI score rankings

### Performance Tracking
```javascript
// Track when AI shortlisted contractor is selected
const successCount = jobsWithSelection.filter(job => 
  job.aiShortlisted.includes(job.selectedContractor)
).length;
```

## Customization Options

### Adjust Scoring Weights
```javascript
// In aiShortlistService.js
const weights = {
  skillMatch: 0.25,    // 25% weight
  reliability: 0.20,   // 20% weight
  experience: 0.15,    // 15% weight
  location: 0.15,      // 15% weight
  budget: 0.10,        // 10% weight
  availability: 0.10,  // 10% weight
  quality: 0.05        // 5% weight
};
```

### Add Custom Skills
```javascript
// Extend skill keywords array
const skillKeywords = [
  'plumbing', 'electrical', 'carpentry',
  // Add your custom skills here
  'custom-skill-1', 'custom-skill-2'
];
```

### Modify Distance Scoring
```javascript
// Customize location scoring thresholds
if (distance <= 5) return 100;   // Very close
if (distance <= 15) return 85;   // Close
if (distance <= 30) return 70;   // Moderate
// ... etc
```

## Troubleshooting

### Common Issues

#### 1. No Contractors Found
- Check contractor availability status
- Verify contractor profiles have required data
- Ensure contractors are within reasonable distance

#### 2. Low AI Scores
- Review contractor profile completeness
- Check rating and completion data
- Verify location coordinates are set

#### 3. Skill Matching Issues
- Ensure job descriptions include relevant keywords
- Check contractor skill tags are properly set
- Review skill keyword dictionary

### Debug Mode
```javascript
// Enable detailed logging
console.log('AI Scoring Details:', {
  skillMatch: scores.skillMatch,
  reliability: scores.reliability,
  explanation: explanation
});
```

## Future Enhancements

### Planned Features
1. **Machine Learning Models**: Train on historical data
2. **Predictive Analytics**: Forecast job success probability
3. **Real-time Updates**: Live contractor availability
4. **Advanced NLP**: Better skill extraction and matching
5. **Multi-language Support**: International contractor matching

### Integration Opportunities
- **Payment Systems**: Link to contractor payment history
- **Review Systems**: Enhanced feedback analysis
- **Communication Tools**: Direct messaging integration
- **Scheduling Systems**: Availability calendar integration

## Support and Maintenance

### Regular Maintenance
- Monitor AI performance metrics
- Update skill keyword dictionary
- Review and adjust scoring weights
- Clean up old shortlist data

### Performance Monitoring
- Track API response times
- Monitor database query performance
- Analyze user engagement metrics
- Review success rate trends

---

## Quick Start Checklist

- [ ] Install ML dependencies
- [ ] Restart server to load new models
- [ ] Test AI shortlist generation
- [ ] Verify admin dashboard integration
- [ ] Test landowner widget functionality
- [ ] Review analytics dashboard
- [ ] Configure custom scoring weights (optional)
- [ ] Set up monitoring alerts (optional)

For additional support or feature requests, please refer to the main project documentation or contact the development team. 