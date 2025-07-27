import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FeedbackForm from '../../components/FeedbackForm';
import PaymentForm from '../../components/PaymentForm';
import ActionRequiredJobs from '../../components/ActionRequiredJobs';
import './JobProgress.css';

export default function JobProgress() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [workProgress, setWorkProgress] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    review: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchInProgressJobs();
  }, []);

  const fetchInProgressJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/landowner/in-progress-jobs`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching in-progress jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkProgress = async (jobId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/work-progress/${jobId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setWorkProgress(response.data);
    } catch (error) {
      console.error('Error fetching work progress:', error);
      setWorkProgress(null);
    }
  };

  const fetchExtensionRequests = async (jobId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/work-progress/${jobId}/extension-requests`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setExtensionRequests(response.data);
    } catch (error) {
      console.error('Error fetching extension requests:', error);
      setExtensionRequests([]);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/landowner/jobs/${jobId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Refresh the jobs list
      fetchInProgressJobs();
      alert(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const handleMarkCompleted = (job) => {
    setSelectedJob(job);
    setReviewData({ rating: 5, review: '' });
    setShowReviewModal(true);
  };

  const handlePayJob = (job) => {
    setSelectedJob(job);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentId) => {
    setShowPaymentModal(false);
    // Show feedback form after successful payment
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = (job) => {
    setSelectedJob(job);
    setShowFeedbackModal(true);
  };

  const handleViewExtensions = (job) => {
    setSelectedJob(job);
    fetchExtensionRequests(job._id);
    setShowExtensionModal(true);
  };

  const handleViewProgress = (job) => {
    setSelectedJob(job);
    fetchWorkProgress(job._id);
    setShowExtensionModal(true); // Reusing modal for progress view
  };

  const handleExtensionResponse = async (requestId, status) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/work-progress/${selectedJob._id}/extension-request/${requestId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Refresh extension requests
      fetchExtensionRequests(selectedJob._id);
      alert(`Extension request ${status} successfully`);
    } catch (error) {
      console.error('Error responding to extension request:', error);
      alert('Failed to respond to extension request');
    }
  };

  const handleSubmitReview = async () => {
    try {
      // First update job status to completed
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/landowner/jobs/${selectedJob._id}/status`,
        { status: 'completed' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Then add the review
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/landowner/jobs/${selectedJob._id}/review`,
        {
          rating: reviewData.rating,
          review: reviewData.review
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setShowReviewModal(false);
      setSelectedJob(null);
      fetchInProgressJobs();
      alert('Job completed and review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    fetchInProgressJobs();
    alert('Feedback submitted successfully!');
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && setReviewData({ ...reviewData, rating: i })}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in_progress':
        return 'status-badge in-progress';
      case 'completed':
        return 'status-badge completed';
      default:
        return 'status-badge open';
    }
  };

  const renderProgressUpdates = (job) => {
    if (!workProgress || workProgress.jobId !== job._id) return null;

    return (
      <div className="progress-updates">
        <h4>Weekly Progress Updates</h4>
        {workProgress.weeklyProgress && workProgress.weeklyProgress.length > 0 ? (
          <div className="updates-list">
            {workProgress.weeklyProgress.map((update, index) => (
              <div key={index} className="progress-update">
                <div className="update-header">
                  <h5>Week {update.weekNumber}</h5>
                  <span className="progress-percentage">{update.progressPercentage}%</span>
                  <span className="update-date">{formatDate(update.createdAt)}</span>
                </div>
                <p className="update-description">{update.description}</p>
                {update.challenges && (
                  <p className="update-challenges"><strong>Challenges:</strong> {update.challenges}</p>
                )}
                {update.nextWeekPlan && (
                  <p className="update-next-week"><strong>Next Week Plan:</strong> {update.nextWeekPlan}</p>
                )}
                {update.photos && update.photos.length > 0 && (
                  <div className="update-photos">
                    <h6>Photos:</h6>
                    <div className="photo-grid">
                      {update.photos.map((photo, photoIndex) => (
                        <img 
                          key={photoIndex} 
                          src={photo} 
                          alt={`Progress photo ${photoIndex + 1}`}
                          className="progress-photo"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-updates">No progress updates available yet.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="job-progress-container">
        <div className="loading">Loading your in-progress jobs...</div>
      </div>
    );
  }

  return (
    <div className="job-progress-container">
      <div className="header">
        <h2>Job Progress & Management</h2>
        <p>Track the progress of your jobs and manage contractor assignments</p>
      </div>

      <ActionRequiredJobs />

      {jobs.length === 0 ? (
        <div className="no-jobs">
          <h3>No In-Progress Jobs</h3>
          <p>You don't have any jobs currently in progress.</p>
          <button 
            onClick={() => navigate('/landowner/post')}
            className="btn-primary"
          >
            Post a New Job
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <span className={getStatusBadgeClass(job.status)}>
                  {job.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="job-details">
                <div className="detail-row">
                  <span className="label">Work Type:</span>
                  <span className="value">{job.workType}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{job.location}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Budget:</span>
                  <span className="value">
                    {(() => {
                      // Find estimatedCost for assigned contractor
                      if (job.selectedContractor && job.aiShortlistScores) {
                        const assignedScore = job.aiShortlistScores.find(
                          score =>
                            score.contractorId &&
                            (score.contractorId._id === job.selectedContractor._id ||
                             score.contractorId === job.selectedContractor._id ||
                             score.contractorId === job.selectedContractor)
                        );
                        if (assignedScore && assignedScore.estimatedCost) {
                          return `₹${assignedScore.estimatedCost.toLocaleString()}`;
                        }
                      }
                      return 'Not available';
                    })()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Land Size:</span>
                  <span className="value">{job.landSize} acres</span>
                </div>
                <div className="detail-row">
                  <span className="label">Timeline:</span>
                  <span className="value">
                    {formatDate(job.startDate)} - {formatDate(job.endDate)}
                  </span>
                </div>
              </div>

              {job.selectedContractor && (
                <div className="contractor-section">
                  <h4>Assigned Contractor</h4>
                  <div className="contractor-info">
                    <div className="contractor-details">
                      <p><strong>Name:</strong> {job.selectedContractor.name}</p>
                      <p><strong>Email:</strong> {job.selectedContractor.email}</p>
                      <p><strong>Phone:</strong> {job.selectedContractor.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Updates Section */}
              {renderProgressUpdates(job)}

              <div className="job-actions">
                {job.status === 'in_progress' && (
                  <>
                    <button 
                      onClick={() => handleViewProgress(job)}
                      className="btn-secondary"
                    >
                      View Progress
                    </button>
                    <button 
                      onClick={() => handleViewExtensions(job)}
                      className="btn-secondary"
                    >
                      View Extension Requests
                    </button>
                  </>
                )}
                {job.status === 'completed' && (
                  <>
                    <button 
                      onClick={() => handlePayJob(job)}
                      className="btn-primary"
                    >
                      Pay Contractor
                    </button>
                    <button 
                      onClick={() => handleSubmitFeedback(job)}
                      className="btn-secondary"
                    >
                      Submit Feedback
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h3>Complete Job & Review Contractor</h3>
              <button 
                className="close-btn"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="review-form">
              <div className="form-group">
                <label>Rating:</label>
                <div className="stars-container">
                  {renderStars(reviewData.rating, true)}
                </div>
              </div>
              
              <div className="form-group">
                <label>Review:</label>
                <textarea
                  value={reviewData.review}
                  onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                  placeholder="Share your experience with this contractor..."
                  rows="4"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleSubmitReview}
                >
                  Complete & Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      <PaymentForm
        job={selectedJob}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmitSuccess={handlePaymentSuccess}
      />

      {/* Comprehensive Feedback Form Modal */}
      <FeedbackForm
        job={selectedJob}
        paymentId={selectedJob?.paymentId}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitSuccess={handleFeedbackSuccess}
      />

      {/* Progress/Extension Requests Modal */}
      {showExtensionModal && (
        <div className="modal-overlay">
          <div className="extension-modal">
            <div className="modal-header">
              <h3>
                {workProgress ? 'Work Progress & Updates' : 'Extension Requests'}
              </h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowExtensionModal(false);
                  setWorkProgress(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {workProgress ? (
                <div className="work-progress-details">
                  <div className="progress-summary">
                    <h4>Current Progress: {workProgress.currentProgress || 0}%</h4>
                    <p><strong>Status:</strong> {workProgress.status}</p>
                    <p><strong>Start Date:</strong> {formatDate(workProgress.startDate)}</p>
                    {workProgress.actualCompletionDate && (
                      <p><strong>Completion Date:</strong> {formatDate(workProgress.actualCompletionDate)}</p>
                    )}
                  </div>
                  
                  {workProgress.weeklyProgress && workProgress.weeklyProgress.length > 0 && (
                    <div className="progress-updates-section">
                      <h4>Weekly Progress Updates</h4>
                      {workProgress.weeklyProgress.map((update, index) => (
                        <div key={index} className="progress-update-item">
                          <div className="update-header">
                            <h5>Week {update.weekNumber}</h5>
                            <span className="progress-percentage">{update.progressPercentage}%</span>
                            <span className="update-date">{formatDate(update.createdAt)}</span>
                          </div>
                          <p className="update-description">{update.description}</p>
                          {update.challenges && (
                            <p className="update-challenges"><strong>Challenges:</strong> {update.challenges}</p>
                          )}
                          {update.nextWeekPlan && (
                            <p className="update-next-week"><strong>Next Week Plan:</strong> {update.nextWeekPlan}</p>
                          )}
                          {update.photos && update.photos.length > 0 && (
                            <div className="update-photos">
                              <h6>Photos:</h6>
                              <div className="photo-grid">
                                {update.photos.map((photo, photoIndex) => (
                                  <img 
                                    key={photoIndex} 
                                    src={photo} 
                                    alt={`Progress photo ${photoIndex + 1}`}
                                    className="progress-photo"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="extension-requests">
                  {extensionRequests.length === 0 ? (
                    <p>No extension requests found.</p>
                  ) : (
                    extensionRequests.map((request) => (
                      <div key={request._id} className="extension-request">
                        <div className="request-details">
                          <p><strong>Requested Date:</strong> {formatDate(request.createdAt)}</p>
                          <p><strong>Reason:</strong> {request.reason}</p>
                          <p><strong>Status:</strong> {request.status}</p>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="request-actions">
                            <button 
                              className="btn-secondary"
                              onClick={() => handleExtensionResponse(request._id, 'rejected')}
                            >
                              Reject
                            </button>
                            <button 
                              className="btn-primary"
                              onClick={() => handleExtensionResponse(request._id, 'approved')}
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}