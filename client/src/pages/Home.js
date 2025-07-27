import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <>
      {/* 1) Full‑width hero */}
      <section className="full-width hero-section">
        <div className="container">
          <h1>Welcome to Contractor Platform</h1>
          <p>
            Connecting landowners with skilled contractors for seamless
            project management.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="hero-button primary">
              Get Started
            </Link>
            <Link to="/login" className="hero-button secondary">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* 2) Centered Features Section */}
      <section className="container features-section">
        <h2>Why Choose Contractor Platform?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>For Landowners</h3>
            <p>
              Post jobs, shortlist contractors, track progress, and make secure
              payments with ease.
            </p>
          </div>
          <div className="feature-card">
            <h3>For Contractors</h3>
            <p>
              Showcase your skills, bid on projects, and upload progress photos
              to build your reputation.
            </p>
          </div>
          <div className="feature-card">
            <h3>For Admins</h3>
            <p>
              Review jobs, manage users, and ensure smooth operations across
              the platform.
            </p>
          </div>
        </div>
      </section>

      {/* 3) Centered Call-to-Action Section */}
      <section className="container cta-section">
        <h2>Ready to Start Your Project?</h2>
        <p>Join thousands of landowners and contractors already using our platform.</p>
        <Link to="/register" className="cta-button">
          Sign Up Now
        </Link>
      </section>
    </>
  );
}
