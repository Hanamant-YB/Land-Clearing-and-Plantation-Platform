import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AIShortlistWidget.css';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const AIShortlistWidget = ({ jobId, onContractorSelect }) => {
  const { user } = useAuth();
  const [shortlist, setShortlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScores, setShowScores] = useState(false);
  const [job, setJob] = useState(null);
  const query = useLocation().search;

  useEffect(() => {
    if (jobId) {
      fetchShortlist();
    }
  }, [jobId]);

  useEffect(() => {
    if (query) {
      const jobId = new URLSearchParams(query).get('jobId');
      if (jobId) {
        axios
          .get(`${process.env.REACT_APP_API_URL}/landowner/jobs/${jobId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
          .then(res => setJob(res.data))
          .catch(err => console.error(err));
      }
    }
  }, [query]);

  const fetchShortlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-shortlist/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShortlist(data.shortlist);
      } else {
        setError('No AI shortlist available for this job');
      }
    } catch (error) {
      setError('Failed to fetch AI shortlist');
      console.error('Error fetching shortlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShortlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-shortlist/generate/${jobId}?limit=5&includeScores=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShortlist(data.shortlist);
        setError(null);
      } else {
        setError('Failed to generate AI shortlist');
      }
    } catch (error) {
      setError('Failed to generate AI shortlist');
      console.error('Error generating shortlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="ai-widget-loading">
        <div className="loading-spinner"></div>
        <p>AI is analyzing contractors...</p>
      </div>
    );
  }

  return (
    <div className="ai-shortlist-widget">
      <div className="widget-header">
        <div className="widget-title">
          <i className="fas fa-robot"></i>
          <h3>AI Contractor Recommendations</h3>
        </div>
        <div className="widget-controls">
          <label className="score-toggle">
            <input 
              type="checkbox" 
              checked={showScores} 
              onChange={(e) => setShowScores(e.target.checked)}
            />
            Show Scores
          </label>
          <button 
            className="generate-btn"
            onClick={generateShortlist}
            disabled={loading}
          >
            <i className="fas fa-magic"></i>
            Generate New
          </button>
        </div>
      </div>

      {error && (
        <div className="widget-error">
          <p>{error}</p>
          <button 
            className="generate-btn"
            onClick={generateShortlist}
          >
            <i className="fas fa-magic"></i>
            Generate AI Shortlist
          </button>
        </div>
      )}

      {shortlist.length > 0 && (
        <div className="shortlist-container">
          {shortlist.slice(0, 5).map((item, index) => (
            <div key={item.contractor.id} className="contractor-card">
              <div className="contractor-header">
                <div className="rank-badge">#{item.rank}</div>
                <div className="contractor-avatar">
                  <img 
                    src={item.contractor.profile.photo || '/default-avatar.jpg'} 
                    alt={item.contractor.name}
                  />
                </div>
                <div className="contractor-info">
                  <h4>{item.contractor.name}</h4>
                  <div className="contractor-meta">
                    <span className="rating">
                      <i className="fas fa-star"></i>
                      {item.contractor.profile.rating || 0}
                    </span>
                    <span className="jobs">
                      <i className="fas fa-briefcase"></i>
                      {item.contractor.profile.completedJobs || 0} jobs
                    </span>
                    <span className={`availability ${item.contractor.profile.availability?.toLowerCase()}`}>
                      {item.contractor.profile.availability || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {showScores && item.scores && (
                <div className="score-breakdown">
                  <div className="overall-score">
                    <div className="score-circle" style={{ borderColor: getScoreColor(item.scores.overall) }}>
                      <span className="score-number">{item.scores.overall}</span>
                      <span className="score-label">{getScoreLabel(item.scores.overall)}</span>
                    </div>
                  </div>
                  <div className="score-details">
                    <div className="score-item">
                      <span>Skills</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ 
                            width: `${item.scores.skillMatch}%`,
                            backgroundColor: getScoreColor(item.scores.skillMatch)
                          }}
                        ></div>
                        <span>{item.scores.skillMatch}%</span>
                      </div>
                    </div>
                    <div className="score-item">
                      <span>Reliability</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ 
                            width: `${item.scores.reliability}%`,
                            backgroundColor: getScoreColor(item.scores.reliability)
                          }}
                        ></div>
                        <span>{item.scores.reliability}%</span>
                      </div>
                    </div>
                    <div className="score-item">
                      <span>Experience</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ 
                            width: `${item.scores.experience}%`,
                            backgroundColor: getScoreColor(item.scores.experience)
                          }}
                        ></div>
                        <span>{item.scores.experience}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="ai-explanation">
                <p>{item.explanation}</p>
              </div>

              <div className="contractor-skills">
                {item.contractor.profile.skills?.slice(0, 3).map((skill, skillIndex) => (
                  <span key={skillIndex} className="skill-tag">{skill}</span>
                ))}
              </div>

              <div className="contractor-actions">
                <button 
                  className="select-btn"
                  onClick={() => onContractorSelect && onContractorSelect(item.contractor)}
                >
                  <i className="fas fa-check"></i>
                  Select Contractor
                </button>
                <button className="contact-btn">
                  <i className="fas fa-envelope"></i>
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shortlist.length === 0 && !error && (
        <div className="no-shortlist">
          <i className="fas fa-robot"></i>
          <p>No AI recommendations available</p>
          <button 
            className="generate-btn"
            onClick={generateShortlist}
          >
            <i className="fas fa-magic"></i>
            Generate AI Shortlist
          </button>
        </div>
      )}
    </div>
  );
};

export default AIShortlistWidget; 