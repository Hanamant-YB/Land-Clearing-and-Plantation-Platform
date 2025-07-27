// client/src/pages/contractor/Assignments.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './Assignments.css';
import Navbar from '../../components/Navbar';

export default function Assignments() {
  const { token, user } = useContext(AuthContext);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [aiShortlistedJobs, setAiShortlistedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobs();
  }, [activeTab]);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'assigned') {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAssignedJobs(res.data);
      } else {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/contractor/ai-shortlisted`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAiShortlistedJobs(res.data);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs/${jobId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Job status updated successfully!');
      loadJobs(); // Refresh the list
    } catch (error) {
      console.error('Error updating job status:', error);
      alert(error.response?.data?.message || 'Failed to update job status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatBudget = (budget) => {
    return budget ? `$${Number(budget).toLocaleString()}` : 'Not specified';
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'open': 'status-open',
      'in_progress': 'status-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return `status-badge ${statusClasses[status] || 'status-open'}`;
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusTexts[status] || 'Open';
  };

  return (
    <>
      <Navbar />
      <div className="assignments-page">
        <h2>My Assignments</h2>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned Jobs ({assignedJobs.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ai-shortlisted' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-shortlisted')}
          >
            AI Shortlisted ({aiShortlistedJobs.length})
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="jobs-container">
            {activeTab === 'assigned' ? (
              // Assigned Jobs Tab
              <div className="jobs-grid">
                {assignedJobs.length === 0 ? (
                  <div className="no-jobs">
                    <p>You don't have any assigned jobs yet.</p>
                    <p>Jobs will appear here once landowners select you for their projects.</p>
                  </div>
                ) : (
                  assignedJobs.map(job => (
                    <div key={job._id} className="job-card assigned">
                      <div className="job-header">
                        <h3>{job.title}</h3>
                        <span className={getStatusBadge(job.status)}>
                          {getStatusText(job.status)}
                        </span>
                      </div>
                      
                      <div className="job-details">
                        <p><strong>Description:</strong> {job.description}</p>
                        <p><strong>Work Type:</strong> {job.workType}</p>
                        <p><strong>Location:</strong> {job.location}</p>
                        <p><strong>Land Size:</strong> {job.landSize} acres</p>
                        <p><strong>Budget:</strong> {(() => {
                          if (job.aiShortlistScores && user) {
                            const myScore = job.aiShortlistScores.find(
                              score =>
                                score.contractorId &&
                                (score.contractorId._id === user._id ||
                                 score.contractorId === user._id ||
                                 score.contractorId === user.id)
                            );
                            if (myScore && myScore.estimatedCost) {
                              return `₹${myScore.estimatedCost.toLocaleString()}`;
                            }
                          }
                          return 'Not specified';
                        })()}</p>
                        <p><strong>Start Date:</strong> {formatDate(job.startDate)}</p>
                        <p><strong>End Date:</strong> {formatDate(job.endDate)}</p>
                        <p><strong>Landowner:</strong> {job.postedBy?.name}</p>
                        <p><strong>Contact:</strong> {job.postedBy?.email}</p>
                        {job.postedBy?.phone && (
                          <p><strong>Phone:</strong> {job.postedBy.phone}</p>
                        )}
                      </div>

                      {job.images && job.images.length > 0 && (
                        <div className="job-images">
                          <h4>Job Images:</h4>
                          <div className="image-gallery">
                            {job.images.slice(0, 3).map((image, index) => (
                              <img 
                                key={index} 
                                src={image} 
                                alt={`Job image ${index + 1}`}
                                onClick={() => window.open(image, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="job-actions">
                        {job.status === 'open' && (
                          <button 
                            onClick={() => handleUpdateStatus(job._id, 'in_progress')}
                            className="btn-start"
                          >
                            Start Work
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // AI Shortlisted Jobs Tab
              <div className="jobs-grid">
                {aiShortlistedJobs.length === 0 ? (
                  <div className="no-jobs">
                    <p>You haven't been AI shortlisted for any jobs yet.</p>
                    <p>Keep your profile updated to increase your chances of being shortlisted!</p>
                  </div>
                ) : (
                  aiShortlistedJobs.map(job => (
                    <div key={job._id} className="job-card shortlisted">
                      <div className="job-header">
                        <h3>{job.title}</h3>
                        <span className="status-badge status-shortlisted">
                          AI Shortlisted
                        </span>
                      </div>
                      
                      <div className="job-details">
                        <p><strong>Description:</strong> {job.description}</p>
                        <p><strong>Work Type:</strong> {job.workType}</p>
                        <p><strong>Location:</strong> {job.location}</p>
                        <p><strong>Land Size:</strong> {job.landSize} acres</p>
                        <p><strong>Budget:</strong> {formatBudget(job.budget)}</p>
                        <p><strong>Start Date:</strong> {formatDate(job.startDate)}</p>
                        <p><strong>End Date:</strong> {formatDate(job.endDate)}</p>
                        <p><strong>Landowner:</strong> {job.postedBy?.name}</p>
                        <p><strong>Contact:</strong> {job.postedBy?.email}</p>
                        {job.postedBy?.phone && (
                          <p><strong>Phone:</strong> {job.postedBy.phone}</p>
                        )}
                      </div>

                      {job.images && job.images.length > 0 && (
                        <div className="job-images">
                          <h4>Job Images:</h4>
                          <div className="image-gallery">
                            {job.images.slice(0, 3).map((image, index) => (
                              <img 
                                key={index} 
                                src={image} 
                                alt={`Job image ${index + 1}`}
                                onClick={() => window.open(image, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="job-actions">
                        <p className="shortlist-notice">
                          🎉 You've been AI shortlisted for this job! 
                          The landowner will review and may select you for this project.
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}