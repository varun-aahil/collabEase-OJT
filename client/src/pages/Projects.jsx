import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import { FaPlus, FaProjectDiagram, FaTasks, FaCheckCircle, FaFilter, FaSearch, FaChartBar, FaArrowLeft, FaStar, FaTag, FaUser } from 'react-icons/fa';
import '../styles/Projects.css';
// import { useSelector } from 'react-redux'; // For user info if needed

// Mock users
const users = [
  { id: 1, name: "Rahul", avatar: "https://ui-avatars.com/api/?name=Rahul" },
  { id: 2, name: "Sanjay", avatar: "https://ui-avatars.com/api/?name=Sanjay" },
  { id: 3, name: "Priya", avatar: "https://ui-avatars.com/api/?name=Priya" },
];

// Mock projects
const mockProjects = [
  { 
    id: 101, 
    name: "Website Redesign", 
    description: "Revamp the company website with modern UI and improved user experience. Focus on mobile responsiveness and performance optimization.",
    due: "2024-07-01", 
    status: "Active", 
    progress: 65,
    members: [1, 2]
  },
  { 
    id: 102, 
    name: "Mobile App", 
    description: "Build the new mobile app for iOS and Android platforms. Implement core functionality and integrate with existing backend systems.",
    due: "2024-08-15", 
    status: "Planning",
    progress: 20,
    members: [2, 3]
  },
  { 
    id: 103, 
    name: "Marketing Campaign", 
    description: "Launch summer marketing campaign across digital channels. Create content, design assets, and track performance metrics.",
    due: "2024-06-20", 
    status: "Active",
    progress: 85,
    members: [1, 3]
  },
  { 
    id: 104, 
    name: "Customer Portal", 
    description: "Develop a self-service customer portal for account management and support. Implement authentication, profile management, and ticketing system.",
    due: "2024-09-30", 
    status: "Planning",
    progress: 10,
    members: [1, 2, 3]
  },
];

// Mock tasks
const initialTasks = [
  {
    id: 1,
    projectId: 101,
    title: "Design UI Components",
    description: "Create a modern component library for the website redesign",
    status: "To Do",
    tags: ["frontend", "design"],
    assignedTo: 1,
    dueDate: "2024-06-10",
    priority: "High",
    subtasks: [
      { id: 1, title: "Header Component", done: true },
      { id: 2, title: "Footer Component", done: false },
      { id: 3, title: "Card Components", done: false },
    ],
    attachments: [],
  },
  {
    id: 2,
    projectId: 101,
    title: "Setup Backend Architecture",
    description: "Configure server and database for the new website",
    status: "In Progress",
    tags: ["backend", "infrastructure"],
    assignedTo: 2,
    dueDate: "2024-06-09",
    priority: "Medium",
    subtasks: [
      { id: 1, title: "Configure Server", done: true },
      { id: 2, title: "Setup Database", done: true },
      { id: 3, title: "Configure CI/CD", done: false },
    ],
    attachments: [],
  },
  {
    id: 3,
    projectId: 101,
    title: "Write Documentation",
    description: "Create comprehensive developer documentation",
    status: "Completed",
    tags: ["docs"],
    assignedTo: 3,
    dueDate: "2024-06-08",
    priority: "Low",
    subtasks: [],
    attachments: [],
  },
  {
    id: 4,
    projectId: 102,
    title: "Design Mobile UI",
    description: "Create UI designs for the mobile app",
    status: "In Progress",
    tags: ["design", "mobile"],
    assignedTo: 3,
    dueDate: "2024-06-15",
    priority: "High",
    subtasks: [],
    attachments: [],
  },
  {
    id: 5,
    projectId: 102,
    title: "Implement Authentication",
    description: "Set up user authentication for the mobile app",
    status: "To Do",
    tags: ["backend", "security"],
    assignedTo: 2,
    dueDate: "2024-06-20",
    priority: "High",
    subtasks: [],
    attachments: [],
  },
];

const defaultStatuses = ["To Do", "In Progress", "Completed"];

const socket = io("http://localhost:5000", { transports: ['websocket'] }); // Adjust backend URL as needed

function Projects({ user, setUser }) {
  const [projects, setProjects] = useState(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [statuses, setStatuses] = useState(defaultStatuses);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTag, setFilterTag] = useState(null);
  const [filterUser, setFilterUser] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("Tasks");
  const [search, setSearch] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    due: '',
    status: 'Planning',
    members: []
  });
  
  // Real-time notifications (Socket.io)
  useEffect(() => {
    socket.on("task-update", (msg) => {
      setNotifications((prev) => [...prev, msg]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 4000);
    });
    return () => socket.off("task-update");
  }, []);

  // Handle task move in Kanban board
  const handleTaskMove = (taskId, newStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );
    socket.emit("task-update", `Task moved to ${newStatus}`);
  };
  
  // Handle new task creation
  const handleTaskCreate = (newTask) => {
    const taskWithProject = {
      ...newTask,
      projectId: selectedProjectId,
      id: tasks.length + 1
    };
    setTasks(prevTasks => [...prevTasks, taskWithProject]);
    socket.emit("task-update", `New task created: ${newTask.title}`);
  };
  
  // Handle task update
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    socket.emit("task-update", `Task updated: ${updatedTask.title}`);
  };
  
  // Handle task deletion
  const handleTaskDelete = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    socket.emit("task-update", `Task deleted`);
  };
  
  // Handle adding new status column
  const handleStatusCreate = (newStatus) => {
    if (!statuses.includes(newStatus)) {
      setStatuses(prevStatuses => [...prevStatuses, newStatus]);
    }
  };
  
  // Handle new project creation
  const handleCreateProject = () => {
    if (!newProject.name) return;
    
    const projectId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const newProjectWithId = {
      ...newProject,
      id: projectId,
      progress: 0
    };
    
    setProjects(prevProjects => [...prevProjects, newProjectWithId]);
    setNewProject({
      name: '',
      description: '',
      due: '',
      status: 'Planning',
      members: []
    });
    setShowAddProject(false);
  };

  // Filter tasks for selected project
  const projectTasks = selectedProjectId
    ? tasks.filter(t => t.projectId === selectedProjectId)
    : [];

  // Stats
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === "Completed").length;
  const inProgressTasks = projectTasks.filter(t => t.status === "In Progress").length;
  const progress = selectedProject?.progress || (totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0);

  // Filtering
  const allTags = Array.from(new Set(projectTasks.flatMap((t) => t.tags || [])));
  let filteredTasks = projectTasks.filter((task) => {
    if (showStarred && !task.pinned) return false;
    if (filterTag && !task.tags?.includes(filterTag)) return false;
    if (filterUser && filterUser !== "unassigned" && task.assignedTo !== parseInt(filterUser)) return false;
    if (filterUser === "unassigned" && task.assignedTo) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "All" && task.status !== filterStatus) return false;
    return true;
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Get status color class
  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'planning': return 'status-planning';
      case 'completed': return 'status-completed';
      case 'on hold': return 'status-hold';
      default: return '';
    }
  };

  // Main layout
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="projects-main">
        {!selectedProjectId ? (
          <div className="projects-overview">
            <div className="projects-header">
              <h1>Projects</h1>
              <button className="new-project-button" onClick={() => setShowAddProject(true)}>
                <FaPlus /> New Project
              </button>
            </div>
            
            {/* Projects Stats */}
            <div className="projects-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaProjectDiagram />
                </div>
                <div className="stat-info">
                  <h3>Total Projects</h3>
                  <p>{projects.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaTasks />
                </div>
                <div className="stat-info">
                  <h3>Active Tasks</h3>
                  <p>{tasks.filter(t => t.status !== "Completed").length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCheckCircle />
                </div>
                <div className="stat-info">
                  <h3>Completed</h3>
                  <p>{tasks.filter(t => t.status === "Completed").length}</p>
                </div>
              </div>
            </div>
            
            {/* Project Search and Filters */}
            <div className="projects-filters">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button className={`filter-btn ${filterStatus === "All" ? "active" : ""}`} onClick={() => setFilterStatus("All")}>
                  All
                </button>
                <button className={`filter-btn ${filterStatus === "Active" ? "active" : ""}`} onClick={() => setFilterStatus("Active")}>
                  Active
                </button>
                <button className={`filter-btn ${filterStatus === "Planning" ? "active" : ""}`} onClick={() => setFilterStatus("Planning")}>
                  Planning
                </button>
                <button className={`filter-btn ${filterStatus === "Completed" ? "active" : ""}`} onClick={() => setFilterStatus("Completed")}>
                  Completed
                </button>
              </div>
            </div>
            
            {/* Projects Grid */}
            <div className="projects-grid">
              {projects
                .filter(project => filterStatus === "All" || project.status === filterStatus)
                .filter(project => !search || project.name.toLowerCase().includes(search.toLowerCase()) || project.description.toLowerCase().includes(search.toLowerCase()))
                .map(project => (
                <div key={project.id} className="project-card" onClick={() => setSelectedProjectId(project.id)}>
                  <div className="project-header">
                    <h3>{project.name}</h3>
                    <span className={`project-status ${getStatusClass(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-progress">
                    <div className="progress-label">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="project-meta">
                    <div className="project-due">
                      {project.due && (
                        <>
                          <span className="due-label">Due:</span>
                          <span className="due-date">{formatDate(project.due)}</span>
                          {getDaysRemaining(project.due) !== null && (
                            <span className={`days-remaining ${getDaysRemaining(project.due) < 0 ? 'overdue' : getDaysRemaining(project.due) <= 5 ? 'due-soon' : ''}`}>
                              {getDaysRemaining(project.due) < 0 
                                ? `${Math.abs(getDaysRemaining(project.due))} days overdue` 
                                : getDaysRemaining(project.due) === 0 
                                  ? 'Due today' 
                                  : `${getDaysRemaining(project.due)} days left`}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="project-team">
                      {project.members && project.members.map(memberId => {
                        const member = users.find(u => u.id === memberId);
                        return member ? (
                          <div key={memberId} className="team-avatar" title={member.name}>
                            <img src={member.avatar} alt={member.name} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Project Form */}
            {showAddProject && (
              <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h2>Create New Project</h2>
                  <form className="new-project-form">
                    <div className="form-group">
                      <label htmlFor="projectName">Project Name</label>
                      <input 
                        type="text" 
                        id="projectName" 
                        value={newProject.name}
                        onChange={e => setNewProject({...newProject, name: e.target.value})}
                        placeholder="Enter project name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="projectDescription">Description</label>
                      <textarea 
                        id="projectDescription"
                        value={newProject.description}
                        onChange={e => setNewProject({...newProject, description: e.target.value})}
                        placeholder="Enter project description"
                        rows="3"
                      ></textarea>
                    </div>
                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="projectDue">Due Date</label>
                        <input 
                          type="date" 
                          id="projectDue"
                          value={newProject.due}
                          onChange={e => setNewProject({...newProject, due: e.target.value})}
                        />
                      </div>
                      <div className="form-group half">
                        <label htmlFor="projectStatus">Status</label>
                        <select 
                          id="projectStatus"
                          value={newProject.status}
                          onChange={e => setNewProject({...newProject, status: e.target.value})}
                        >
                          <option value="Planning">Planning</option>
                          <option value="Active">Active</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Team Members</label>
                      <div className="team-selection">
                        {users.map(user => (
                          <div 
                            key={user.id}
                            className={`team-select-item ${newProject.members.includes(user.id) ? 'selected' : ''}`}
                            onClick={() => {
                              const isSelected = newProject.members.includes(user.id);
                              setNewProject({
                                ...newProject, 
                                members: isSelected 
                                  ? newProject.members.filter(id => id !== user.id)
                                  : [...newProject.members, user.id]
                              });
                            }}
                          >
                            <img src={user.avatar} alt={user.name} />
                            <span>{user.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setShowAddProject(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="submit-btn"
                        onClick={handleCreateProject}
                      >
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="project-detail">
            {/* Project Header */}
            <div className="project-detail-header">
              <button className="back-button" onClick={() => setSelectedProjectId(null)}>
                <FaArrowLeft /> Back to Projects
              </button>
              <h1>{selectedProject?.name}</h1>
              <span className={`project-status ${getStatusClass(selectedProject?.status)}`}>
                {selectedProject?.status}
              </span>
            </div>
            
            {/* Project Info */}
            <div className="project-info">
              <p className="project-description">{selectedProject?.description}</p>
              <div className="project-meta-info">
                <div className="due-date-info">
                  <span className="info-label">Due Date:</span>
                  <span className="info-value">{formatDate(selectedProject?.due)}</span>
                  {getDaysRemaining(selectedProject?.due) !== null && (
                    <span className={`days-remaining ${getDaysRemaining(selectedProject?.due) < 0 ? 'overdue' : getDaysRemaining(selectedProject?.due) <= 5 ? 'due-soon' : ''}`}>
                      {getDaysRemaining(selectedProject?.due) < 0 
                        ? `(${Math.abs(getDaysRemaining(selectedProject?.due))} days overdue)` 
                        : getDaysRemaining(selectedProject?.due) === 0 
                          ? '(Due today)' 
                          : `(${getDaysRemaining(selectedProject?.due)} days left)`}
                    </span>
                  )}
                </div>
                <div className="team-info">
                  <span className="info-label">Team:</span>
                  <div className="team-avatars">
                    {selectedProject?.members?.map(memberId => {
                      const member = users.find(u => u.id === memberId);
                      return member ? (
                        <div key={memberId} className="team-avatar" title={member.name}>
                          <img src={member.avatar} alt={member.name} />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Project Progress */}
            <div className="project-progress-section">
              <div className="progress-header">
                <h3>Project Progress</h3>
                <span className="progress-percentage">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-stats">
                <div className="progress-stat">
                  <div className="stat-label">Total Tasks</div>
                  <div className="stat-value">{totalTasks}</div>
                </div>
                <div className="progress-stat">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{completedTasks}</div>
                </div>
                <div className="progress-stat">
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{inProgressTasks}</div>
                </div>
                <div className="progress-stat">
                  <div className="stat-label">To Do</div>
                  <div className="stat-value">{totalTasks - completedTasks - inProgressTasks}</div>
                </div>
              </div>
            </div>
            
            {/* Project Tabs */}
            <div className="project-tabs">
              <button 
                className={`project-tab ${activeTab === 'Tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('Tasks')}
              >
                <FaTasks /> Tasks
              </button>
              <button 
                className={`project-tab ${activeTab === 'Team' ? 'active' : ''}`}
                onClick={() => setActiveTab('Team')}
              >
                <FaUser /> Team
              </button>
              <button 
                className={`project-tab ${activeTab === 'Analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('Analytics')}
              >
                <FaChartBar /> Analytics
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="project-tab-content">
              {activeTab === 'Tasks' ? (
                <>
                  {/* Task Filters */}
                  <div className="task-filters">
                    <div className="filter-section">
                      <button className={`filter-chip ${filterStatus === 'All' ? 'active' : ''}`} onClick={() => setFilterStatus('All')}>
                        All
                      </button>
                      {statuses.map(status => (
                        <button 
                          key={status}
                          className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
                          onClick={() => setFilterStatus(status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    
                    {allTags.length > 0 && (
                      <div className="filter-section">
                        <FaTag className="filter-icon" />
                        <button className={`filter-chip ${!filterTag ? 'active' : ''}`} onClick={() => setFilterTag(null)}>
                          All Tags
                        </button>
                        {allTags.map(tag => (
                          <button 
                            key={tag}
                            className={`filter-chip ${filterTag === tag ? 'active' : ''}`}
                            onClick={() => setFilterTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="filter-section">
                      <FaUser className="filter-icon" />
                      <button className={`filter-chip ${!filterUser ? 'active' : ''}`} onClick={() => setFilterUser(null)}>
                        All Users
                      </button>
                      {users.map(user => (
                        <button 
                          key={user.id}
                          className={`filter-chip ${filterUser === user.id.toString() ? 'active' : ''}`}
                          onClick={() => setFilterUser(user.id.toString())}
                        >
                          {user.name}
                        </button>
                      ))}
                      <button 
                        className={`filter-chip ${filterUser === 'unassigned' ? 'active' : ''}`}
                        onClick={() => setFilterUser('unassigned')}
                      >
                        Unassigned
                      </button>
                    </div>
                    
                    <div className="filter-section">
                      <FaStar className="filter-icon" />
                      <button 
                        className={`filter-chip ${showStarred ? 'active' : ''}`}
                        onClick={() => setShowStarred(!showStarred)}
                      >
                        Starred
                      </button>
                    </div>
                  </div>
                  
                  {/* Kanban Board */}
                  <KanbanBoard 
                    tasks={filteredTasks}
                    statuses={statuses}
                    onTaskMove={handleTaskMove}
                    onTaskCreate={handleTaskCreate}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    onStatusCreate={handleStatusCreate}
                    users={users}
                  />
                </>
              ) : activeTab === 'Team' ? (
                <div className="team-tab-content">
                  <h3>Team Members</h3>
                  <div className="team-members-list">
                    {selectedProject?.members?.map(memberId => {
                      const member = users.find(u => u.id === memberId);
                      return member ? (
                        <div key={memberId} className="team-member-card">
                          <img className="member-avatar" src={member.avatar} alt={member.name} />
                          <div className="member-info">
                            <h4>{member.name}</h4>
                            <p>{member.role || 'Team Member'}</p>
                          </div>
                          <div className="member-tasks">
                            <div className="task-count">
                              <span className="count">{projectTasks.filter(t => t.assignedTo === memberId).length}</span>
                              <span className="label">Tasks</span>
                            </div>
                            <div className="task-count">
                              <span className="count">{projectTasks.filter(t => t.assignedTo === memberId && t.status === 'Completed').length}</span>
                              <span className="label">Completed</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="analytics-tab-content">
                  <h3>Project Analytics</h3>
                  <div className="analytics-message">
                    <FaChartBar className="analytics-icon" />
                    <p>Analytics feature coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects; 