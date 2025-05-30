import React, { useState } from 'react';
import '../styles/Topbar.css';

function Topbar({ user, userPhoto, notifications = [], onProfile, onLogout, onSearch, onMarkAllAsRead }) {
  const [showNotifications, setShowNotifications] = useState(false);
  
  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };
  
  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };
  
  const handleClickOutside = (event) => {
    if (showNotifications && !event.target.closest('.notifications-container')) {
      setShowNotifications(false);
    }
  };
  
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <header className="topbar fixed-topbar">
      <div className="search-container">
        <input type="text" className="search-input" placeholder="Search projects, tasks, and team..." onChange={onSearch} />
      </div>
      <div className="topbar-actions">
        <div className="notifications-container">
          <button className="icon-button" onClick={handleNotificationsClick} title="Notifications">
            <i className="fas fa-bell"></i>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                <button className="mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                      <div className="notification-avatar">
                        <img src={notification.photo || "https://ui-avatars.com/api/?name=User"} alt="" />
                      </div>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      {!notification.read && <div className="unread-indicator"></div>}
                    </div>
                  ))
                ) : (
                  <div className="empty-notifications">No new notifications</div>
                )}
              </div>
              <div className="notifications-footer">
                <a href="#">View all notifications</a>
              </div>
            </div>
          )}
        </div>
        <button className="icon-button profile-icon" onClick={onProfile} title="Go to Profile">
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="profile-image" />
          ) : (
            <div className="profile-initial">{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</div>
          )}
        </button>
      </div>
    </header>
  );
}

export default Topbar; 