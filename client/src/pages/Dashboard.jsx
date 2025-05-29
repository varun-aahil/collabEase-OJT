import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Dashboard.css";
import { FaUserEdit, FaTrash, FaCheckCircle, FaClock, FaFolder, FaTasks, FaExclamationCircle, FaBell, FaUserCircle, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import LogoutButton from '../components/LogoutButton';

function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    completedTasks: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      message: "New task assigned: Complete project documentation",
      time: "2 hours ago",
      photo: "https://ui-avatars.com/api/?name=John+Doe"
    },
    {
      id: 2,
      message: "Project deadline updated: Marketing Campaign",
      time: "5 hours ago",
      photo: "https://ui-avatars.com/api/?name=Jane+Smith"
    }
  ]);
  const [showProfile, setShowProfile] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [recentActivity] = useState([
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
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock team members for demo
  const teamMembers = [
    {
      id: 1,
      name: 'Sanket Jadhav',
      email: 'sanket3280@gmail.com',
      status: 'Active',
      role: 'Member',
      avatar: '',
    },
    {
      id: 2,
      name: 'Sanket tanaji jadhav',
      email: 'sankettanaj.p24@medhaviskil...',
      status: 'Active',
      role: 'Member',
      avatar: '',
    },
    {
      id: 3,
      name: '25F1001327 SANKET JADHAV',
      email: '25f1001327@ds.study.iitm.ac...',
      status: 'Active',
      role: 'Member',
      avatar: '',
    },
    {
      id: 4,
      name: 'Sanket Jadhav',
      email: 'sj546400@gmail.com',
      status: 'Active',
      role: 'Member',
      avatar: 'https://ui-avatars.com/api/?name=Sanket+Jadhav&background=000000&color=fff',
    },
  ];

  useEffect(() => {
    fetchProjects();
    // Fetch user profile photo
    const fetchUserPhoto = async () => {
      try {
        // For demo purposes, use a placeholder avatar
        setUserPhoto(user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || "User")}&background=5a5ee3&color=fff`);
      } catch (error) {
        console.error('Error fetching user photo:', error);
      }
    };

    fetchUserPhoto();
  }, [user]);

  const fetchProjects = async () => {
    try {
      // For demo purposes, we'll use mock data if API call fails
      const mockProjects = [
        {
          id: 1,
          title: "Website Redesign",
          description: "Complete overhaul of company website with modern UI",
          status: "In Progress"
        },
        {
          id: 2,
          title: "Mobile App Development",
          description: "Cross-platform mobile application for customer engagement",
          status: "Planning"
        },
        {
          id: 3,
          title: "Marketing Campaign",
          description: "Q2 digital marketing campaign for new product launch",
          status: "On Hold"
        }
      ];
      
      try {
        const response = await axios.get("http://localhost:5000/api/projects", {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects(mockProjects);
      }
    } catch (error) {
      console.error("Error in fetchProjects:", error);
    }
  };

  const handleLogout = async () => {
    // Immediately clear user and redirect
    setUser(null);
    navigate("/login", { replace: true });
  };

  const handleProfileClick = (e) => {
    e.stopPropagation(); // Stop event from propagating
    console.log("Profile clicked, current state:", showProfile);
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };

  const handleNotificationsClick = (e) => {
    e.stopPropagation(); // Stop event from propagating
    console.log("Notifications clicked, current state:", showNotifications);
    setShowNotifications(!showNotifications);
    setShowProfile(false);
  };

  const handleClickOutside = (event) => {
    // Don't close if clicking on these elements
    const profileContainer = event.target.closest('.profile-container');
    const notificationsContainer = event.target.closest('.notifications-container');
    const profileButton = event.target.closest('.profile-btn');
    const notificationButton = event.target.closest('.icon-button');
    
    // Debug logging
    console.log("Click outside - Profile:", !profileContainer && !profileButton);
    console.log("Click outside - Notification:", !notificationsContainer && !notificationButton);
    
    // Handle profile dropdown
    if (showProfile && !profileContainer && !profileButton) {
      setShowProfile(false);
    }
    
    // Handle notifications dropdown
    if (showNotifications && !notificationsContainer && !notificationButton) {
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfile, showNotifications]);

  // Format date for better display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <div className="welcome-message">
          <div>
            <h2>Welcome back, {user?.displayName || user?.email || "User"}!</h2>
            <p>Here's what's happening in your projects today.</p>
            <button 
              onClick={() => navigate('/profile')} 
              style={{ 
                padding: '8px 12px', 
                background: '#fff', 
                color: '#4e73df', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginTop: '10px',
                fontWeight: '600'
              }}
            >
              Go to Profile Page
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', fontSize: '14px' }}>
              Firebase Auth: {user ? '✓ Connected' : '✗ Not connected'}
            </div>
            <LogoutButton setUser={setUser} />
          </div>
        </div>

        <div className="topbar">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input type="text" className="search-input" placeholder="Search projects, tasks, and team..." />
          </div>
          <div className="topbar-actions">
            <div className="notifications-container">
              <button className="icon-button" onClick={handleNotificationsClick} title="Notifications">
                <FaBell />
                {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button className="mark-all-read">Mark all as read</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div className="notification-item" key={notification.id}>
                          <div className="notification-avatar">
                            <img src={notification.photo} alt="User" />
                          </div>
                          <div className="notification-content">
                            <p>{notification.message}</p>
                            <span className="notification-time">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-notifications">
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="notifications-footer">
                    <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="profile-container">
              <button className="icon-button profile-btn" onClick={handleProfileClick} title="Profile">
                {userPhoto ? (
                  <img src={userPhoto} alt="Profile" className="profile-image" />
                ) : (
                  <span className="profile-initial">{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</span>
                )}
              </button>
              {showProfile && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    {userPhoto ? (
                      <img src={userPhoto} alt="Profile" className="profile-image-large" />
                    ) : (
                      <div className="profile-initial-large">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </div>
                    )}
                    <h3>{user?.displayName || user?.email || 'User'}</h3>
                    <p>{user?.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link 
                    to="/profile" 
                    className="dropdown-link"
                    onClick={() => setShowProfile(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <FaUserCircle />
                    View Profile
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-link logout-btn" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogout();
                    }}
                    type="button"
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="dashboard-stats-pro">
          <div className="stat-card-pro" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-projects">
              <FaFolder />
            </div>
            <div className="stat-info">
              <div className="stat-title">Projects</div>
              <div className="stat-value">{projects.length}</div>
            </div>
          </div>
          <div className="stat-card-pro" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-tasks">
              <FaTasks />
            </div>
            <div className="stat-info">
              <div className="stat-title">Total Tasks</div>
              <div className="stat-value">{stats.totalTasks || 12}</div>
            </div>
          </div>
          <div className="stat-card-pro" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-completed">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <div className="stat-title">Completed</div>
              <div className="stat-value">{stats.completedTasks || 5}</div>
            </div>
          </div>
          <div className="stat-card-pro" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-overdue">
              <FaExclamationCircle />
            </div>
            <div className="stat-info">
              <div className="stat-title">Overdue</div>
              <div className="stat-value">{stats.overdueTasks || 2}</div>
            </div>
          </div>
        </section>

        {/* Main Dashboard Sections */}
        <div className="dashboard-sections-pro">
          <section className="my-tasks-section">
            <div className="section-header-pro">
              <h3>My Tasks</h3>
              <button className="view-all-link">View all</button>
            </div>
            <div className="my-tasks-list">
              {tasks && tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FaTasks style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
                  <p>No tasks assigned to you</p>
                  <button className="add-button" onClick={() => navigate('/projects')}>Add New Task</button>
                </div>
              )}
            </div>
          </section>
          <section className="recent-activity-section">
            <div className="section-header-pro">
              <h3>Recent Activity</h3>
              <button className="view-all-link">View all</button>
            </div>
            <div className="recent-activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <i className={`fas fa-${activity.type === 'login' ? 'sign-in-alt' : 'key'}`}></i>
                    </div>
                    <div className="activity-details">
                      <h4>{activity.description}</h4>
                      <div className="activity-meta">
                        <span>{formatDate(activity.timestamp)}</span>
                        <span>{activity.device}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No recent activity</div>
              )}
            </div>
          </section>
        </div>

        <div className="dashboard-bottom-sections-pro">
          <section className="recent-projects-section">
            <div className="section-header-pro">
              <h3>Recent Projects</h3>
              <Link to="/projects" className="view-all-link">View all</Link>
            </div>
            <div className="recent-projects-list">
              {projects.length === 0 ? (
                <div className="empty-state">
                  <FaFolder style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
                  <p>No recent projects</p>
                  <Link to="/projects" className="add-button">Manage Projects</Link>
                </div>
              ) : (
                projects.map(project => (
                  <div className="project-card" key={project._id || project.id}>
                    <div className="project-title">{project.title}</div>
                    <div className="project-description">{project.description}</div>
                    <div className="project-status">
                      <span className={`status-badge status-${project.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                        {project.status || 'Pending'}
                      </span>
                    </div>
                    <div className="project-actions" style={{ marginTop: '10px', textAlign: 'right' }}>
                      <Link to="/projects" className="view-project-btn">
                        View Project
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/projects" className="kanban-cta-btn">
                <FaTasks style={{ marginRight: '8px' }} /> Open Kanban Board
              </Link>
            </div>
          </section>
          
          <section className="team-section">
            <div className="section-header-pro">
              <h3>Team Members</h3>
              <button className="add-team-btn" onClick={() => navigate('/team')}>View All Members</button>
            </div>
            {showSuccess && (
              <div className="team-success-alert">User deleted successfully!</div>
            )}
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
                      <span className="badge badge-active">Active</span>
                      <span className="badge badge-role">Member</span>
                    </div>
                  </div>
                  <div className="team-card-actions">
                    <button className="team-action-btn" title="Edit User"><FaUserEdit /></button>
                    <button 
                      className="team-action-btn" 
                      title="Delete User"
                      onClick={() => setShowSuccess(true)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 