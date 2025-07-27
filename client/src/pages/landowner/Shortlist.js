import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Shortlist.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Shortlist() {
  const [job, setJob] = useState(null);
  const [contractors, setContractors] = useState({});
  const [loading, setLoading] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const query = useQuery();
  const jobId = query.get('jobId');
  const navigate = useNavigate();

  // Fetch all jobs for the landowner
  useEffect(() => {
    if (!jobId) {
      setLoadingJobs(true);
      axios
        .get(`${process.env.REACT_APP_API_URL}/landowner/jobs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => {
          // Filter jobs that have AI shortlists
          const jobsWithShortlists = res.data.filter(job => 
            job.aiShortlistGenerated && job.aiShortlistScores && job.aiShortlistScores.length > 0
          );
          setMyJobs(jobsWithShortlists);
        })
        .catch(err => console.error('Error fetching jobs:', err))
        .finally(() => setLoadingJobs(false));
    }
  }, [jobId]);

  // Fetch specific job if jobId is provided
  useEffect(() => {
    if (jobId) {
      setLoading(true);
      axios
        .get(`${process.env.REACT_APP_API_URL}/landowner/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(res => setJob(res.data))
        .catch(err => {
          console.error('Error fetching job:', err);
          // If job not found, redirect to jobs list
          if (err.response?.status === 404) {
            navigate('/landowner/shortlist');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [jobId, navigate]);

  // Fetch contractor profiles
  useEffect(() => {
    if (job && job.aiShortlistScores) {
      job.aiShortlistScores.forEach(item => {
        if (!item.contractorId) {
          console.error('Undefined contractorId in aiShortlistScores item:', item);
          return;
        }
        if (!contractors[item.contractorId]) {
          axios
            .get(`${process.env.REACT_APP_API_URL}/contractor/profile/${item.contractorId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            .then(res => {
              setContractors(prev => ({ ...prev, [item.contractorId]: res.data }));
            })
            .catch(() => {
              setContractors(prev => ({ ...prev, [item.contractorId]: { name: 'Not found' } }));
            });
        }
      });
    }
    // eslint-disable-next-line
  }, [job]);

  const selectContractor = async (contractorId) => {
    if (!window.confirm('Are you sure you want to select this contractor?')) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/landowner/select-contractor`,
        { jobId: job._id, contractorId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Refetch job to update UI
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/landowner/jobs/${job._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setJob(res.data);
      alert('Contractor selected successfully! Job is now in progress.');
      // Redirect to job progress page
      navigate('/landowner/progress');
    } catch (err) {
      console.error('Error selecting contractor:', err);
      alert('Failed to select contractor. Please try again.');
    }
  };

  const viewJobShortlist = (jobId) => {
    navigate(`/landowner/shortlist?jobId=${jobId}`);
  };

  // Show jobs list if no specific job is selected
  if (!jobId) {
    if (loadingJobs) return <div className="loading">Loading your jobs...</div>;
    
    if (myJobs.length === 0) {
      return (
        <div className="shortlist-container">
          <h2>AI Shortlists</h2>
          <p>No jobs with AI shortlists found. Post a new job to get started!</p>
          <button onClick={() => navigate('/landowner/post')} className="btn-primary">
            Post New Job
          </button>
        </div>
      );
    }

    return (
      <div className="shortlist-container">
        <h2>Your Jobs with AI Shortlists</h2>
        <div className="jobs-grid">
          {myJobs.map(job => (
            <div key={job._id} className="job-card">
              <h3>{job.title}</h3>
              <p><strong>Work Type:</strong> {job.workType}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>AI Shortlist:</strong> {job.aiShortlistScores?.length || 0} contractors</p>
              <p><strong>Status:</strong> {job.selectedContractor ? 'Contractor Selected' : 'Open for Selection'}</p>
              <button 
                onClick={() => viewJobShortlist(job._id)}
                className="btn-primary"
                disabled={job.selectedContractor}
              >
                {job.selectedContractor ? 'View Selection' : 'View Shortlist'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show specific job shortlist
  if (loading || !job) return <div className="loading">Loading shortlist...</div>;

  if (job.selectedContractor) {
    return (
      <div className="shortlist-container">
        <h2>Selected Contractor for: {job.title}</h2>
        <div className="selected-contractor">
          <h3>Selected Contractor:</h3>
          <p>
            {contractors[job.selectedContractor]
              ? contractors[job.selectedContractor].name
              : job.selectedContractor}
          </p>
        </div>
        <button onClick={() => navigate('/landowner/shortlist')} className="btn-secondary">
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="shortlist-container">
      <h2>AI Shortlist for: {job.title}</h2>
      <div className="job-details">
        <p><strong>Work Type:</strong> {job.workType}</p>
        <p><strong>Location:</strong> {job.location}</p>
        {/* <p><strong>Budget:</strong> ₹{job.budget?.toLocaleString()}</p> */}
      </div>
      
      {job.aiShortlistGenerated && job.aiShortlistScores && job.aiShortlistScores.length > 0 ? (
        <div className="shortlist-grid">
          {job.aiShortlistScores.map((item, index) => (
            <div key={item.contractorId || index} className="contractor-card">
              <h3>#{index + 1} - {contractors[item.contractorId]?.name || 'Loading...'}</h3>
              <p><strong>Score:</strong> {item.overallScore?.toFixed(2) || 'N/A'}</p>
              {/* Estimated Cost Display */}
              {item.estimatedCost !== undefined && item.estimatedCost !== null ? (
                <p><strong>Estimated Cost:</strong> ₹{item.estimatedCost.toLocaleString()}</p>
              ) : (
                <p style={{color: '#888'}}><strong>Estimated Cost:</strong> Not available</p>
              )}
              {contractors[item.contractorId] && (
                <div className="contractor-details">
                  <p><strong>Email:</strong> {contractors[item.contractorId].email}</p>
                  <p><strong>Phone:</strong> {contractors[item.contractorId].phone}</p>
                  {contractors[item.contractorId].profile && (
                    <p><strong>Experience:</strong> {contractors[item.contractorId].profile.experience}</p>
                  )}
                </div>
              )}
              <button 
                onClick={() => selectContractor(item.contractorId)}
                className="btn-primary"
              >
                Select This Contractor
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-shortlist">
          <p>No shortlist available or still generating...</p>
          <p>Please wait a moment and refresh the page.</p>
        </div>
      )}
      
      <button onClick={() => navigate('/landowner/shortlist')} className="btn-secondary">
        Back to Jobs
      </button>
    </div>
  );
}