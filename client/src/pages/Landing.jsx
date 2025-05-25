import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import '../styles/Landing.css';

function Landing() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    // Test if Firebase auth is initialized
    const unsubscribe = auth.onAuthStateChanged(
      () => {
        setFirebaseInitialized(true);
        console.log('Firebase Auth initialized successfully');
      },
      (error) => {
        console.error('Firebase Auth error:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1>CollabEase</h1>
        <p>Simplify team collaboration and project management</p>
        {firebaseInitialized ? (
          <span className="firebase-status success">Firebase connected ✓</span>
        ) : (
          <span className="firebase-status error">Firebase connecting...</span>
        )}
      </div>
      <div className="cta-buttons">
        <Link to="/login" className="cta-button login">Login</Link>
        <Link to="/register" className="cta-button register">Register</Link>
      </div>
      <div className="landing-features">
        <div className="feature">
          <h3>Seamless Collaboration</h3>
          <p>Work together with your team in real-time</p>
        </div>
        <div className="feature">
          <h3>Project Management</h3>
          <p>Track and manage your projects efficiently</p>
        </div>
        <div className="feature">
          <h3>Task Organization</h3>
          <p>Organize tasks and stay on top of deadlines</p>
        </div>
      </div>
    </div>
  );
}

export default Landing; 