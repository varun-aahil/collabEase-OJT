import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaCamera, 
  FaArrowLeft, 
  FaShieldAlt, 
  FaTrash, 
  FaKey, 
  FaToggleOn, 
  FaToggleOff,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaAlignLeft
} from 'react-icons/fa';
import '../styles/Profile.css';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [userPhoto, setUserPhoto] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate passwords
      if (formData.newPassword !== formData.confirmPassword) {
        showNotification('New passwords do not match', 'error');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        setIsSubmitting(false);
        return;
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, formData.newPassword);
      
      // Success message
      showNotification('Password updated successfully!', 'success');
      
      // Reset password fields
      setFormData(prevData => ({
        ...prevData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      
      if (error.code === 'auth/wrong-password') {
        showNotification('Current password is incorrect', 'error');
      } else {
        showNotification(`Failed to update password: ${error.message}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    showNotification(
      twoFactorEnabled 
        ? 'Two-factor authentication disabled' 
        : 'Two-factor authentication enabled. (Demo feature - no actual verification will be sent)',
      'success'
    );
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        deletePassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Delete user
      await deleteUser(auth.currentUser);
      
      // Reset user state
      setUser(null);
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      
      if (error.code === 'auth/wrong-password') {
        showNotification('Password is incorrect', 'error');
      } else {
        showNotification(`Failed to delete account: ${error.message}`, 'error');
      }
      
      setIsSubmitting(false);
    }
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
                    <FaUser /> Edit Profile
                  </button>
                ) : (
                  <button className="cancel-button" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                )}
              </div>
              
              {!editMode ? (
                <div className="account-info-card">
                  <div className="account-info-header">
                    <div className="account-info-avatar">
                      <img src={userPhoto} alt="Profile" />
                    </div>
                    <div className="account-info-title">
                      <h4>{formData.displayName || user.email}</h4>
                      <p className="account-info-subtitle">Your personal information</p>
                    </div>
                  </div>
                  
                  <div className="info-display">
                    <div className="info-row">
                      <div className="info-icon">
                        <FaUser />
                      </div>
                      <span className="info-label">Name</span>
                      <span className="info-value">{formData.displayName || 'Not set'}</span>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <FaEnvelope />
                      </div>
                      <span className="info-label">Email</span>
                      <span className="info-value">{formData.email}</span>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <FaAlignLeft />
                      </div>
                      <span className="info-label">Bio</span>
                      <span className="info-value bio-text">{formData.bio || 'Not set'}</span>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <FaMapMarkerAlt />
                      </div>
                      <span className="info-label">Location</span>
                      <span className="info-value">{formData.location || 'Not set'}</span>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <FaPhone />
                      </div>
                      <span className="info-label">Phone</span>
                      <span className="info-value">{formData.phone || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="account-form-card">
                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="displayName">
                        <FaUser /> Name
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">
                        <FaEnvelope /> Email
                      </label>
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
                      <label htmlFor="bio">
                        <FaAlignLeft /> Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="location">
                          <FaMapMarkerAlt /> Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">
                          <FaPhone /> Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="cancel-button" onClick={() => setEditMode(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="save-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Security Settings</h3>
              </div>
              
              <div className="security-cards">
                <div className="security-card">
                  <div className="security-card-header">
                    <FaKey />
                    <h4>Password</h4>
                  </div>
                  <p>Change your account password regularly to keep your account secure</p>
                  <form onSubmit={handlePasswordChange} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        required
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
                        required
                        minLength={6}
                      />
                      <p className="form-hint">Password must be at least 6 characters long</p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <button type="submit" className="save-button" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
                
                <div className="security-card">
                  <div className="security-card-header">
                    <FaShieldAlt />
                    <h4>Two-Factor Authentication</h4>
                  </div>
                  <p>Add an extra layer of security to your account by enabling two-factor authentication</p>
                  <div className="two-factor-toggle">
                    <span>Two-Factor Authentication is {twoFactorEnabled ? 'enabled' : 'disabled'}</span>
                    <button className="toggle-button" onClick={toggleTwoFactor}>
                      {twoFactorEnabled ? <FaToggleOn className="toggle-on" /> : <FaToggleOff className="toggle-off" />}
                    </button>
                  </div>
                  {twoFactorEnabled && (
                    <div className="verification-status">
                      <FaCheckCircle className="check-icon" />
                      <span>Two-factor authentication is active</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <button 
                  className="delete-account-button" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                >
                  <FaTrash /> Delete Account
                </button>
              </div>
              
              {/* Delete Account Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="modal-overlay">
                  <div className="modal-content delete-confirmation">
                    <h3>Delete Your Account</h3>
                    <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                    <p>All your data, including projects, tasks, and settings will be permanently deleted.</p>
                    
                    <div className="form-group">
                      <label htmlFor="deletePassword">Enter your password to confirm</label>
                      <input
                        type="password"
                        id="deletePassword"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your current password"
                        required
                      />
                    </div>
                    
                    <div className="modal-actions">
                      <button 
                        className="cancel-button" 
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={handleDeleteAccount}
                        disabled={!deletePassword || isSubmitting}
                      >
                        {isSubmitting ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 