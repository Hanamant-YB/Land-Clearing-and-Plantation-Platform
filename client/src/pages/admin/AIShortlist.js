import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AIShortlist.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AIShortlist = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScores, setShowScores] = useState(true);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique work types for filter dropdown
  const workTypes = Array.from(new Set(jobs.map(job => job.workType))).filter(Boolean);

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesWorkType = workTypeFilter === 'all' || job.workType === workTypeFilter;
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesWorkType && matchesSearch;
  });

  // Add state to track expanded explanations
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const toggleExplanation = (contractorId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [contractorId]: !prev[contractorId]
    }));
  };

  const [drilldownContractor, setDrilldownContractor] = useState(null);
  const [showDrilldownModal, setShowDrilldownModal] = useState(false);

  const openContractorDrilldown = (contractor) => {
    setDrilldownContractor(contractor);
    setShowDrilldownModal(true);
  };
  const closeDrilldownModal = () => {
    setShowDrilldownModal(false);
    setDrilldownContractor(null);
  };

  // Helper: Get jobs where contractor was shortlisted
  const getJobsForContractor = (contractorId) => {
    return jobs.filter(job => Array.isArray(job.aiShortlisted) && job.aiShortlisted.some(c => (c.$oid || c) === contractorId));
  };

  useEffect(() => {
    fetchJobs();
    fetchAnalytics();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/jobs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      setError('Failed to fetch jobs');
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-shortlist/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const generateShortlist = async (jobId) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-shortlist/generate/${jobId}?limit=10&includeScores=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setShortlist(data.shortlist);
      setSelectedJob(data.job);
      fetchAnalytics(); // Refresh analytics
    } catch (error) {
      setError('Failed to generate AI shortlist');
      console.error('Error generating shortlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShortlist = async (jobId) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ai-shortlist/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setShortlist(data.shortlist);
      setSelectedJob(data.job);
    } catch (error) {
      setError('Failed to fetch shortlist');
      console.error('Error fetching shortlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    if (job.aiShortlistGenerated) {
      await getShortlist(job._id);
    } else {
      setShortlist([]);
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

  // Helper: Export analytics data as CSV
  const exportAnalyticsToCSV = () => {
    if (!analytics) return;
    // Flatten analytics object for CSV
    const rows = [];
    // Overview
    if (analytics.overview) {
      rows.push({ Section: 'Overview', ...analytics.overview });
    }
    // Metrics
    if (analytics.metrics) {
      rows.push({ Section: 'Metrics', ...analytics.metrics });
    }
    // Top Contractors
    if (Array.isArray(analytics.topContractors)) {
      analytics.topContractors.forEach((c, i) => {
        rows.push({ Section: `Top Contractor #${i + 1}`, ...c });
      });
    }
    // Recent Shortlists
    if (Array.isArray(analytics.recentShortlists)) {
      analytics.recentShortlists.forEach((s, i) => {
        rows.push({ Section: `Recent Shortlist #${i + 1}`, ...s });
      });
    }
    // Convert to CSV
    const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Processing AI shortlist...</p>
      </div>
    );
  }

  return (
    <div className="ai-shortlist-container">
      {/* Tabs */}
      <div className="ai-tabs">
        <button 
          className={`ai-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-line"></i>
          Overview
        </button>
        {/* Hide the jobs tab */}
        {false && (
          <button 
            className={`ai-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <i className="fas fa-briefcase"></i>
            Job Shortlists
          </button>
        )}
        <button 
          className={`ai-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fas fa-analytics"></i>
          AI Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          {analytics && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon ai">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div className="stat-content">
                    <h3>AI Shortlists Generated</h3>
                    <div className="stat-number">{analytics.overview.jobsWithAIShortlist}</div>
                    <div className="stat-change positive">
                      {analytics.overview.aiShortlistRate.toFixed(1)}% of total jobs
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon success">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <h3>Success Rate</h3>
                    <div className="stat-number">{analytics.overview.successRate}%</div>
                    <div className="stat-change positive">
                      AI recommendations accepted
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon contractors">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-content">
                    <h3>Total Contractors</h3>
                    <div className="stat-number">{analytics.overview?.totalContractors}</div>
                    <div className="stat-change positive">
                      Available for AI matching
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon score">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="stat-content">
                    <h3>Avg AI Score</h3>
                    <div className="stat-number">{analytics.metrics?.avgAIScore}%</div>
                    <div className="stat-change positive">
                      Across all contractors
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Contractors */}
              <div className="chart-card">
                <h3>Top Performing Contractors (AI Score)</h3>
                <div className="top-contractors-list">
                  {Array.isArray(analytics.topContractors) &&
                    analytics.topContractors
                      .filter(c => typeof c === 'object' && c !== null && !React.isValidElement(c))
                      .map((contractor, index) => (
                        <div key={index} className="contractor-item" style={{ cursor: 'pointer' }} onClick={() => openContractorDrilldown(contractor)}>
                          <div className="contractor-rank">#{index + 1}</div>
                          <div className="contractor-info">
                            <div className="contractor-name">{contractor.name}</div>
                            <div className="contractor-stats">
                              <span>AI Score: {contractor.aiScore}</span>
                              <span>Rating: {contractor.rating}/5</span>
                              <span>Jobs: {contractor.completedJobs}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Recent Shortlists */}
              <div className="chart-card">
                <h3>Recent AI Shortlists</h3>
                <div className="recent-shortlists">
                  {Array.isArray(analytics.recentShortlists) &&
                    analytics.recentShortlists
                      .filter(item => typeof item === 'object' && item !== null && !React.isValidElement(item))
                      .map((item, index) => (
                        <div key={index} className="shortlist-item">
                          <div className="shortlist-info">
                            <div className="job-title">{item.jobTitle}</div>
                            <div className="shortlist-details">
                              <span>Posted by: {item.postedBy}</span>
                              <span>Shortlist size: {item.shortlistSize}</span>
                              <span>Generated: {new Date(item.generatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Jobs Tab - Hidden */}
      {false && activeTab === 'jobs' && (
        <div className="jobs-section">
          <div className="jobs-filters">
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="job-search-input"
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select value={workTypeFilter} onChange={e => setWorkTypeFilter(e.target.value)}>
              <option value="all">All Work Types</option>
              {workTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="jobs-grid">
            <div className="jobs-list">
              <h3>Available Jobs</h3>
              <div className="job-cards">
                {filteredJobs.map(job => {
                  // Determine status
                  let statusLabel = '';
                  let statusClass = '';
                  let statusTooltip = '';
                  if (job.aiShortlistGenerated) {
                    statusLabel = 'Shortlist Ready';
                    statusClass = 'generated';
                    statusTooltip = 'AI shortlist has been generated for this job.';
                    if (job.aiShortlistDate && (Date.now() - new Date(job.aiShortlistDate).getTime()) > 30 * 24 * 60 * 60 * 1000) {
                      statusLabel = 'Outdated';
                      statusClass = 'outdated';
                      statusTooltip = 'AI shortlist may be outdated. Consider regenerating.';
                    }
                  } else {
                    statusLabel = 'Needs Generation';
                    statusClass = 'pending';
                    statusTooltip = 'No AI shortlist has been generated for this job yet.';
                  }
                  return (
                    <div 
                      key={job._id} 
                      className={`job-card ${selectedJob?._id === job._id ? 'selected' : ''}`}
                      onClick={() => handleJobSelect(job)}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="job-card-header">
                        <div className="job-title-type">
                          <span className="job-title">{job.title || job.workType}</span>
                        </div>
                        <span 
                          className={`ai-status ${statusClass}`}
                          data-tip={statusTooltip}
                        >
                          {statusLabel}
                        </span>
                        <ReactTooltip effect="solid" />
                      </div>
                      <div className="job-details-group">
                        <div className="job-detail-row">
                          <span className="job-detail-label">🆔 Job ID:</span>
                          <span className="job-detail-value">{job._id}</span>
                        </div>
                        <div className="job-detail-row">
                          <span className="job-detail-label">📍 Location:</span>
                          <span className="job-detail-value">{job.location}</span>
                        </div>
                        <div className="job-detail-row">
                          <span className="job-detail-label">🗓️ Posted:</span>
                          <span className="job-detail-value">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                        <div className="job-detail-row">
                          <span className="job-detail-label">💰 Budget:</span>
                          <span className="job-detail-value">{job.budget ? `₹${job.budget.toLocaleString()}` : '-'}</span>
                        </div>
                        <div className="job-detail-row">
                          <span className="job-detail-label">🔖 Type:</span>
                          <span className="job-detail-value">{job.workType}</span>
                        </div>
                        <div className="job-detail-row">
                          <span className="job-detail-label">📊 Status:</span>
                          <span className="job-detail-value">{job.status}</span>
                        </div>
                      </div>
                      <div className="job-card-actions">
                        <button
                          className="job-action-btn"
                          onClick={e => { e.stopPropagation(); handleJobSelect(job); }}
                        >
                          View Shortlist
                        </button>
                        <button
                          className="job-action-btn"
                          onClick={e => { e.stopPropagation(); generateShortlist(job._id); }}
                          disabled={!job.aiShortlistGenerated}
                        >
                          Regenerate
                        </button>
                        <button
                          className="job-action-btn"
                          onClick={e => { e.stopPropagation(); /* Add view details logic if needed */ }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shortlist-panel">
              {selectedJob ? (
                <>
                  <div className="shortlist-header">
                    <h3>AI Shortlist for: {selectedJob.title}</h3>
                    <div className="shortlist-controls">
                      <label className="score-toggle">
                        <input 
                          type="checkbox" 
                          checked={showScores} 
                          onChange={(e) => setShowScores(e.target.checked)}
                        />
                        Show Scores
                      </label>
                      {selectedJob.aiShortlistGenerated && (
                        <button 
                          className="regenerate-btn"
                          onClick={() => generateShortlist(selectedJob._id)}
                        >
                          <i className="fas fa-sync-alt"></i>
                          Regenerate
                        </button>
                      )}
                    </div>
                  </div>

                  {shortlist.length > 0 ? (
                    <div className="shortlist-cards">
                      {shortlist.map((item, index) => (
                        <div key={item.contractor.id} className="shortlist-card">
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
                                  <span>Skill Match</span>
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
                                <div className="score-item">
                                  <span>Location</span>
                                  <div className="score-bar">
                                    <div 
                                      className="score-fill" 
                                      style={{ 
                                        width: `${item.scores.location}%`,
                                        backgroundColor: getScoreColor(item.scores.location)
                                      }}
                                    ></div>
                                    <span>{item.scores.location}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="ai-explanation-toggle">
                            <button
                              className="explanation-toggle-btn"
                              onClick={() => toggleExplanation(item.contractor.id)}
                            >
                              {expandedExplanations[item.contractor.id] ? 'Hide Explanation' : 'Show Explanation'}
                            </button>
                          </div>
                          {expandedExplanations[item.contractor.id] && (
                            <div className="ai-explanation">
                              <p>{item.explanation}</p>
                            </div>
                          )}

                          <div className="contractor-skills">
                            {item.contractor.profile.skills?.slice(0, 5).map((skill, skillIndex) => (
                              <span key={skillIndex} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-shortlist">
                      <i className="fas fa-robot"></i>
                      <p>No AI shortlist available for this job</p>
                      <button 
                        className="generate-btn"
                        onClick={() => generateShortlist(selectedJob._id)}
                      >
                        <i className="fas fa-magic"></i>
                        Generate AI Shortlist
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-selection">
                  <i className="fas fa-hand-pointer"></i>
                  <p>Select a job to view its AI shortlist</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-header">
            <button className="export-btn" onClick={exportAnalyticsToCSV}>
              Export Analytics as CSV
            </button>
          </div>
          {analytics && analytics.metrics && analytics.overview && Array.isArray(analytics.topContractors) ? (
            <React.Fragment>
              <div className="analytics-grid">
                <div className="chart-card">
                  <h3>AI Performance Metrics</h3>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-value">{analytics.metrics?.avgAIScore}</div>
                      <div className="metric-label">Average AI Score</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{analytics.metrics?.avgRating}</div>
                      <div className="metric-label">Average Rating</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{analytics.metrics?.avgCompletedJobs}</div>
                      <div className="metric-label">Avg Completed Jobs</div>
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Success Rate Analysis</h3>
                  <div className="success-rate-chart">
                    <div className="rate-circle">
                      <div className="rate-number">{analytics.overview?.successRate}%</div>
                      <div className="rate-label">SUCCESS<br/>RATE</div>
                    </div>
                    <div className="rate-details">
                      <p>AI shortlisted contractors selected by landowners</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h3>Top Contractors by AI Score</h3>
                <div className="top-contractors-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Contractor</th>
                        <th>AI Score</th>
                        <th>Rating</th>
                        <th>Completed Jobs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(analytics.topContractors) &&
                        analytics.topContractors
                          .filter(c => typeof c === 'object' && c !== null && !React.isValidElement(c))
                          .map((contractor, index) => (
                            <tr
                              key={index}
                              style={{ cursor: 'pointer' }}
                              onClick={() => openContractorDrilldown(contractor)}
                              className="clickable-row"
                            >
                              <td>#{index + 1}</td>
                              <td>{contractor.name}</td>
                              <td>
                                <span className="score-badge" style={{ backgroundColor: getScoreColor(contractor.aiScore) }}>
                                  {contractor.aiScore}
                                </span>
                              </td>
                              <td>{contractor.rating}/5</td>
                              <td>{contractor.completedJobs}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </React.Fragment>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No analytics data available for the selected date range.
            </div>
          )}
        </div>
      )}
      {/* Drilldown Modal for Contractor */}
      {showDrilldownModal && drilldownContractor && (
        <div className="modal-overlay">
          <div className="custom-modal">
            <button
              className="custom-modal-close"
              onClick={closeDrilldownModal}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="custom-modal-title">Jobs Shortlisted for {drilldownContractor.name}</div>
            {getJobsForContractor(drilldownContractor._id || drilldownContractor.id).length === 0 ? (
              <div className="custom-modal-message">No jobs found for this contractor.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {getJobsForContractor(drilldownContractor._id || drilldownContractor.id).map(job => (
                    <tr key={job._id.$oid || job._id}>
                      <td>{job.title}</td>
                      <td>{job.status}</td>
                      <td>{job.createdAt && (job.createdAt.$date ? new Date(job.createdAt.$date).toLocaleDateString() : new Date(job.createdAt).toLocaleDateString())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIShortlist; 