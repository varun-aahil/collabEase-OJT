import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <h1 className="landing-title">CollabEase</h1>
          <nav className="landing-nav">
            <Link to="/login" className="landing-nav-btn">Login</Link>
            <Link to="/register" className="landing-nav-btn primary">Sign Up</Link>
          </nav>
        </div>
      </header>
      <section className="hero-section">
        <div className="container">
          <h2 className="hero-title">Looking For The Most Efficient Task Management System?</h2>
          <p className="hero-subtitle">Start working with CollabEase – a modern platform to assign, track, and analyze your team's tasks and projects.</p>
          <div className="hero-actions">
            <Link to="/register" className="cta-btn primary">Get Started Free</Link>
            <Link to="/login" className="cta-btn">Login</Link>
          </div>
        </div>
      </section>
      <section className="features-section">
        <div className="container">
          <h3 className="section-title">Why CollabEase?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Scheduled Tasks</h4>
              <p>Assign daily, weekly, and monthly tasks to your team with clear deadlines.</p>
            </div>
            <div className="feature-card">
              <h4>Easy Follow-ups</h4>
              <p>Monitor progress and get instant feedback from your team, all in one place.</p>
            </div>
            <div className="feature-card">
              <h4>Employee Analysis</h4>
              <p>Track performance and motivate your team with transparent analytics.</p>
            </div>
            <div className="feature-card">
              <h4>HR Decisions</h4>
              <p>Make informed decisions on promotions, appraisals, and retention with detailed reports.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="how-section">
        <div className="container">
          <h3 className="section-title">How It Works</h3>
          <ol className="how-list">
            <li>Managers assign tasks and set deadlines from the web app.</li>
            <li>Team members view and update tasks from any device.</li>
            <li>Progress is tracked in real-time, with instant notifications.</li>
            <li>Managers review, approve, and analyze completed tasks.</li>
          </ol>
        </div>
      </section>
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-brand">CollabEase</div>
          <div className="footer-contact">
            <span>Contact: info@collabease.com</span>
            <span>Phone: +91-9000000000</span>
          </div>
          <div className="footer-copy">&copy; {new Date().getFullYear()} CollabEase. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default Landing; 