import React, { useState } from 'react';
import './DisputeModal.css';

const DisputeModal = ({ isOpen, onClose, onSubmit, jobId, userRole }) => {
  const [disputeForm, setDisputeForm] = useState({
    issueType: 'quality_issue',
    title: '',
    description: '',
    severity: 'medium',
    photos: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let photoUrls = [];
      if (disputeForm.photos.length > 0) {
        const formData = new FormData();
        Array.from(disputeForm.photos).forEach(file => {
          formData.append('photos', file);
        });

        const uploadResponse = await fetch('/api/photo/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrls = uploadData.urls;
        }
      }

      const response = await fetch(`/api/work-progress/${jobId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...disputeForm,
          photos: photoUrls
        })
      });

      if (response.ok) {
        onSubmit();
        setDisputeForm({
          issueType: 'quality_issue',
          title: '',
          description: '',
          severity: 'medium',
          photos: []
        });
        onClose();
      }
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Error submitting dispute');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dispute-modal-overlay">
      <div className="dispute-modal">
        <div className="dispute-modal-header">
          <h2>Report Dispute/Issue</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="dispute-form">
          <div className="form-group">
            <label>Issue Type</label>
            <select
              value={disputeForm.issueType}
              onChange={(e) => setDisputeForm({...disputeForm, issueType: e.target.value})}
              required
            >
              <option value="quality_issue">Quality Issue</option>
              <option value="delay">Delay</option>
              <option value="communication">Communication</option>
              <option value="payment">Payment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={disputeForm.title}
              onChange={(e) => setDisputeForm({...disputeForm, title: e.target.value})}
              placeholder="Brief title of the issue"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={disputeForm.description}
              onChange={(e) => setDisputeForm({...disputeForm, description: e.target.value})}
              placeholder="Detailed description of the issue..."
              required
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Severity</label>
            <select
              value={disputeForm.severity}
              onChange={(e) => setDisputeForm({...disputeForm, severity: e.target.value})}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Supporting Photos (Optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setDisputeForm({...disputeForm, photos: Array.from(e.target.files)})}
            />
            <small>Upload photos to support your claim</small>
          </div>

          <div className="dispute-form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Submit Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal; 