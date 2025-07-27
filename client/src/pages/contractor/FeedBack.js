import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './FeedBack.css';
import Navbar from '../../components/Navbar';

console.log('FeedBack.js file is being loaded');

export default function FeedBack() {
  console.log('FeedBack component function is running');
  
  const { token, user } = useContext(AuthContext);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(true);

  console.log('FeedBack component loaded');
  console.log('Token:', token);
  console.log('User:', user);

  useEffect(() => {
    const fetchFeedback = async () => {
      console.log('Starting to fetch feedback...');
    try {
      setLoading(true);
        setError('');
        
        console.log('Making API call to:', `${process.env.REACT_APP_API_URL}/feedback/contractor`);
        
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/feedback/contractor`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        console.log('API Response:', response);
        console.log('Response data:', response.data);
        
        setFeedback(response.data.feedback || []);
        setStats(response.data.stats || {});
        
        console.log('Feedback set:', response.data.feedback);
        console.log('Stats set:', response.data.stats);
        
        console.info('For more technical details, open the browser console.');
    } catch (error) {
        console.error('Error fetching feedback:', error);
        console.error('Error response:', error.response);
        setError(error.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

    if (token) {
      fetchFeedback();
    } else {
      console.log('No token available');
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    console.log('Rendering loading state');
    return <div className="feedback-page"><div className="loading">Loading feedback data...</div></div>;
  }

  if (error) {
    console.log('Rendering error state:', error);
    return <div className="feedback-page"><div className="error-message">{error}</div></div>;
  }

  console.log('Rendering feedback page with:', { feedback, stats });

    return (
    <>
      <Navbar />
      <div className="feedback-page">
        <div className="feedback-header">
          <h2>Contractor Feedback</h2>
        </div>
        {/* Stats Section */}
        <div className="feedback-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalFeedback || 0}</div>
            <div className="stat-label">Total Feedback</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Number(stats.averageRating)?.toFixed(1) || 0}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Number(stats.averageQuality)?.toFixed(1) || 0}</div>
            <div className="stat-label">Avg. Quality</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Number(stats.averageCommunication)?.toFixed(1) || 0}</div>
            <div className="stat-label">Avg. Communication</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Number(stats.averageTimeliness)?.toFixed(1) || 0}</div>
            <div className="stat-label">Avg. Timeliness</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Number(stats.averageProfessionalism)?.toFixed(1) || 0}</div>
            <div className="stat-label">Avg. Professionalism</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.recommendationRate || 0}%</div>
            <div className="stat-label">Recommendation Rate</div>
          </div>
        </div>
        {/* Feedback List Section */}
        <div className="feedback-cards">
          {feedback.length === 0 ? (
            <div className="no-reviews">
              <div className="no-reviews-icon">📝</div>
              <h3>No Feedback Yet</h3>
              <p>You haven't received any feedback from landowners yet.</p>
            </div>
          ) : (
            feedback.map((item) => (
              <div key={item._id} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-job-info">
                    <h3>{item.jobTitle}</h3>
                    <div className="job-details">
                      <span>{item.jobType}</span>
                      <span>• ₹{item.jobBudget?.toLocaleString()}</span>
                      <span>• {item.jobLocation}</span>
                    </div>
                  </div>
                  <div className="feedback-rating">
                    <div className="stars">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={`star ${i <= item.rating ? 'filled' : 'empty'}`}>★</span>
                      ))}
                    </div>
                    <span className="rating-number">{item.rating}/5</span>
                    <div className="overall-score">Overall: {item.overallScore}/5</div>
                  </div>
                </div>
                <div className="feedback-content">
                  <div className="feedback-text">
                    <p>"{item.review}"</p>
                  </div>
                  <div className="detailed-ratings">
                    <div className="rating-grid">
                      <div className="rating-item">
                        <span>Quality:</span>
                        <div className="mini-stars">{[1,2,3,4,5].map(i => (<span key={i} className={`star ${i <= item.qualityOfWork ? 'filled' : 'empty'}`}>★</span>))}</div>
                      </div>
                      <div className="rating-item">
                        <span>Communication:</span>
                        <div className="mini-stars">{[1,2,3,4,5].map(i => (<span key={i} className={`star ${i <= item.communication ? 'filled' : 'empty'}`}>★</span>))}</div>
                      </div>
                      <div className="rating-item">
                        <span>Timeliness:</span>
                        <div className="mini-stars">{[1,2,3,4,5].map(i => (<span key={i} className={`star ${i <= item.timeliness ? 'filled' : 'empty'}`}>★</span>))}</div>
                      </div>
                      <div className="rating-item">
                        <span>Professionalism:</span>
                        <div className="mini-stars">{[1,2,3,4,5].map(i => (<span key={i} className={`star ${i <= item.professionalism ? 'filled' : 'empty'}`}>★</span>))}</div>
                      </div>
                    </div>
                  </div>
                  {item.strengths && (
                    <div className="feedback-section">
                      <strong>Strengths:</strong> {item.strengths}
                    </div>
                  )}
                  {item.areasForImprovement && (
                    <div className="feedback-section">
                      <strong>Areas for Improvement:</strong> {item.areasForImprovement}
                    </div>
                  )}
                  <div className="recommendation-badge">
                    {item.wouldRecommend ? (
                      <span className="recommended">✓ Would Recommend</span>
                    ) : (
                      <span className="not-recommended">✗ Would Not Recommend</span>
                    )}
                  </div>
                  <div className="feedback-meta">
                    <div className="reviewer-info">
                      <span className="reviewer-name">Landowner: {item.landownerId?.name || 'Unknown'}</span>
                      <span className="reviewer-email">{item.landownerId?.email || ''}</span>
                    </div>
                    <div className="feedback-date">
                      Submitted: {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    {item.paymentId && (
                      <div className="payment-info">
                        Payment: ₹{item.paymentId.amount}
                        {item.paymentId.receiptNumber && (
                          <span> (Receipt: {item.paymentId.receiptNumber})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
} 