import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import '../styles/InvitePage.css';

function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/team/invite/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setInvitation(data);
      } else {
        setError(data.message || 'Invalid invitation');
      }
    } catch (err) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    setAccepting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        // Redirect to login/signup with invitation token
        navigate(`/login?invite=${token}`);
        return;
      }

      const response = await fetch(`http://localhost:5001/api/team/invite/${token}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Success - redirect to dashboard
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="loading-section">
            <FaSpinner className="spinner" />
            <h2>Validating invitation...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-container">
          <div className="error-section">
            <FaTimesCircle className="error-icon" />
            <h2>Invitation Invalid</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-container">
        <div className="invite-header">
          <div className="logo">CollabEase</div>
          <FaCheckCircle className="success-icon" />
          <h1>You're Invited! 🎉</h1>
        </div>
        
        <div className="invite-details">
          <p><strong>{invitation.invitedBy}</strong> has invited you to join their team on CollabEase.</p>
          <p>Email: <strong>{invitation.email}</strong></p>
          
          <div className="invitation-info">
            <p>With CollabEase, you can:</p>
            <ul>
              <li>📋 Manage projects and tasks</li>
              <li>👥 Collaborate with your team</li>
              <li>🎯 Track progress in real-time</li>
              <li>💬 Communicate effectively</li>
            </ul>
          </div>
          
          <div className="expiry-notice">
            <p>⏰ This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="invite-actions">
          <button 
            onClick={acceptInvitation}
            disabled={accepting}
            className="btn-accept"
          >
            {accepting ? (
              <>
                <FaSpinner className="spinner" />
                Accepting...
              </>
            ) : (
              'Accept Invitation & Join Team'
            )}
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="btn-login"
          >
            I already have an account
          </button>
        </div>
        
        <div className="invite-footer">
          <p>Need help? Contact support or learn more about CollabEase.</p>
        </div>
      </div>
    </div>
  );
}

export default InvitePage; 