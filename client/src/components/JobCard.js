import React from 'react';

export default function JobCard({ job, onAction, actionLabel }) {
  return (
    <div style={{border:'1px solid #ccc',padding:'1rem',margin:'1rem 0'}}>
      <h3>{job.title}</h3>
      <p>{job.description}</p>
      {actionLabel && <button onClick={() => onAction(job)}>{actionLabel}</button>}
    </div>
  );
}