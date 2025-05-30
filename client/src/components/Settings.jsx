import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { 
  FaUser, 
  FaPalette, 
  FaBell, 
  FaShieldAlt, 
  FaSun,
  FaMoon,
  FaLock,
  FaSignOutAlt,
  FaKey,
  FaLanguage,
  FaFont
} from 'react-icons/fa';
import '../styles/Settings.css';
import Sidebar from './Sidebar';

const Settings = ({ user, setUser, theme, setTheme }) => {
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

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="settings-section">
            <h3>General Settings</h3>
            <div className="settings-content">
              <div className="setting-item">
                <label>
                  <FaUser /> Display Name
                </label>
                <input 
                  type="text" 
                  defaultValue={user?.displayName || ''} 
                  placeholder="Enter your display name"
                />
                <small className="setting-hint">This name will be visible to other users</small>
              </div>
              <div className="setting-item">
                <label>
                  <FaUser /> Email
                </label>
                <input type="email" defaultValue={user?.email || ''} disabled />
                <small className="setting-hint">Email cannot be changed</small>
              </div>
              <div className="setting-item">
                <label>
                  <FaLanguage /> Language
                </label>
                <select>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
                <small className="setting-hint">Select your preferred language</small>
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
                <select>
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
      case 'security':
        return (
          <div className="settings-section">
            <h3>Security</h3>
            <div className="settings-content">
              <div className="setting-item">
                <button className="settings-btn">
                  <FaKey /> Change Password
                </button>
                <small className="setting-hint">Last changed 30 days ago</small>
              </div>
              <div className="setting-item">
                <button className="settings-btn">
                  <FaLock /> Enable Two-Factor Auth
                </button>
                <small className="setting-hint">Add an extra layer of security to your account</small>
              </div>
              <div className="setting-item">
                <button className="settings-btn danger" onClick={handleSignOut}>
                  <FaSignOutAlt /> Sign Out
                </button>
                <small className="setting-hint">Sign out from all devices</small>
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
              <button 
                className={`sidebar-btn ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <FaShieldAlt /> Security
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