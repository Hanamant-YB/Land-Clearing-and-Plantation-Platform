import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FeedbackForm.css';

export default function FeedbackForm({ 
  job, 
  paymentId, 
  isOpen, 
  onClose, 
  onSubmitSuccess 
}) {
  const [formData, setFormData] = useState({
    rating: 0,
    review: '',
    qualityOfWork: 0,
    communication: 0,
    timeliness: 0,
    professionalism: 0,
    strengths: '',
    areasForImprovement: '',
    wouldRecommend: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && job) {
      // Reset form when modal opens
      setFormData({
        rating: 0,
        review: '',
        qualityOfWork: 0,
        communication: 0,
        timeliness: 0,
        professionalism: 0,
        strengths: '',
        areasForImprovement: '',
        wouldRecommend: true
      });
      setError('');
    }
  }, [isOpen, job]);

  // Find the assigned contractor's estimated cost
  let estimatedCost = null;
  if (job && job.aiShortlistScores && job.selectedContractor) {
    const assignedScore = job.aiShortlistScores.find(
      score =>
        score.contractorId &&
        (score.contractorId._id === job.selectedContractor._id ||
         score.contractorId === job.selectedContractor._id ||
         score.contractorId === job.selectedContractor)
    );
    if (assignedScore && assignedScore.estimatedCost) {
      estimatedCost = assignedScore.estimatedCost;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rating || !formData.review) {
      setError('Please provide a rating and review');
      return;
    }

    if (!formData.qualityOfWork || !formData.communication || 
        !formData.timeliness || !formData.professionalism) {
      setError('Please rate all performance categories');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/feedback/submit`,
        {
          ...formData,
          jobId: job._id,
          contractorId: job.selectedContractor?._id || job.selectedContractor,
          jobBudget: estimatedCost // <-- Add jobBudget to the request
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.status === 201) {
        setError('');
        alert('Feedback submitted successfully!');
        onSubmitSuccess();
        onClose();
      }
    } catch (error) {
      // Handle duplicate feedback gracefully
      const msg = error.response?.data?.message || '';
      if (msg.includes('Feedback already submitted for this job')) {
        alert('Feedback already submitted for this job.');
        setError('');
        onSubmitSuccess();
        onClose();
      } else {
        console.error('Error submitting feedback:', error);
        setError(msg || 'Failed to submit feedback');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, field, interactive = true) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={() => {
            if (interactive) {
              setFormData({ ...formData, [field]: i });
              // Auto-set overall rating if it's 0
              if (field !== 'rating' && formData.rating === 0) {
                setFormData(prev => ({ ...prev, [field]: i, rating: i }));
              }
            }
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const calculateOverallRating = () => {
    const ratings = [
      formData.qualityOfWork,
      formData.communication,
      formData.timeliness,
      formData.professionalism
    ].filter(r => r > 0);
    
    if (ratings.length === 0) return 0;
    return Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length);
  };

  if (!isOpen || !job) return null;

  return (
    <div className="feedback-form-overlay">
      <div className="feedback-form-modal">
        <div className="modal-header">
          <h2>Submit Feedback</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="job-summary">
          <h3>{job.title}</h3>
          <p className="job-description">{job.description}</p>
          <div className="job-meta">
            <span className="job-type">{job.workType}</span>
            <span className="job-budget">₹{job.budget?.toLocaleString()}</span>
            <span className="job-location">{job.location}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Overall Rating */}
          <div className="form-section">
            <h4>Overall Rating</h4>
            <div className="rating-group">
              <label>How would you rate this contractor overall?</label>
              <div className="stars-container">
                {renderStars(formData.rating, 'rating')}
              </div>
              <span className="rating-text">
                {formData.rating > 0 ? `${formData.rating} out of 5 stars` : 'Click to rate'}
              </span>
            </div>
          </div>

          {/* Detailed Performance Ratings */}
          <div className="form-section">
            <h4>Detailed Performance Assessment</h4>
            <div className="performance-ratings">
              <div className="rating-item">
                <label>Quality of Work</label>
                <div className="stars-container">
                  {renderStars(formData.qualityOfWork, 'qualityOfWork')}
                </div>
              </div>
              
              <div className="rating-item">
                <label>Communication</label>
                <div className="stars-container">
                  {renderStars(formData.communication, 'communication')}
                </div>
              </div>
              
              <div className="rating-item">
                <label>Timeliness</label>
                <div className="stars-container">
                  {renderStars(formData.timeliness, 'timeliness')}
                </div>
              </div>
              
              <div className="rating-item">
                <label>Professionalism</label>
                <div className="stars-container">
                  {renderStars(formData.professionalism, 'professionalism')}
                </div>
              </div>
            </div>
          </div>

          {/* Written Review */}
          <div className="form-section">
            <h4>Written Review</h4>
            <div className="form-group">
              <label>Please share your experience with this contractor:</label>
              <textarea
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="Describe your experience, what went well, and any areas for improvement..."
                rows="4"
                required
              />
            </div>
          </div>

          {/* Strengths and Areas for Improvement */}
          <div className="form-section">
            <h4>Additional Feedback</h4>
            <div className="form-group">
              <label>What were the contractor's strengths?</label>
              <textarea
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="What did the contractor do exceptionally well?"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Areas for improvement:</label>
              <textarea
                value={formData.areasForImprovement}
                onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
                placeholder="What could the contractor improve on?"
                rows="3"
              />
            </div>
          </div>

          {/* Recommendation */}
          <div className="form-section">
            <h4>Recommendation</h4>
            <div className="form-group">
              <label>Would you recommend this contractor to others?</label>
              <div className="recommendation-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    value="true"
                    checked={formData.wouldRecommend === true}
                    onChange={() => setFormData({ ...formData, wouldRecommend: true })}
                  />
                  <span className="radio-label">Yes, I would recommend</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    value="false"
                    checked={formData.wouldRecommend === false}
                    onChange={() => setFormData({ ...formData, wouldRecommend: false })}
                  />
                  <span className="radio-label">No, I would not recommend</span>
                </label>
              </div>
            </div>
          </div>

          {/* Auto-calculated Overall Score */}
          <div className="overall-score-display">
            <h4>Calculated Overall Score</h4>
            <div className="score-display">
              <div className="stars-container">
                {renderStars(calculateOverallRating(), 'rating', false)}
              </div>
              <span className="score-text">
                {calculateOverallRating() > 0 ? `${calculateOverallRating()}/5` : 'Rate categories above'}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 