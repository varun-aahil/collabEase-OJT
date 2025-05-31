import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import { FaPlus, FaProjectDiagram, FaTasks, FaCheckCircle, FaFilter, FaSearch, FaChartBar, FaArrowLeft, FaStar, FaTag, FaUser } from 'react-icons/fa';
import '../styles/Projects.css';
import { getProjects, getProjectTasks, createProject, createTask, updateTaskStatus, deleteTask, getUsers, deleteProject } from '../utils/api';
// import { useSelector } from 'react-redux'; // For user info if needed

const defaultStatuses = ["To Do", "In Progress", "Completed"];

const socket = io("http://localhost:5001", { transports: ['websocket'] }); // Updated to match actual server port

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
  const [users, setUsers] = useState([]); // Real users from API
  const [userSearch, setUserSearch] = useState(""); // Search for team members
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [projectsCache, setProjectsCache] = useState(null); // Cache for projects
  const [tasksCache, setTasksCache] = useState({}); // Cache for tasks by project ID
  const [lastFetch, setLastFetch] = useState({}); // Track last fetch times
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    due: '',
    status: 'Planning',
    members: []
  });
  const [projectToDelete, setProjectToDelete] = useState(null); // For delete confirmation
  const [editingProject, setEditingProject] = useState(null); // For editing existing projects
  const [showEditProject, setShowEditProject] = useState(false); // Control edit modal
  
  // Real-time notifications (Socket.io)
  useEffect(() => {
    socket.on("task-update", (msg) => {
      setNotifications((prev) => [...prev, msg]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 4000);
    });
    return () => socket.off("task-update");
  }, []);
  
  // Fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        console.log('🚀 Fetching users from API...');
        console.log('🔑 Auth token in localStorage:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
        
        const response = await getUsers();
        setUsers(response.data);
        console.log('✅ Fetched users successfully:', response.data);
        console.log('👥 Number of users found:', response.data.length);
        
        // Log each user for debugging
        response.data.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
        });
        
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        console.error("📊 Error details:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        // Show specific error message to user
        setError(`Failed to load team members: ${error.response?.data?.message || error.message}. Your friend might not appear in the list.`);
        
        // Still fall back to mock data, but with a more informative message
        console.log('⚠️ Falling back to mock data - your friend will not appear in this list');
        setUsers([
          { id: 1, name: "Rahul", avatar: "https://ui-avatars.com/api/?name=Rahul" },
          { id: 2, name: "Sanjay", avatar: "https://ui-avatars.com/api/?name=Sanjay" },
          { id: 3, name: "Priya", avatar: "https://ui-avatars.com/api/?name=Priya" },
        ]);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Fetch projects from the API with caching
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Check cache first (cache for 5 minutes)
        const now = Date.now();
        const cacheKey = 'projects';
        const lastFetchTime = lastFetch[cacheKey];
        const cacheAge = now - (lastFetchTime || 0);
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        if (projectsCache && cacheAge < cacheExpiry) {
          console.log('Using cached projects data');
          setProjects(projectsCache);
          return;
        }
        
        setLoading(true);
        setError(null);
        console.log('Fetching projects from API...');
        console.log('API URL:', 'http://localhost:5001/api/projects');
        
        const response = await getProjects();
        const projectsData = response.data;
        
        setProjects(projectsData);
        setProjectsCache(projectsData);
        setLastFetch(prev => ({ ...prev, [cacheKey]: now }));
        
        console.log('Projects fetched successfully:', projectsData.length);
      } catch (error) {
        console.error("Error fetching projects:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setError(`Failed to load projects: ${error.message}. Please check if the server is running on port 5001.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [user]);
  
  // Fetch tasks for the selected project with caching
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProjectId) return;
      
      try {
        // Check cache first (cache for 2 minutes for tasks as they change more frequently)
        const now = Date.now();
        const cacheKey = `tasks_${selectedProjectId}`;
        const lastFetchTime = lastFetch[cacheKey];
        const cacheAge = now - (lastFetchTime || 0);
        const cacheExpiry = 2 * 60 * 1000; // 2 minutes
        
        if (tasksCache[selectedProjectId] && cacheAge < cacheExpiry) {
          console.log('Using cached tasks data for project:', selectedProjectId);
          setTasks(tasksCache[selectedProjectId]);
          return;
        }
        
        setLoading(true);
        setError(null);
        console.log('Fetching tasks from API for project:', selectedProjectId);
        
        const response = await getProjectTasks(selectedProjectId);
        const tasksData = response.data;
        
        setTasks(tasksData);
        setTasksCache(prev => ({ ...prev, [selectedProjectId]: tasksData }));
        setLastFetch(prev => ({ ...prev, [cacheKey]: now }));
        
        console.log('Tasks fetched successfully:', tasksData.length);
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
    console.log('🚀 Moving task', taskId, 'to', newStatus);
    
    try {
      // Store original task for potential rollback
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) {
        console.error('❌ Task not found:', taskId);
        return;
      }
      
      console.log('📦 Original task:', originalTask);
      
      // IMMEDIATE UI UPDATE (optimistic)
      const updatedTask = { ...originalTask, status: newStatus };
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        );
        console.log('⚡ Optimistic update applied - UI should update instantly');
        return newTasks;
      });
      
      // Update cache immediately too
      if (selectedProjectId && tasksCache[selectedProjectId]) {
        setTasksCache(prev => ({
          ...prev,
          [selectedProjectId]: prev[selectedProjectId].map(task =>
            task.id === taskId ? updatedTask : task
          )
        }));
      }
      
      // THEN make API call in background
      console.log('🌐 Making API call to update task status...');
      await updateTaskStatus(taskId, newStatus);
      console.log('✅ API call successful - task status updated in database');
      
      // Emit socket event for real-time updates
      socket.emit("task-update", `Task moved to ${newStatus}`);
      
    } catch (error) {
      console.error("❌ Error updating task status:", error);
      console.error("Error details:", error.response?.data);
      
      // ROLLBACK on error - revert to original state
      console.log('🔄 Rolling back optimistic update due to error');
      setTasks(prevTasks => {
        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask) {
          return prevTasks.map(task =>
            task.id === taskId ? originalTask : task
          );
        }
        return prevTasks;
      });
      
      // Revert cache too
      if (selectedProjectId && tasksCache[selectedProjectId]) {
        setTasksCache(prev => ({
          ...prev,
          [selectedProjectId]: prev[selectedProjectId].map(task => {
            const originalTask = tasks.find(t => t.id === taskId);
            return task.id === taskId && originalTask ? originalTask : task;
          })
        }));
      }
      
      setError(`Failed to update task status: ${error.message}`);
    }
  };
  
  // Handle new task creation
  const handleTaskCreate = async (newTask) => {
    try {
      console.log('Attempting to create task:', newTask);
      console.log('Selected project ID:', selectedProjectId);
      
      if (!selectedProjectId) {
        console.error('No project selected');
        setError("Please select a project first.");
        return;
      }
      
      const taskWithProject = {
        ...newTask,
        project: selectedProjectId,
        projectId: selectedProjectId // Add both for compatibility
      };
      
      console.log('Task data being sent to API:', taskWithProject);
      
      // Optimistically update the UI first
      const tempTask = {
        id: Date.now(), // Temporary ID
        ...taskWithProject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tempId: true // Mark as temporary
      };
      
      // Add to local state immediately for instant UI update
      setTasks(prevTasks => [...prevTasks, tempTask]);
      
      // Then make the API call
      const response = await createTask(taskWithProject);
      console.log('Task created successfully:', response.data);
      
      // Replace the temporary task with the real one from server
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.tempId && task.id === tempTask.id 
            ? { ...response.data, projectId: selectedProjectId } // Ensure projectId is set
            : task
        )
      );
      
      socket.emit("task-update", `New task created: ${newTask.title}`);
    } catch (error) {
      console.error("Error creating task:", error);
      console.error("Error response:", error.response?.data);
      
      // Remove the temporary task on error
      setTasks(prevTasks => 
        prevTasks.filter(task => !(task.tempId && task.id === Date.now()))
      );
      
      setError(`Failed to create task: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // Handle task update
  const handleTaskUpdate = async (updatedTask) => {
    try {
      // Optimistically update UI first
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      
      // Update cache
      if (selectedProjectId && tasksCache[selectedProjectId]) {
        setTasksCache(prev => ({
          ...prev,
          [selectedProjectId]: prev[selectedProjectId].map(task =>
            task.id === updatedTask.id ? updatedTask : task
          )
        }));
      }
      
      const response = await updateTaskStatus(updatedTask.id, updatedTask.status);
      
      // Update with server response if different
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? response.data : task
        )
      );
      
      socket.emit("task-update", `Task updated: ${updatedTask.title}`);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
      
      // Revert optimistic update on error
      if (selectedProjectId && tasksCache[selectedProjectId]) {
        const originalTask = tasksCache[selectedProjectId].find(t => t.id === updatedTask.id);
        if (originalTask) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === updatedTask.id ? originalTask : task
            )
          );
        }
      }
    }
  };
  
  // Handle task deletion
  const handleTaskDelete = async (taskId) => {
    // Store original task for potential rollback
    const originalTask = tasks.find(t => t.id === taskId);
    
    try {
      // Optimistically update UI first
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Update cache
      if (selectedProjectId && tasksCache[selectedProjectId]) {
        setTasksCache(prev => ({
          ...prev,
          [selectedProjectId]: prev[selectedProjectId].filter(task => task.id !== taskId)
        }));
      }
      
      await deleteTask(taskId);
      socket.emit("task-update", `Task deleted`);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task. Please try again.");
      
      // Revert optimistic update on error
      if (originalTask) {
        setTasks(prevTasks => [...prevTasks, originalTask]);
        if (selectedProjectId && tasksCache[selectedProjectId]) {
          setTasksCache(prev => ({
            ...prev,
            [selectedProjectId]: [...prev[selectedProjectId], originalTask]
          }));
        }
      }
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

  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    try {
      console.log('🗑️ Deleting project:', projectId);
      
      // Store original project for potential rollback
      const originalProject = projects.find(p => p.id === projectId);
      if (!originalProject) {
        console.error('❌ Project not found:', projectId);
        return;
      }
      
      // Optimistically remove from UI
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      
      // Update cache
      setProjectsCache(prevCache => prevCache ? prevCache.filter(p => p.id !== projectId) : null);
      
      // Make API call
      console.log('🌐 Making API call to delete project...');
      await deleteProject(projectId);
      console.log('✅ Project deleted successfully from database');
      
      // Close delete confirmation
      setProjectToDelete(null);
      
      // If we were viewing this project, go back to projects overview
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      
      // Rollback - add project back to UI
      const originalProject = projects.find(p => p.id === projectId);
      if (originalProject) {
        setProjects(prevProjects => [...prevProjects, originalProject]);
        setProjectsCache(prevCache => prevCache ? [...prevCache, originalProject] : null);
      }
      
      // Check for specific error status codes and provide better user messages
      if (error.response && error.response.status === 403) {
        setError("Permission denied: Only the project owner can delete a project.");
      } else {
        setError(`Failed to delete project: ${error.message}`);
      }
      setProjectToDelete(null);
    }
  };

  // Handle project editing
  const handleEditProject = (project) => {
    // Format date for input field (YYYY-MM-DD)
    let formattedDue = '';
    if (project.due) {
      const date = new Date(project.due);
      if (!isNaN(date.getTime())) {
        formattedDue = date.toISOString().split('T')[0];
      }
    }
    
    setEditingProject({
      id: project.id,
      name: project.title || project.name,
      description: project.description || '',
      due: formattedDue,
      status: project.status || 'Planning',
      members: project.teamMembers?.map(member => typeof member === 'string' ? member : member.id) || []
    });
    setShowEditProject(true);
    setUserSearch(''); // Clear search when opening modal
  };

  // Handle project update
  const handleUpdateProject = async () => {
    if (!editingProject.name || !editingProject.id) return;
    
    try {
      const projectData = {
        title: editingProject.name,
        description: editingProject.description,
        due: editingProject.due,
        status: editingProject.status,
        teamMembers: editingProject.members
      };
      
      console.log('🔄 Updating project:', editingProject.id, projectData);
      
      // Make API call to update project
      const response = await fetch(`http://localhost:5001/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedProject = await response.json();
      console.log('✅ Project updated successfully:', updatedProject);
      
      // Update projects list
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === editingProject.id ? updatedProject : p)
      );
      
      // Update cache
      setProjectsCache(prevCache => 
        prevCache ? prevCache.map(p => p.id === editingProject.id ? updatedProject : p) : null
      );
      
      // Close edit modal
      setShowEditProject(false);
      setEditingProject(null);
      
      // If we're viewing this project, refresh the view
      if (selectedProjectId === editingProject.id) {
        // Force a refresh of the project details
        window.location.reload();
      }
      
    } catch (error) {
      console.error("❌ Error updating project:", error);
      setError("Failed to update project. Please try again.");
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
    
    // Handle assignedTo filtering for both string IDs and user objects
    if (filterUser && filterUser !== "unassigned") {
      const taskAssignedTo = task.assignedTo?.id || task.assignedTo;
      if (taskAssignedTo !== filterUser) return false;
    }
    if (filterUser === "unassigned" && task.assignedTo) return false;
    
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "All" && task.status !== filterStatus) return false;
    return true;
  });
  
  // Debug logging for task data
  if (selectedProjectId) {
    console.log('Debug - Project tasks:', projectTasks.length);
    console.log('Debug - Filtered tasks:', filteredTasks.length);
    console.log('Debug - Selected project ID:', selectedProjectId);
    console.log('Debug - All tasks:', tasks.length);
  }
  
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button 
                  className="debug-users-btn" 
                  onClick={async () => {
                    console.log('🔧 Manual debug test for users API...');
                    try {
                      const response = await getUsers();
                      console.log('✅ Manual test successful:', response.data);
                      alert(`Found ${response.data.length} users! Check console for details.`);
                    } catch (error) {
                      console.error('❌ Manual test failed:', error);
                      alert(`API test failed: ${error.response?.data?.message || error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  🔧 Test Users API
                </button>
                <button className="new-project-button" onClick={() => setShowAddProject(true)}>
                  <FaPlus /> New Project
                </button>
              </div>
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
                .filter(project => !search || (project.title || project.name || '').toLowerCase().includes(search.toLowerCase()) || (project.description || '').toLowerCase().includes(search.toLowerCase()))
                .map(project => (
                <div key={project.id} className="project-card" onClick={() => setSelectedProjectId(project.id)}>
                  <div className="project-header">
                    <h3>{project.title || project.name}</h3>
                    <div className="project-actions">
                      <span className={`project-status ${getStatusClass(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
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
                      {/* Show team members avatars in project grid */}
                      {(project.teamMembers || project.members || []).map(memberIdOrObj => {
                        const memberId = typeof memberIdOrObj === 'string' ? memberIdOrObj : memberIdOrObj?.id;
                        const member = typeof memberIdOrObj === 'object' ? memberIdOrObj : users.find(u => u.id === memberId);
                        return member ? (
                          <div key={member.id || memberId} className="team-avatar" title={member.displayName || member.name}>
                            <img src={member.image || member.avatar} alt={member.displayName || member.name} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="project-footer">
                    {/* Check if user is owner - handle both string ID and object formats */}
                    {(typeof project.owner === 'object' ? project.owner?.id : project.owner) === user?.id && (
                      <button 
                        className="delete-project-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the project
                          setProjectToDelete(project);
                        }}
                      >
                        Delete Project
                      </button>
                    )}
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
                      <div className="team-member-search">
                        <div className="search-input-container">
                          <FaSearch className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search team members..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="team-search-input"
                          />
                        </div>
                      </div>
                      <div className="team-selection">
                        {loadingUsers ? (
                          <div className="loading-users">
                            <div className="loading-spinner"></div>
                            <span>Loading team members...</span>
                          </div>
                        ) : (
                          users
                            .filter(user => 
                              user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                              (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                            )
                            .map(user => (
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
                                title={user.email}
                              >
                                <img src={user.avatar} alt={user.name} />
                                <div className="user-info">
                                  <span className="user-name">{user.name}</span>
                                  {user.role && <span className="user-role">{user.role}</span>}
                                </div>
                                {newProject.members.includes(user.id) && (
                                  <FaCheckCircle className="selected-icon" />
                                )}
                              </div>
                            ))
                        )}
                        {!loadingUsers && users.filter(user => 
                          user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                        ).length === 0 && userSearch && (
                          <div className="no-users-found">
                            No team members found matching "{userSearch}"
                          </div>
                        )}
                      </div>
                      {newProject.members.length > 0 && (
                        <div className="selected-members">
                          <h4>Selected Members ({newProject.members.length})</h4>
                          <div className="selected-member-list">
                            {newProject.members.map(memberId => {
                              const member = users.find(u => u.id === memberId);
                              return member ? (
                                <div key={memberId} className="selected-member">
                                  <img src={member.avatar} alt={member.name} />
                                  <span>{member.name}</span>
                                  <button
                                    type="button"
                                    className="remove-member"
                                    onClick={() => {
                                      setNewProject({
                                        ...newProject,
                                        members: newProject.members.filter(id => id !== memberId)
                                      });
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
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
            
            {/* Delete Project Confirmation */}
            {projectToDelete && (
              <div className="modal-overlay" onClick={() => setProjectToDelete(null)}>
                <div className="modal-content delete-confirmation" onClick={e => e.stopPropagation()}>
                  <div className="delete-header">
                    <div className="delete-icon">🗑️</div>
                    <h2>Delete Project</h2>
                  </div>
                  <div className="delete-message">
                    <p>Are you sure you want to delete "<strong>{projectToDelete.title || projectToDelete.name}</strong>"?</p>
                    <p className="warning-text">
                      This action cannot be undone. All tasks and data associated with this project will be permanently deleted.
                    </p>
                  </div>
                  <div className="delete-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => setProjectToDelete(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteProject(projectToDelete.id)}
                    >
                      Delete Project
                    </button>
                  </div>
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
              <h1>{selectedProject?.title || selectedProject?.name}</h1>
              <div className="project-header-actions">
                <span className={`project-status ${getStatusClass(selectedProject?.status)}`}>
                  {selectedProject?.status}
                </span>
                <button 
                  className="edit-project-btn"
                  onClick={() => handleEditProject(selectedProject)}
                  title="Edit Project"
                >
                  Edit
                </button>
              </div>
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
                    {(selectedProject?.teamMembers || selectedProject?.members || []).map(memberIdOrObj => {
                      // Handle both cases: member could be an ID string or a user object
                      const memberId = typeof memberIdOrObj === 'string' ? memberIdOrObj : memberIdOrObj?.id;
                      const member = typeof memberIdOrObj === 'object' ? memberIdOrObj : users.find(u => u.id === memberId);
                      
                      return member ? (
                        <div key={member.id || memberId} className="team-avatar" title={member.displayName || member.name}>
                          <img src={member.image || member.avatar} alt={member.displayName || member.name} />
                        </div>
                      ) : null;
                    })}
                    {(!selectedProject?.teamMembers && !selectedProject?.members) && (
                      <span style={{ color: '#6c757d', fontStyle: 'italic' }}>No team members assigned</span>
                    )}
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
                    {/* Project Team Info */}
                    <div style={{ 
                      marginBottom: '1rem', 
                      padding: '0.75rem', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px', 
                      border: '1px solid #e9ecef',
                      fontSize: '0.9rem',
                      color: '#495057'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaUser style={{ color: '#4e73df' }} />
                        <span>
                          <strong>Project Team:</strong> {(selectedProject?.teamMembers || selectedProject?.members || []).length} member(s) available for task assignment
                        </span>
                      </div>
                      {(selectedProject?.teamMembers || selectedProject?.members || []).length === 0 && (
                        <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#6c757d' }}>
                          No team members assigned to this project. Add team members to assign tasks.
                        </div>
                      )}
                    </div>
                    
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
                        All Assignees
                      </button>
                      {/* Only show project team members in filter */}
                      {(selectedProject?.teamMembers || selectedProject?.members || []).map(memberIdOrObj => {
                        const memberId = typeof memberIdOrObj === 'string' ? memberIdOrObj : memberIdOrObj?.id;
                        const member = typeof memberIdOrObj === 'object' ? memberIdOrObj : users.find(u => u.id === memberId);
                        
                        return member ? (
                          <button 
                            key={member.id || memberId}
                            className={`filter-chip ${filterUser === (member.id || memberId) ? 'active' : ''}`}
                            onClick={() => setFilterUser(member.id || memberId)}
                          >
                            {member.displayName || member.name}
                          </button>
                        ) : null;
                      })}
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
                    users={(() => {
                      // Filter users to only include project team members
                      const projectMembers = (selectedProject?.teamMembers || selectedProject?.members || []);
                      const filteredUsers = projectMembers.map(memberIdOrObj => {
                        const memberId = typeof memberIdOrObj === 'string' ? memberIdOrObj : memberIdOrObj?.id;
                        const member = typeof memberIdOrObj === 'object' ? memberIdOrObj : users.find(u => u.id === memberId);
                        return member;
                      }).filter(Boolean); // Remove any null/undefined members
                      
                      console.log('🎯 Project Team Members for Task Assignment:');
                      console.log(`  Project: ${selectedProject?.title || selectedProject?.name}`);
                      console.log(`  Total Available Users: ${users.length}`);
                      console.log(`  Project Team Members: ${filteredUsers.length}`);
                      filteredUsers.forEach((member, index) => {
                        console.log(`    ${index + 1}. ${member?.displayName || member?.name} (${member?.id})`);
                      });
                      
                      return filteredUsers;
                    })()}
                  />
                </>
              ) : activeTab === 'Team' ? (
                <div className="team-tab-content">
                  <h3>Team Members</h3>
                  <div className="team-members-list">
                    {(selectedProject?.teamMembers || selectedProject?.members || []).map(memberIdOrObj => {
                      // Handle both cases: member could be an ID string or a user object
                      const memberId = typeof memberIdOrObj === 'string' ? memberIdOrObj : memberIdOrObj?.id;
                      const member = typeof memberIdOrObj === 'object' ? memberIdOrObj : users.find(u => u.id === memberId);
                      
                      return member ? (
                        <div key={member.id || memberId} className="team-member-card">
                          <img className="member-avatar" src={member.image || member.avatar} alt={member.displayName || member.name} />
                          <div className="member-info">
                            <h4>{member.displayName || member.name}</h4>
                            <p>{member.role || 'Team Member'}</p>
                          </div>
                          <div className="member-tasks">
                            <div className="task-count">
                              <span className="count">{projectTasks.filter(t => (t.assignedTo?.id || t.assignedTo) === (member.id || memberId)).length}</span>
                              <span className="label">Tasks</span>
                            </div>
                            <div className="task-count">
                              <span className="count">{projectTasks.filter(t => (t.assignedTo?.id || t.assignedTo) === (member.id || memberId) && t.status === 'Completed').length}</span>
                              <span className="label">Completed</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {(!selectedProject?.teamMembers && !selectedProject?.members) && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                        <FaUser style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                        <h4>No Team Members</h4>
                        <p>This project doesn't have any team members assigned yet.</p>
                      </div>
                    )}
                    {(selectedProject?.teamMembers?.length === 0 && selectedProject?.members?.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                        <FaUser style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                        <h4>No Team Members</h4>
                        <p>This project doesn't have any team members assigned yet.</p>
                      </div>
                    )}
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
        
        {/* Edit Project Form - Moved outside of the conditional rendering */}
        {showEditProject && editingProject && (
          <div className="modal-overlay" onClick={() => setShowEditProject(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Edit Project</h2>
              <form className="new-project-form">
                <div className="form-group">
                  <label htmlFor="editProjectName">Project Name</label>
                  <input 
                    type="text" 
                    id="editProjectName" 
                    value={editingProject.name}
                    onChange={e => setEditingProject({...editingProject, name: e.target.value})}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editProjectDescription">Description</label>
                  <textarea 
                    id="editProjectDescription"
                    value={editingProject.description}
                    onChange={e => setEditingProject({...editingProject, description: e.target.value})}
                    placeholder="Enter project description"
                    rows="3"
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="editProjectDue">Due Date</label>
                    <input 
                      type="date" 
                      id="editProjectDue"
                      value={editingProject.due}
                      onChange={e => setEditingProject({...editingProject, due: e.target.value})}
                    />
                  </div>
                  <div className="form-group half">
                    <label htmlFor="editProjectStatus">Status</label>
                    <select 
                      id="editProjectStatus"
                      value={editingProject.status}
                      onChange={e => setEditingProject({...editingProject, status: e.target.value})}
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
                  <div className="team-member-search">
                    <div className="search-input-container">
                      <FaSearch className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search team members..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="team-search-input"
                      />
                    </div>
                  </div>
                  <div className="team-selection">
                    {loadingUsers ? (
                      <div className="loading-users">
                        <div className="loading-spinner"></div>
                        <span>Loading team members...</span>
                      </div>
                    ) : (
                      users
                        .filter(user => 
                          user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                        )
                        .map(user => (
                          <div 
                            key={user.id}
                            className={`team-select-item ${editingProject.members.includes(user.id) ? 'selected' : ''}`}
                            onClick={() => {
                              const isSelected = editingProject.members.includes(user.id);
                              setEditingProject({
                                ...editingProject, 
                                members: isSelected 
                                  ? editingProject.members.filter(id => id !== user.id)
                                  : [...editingProject.members, user.id]
                              });
                            }}
                            title={user.email}
                          >
                            <img src={user.avatar} alt={user.name} />
                            <div className="user-info">
                              <span className="user-name">{user.name}</span>
                              {user.role && <span className="user-role">{user.role}</span>}
                            </div>
                            {editingProject.members.includes(user.id) && (
                              <FaCheckCircle className="selected-icon" />
                            )}
                          </div>
                        ))
                    )}
                    {!loadingUsers && users.filter(user => 
                      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                    ).length === 0 && userSearch && (
                      <div className="no-users-found">
                        No team members found matching "{userSearch}"
                      </div>
                    )}
                  </div>
                  {editingProject.members.length > 0 && (
                    <div className="selected-members">
                      <h4>Selected Members ({editingProject.members.length})</h4>
                      <div className="selected-member-list">
                        {editingProject.members.map(memberId => {
                          const member = users.find(u => u.id === memberId);
                          return member ? (
                            <div key={memberId} className="selected-member">
                              <img src={member.avatar} alt={member.name} />
                              <span>{member.name}</span>
                              <button
                                type="button"
                                className="remove-member"
                                onClick={() => {
                                  setEditingProject({
                                    ...editingProject,
                                    members: editingProject.members.filter(id => id !== memberId)
                                  });
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditProject(false);
                      setEditingProject(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="submit-btn"
                    onClick={handleUpdateProject}
                  >
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;
