import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import { FaPlus, FaProjectDiagram, FaTasks, FaCheckCircle, FaFilter, FaSearch, FaChartBar, FaArrowLeft, FaStar, FaTag, FaUser } from 'react-icons/fa';
import '../styles/Projects.css';
import { getProjects, getProjectTasks, createProject, createTask, updateTaskStatus, deleteTask } from '../utils/api';
// import { useSelector } from 'react-redux'; // For user info if needed

// Mock users - this should eventually be replaced with real user data from the API
const users = [
  { id: 1, name: "Rahul", avatar: "https://ui-avatars.com/api/?name=Rahul" },
  { id: 2, name: "Sanjay", avatar: "https://ui-avatars.com/api/?name=Sanjay" },
  { id: 3, name: "Priya", avatar: "https://ui-avatars.com/api/?name=Priya" },
];

const defaultStatuses = ["To Do", "In Progress", "Completed"];

const socket = io("http://localhost:5000", { transports: ['websocket'] }); // Adjust backend URL as needed

function Projects({ user, setUser }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState(defaultStatuses);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTag, setFilterTag] = useState(null);
  const [filterUser, setFilterUser] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("Tasks");
  const [search, setSearch] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  
  // Fetch projects from the API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProjects();
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Fetch tasks for the selected project
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProjectId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await getProjectTasks(selectedProjectId);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to load tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [selectedProjectId]);
  
  // Calculate progress for each project
  useEffect(() => {
    if (!selectedProjectId) return;
    
    const projectTasks = tasks.filter(t => t.projectId === selectedProjectId || t.project === selectedProjectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === "Completed").length;
    
    // Calculate progress - if no tasks, progress is 0
    const newProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    
    // Update the selected project's progress
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === selectedProjectId ? { ...project, progress: newProgress } : project
      )
    );
  }, [tasks, selectedProjectId]);

  // Handle task move in Kanban board
  const handleTaskMove = async (taskId, newStatus) => {
    try {
      // Update task status in the database
      await updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus }
            : task
        );
        return updatedTasks;
      });
      
      socket.emit("task-update", `Task moved to ${newStatus}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      setError("Failed to update task status. Please try again.");
    }
  };
  
  // Handle new task creation
  const handleTaskCreate = async (newTask) => {
    try {
      const taskWithProject = {
        ...newTask,
        project: selectedProjectId
      };
      
      const response = await createTask(taskWithProject);
      setTasks(prevTasks => [...prevTasks, response.data]);
      socket.emit("task-update", `New task created: ${newTask.title}`);
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task. Please try again.");
    }
  };
  
  // Handle task update
  const handleTaskUpdate = async (updatedTask) => {
    try {
      const response = await updateTaskStatus(updatedTask.id, updatedTask.status);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? response.data : task
        )
      );
      socket.emit("task-update", `Task updated: ${updatedTask.title}`);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
    }
  };
  
  // Handle task deletion
  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      socket.emit("task-update", `Task deleted`);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task. Please try again.");
    }
  };
  
  // Handle adding new status column
  const handleStatusCreate = (newStatus) => {
    if (!statuses.includes(newStatus)) {
      setStatuses(prevStatuses => [...prevStatuses, newStatus]);
    }
  };
  
  // Handle new project creation
  const handleCreateProject = async () => {
    if (!newProject.name) return;
    
    try {
      const projectData = {
        title: newProject.name,
        description: newProject.description,
        due: newProject.due,
        status: newProject.status,
        teamMembers: newProject.members
      };
      
      const response = await createProject(projectData);
      setProjects(prevProjects => [...prevProjects, response.data]);
      
      setNewProject({
        name: '',
        description: '',
        due: '',
        status: 'Planning',
        members: []
      });
      setShowAddProject(false);
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project. Please try again.");
    }
  };

  // Filter tasks for selected project
  const projectTasks = selectedProjectId
    ? tasks.filter(t => t.projectId === selectedProjectId || t.project === selectedProjectId)
    : [];

  // Stats
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === "Completed").length;
  const inProgressTasks = projectTasks.filter(t => t.status === "In Progress").length;

  // Calculate progress for display
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

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
        {loading && <div className="loading-indicator">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        
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
                      <span>
                        {tasks.filter(t => t.projectId === project.id).length > 0 
                          ? (project.progress || 0) + '%' 
                          : '0%'}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${tasks.filter(t => t.projectId === project.id).length > 0 
                          ? (project.progress || 0) 
                          : 0}%` }}
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