import React from 'react';
import './ContractorProfileModal.css';

export default function ContractorProfileModal({ contractor, onClose }) {
  if (!contractor) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="profile-header">
          <img src={contractor.profile.photo || '/default-avatar.jpg'} alt={contractor.name} />
          <h2>{contractor.name}</h2>
          <p>{contractor.profile.bio}</p>
        </div>
        <div className="profile-details">
          <p><strong>Rating:</strong> {contractor.profile.rating || 0}/5</p>
          <p><strong>Completed Jobs:</strong> {contractor.profile.completedJobs || 0}</p>
          <p><strong>Skills:</strong> {contractor.profile.skills?.join(', ')}</p>
        </div>
      </div>
    </div>
  );
}