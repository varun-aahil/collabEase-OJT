import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUserEdit, FaTrash, FaUserPlus, FaEnvelope, FaLink, FaCheck, FaTimes } from 'react-icons/fa';
import '../styles/Dashboard.css';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

function Team({ user }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch team members from backend
  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Replace with your real API endpoint
      const res = await axios.get('/api/team', { withCredentials: true });
      setTeamMembers(res.data);
    } catch (err) {
      // fallback to mock data if API fails
      setTeamMembers([
        {
          id: 1,
          name: 'Sanket Jadhav',
          email: 'sanket3280@gmail.com',
          status: 'active',
          role: 'Member',
          avatar: '',
        },
        {
          id: 2,
          name: 'Sanket tanaji jadhav',
          email: 'sankettanaj.p24@medhaviskil...',
          status: 'inactive',
          role: 'Member',
          avatar: '',
        },
        {
          id: 3,
          name: '25F1001327 SANKET JADHAV',
          email: '25f1001327@ds.study.iitm.ac...',
          status: 'active',
          role: 'Member',
          avatar: '',
        },
        {
          id: 4,
          name: 'Sanket Jadhav',
          email: 'sj546400@gmail.com',
          status: 'active',
          role: 'Member',
          avatar: 'https://ui-avatars.com/api/?name=Sanket+Jadhav&background=000000&color=fff',
        },
      ]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    // Replace with your real API endpoint
    try {
      await axios.delete(`/api/team/${id}`, { withCredentials: true });
      setShowSuccess(true);
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    } catch (err) {
      setShowSuccess(false);
    }
  };

  const handleToggleStatus = async (id) => {
    // Replace with your real API endpoint
    setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m));
    // Optionally, call backend to update status
  };

  const handleInvite = async () => {
    setInviteSuccess('');
    setInviteError('');
    try {
      // Replace with your real API endpoint
      // const res = await axios.post('/api/team/invite', { email: inviteEmail }, { withCredentials: true });
      // setInviteLink(res.data.link);
      setInviteLink('https://yourapp.com/invite/abc123'); // mock
      setInviteSuccess('Invite sent successfully!');
      setInviteEmail('');
    } catch (err) {
      setInviteError('Failed to send invite.');
    }
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
            <h3 style={{fontSize:'1.5rem'}}>Team Members</h3>
            <button className="add-team-btn" onClick={()=>setShowInviteModal(true)}><FaUserPlus style={{marginRight:6}}/>Add Team Member</button>
          </div>
          {showSuccess && (
            <div className="team-success-alert">User deleted successfully!</div>
          )}
          {loading ? <div>Loading...</div> : (
          <div className="team-grid">
            {teamMembers.map(member => (
              <div className="team-card" key={member.id}>
                <div className="team-card-avatar">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} />
                  ) : (
                    <span>{member.name[0]}</span>
                  )}
                </div>
                <div className="team-card-info">
                  <div className="team-card-name">{member.name}</div>
                  <div className="team-card-email">{member.email}</div>
                  <div className="team-card-badges">
                    <span className={`badge badge-${member.status}`}>{member.status === 'active' ? 'Active' : 'Inactive'}</span>
                    <span className="badge badge-role">{member.role}</span>
                  </div>
                </div>
                <div className="team-card-actions">
                  <button className="team-action-btn" title="Edit"><FaUserEdit /></button>
                  <button className="team-action-btn" title="Delete" onClick={()=>handleDelete(member.id)}><FaTrash /></button>
                  <button className="team-action-btn" title={member.status === 'active' ? 'Deactivate' : 'Activate'} onClick={()=>handleToggleStatus(member.id)}>{member.status === 'active' ? <FaTimes /> : <FaCheck />}</button>
                </div>
              </div>
            ))}
          </div>
          )}
          {/* Invite Modal */}
          {showInviteModal && (
            <div className="modal">
              <div className="modal-content">
                <h2>Invite Team Member</h2>
                <div style={{marginBottom:12}}>
                  <label>Email:</label>
                  <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="Enter email" style={{width:'100%'}} />
                </div>
                <button className="add-team-btn" onClick={handleInvite} style={{marginBottom:12}}><FaEnvelope style={{marginRight:6}}/>Send Invite</button>
                {inviteLink && (
                  <div style={{marginBottom:12}}>
                    <label>Or share this link:</label>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <input type="text" value={inviteLink} readOnly style={{flex:1}} />
                      <button className="add-team-btn" onClick={()=>navigator.clipboard.writeText(inviteLink)}><FaLink /></button>
                    </div>
                  </div>
                )}
                {inviteSuccess && <div className="team-success-alert">{inviteSuccess}</div>}
                {inviteError && <div className="error-message">{inviteError}</div>}
                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={()=>setShowInviteModal(false)}>Close</button>
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