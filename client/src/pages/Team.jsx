import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserEdit, FaTrash, FaUserPlus, FaEnvelope, FaLink, FaCheck, FaTimes, FaCopy } from 'react-icons/fa';
import '../styles/Dashboard.css';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../utils/api';

function Team({ user }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);

  // Fetch team members from backend
  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching team members...');
      const response = await api.get('/team');
      setTeamMembers(response.data);
      console.log('✅ Team members fetched:', response.data);
    } catch (error) {
      console.error("❌ Error fetching team members:", error);
      setInviteError('Failed to load team members. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const member = teamMembers.find(m => m.id === id);
    const confirmDelete = window.confirm(`Remove ${member?.name || member?.email} from your projects?\n\nThis will:\n• Hide them from your team list\n• Remove them from project assignments\n• They can still use the app, but won't see your projects`);
    
    if (!confirmDelete) {
      return;
    }
    
    try {
      console.log('🗑️ Removing team member:', id, member?.email);
      const response = await api.delete(`/team/${id}`);
      console.log('✅ Delete response:', response.data);
      
      // Remove from local state
      setTeamMembers(teamMembers.filter(m => m.id !== id));
      setSuccessMessage('Team member removed successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("❌ Error removing team member:", error);
      console.error("❌ Error details:", error.response?.data);
      setInviteError(error.response?.data?.message || 'Failed to remove team member.');
      setTimeout(() => setInviteError(''), 3000);
    }
  };

  const handleToggleStatus = async (id) => {
    const member = teamMembers.find(m => m.id === id);
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    
    try {
      console.log(`🔄 Updating status for ${id} to ${newStatus}`);
      await api.patch(`/team/${id}/status`, { status: newStatus });
      
      setTeamMembers(teamMembers.map(m => 
        m.id === id ? { ...m, status: newStatus } : m
      ));
      
      setSuccessMessage(`Team member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("❌ Error updating team member status:", error);
      setInviteError('Failed to update team member status.');
      setTimeout(() => setInviteError(''), 3000);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setInviteSuccess('');
    setInviteError('');
    setInviteSending(true);
    
    try {
      console.log('📧 Sending invitation to:', inviteEmail);
      const response = await api.post('/team/invite', { email: inviteEmail });
      
      setInviteLink(response.data.inviteLink);
      setInviteSuccess('Invitation sent successfully! You can copy the link below to share.');
      setInviteEmail('');
      console.log('✅ Invitation sent successfully');
    } catch (error) {
      console.error("❌ Error sending invitation:", error);
      if (error.response?.data?.userExists) {
        setInviteError('This email is already a team member.');
      } else {
        setInviteError(error.response?.data?.message || 'Failed to send invitation.');
      }
    } finally {
      setInviteSending(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteSuccess('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setInviteError('Failed to copy link. Please copy it manually.');
    }
  };

  const clearMessages = () => {
    setInviteSuccess('');
    setInviteError('');
    setInviteLink('');
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div style={{flex:1}}>
        <Topbar
          user={user}
          userPhoto={user?.photo}
          notifications={[]}
          onProfile={() => {}}
          onLogout={() => {}}
        />
        <main className="main-content" style={{paddingTop:'80px'}}>
          <div className="section-header-pro" style={{alignItems:'center', marginBottom: 32}}>
            <div>
              <h3 style={{fontSize:'1.5rem'}}>All Users ({teamMembers.length})</h3>
              <p style={{color: '#6c757d', fontSize: '0.9rem', margin: '4px 0 0 0'}}>
                Users automatically appear when they register. Send invitations to notify them about your projects.
              </p>
            </div>
            <button className="add-team-btn" onClick={() => {
              setShowInviteModal(true);
              clearMessages();
            }}>
              <FaUserPlus style={{marginRight:6}}/>Send Invitation
            </button>
          </div>
          
          {showSuccess && (
            <div className="team-success-alert">
              {successMessage}
            </div>
          )}
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
              <p>Loading team members...</p>
            </div>
          ) : (
            <div className="team-grid">
              {teamMembers.map(member => (
                <div className="team-card" key={member.id}>
                  <div className="team-card-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <span>{(member.name || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="team-card-info">
                    <div className="team-card-name">{member.name}</div>
                    <div className="team-card-email">{member.email}</div>
                    <div className="team-card-badges">
                      <span className={`badge badge-${member.status}`}>
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="badge badge-role">{member.role}</span>
                    </div>
                  </div>
                  <div className="team-card-actions">
                    <button 
                      className="team-action-btn" 
                      title="Remove from projects" 
                      onClick={() => handleDelete(member.id)}
                    >
                      <FaTrash />
                    </button>
                    <button 
                      className="team-action-btn" 
                      title={member.status === 'active' ? 'Deactivate user' : 'Activate user'} 
                      onClick={() => handleToggleStatus(member.id)}
                    >
                      {member.status === 'active' ? <FaTimes /> : <FaCheck />}
                    </button>
                  </div>
                </div>
              ))}
              
              {teamMembers.length === 0 && !loading && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6c757d'
                }}>
                  <FaUserPlus style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                  <h3>No users have registered yet</h3>
                  <p>When people register for your app, they'll automatically appear here.<br/>
                  You can then send them project invitations.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Invite Modal */}
          {showInviteModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Send Project Invitation</h2>
                <p style={{color: '#6c757d', fontSize: '0.9rem', marginBottom: '16px'}}>
                  Send an invitation to notify someone about your projects. If they haven't registered yet, 
                  they'll get an email with a registration link.
                </p>
                <div style={{marginBottom:12}}>
                  <label>Email Address:</label>
                  <input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address" 
                    style={{width:'100%'}}
                    disabled={inviteSending}
                  />
                </div>
                
                <button 
                  className="add-team-btn" 
                  onClick={handleInvite} 
                  style={{marginBottom:12}}
                  disabled={inviteSending}
                >
                  <FaEnvelope style={{marginRight:6}}/>
                  {inviteSending ? 'Sending...' : 'Send Invite'}
                </button>
                
                {inviteLink && (
                  <div style={{marginBottom:12}}>
                    <label>Or share this link:</label>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <input 
                        type="text" 
                        value={inviteLink} 
                        readOnly 
                        style={{flex:1, fontSize: '0.85rem'}} 
                      />
                      <button 
                        className="add-team-btn" 
                        onClick={copyInviteLink}
                        title="Copy to clipboard"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                )}
                
                {inviteSuccess && (
                  <div className="team-success-alert" style={{marginBottom:12}}>
                    {inviteSuccess}
                  </div>
                )}
                
                {inviteError && (
                  <div className="error-message" style={{marginBottom:12}}>
                    {inviteError}
                  </div>
                )}
                
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowInviteModal(false);
                      clearMessages();
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Team; 