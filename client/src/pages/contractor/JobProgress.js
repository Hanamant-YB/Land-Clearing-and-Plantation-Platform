// client/src/pages/contractor/JobProgress.js
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './JobProgress.css';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';

export default function JobProgress() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedJobs();
  }, []);

  const fetchAssignedJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching assigned jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/contractor/assigned-jobs/${jobId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Refresh the jobs list
      fetchAssignedJobs();
      alert(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="job-progress-container">
          <div className="loading">Loading your assigned jobs...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="job-progress-container">
        <div className="header">
          <h2>My Assigned Jobs</h2>
          <p>Track and update the status of your assigned jobs</p>
        </div>

        {jobs.length === 0 ? (
          <div className="no-jobs">
            <h3>No Assigned Jobs</h3>
            <p>You don't have any jobs assigned to you yet.</p>
            <button 
              onClick={() => navigate('/contractor/jobs')}
              className="btn-primary"
            >
              Browse Available Jobs
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

                <div className="landowner-section">
                  <h4>Job Posted By</h4>
                  <div className="landowner-info">
                    <div className="landowner-details">
                      <p><strong>Name:</strong> {job.postedBy.name}</p>
                      <p><strong>Email:</strong> {job.postedBy.email}</p>
                      <p><strong>Phone:</strong> {job.postedBy.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="job-description">
                  <h4>Job Description</h4>
                  <p>{job.description}</p>
                </div>

                <div className="job-actions">
                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => updateJobStatus(job._id, 'completed')}
                      className="btn-success"
                    >
                      Mark as Completed
                    </button>
                  )}
                  
                  {job.status === 'open' && (
                    <button
                      onClick={() => updateJobStatus(job._id, 'in_progress')}
                      className="btn-primary"
                    >
                      Start Work
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/contractor/assignments`)}
                    className="btn-secondary"
                  >
                    View All Assignments
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}