import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import '../styles/Topbar.css';
// import { useSelector } from 'react-redux'; // For user info if needed

// Mock users
const users = [
  { id: 1, name: "Rahul", avatar: "https://ui-avatars.com/api/?name=Rahul" },
  { id: 2, name: "Sanjay", avatar: "https://ui-avatars.com/api/?name=Sanjay" },
  { id: 3, name: "Priya", avatar: "https://ui-avatars.com/api/?name=Priya" },
];

// Mock projects
const mockProjects = [
  { id: 101, name: "Website Redesign", description: "Revamp the company website.", due: "2024-07-01", status: "Active" },
  { id: 102, name: "Mobile App", description: "Build the new mobile app.", due: "2024-08-15", status: "Planning" },
  { id: 103, name: "Marketing Campaign", description: "Launch summer campaign.", due: "2024-06-20", status: "Active" },
];

// Mock tasks
const initialTasks = [
  {
    id: 1,
    projectId: 101,
    title: "Design UI",
    status: "To Do",
    tags: ["#frontend", "#design"],
    assignedTo: 1,
    due: "2024-06-10",
    pinned: false,
    subtasks: [
      { id: 1, title: "Header", done: true },
      { id: 2, title: "Footer", done: false },
    ],
    dependencies: [],
    attachments: [],
    history: [
      { user: 1, action: "created", at: "2024-06-01T10:00" },
      { user: 2, action: "moved to To Do", at: "2024-06-01T10:05" },
    ],
    customStatus: null,
  },
  {
    id: 2,
    projectId: 101,
    title: "Setup Backend",
    status: "In Progress",
    tags: ["#backend", "#urgent"],
    assignedTo: 2,
    due: "2024-06-09",
    pinned: true,
    subtasks: [],
    dependencies: [1],
    attachments: [],
    history: [
      { user: 2, action: "created", at: "2024-06-01T10:10" },
      { user: 2, action: "moved to In Progress", at: "2024-06-02T09:00" },
    ],
    customStatus: null,
  },
  {
    id: 3,
    projectId: 102,
    title: "Write Docs",
    status: "Completed",
    tags: ["#docs"],
    assignedTo: null,
    due: "2024-06-08",
    pinned: false,
    subtasks: [],
    dependencies: [],
    attachments: [],
    history: [
      { user: 3, action: "created", at: "2024-06-01T10:20" },
      { user: 3, action: "moved to Done", at: "2024-06-03T12:00" },
    ],
    customStatus: null,
  },
];

const defaultStatuses = ["To Do", "In Progress", "Completed"];

const socket = io("http://localhost:5000"); // Adjust backend URL as needed

function Projects({ user, setUser }) {
  const [projects] = useState(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [statuses, setStatuses] = useState(defaultStatuses);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTag, setFilterTag] = useState(null);
  const [filterUser, setFilterUser] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [showHistoryTask, setShowHistoryTask] = useState(null);
  const [customStatusInput, setCustomStatusInput] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("Tasks");
  const [search, setSearch] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);

  // Real-time notifications (Socket.io)
  useEffect(() => {
    socket.on("task-update", (msg) => {
      setNotifications((prev) => [...prev, msg]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 4000);
    });
    return () => socket.off("task-update");
  }, []);

  // Fetch user profile photo
  useEffect(() => {
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

  // Navigation handlers
  const handleProfileNavigation = () => {
    // Optionally close dropdowns if you have them
    window.location.href = '/profile';
  };
  const handleLogout = async () => {
    if (setUser) setUser(null);
    window.location.href = '/login';
    try {
      await fetch("http://localhost:5000/auth/logout", {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Filter tasks for selected project
  const projectTasks = selectedProjectId
    ? tasks.filter(t => t.projectId === selectedProjectId)
    : [];

  // Stats
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === "Completed").length;
  const inProgressTasks = projectTasks.filter(t => t.status === "In Progress").length;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtering
  const allTags = Array.from(new Set(projectTasks.flatMap((t) => t.tags)));
  let filteredTasks = projectTasks.filter((task) => {
    if (showStarred && !task.pinned) return false;
    if (filterTag && !task.tags.includes(filterTag)) return false;
    if (filterUser === "unassigned" && task.assignedTo) return false;
    if (filterUser && filterUser !== "unassigned" && task.assignedTo !== filterUser) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "All" && task.status !== filterStatus) return false;
    return true;
  });

  // Drag and drop handlers
  const onDragStart = (e, id) => {
    e.dataTransfer.setData("id", id);
  };
  const onDrop = (e, status) => {
    const id = e.dataTransfer.getData("id");
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === Number(id)
          ? {
              ...task,
              status,
              history: [
                ...task.history,
                { user: 1, action: `moved to ${status}`, at: new Date().toISOString() },
              ],
            }
          : task
      )
    );
    socket.emit("task-update", `Task #${id} moved to ${status}`);
  };
  const onDragOver = (e) => e.preventDefault();

  // Add custom status
  const addCustomStatus = () => {
    if (customStatusInput && !statuses.includes(customStatusInput)) {
      setStatuses([...statuses, customStatusInput]);
      setCustomStatusInput("");
    }
  };

  // Pin/unpin task
  const togglePin = (id) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === id ? { ...task, pinned: !task.pinned } : task
      )
    );
  };

  // Subtask completion
  const toggleSubtask = (taskId, subId) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((s) =>
                s.id === subId ? { ...s, done: !s.done } : s
              ),
            }
          : task
      )
    );
  };

  // Due date color
  const dueColor = (due) => {
    const today = new Date().toISOString().slice(0, 10);
    if (due < today) return "overdue";
    if (due === today) return "due-today";
    return "future";
  };

  // File attachment (mock)
  const attachFile = (taskId, file) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              attachments: [...task.attachments, { name: file.name, url: URL.createObjectURL(file) }],
            }
          : task
      )
    );
  };

  // AI Suggestion (mock)
  const aiSuggest = (title) => {
    if (title.toLowerCase().includes("bug")) return { tag: "#bug", due: "2024-06-12" };
    return {};
  };

  // Tabs content
  const renderTabs = () => {
    if (activeTab === "Tasks") {
      return (
        <>
          <div className="project-filters flex items-center gap-2 mb-4">
            <button className={`add-task-btn`}>+ Add Task</button>
            <button className={`filter-btn${filterStatus === "All" ? " active" : ""}`} onClick={() => setFilterStatus("All")}>All</button>
            {statuses.map(status => (
              <button key={status} className={`filter-btn${filterStatus === status ? " active" : ""}`} onClick={() => setFilterStatus(status)}>{status}</button>
            ))}
            <input
              type="text"
              className="task-search"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="kanban-board">
            {statuses.map((status) => (
              <div
                key={status}
                onDrop={(e) => onDrop(e, status)}
                onDragOver={onDragOver}
                className="kanban-column"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h2>{status}</h2>
                  <span className="kanban-count">{filteredTasks.filter(t => t.status === status).length}</span>
                </div>
                {filteredTasks.filter((task) => task.status === status).length === 0 && (
                  <div className="empty-state">No tasks</div>
                )}
                {filteredTasks.filter((task) => task.status === status).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className={`kanban-task${task.pinned ? ' pinned' : ''} ${dueColor(task.due)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="task-title">{task.title}</div>
                      <button className={`starred-btn${task.pinned ? '' : ' inactive'}`} onClick={() => togglePin(task.id)}>{task.pinned ? "⭐" : "☆"}</button>
                    </div>
                    <div className="task-tags">
                      {task.tags.map((tag) => (
                        <span key={tag} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                    <div className="task-meta">
                      <div className="task-assigned">
                        {task.assignedTo ? (
                          <img src={users.find((u) => u.id === task.assignedTo)?.avatar} alt="avatar" />
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}
                      </div>
                      <span className="task-due">Due: {task.due}</span>
                    </div>
                    {/* Subtasks */}
                    {task.subtasks.length > 0 && (
                      <div className="subtasks">
                        <div className="text-xs font-semibold mb-1">Subtasks</div>
                        <div className="subtasks-list">
                          {task.subtasks.map((s) => (
                            <label key={s.id} className="subtask-label">
                              <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(task.id, s.id)} />
                              {s.title}
                            </label>
                          ))}
                        </div>
                        <div className="subtask-progress">
                          <div
                            className="subtask-progress-bar"
                            style={{ width: `${(task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {/* Attachments */}
                    <div className="attachments">
                      <input type="file" onChange={(e) => attachFile(task.id, e.target.files[0])} className="text-xs" />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.attachments.map((a, i) => (
                          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="attachment-link">{a.name}</a>
                        ))}
                      </div>
                    </div>
                    {/* History/Activity Log */}
                    <button className="history-btn" onClick={() => setShowHistoryTask(task.id)}>View History</button>
                    {/* Dependencies */}
                    {task.dependencies.length > 0 && (
                      <div className="dependencies">Depends on: {task.dependencies.join(", ")}</div>
                    )}
                  </div>
                ))}
                {/* Add new custom status column */}
                {status === "Completed" && customStatusInput !== null && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customStatusInput}
                      onChange={(e) => setCustomStatusInput(e.target.value)}
                      placeholder="Add new status"
                      className="border px-2 py-1 rounded text-xs"
                    />
                    <button className="ml-2 px-2 py-1 rounded bg-blue-200 text-xs" onClick={addCustomStatus}>Add</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      );
    }
    // Team, Chat, Automations tabs placeholder
    return <div className="empty-state">Coming soon!</div>;
  };

  // Main layout: using dashboard layout
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
          {!selectedProjectId ? (
            <div className="all-projects-view">
              <div className="dashboard-header">
                <h1>All Projects</h1>
                <button className="create-btn">
                  <i className="fas fa-plus"></i> New Project
                </button>
              </div>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <i className="fas fa-project-diagram"></i>
                  <div className="stat-info">
                    <h3>Total Projects</h3>
                    <p>{projects.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-tasks"></i>
                  <div className="stat-info">
                    <h3>Active Tasks</h3>
                    <p>{tasks.filter(t => t.status !== "Completed").length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-check-circle"></i>
                  <div className="stat-info">
                    <h3>Completed</h3>
                    <p>{tasks.filter(t => t.status === "Completed").length}</p>
                  </div>
                </div>
              </div>
              <div className="dashboard-sections">
                <section className="section">
                  <div className="section-header">
                    <h2>Recent Projects</h2>
                    <button className="add-btn">
                      <i className="fas fa-plus"></i> Add Project
                    </button>
                  </div>
                  <div className="projects-grid">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        className="project-card"
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <div className="project-header">
                          <h3>{project.name}</h3>
                          <button className="delete-btn">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <p>{project.description}</p>
                        <div className="project-members">
                          <div className="member-list">
                            {users.slice(0, 3).map(user => (
                              <div key={user.id} className="member-avatar">
                                <img src={user.avatar} alt={user.name} />
                              </div>
                            ))}
                          </div>
                          <span className="project-status">{project.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="project-details-page">
              <button className="back-btn" onClick={() => setSelectedProjectId(null)}>
                <i className="fas fa-arrow-left"></i> Back to Projects
              </button>
              {/* Top Stats */}
              <div className="project-stats-cards">
                <div className="project-stat-card">
                  <div className="stat-icon stat-tasks"><i className="fas fa-tasks"></i></div>
                  <div>
                    <div className="stat-title">Total Tasks</div>
                    <div className="stat-value">{totalTasks}</div>
                  </div>
                </div>
                <div className="project-stat-card">
                  <div className="stat-icon stat-completed"><i className="fas fa-check-circle"></i></div>
                  <div>
                    <div className="stat-title">Completed</div>
                    <div className="stat-value">{completedTasks}</div>
                  </div>
                </div>
                <div className="project-stat-card">
                  <div className="stat-icon stat-inprogress"><i className="fas fa-sync-alt"></i></div>
                  <div>
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value">{inProgressTasks}</div>
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="project-progress-bar-wrap">
                <div className="project-progress-label">Project Progress</div>
                <div className="project-progress-bar">
                  <div className="project-progress-bar-inner" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="project-progress-percent">{progress}%</div>
              </div>
              {/* Tabs */}
              <div className="project-tabs">
                {['Tasks', 'Team', 'Chat', 'Automations'].map(tab => (
                  <button
                    key={tab}
                    className={`project-tab${activeTab === tab ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}{tab === 'Team' ? ' (1)' : ''}
                  </button>
                ))}
              </div>
              {/* Tab Content */}
              <div className="project-tab-content">
                {renderTabs()}
              </div>
              {/* Task History Modal */}
              {showHistoryTask && (
                <div className="history-modal-bg">
                  <div className="history-modal">
                    <h2>Task History</h2>
                    <ul>
                      {projectTasks.find((t) => t.id === showHistoryTask)?.history.map((h, i) => (
                        <li key={i}>
                          <b>{users.find((u) => u.id === h.user)?.name || "User"}</b> {h.action} <span style={{ color: '#888' }}>{new Date(h.at).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                    <button className="close-btn" onClick={() => setShowHistoryTask(null)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Projects; 