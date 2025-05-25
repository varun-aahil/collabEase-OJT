import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaCamera, FaArrowLeft } from 'react-icons/fa';
import '../styles/Profile.css';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [userPhoto, setUserPhoto] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    // Set user photo
    setUserPhoto(user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || "User")}&background=5a5ee3&color=fff`);
    
    // Update form data when user changes
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        displayName: user.displayName || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update profile info
    setUser(prevUser => ({
      ...prevUser,
      displayName: formData.displayName,
      bio: formData.bio,
      location: formData.location,
      phone: formData.phone
    }));
    
    // Show success notification
    showNotification('Profile updated successfully!', 'success');
    setEditMode(false);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }
    
    // Success message (in a real app, this would update the password in Firebase)
    showNotification('Password updated successfully!', 'success');
    
    // Reset password fields
    setFormData(prevData => ({
      ...prevData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result);
        // In a real app, you would upload this to storage and update the user profile
        setUser(prevUser => ({
          ...prevUser,
          photoURL: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <Link to="/dashboard" className="back-link">
          <FaArrowLeft /> Back to Dashboard
        </Link>
        <h1>Your Profile</h1>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="profile-container">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-photo-container">
            <img src={userPhoto} alt="Profile" className="profile-photo" />
            <label className="photo-upload-label">
              <FaCamera />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
          
          <h2>{user.displayName || user.email}</h2>
          <p className="user-email">{user.email}</p>
          
          <div className="profile-tabs">
            <button 
              className={activeTab === 'account' ? 'active' : ''} 
              onClick={() => setActiveTab('account')}
            >
              <FaUser /> Account
            </button>
            <button 
              className={activeTab === 'security' ? 'active' : ''} 
              onClick={() => setActiveTab('security')}
            >
              <FaLock /> Security
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="profile-content">
          {activeTab === 'account' && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Account Information</h3>
                {!editMode ? (
                  <button className="edit-button" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <button className="cancel-button" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                )}
              </div>
              
              {!editMode ? (
                <div className="info-display">
                  <div className="info-row">
                    <span className="info-label">Name</span>
                    <span className="info-value">{formData.displayName || 'Not set'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{formData.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Bio</span>
                    <span className="info-value">{formData.bio || 'Not set'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location</span>
                    <span className="info-value">{formData.location || 'Not set'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{formData.phone || 'Not set'}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="displayName">Name</label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <p className="form-hint">Email cannot be changed</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <button type="submit" className="save-button">Save Changes</button>
                </form>
              )}
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Security Settings</h3>
              </div>
              
              <form onSubmit={handlePasswordChange} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
                <button type="submit" className="save-button">Update Password</button>
              </form>
              
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <button className="delete-account-button">Delete Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 