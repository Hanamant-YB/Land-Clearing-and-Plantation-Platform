import React from 'react';
import './LandownerFooter.css';

export default function LandownerFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landowner-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Contractor Platform</h4>
          <p>Connecting skilled contractors with property owners for quality agricultural and land management services.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/landowner/home">Dashboard</a></li>
            <li><a href="/landowner/post">Post Job</a></li>
            <li><a href="/landowner/shortlist">Shortlist</a></li>
            <li><a href="/landowner/progress">Progress</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Our Services</h4>
          <ul>
            <li>🌾 Plowing</li>
            <li>🌾 Harvesting</li>
            <li>💧 Irrigation</li>
            <li>🌱 Weeding</li>
            <li>🌱 Planting</li>
            <li>🌿 Fertilizing</li>
            <li>🐛 Pest Control</li>
            <li>🌳 Landscaping</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Info</h4>
          <div className="contact-info">
            <p>📧 support@contractorplatform.com</p>
            <p>📞 +1 (555) 123-4567</p>
            <p>📍 123 Construction Ave, Building City</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} Contractor Platform. All rights reserved.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 