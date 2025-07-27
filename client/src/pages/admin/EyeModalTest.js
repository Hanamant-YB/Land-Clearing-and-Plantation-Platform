import React, { useState } from 'react';
import { Eye } from 'lucide-react';

export default function EyeModalTest() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ padding: 40 }}>
      <button
        className="action-btn"
        title="Open Modal"
        onClick={() => setShowModal(true)}
        style={{ fontSize: 24, padding: 10, border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
      >
        <Eye size={32} />
      </button>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 40, borderRadius: 12, minWidth: 300, textAlign: 'center' }}>
            <h2>Modal Opened!</h2>
            <p>This is a test modal opened by clicking the Eye icon.</p>
            <button onClick={() => setShowModal(false)} style={{ marginTop: 20, padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
} 