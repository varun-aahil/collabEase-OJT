import { useState, useEffect } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import axios from "axios";
import "../styles/Dashboard.css";
import { FaUserEdit, FaTrash } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
  const [showSuccess, setShowSuccess] = useState(true);

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
    fetchTasks();
    fetchStats();
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
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
  }, []);

  const fetchProjects = async () => {
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
      if (error.response?.status === 401) {
        setUser(null);
        navigate("/login", { replace: true });
      }
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tasks/my-tasks", {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tasks/stats", {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    // Immediately clear user and redirect
    setUser(null);
    navigate("/login", { replace: true });
    
    // Then handle the server logout in the background
    try {
      await axios.get("http://localhost:5000/auth/logout", {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };

  const handleProfileNavigation = () => {
    setShowProfile(false);
    navigate('/profile');
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
  };

  const handleClickOutside = (event) => {
    // Don't close if clicking on the logout button
    if (event.target.closest('.logout-btn')) {
      return;
    }
    
    if (showProfile && !event.target.closest('.profile-container')) {
      setShowProfile(false);
    }
    if (showNotifications && !event.target.closest('.notifications-container')) {
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProfile, showNotifications]);

  return (
    <div className="dashboard">
      <Sidebar />
      <div style={{flex:1}}>
        <Topbar
          user={user}
          userPhoto={userPhoto}
          notifications={notifications}
          onProfile={handleProfileNavigation}
          onLogout={handleLogout}
        />
        <main className="main-content" style={{paddingTop:'80px'}}>
          {/* Top Bar */}
          <header className="topbar">
            <div className="search-container">
              <input type="text" className="search-input" placeholder="Search projects, tasks, and team..." />
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
                        <div className="profile-initial-large">
                          {user?.name?.charAt(0) || user?.email?.charAt(0)}
                        </div>
                      )}
                      <h3>{user?.name || 'User'}</h3>
                      <p>{user?.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-link" onClick={handleProfileNavigation}>
                      <i className="fas fa-user"></i>
                      View Profile
                    </button>
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
                      <i className="fas fa-sign-out-alt"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Welcome Message */}
          <div className="welcome-message">
            <h2>Welcome back, {user?.name}!</h2>
            <p>Here's what's happening in your projects today.</p>
          </div>

          {/* Stat Cards */}
          <section className="dashboard-stats-pro">
            <div className="stat-card-pro">
              <div className="stat-icon stat-projects"><i className="fas fa-folder"></i></div>
              <div className="stat-info">
                <div className="stat-title">Projects</div>
                <div className="stat-value">{projects.length}</div>
              </div>
            </div>
            <div className="stat-card-pro">
              <div className="stat-icon stat-tasks"><i className="fas fa-tasks"></i></div>
              <div className="stat-info">
                <div className="stat-title">Total Tasks</div>
                <div className="stat-value">{stats.totalTasks}</div>
              </div>
            </div>
            <div className="stat-card-pro">
              <div className="stat-icon stat-completed"><i className="fas fa-check-circle"></i></div>
              <div className="stat-info">
                <div className="stat-title">Completed</div>
                <div className="stat-value">{stats.completedTasks}</div>
              </div>
            </div>
            <div className="stat-card-pro">
              <div className="stat-icon stat-overdue"><i className="fas fa-exclamation-circle"></i></div>
              <div className="stat-info">
                <div className="stat-title">Overdue</div>
                <div className="stat-value">{stats.overdueTasks}</div>
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
                {tasks.length === 0 ? <div className="empty-state">No tasks assigned to you</div> : null}
              </div>
            </section>
            <section className="recent-activity-section">
              <div className="section-header-pro">
                <h3>Recent Activity</h3>
                <button className="view-all-link">View all</button>
              </div>
              <div className="recent-activity-list">
                {recentActivity.length === 0 ? <div className="empty-state">No recent activity</div> : null}
              </div>
            </section>
          </div>
          <div className="dashboard-bottom-sections-pro">
            <section className="recent-projects-section">
              <div className="section-header-pro">
                <h3>Recent Projects</h3>
                <button className="view-all-link">View all</button>
              </div>
              <div className="recent-projects-list">
                {projects.length === 0 ? (
                  <div className="empty-state">No recent projects</div>
                ) : (
                  projects.map(project => (
                    <div className="project-card" key={project._id || project.id}>
                      <div className="project-title">{project.title}</div>
                      <div className="project-description">{project.description}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
            <section className="team-section">
              <div className="section-header-pro" style={{alignItems:'center'}}>
                <h3 style={{fontSize:'1.5rem'}}>Team Members</h3>
                <button className="add-team-btn">Add Team Member</button>
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
                      <button className="team-action-btn"><FaUserEdit /></button>
                      <button className="team-action-btn" onClick={()=>setShowSuccess(true)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard; 