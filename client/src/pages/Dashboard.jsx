import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";
import { FaUserEdit, FaTrash, FaCheckCircle, FaClock, FaFolder, FaTasks, FaExclamationCircle, FaBell, FaUserCircle, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import LogoutButton from '../components/LogoutButton';
import { getProjects, getMyTasks, getUsers, getNotifications, markAllNotificationsAsRead } from '../utils/api';

function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    completedTasks: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchNotifications();
      
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
    }
  }, [user]);
  
  // Calculate task statistics whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completedTasks = tasks.filter(task => task.status === "Completed").length;
      
      // Calculate overdue tasks (due date is before today and not completed)
      const overdueTasks = tasks.filter(task => {
        if (!task.dueDate || task.status === "Completed") return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;
      
      // Calculate tasks due today
      const todayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      }).length;
      
      setStats({
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        todayTasks
      });
    } else {
      // Reset stats if no tasks
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        todayTasks: 0
      });
    }
  }, [tasks]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchTeamMembers()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      console.log('🔔 Fetching notifications...');
      const response = await getNotifications();
      const notificationsData = response.data.map(notification => ({
        id: notification.id,
        message: notification.message,
        time: formatNotificationTime(notification.time),
        photo: notification.photo,
        type: notification.type,
        read: notification.read
      }));
      setNotifications(notificationsData);
      console.log(`✅ Loaded ${notificationsData.length} notifications`);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      // Fallback to empty array
      setNotifications([]);
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error("❌ Error marking notifications as read:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to fetch projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTasks = async () => {
    try {
      const response = await getMyTasks();
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // Don't set error state here to avoid overriding project errors
    }
  };
  
  const fetchTeamMembers = async () => {
    try {
      const response = await getUsers();
      setTeamMembers(response.data);
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Fallback to empty array if error
      setTeamMembers([]);
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
        <Topbar 
          user={user}
          userPhoto={userPhoto}
          notifications={notifications}
          onProfile={() => navigate('/profile')}
          onLogout={handleLogout}
          onSearch={(e) => console.log("Search:", e.target.value)}
          onMarkAllAsRead={handleMarkAllAsRead}
        />

        <div className="welcome-message">
          <div>
            <h2>Welcome back, {user?.displayName || user?.email || "User"}!</h2>
            <p>Here's what's happening in your projects today.</p>
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
              <div className="stat-value">{stats.totalTasks}</div>
            </div>
          </div>
          <div className="stat-card-pro" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-completed">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <div className="stat-title">Completed</div>
              <div className="stat-value">{stats.completedTasks}</div>
            </div>
          </div>
          <div className="stat-card-pro" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon stat-overdue">
              <FaExclamationCircle />
            </div>
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
              <Link to="/projects" className="view-all-link" style={{ textDecoration: 'none' }}>View all</Link>
            </div>
            <div className="my-tasks-list">
              {loading ? (
                <div className="loading-state">
                  <p>Loading tasks...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>{error}</p>
                </div>
              ) : tasks && tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <span className={`task-status status-${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="task-due-date">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
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
              <Link to="/profile" className="view-all-link" style={{ textDecoration: 'none' }}>View all</Link>
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
              <Link to="/team" className="add-team-btn" style={{ textDecoration: 'none' }}>View All Members</Link>
            </div>
            {showSuccess && (
              <div className="team-success-alert">User deleted successfully!</div>
            )}
            <div className="team-grid">
              {loading ? (
                <div className="loading-state">
                  <p>Loading team members...</p>
                </div>
              ) : teamMembers.length > 0 ? (
                teamMembers.map(member => (
                  <div className="team-card" key={member.id}>
                    <div className="team-card-avatar">
                      {member.image || member.photoURL ? (
                        <img src={member.image || member.photoURL} alt={member.displayName} />
                      ) : (
                        <span>{member.displayName ? member.displayName[0] : "U"}</span>
                      )}
                    </div>
                    <div className="team-card-info">
                      <div className="team-card-name">{member.displayName || "User"}</div>
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
                ))
              ) : (
                <div className="empty-state">
                  <p>No team members found</p>
                  <button className="add-button">Add Team Member</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 