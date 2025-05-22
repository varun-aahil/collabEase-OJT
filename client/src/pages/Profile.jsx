import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'login',
      description: 'Logged in from Chrome on Windows',
      timestamp: '2024-03-20T10:30:00',
      location: 'New York, USA',
      device: 'Chrome on Windows'
    },
    {
      id: 2,
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: '2024-03-19T15:45:00',
      location: 'New York, USA',
      device: 'Chrome on Windows'
    },
    {
      id: 3,
      type: 'login',
      description: 'Logged in from Safari on iPhone',
      timestamp: '2024-03-18T09:15:00',
      location: 'New York, USA',
      device: 'Safari on iPhone'
    }
  ]);
  const [loginStats, setLoginStats] = useState({
    totalLogins: 156,
    lastLogin: '2024-03-20T10:30:00',
    activeSessions: 2,
    loginMethods: {
      email: 120,
      google: 25,
      github: 11
    }
  });
  const [userPhoto, setUserPhoto] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
      document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    }

    // Fetch user profile photo
    const fetchUserPhoto = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserPhoto(data.photo || null);
        }
      } catch (error) {
        console.error('Error fetching user photo:', error);
      }
    };

    fetchUserPhoto();
  }, [user, navigate]);

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert("New passwords don't match");
      return;
    }
    try {
      const response = await axios.post('/api/users/security/update', securitySettings, {
        withCredentials: true
      });
      setShowSecurityModal(false);
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: securitySettings.twoFactorEnabled
      });
      // Add new activity
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'password_change',
        description: 'Password changed successfully',
        timestamp: new Date().toISOString(),
        location: 'Current Location',
        device: navigator.userAgent
      }, ...prev]);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update security settings');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await axios.post('/api/auth/logout-all', {}, {
        withCredentials: true
      });
      setLoginStats(prev => ({
        ...prev,
        activeSessions: 1
      }));
      // Add new activity
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'logout_all',
        description: 'Logged out from all other devices',
        timestamp: new Date().toISOString(),
        location: 'Current Location',
        device: navigator.userAgent
      }, ...prev]);
    } catch (error) {
      alert('Failed to logout from all devices');
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="profile-image-large" />
          ) : (
            <div className="profile-initial-large">
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </div>
          )}
          <div className="profile-details">
            <h1>{user?.name || 'User'}</h1>
            <p>{user?.email}</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-button theme-toggle" 
            onClick={handleThemeToggle}
            title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i className={`fas fa-${isDarkTheme ? 'sun' : 'moon'}`}></i>
          </button>
          <Link to="/dashboard" className="back-btn">
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <div className="section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <button className="security-btn" onClick={() => setShowSecurityModal(true)}>
              <i className="fas fa-shield-alt"></i>
              Security Settings
            </button>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <i className={`fas fa-${activity.type === 'login' ? 'sign-in-alt' : 
                    activity.type === 'password_change' ? 'key' : 
                    activity.type === 'logout_all' ? 'sign-out-alt' : 'circle'}`}></i>
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <div className="activity-details">
                    <span><i className="fas fa-clock"></i> {new Date(activity.timestamp).toLocaleString()}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {activity.location}</span>
                    <span><i className="fas fa-desktop"></i> {activity.device}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Login Statistics</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <i className="fas fa-sign-in-alt"></i>
              <div className="stat-info">
                <h3>Total Logins</h3>
                <p>{loginStats.totalLogins}</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-clock"></i>
              <div className="stat-info">
                <h3>Last Login</h3>
                <p>{new Date(loginStats.lastLogin).toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-users"></i>
              <div className="stat-info">
                <h3>Active Sessions</h3>
                <p>{loginStats.activeSessions}</p>
              </div>
            </div>
          </div>
          <div className="login-methods">
            <h3>Login Methods</h3>
            <div className="method-bars">
              <div className="method-bar">
                <span>Email</span>
                <div className="bar-container">
                  <div className="bar" style={{ width: `${(loginStats.loginMethods.email / loginStats.totalLogins) * 100}%` }}></div>
                </div>
                <span>{loginStats.loginMethods.email}</span>
              </div>
              <div className="method-bar">
                <span>Google</span>
                <div className="bar-container">
                  <div className="bar" style={{ width: `${(loginStats.loginMethods.google / loginStats.totalLogins) * 100}%` }}></div>
                </div>
                <span>{loginStats.loginMethods.google}</span>
              </div>
              <div className="method-bar">
                <span>GitHub</span>
                <div className="bar-container">
                  <div className="bar" style={{ width: `${(loginStats.loginMethods.github / loginStats.totalLogins) * 100}%` }}></div>
                </div>
                <span>{loginStats.loginMethods.github}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSecurityModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Security Settings</h2>
            <form onSubmit={handleSecurityUpdate}>
              <div className="security-section">
                <h3>Change Password</h3>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={securitySettings.currentPassword}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    currentPassword: e.target.value
                  })}
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={securitySettings.newPassword}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    newPassword: e.target.value
                  })}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={securitySettings.confirmPassword}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    confirmPassword: e.target.value
                  })}
                  required
                />
              </div>
              <div className="security-section">
                <h3>Two-Factor Authentication</h3>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorEnabled}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      twoFactorEnabled: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                  Enable 2FA
                </label>
              </div>
              <div className="security-section">
                <h3>Active Sessions</h3>
                <p>Current active sessions: {loginStats.activeSessions}</p>
                <button type="button" className="danger-btn" onClick={handleLogoutAllDevices}>
                  Logout from all other devices
                </button>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowSecurityModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile; 