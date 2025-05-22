import React, { useState } from 'react';
import '../styles/Topbar.css';

function Topbar({ user, userPhoto, notifications = [], onProfile, onLogout, onSearch }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };
  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
  };
  const handleClickOutside = (event) => {
    if (event.target.closest('.logout-btn')) return;
    if (showProfile && !event.target.closest('.profile-container')) setShowProfile(false);
    if (showNotifications && !event.target.closest('.notifications-container')) setShowNotifications(false);
  };
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfile, showNotifications]);

  return (
    <header className="topbar fixed-topbar">
      <div className="search-container">
        <input type="text" className="search-input" placeholder="Search projects, tasks, and team..." onChange={onSearch} />
      </div>
      <div className="topbar-actions">
        <button className="icon-button" onClick={handleNotificationsClick} title="Notifications">
          <i className="fas fa-bell"></i>
          {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
        </button>
        <div className="profile-container">
          <button className="icon-button profile-btn" onClick={handleProfileClick} title="Profile">
            {userPhoto ? (
              <img src={userPhoto} alt="Profile" className="profile-image" />
            ) : (
              <span className="profile-initial">{user?.name?.charAt(0) || user?.email?.charAt(0)}</span>
            )}
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-info">
                {userPhoto ? (
                  <img src={userPhoto} alt="Profile" className="profile-image-large" />
                ) : (
                  <div className="profile-initial-large">{user?.name?.charAt(0) || user?.email?.charAt(0)}</div>
                )}
                <h3>{user?.name || 'User'}</h3>
                <p>{user?.email}</p>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-link" onClick={onProfile}>
                <i className="fas fa-user"></i>
                View Profile
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-link logout-btn" onClick={onLogout} type="button">
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar; 