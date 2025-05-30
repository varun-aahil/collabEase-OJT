import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { 
  FaUser, 
  FaPalette, 
  FaBell, 
  FaSun,
  FaMoon,
  FaFont,
  FaExternalLinkAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import '../styles/Settings.css';
import Sidebar from './Sidebar';

const Settings = ({ user, setUser, theme, setTheme, fontSize, setFontSize }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true
  });

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleFontSizeChange = (e) => {
    const newFontSize = e.target.value;
    setFontSize(newFontSize);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="settings-section">
            <h3>General Settings</h3>
            <div className="settings-content">
              <div className="setting-item">
                <label>
                  <FaUser /> Profile Information
                </label>
                <p className="setting-description">
                  To change your name, update security settings, and manage your profile information, please visit your profile page.
                </p>
                <Link to="/profile" className="settings-link-btn">
                  <FaExternalLinkAlt /> Go to Profile
                </Link>
              </div>
              <div className="setting-item">
                <label>
                  <FaUser /> Email
                </label>
                <input type="email" defaultValue={user?.email || ''} disabled />
                <small className="setting-hint">Email cannot be changed</small>
              </div>
              <div className="setting-item">
                <button className="settings-btn danger" onClick={handleSignOut}>
                  <FaSignOutAlt /> Sign Out
                </button>
                <small className="setting-hint">Sign out from your account</small>
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="settings-content">
              <div className="setting-item">
                <label>
                  <FaPalette /> Theme
                </label>
                <div className="theme-options">
                  <button 
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <FaSun /> Light
                  </button>
                  <button 
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <FaMoon /> Dark
                  </button>
                </div>
                <small className="setting-hint">Choose your preferred theme</small>
              </div>
              <div className="setting-item">
                <label>
                  <FaFont /> Font Size
                </label>
                <select value={fontSize} onChange={handleFontSizeChange}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                <small className="setting-hint">Adjust the text size to your preference</small>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="settings-section">
            <h3>Notifications</h3>
            <div className="settings-content">
              <div className="setting-item">
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  <span className="toggle-text">Email Notifications</span>
                </label>
                <small className="setting-hint">Receive email updates about your account activity</small>
              </div>
              <div className="setting-item">
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  <span className="toggle-text">Push Notifications</span>
                </label>
                <small className="setting-hint">Get instant notifications in your browser</small>
              </div>
              <div className="setting-item">
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={notifications.tasks}
                    onChange={() => handleNotificationChange('tasks')}
                  />
                  <span className="toggle-text">Task Reminders</span>
                </label>
                <small className="setting-hint">Receive reminders for upcoming tasks</small>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar user={user} setUser={setUser} />
      <div className="dashboard-main">
        <div className="settings-page">
          <div className="settings-header">
            <h2>Settings</h2>
          </div>
          
          <div className="settings-container">
            <div className="settings-sidebar">
              <button 
                className={`sidebar-btn ${activeSection === 'general' ? 'active' : ''}`}
                onClick={() => setActiveSection('general')}
              >
                <FaUser /> General
              </button>
              <button 
                className={`sidebar-btn ${activeSection === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveSection('appearance')}
              >
                <FaPalette /> Appearance
              </button>
              <button 
                className={`sidebar-btn ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                <FaBell /> Notifications
              </button>
            </div>
            <div className="settings-main">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 