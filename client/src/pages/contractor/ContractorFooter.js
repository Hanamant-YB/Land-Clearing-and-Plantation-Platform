import React from 'react';
import './ContractorFooter.css';

export default function ContractorFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="contractor-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>🌱 Contractor Platform</h4>
          <p>Empowering skilled contractors for exceptional agricultural and land management services.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/contractor/home">🏠 Dashboard</a></li>
            <li><a href="/contractor/assignments">📋 Assignments</a></li>
            <li><a href="/contractor/work-management">🛠️ Work Management</a></li>
            <li><a href="/contractor/payments">💳 Payments</a></li>
            <li><a href="/contractor/feedback">⭐ Feedback</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Services</h4>
          <ul>
            <li>🌾 Land Clearing</li>
            <li>🌱 Plantation</li>
            <li>🌿 Landscaping</li>
            <li>💧 Irrigation</li>
            <li>🌳 Tree Planting</li>
            <li>🌿 Maintenance</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <div className="contact-info">
            <p>📧 support@contractorplatform.com</p>
            <p>📞 +1 (555) 123-4567</p>
            <p>📍 123 Green Valley, Nature City</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} Contractor Platform. All rights reserved.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 