import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaymentForm from './PaymentForm';
import FeedbackForm from './FeedbackForm';
import './ActionRequiredJobs.css';

const ActionRequiredJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/landowner/completed-action-required`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJobs(res.data);
      } catch (err) {
        setJobs([]);
      }
      setLoading(false);
    };
    fetchJobs();
  }, [token]);

  const handleContinue = (job) => {
    setSelectedJob(job);
    setLastPaymentId(null);
    if (!job.isPaid) {
      setShowPayment(true);
    } else if (!job.isFeedbackGiven) {
      fetchAndShowFeedback(job);
    }
  };

  const fetchAndShowFeedback = async (job) => {
    // Fetch latest completed payment for the job
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payments/job/${job._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const completed = res.data.find(p => p.status === 'completed');
      if (completed) {
        setLastPaymentId(completed._id);
        setShowFeedback(true);
      } else {
        setLastPaymentId(null);
        setShowFeedback(true); // fallback, but feedback will fail if paymentId is required
      }
    } catch (err) {
      setLastPaymentId(null);
      setShowFeedback(true);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    if (selectedJob) {
      await fetchAndShowFeedback(selectedJob);
    }
    setJobs(jobs => jobs.map(j => j._id === selectedJob._id ? { ...j, isPaid: true } : j));
  };

  const handleFeedbackSuccess = () => {
    setShowFeedback(false);
    setJobs(jobs => jobs.filter(j => j._id !== selectedJob._id));
  };

  if (loading) return <div className="arj-loading">Loading action required jobs...</div>;
  if (jobs.length === 0) return null;

  return (
    <div className="arj-section">
      <h2 className="arj-title">Action Required: Complete Payment & Feedback</h2>
      <div className="arj-job-list">
        {jobs.map(job => (
          <div key={job._id} className="arj-job-card">
            <div className="arj-job-header">
              <img
                src={job.selectedContractor?.profile?.photo || '/default-avatar.jpg'}
                alt={job.selectedContractor?.name || 'Contractor'}
                className="arj-contractor-avatar"
              />
              <div className="arj-job-info">
                <h4 className="arj-job-title">{job.title}</h4>
                <div className="arj-contractor-name">Contractor: {job.selectedContractor?.name}</div>
                <div className="arj-job-budget">
                  Budget: {(() => {
                    if (job.aiShortlistScores && job.selectedContractor) {
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
                    return 'Not specified';
                  })()}
                </div>
                <div className="arj-job-location">Location: {job.location}</div>
              </div>
              <div className="arj-status-chip" style={{background: job.isPaid ? (job.isFeedbackGiven ? '#4caf50' : '#ff9800') : '#f44336'}}>
                {job.isPaid ? (job.isFeedbackGiven ? 'Done' : 'Awaiting Feedback') : 'Awaiting Payment'}
              </div>
            </div>
            <div className="arj-actions">
              <button className="arj-continue-btn" onClick={() => handleContinue(job)}>
                {job.isPaid ? (job.isFeedbackGiven ? 'Completed' : 'Leave Feedback') : 'Pay Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <PaymentForm
        job={selectedJob}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSubmitSuccess={handlePaymentSuccess}
      />
      <FeedbackForm
        job={selectedJob}
        paymentId={lastPaymentId}
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmitSuccess={handleFeedbackSuccess}
      />
    </div>
  );
};

export default ActionRequiredJobs; 