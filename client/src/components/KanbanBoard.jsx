import React, { useState, useRef } from 'react';
import { FaPlus, FaEllipsisH, FaTrash, FaTimes, FaPaperclip, FaCheckCircle, FaClock, FaUser, FaFlag } from 'react-icons/fa';
import '../styles/KanbanBoard.css';

const KanbanBoard = ({ 
  tasks, 
  statuses, 
  onTaskMove, 
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete,
  onStatusCreate,
  users
}) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [syncingTasks, setSyncingTasks] = useState(new Set()); // Track which tasks are syncing
  const [showAddTask, setShowAddTask] = useState(null);
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '', assignedTo: null, priority: 'Medium', dueDate: '' });
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [taskMenuOpen, setTaskMenuOpen] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  
  const dragItem = useRef();
  const dragNode = useRef();

  // Check if drag and drop is supported
  React.useEffect(() => {
    const isDragSupported = 'draggable' in document.createElement('div');
    console.log('🔍 Drag and drop supported:', isDragSupported);
    
    // Test dataTransfer support
    const testEvent = new Event('dragstart');
    const hasDataTransfer = 'dataTransfer' in testEvent;
    console.log('🔍 DataTransfer supported:', hasDataTransfer);
  }, []);

  // Handle drag start
  const handleDragStart = (e, taskId, status) => {
    console.log('🎯 Drag started for task:', taskId, 'status:', status);
    
    // Set drag data immediately
    try {
      e.dataTransfer.setData('text/plain', String(taskId));
      e.dataTransfer.effectAllowed = 'move';
      console.log('✅ DataTransfer set successfully');
    } catch (error) {
      console.error('❌ Error setting dataTransfer:', error);
    }
    
    // Store drag info
    dragItem.current = { taskId, status };
    dragNode.current = e.target;
    
    // Add drag end listener
    if (dragNode.current) {
      dragNode.current.addEventListener('dragend', handleDragEnd);
    }
    
    // Set visual state after a brief delay
    setTimeout(() => {
      setDraggedTask(taskId);
      console.log('🎨 Visual drag state set for task:', taskId);
    }, 0);
    
    console.log('✅ Drag start setup complete');
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    console.log('🏁 Drag ended');
    setDraggedTask(null);
    if (dragNode.current) {
      dragNode.current.removeEventListener('dragend', handleDragEnd);
    }
    dragItem.current = null;
    dragNode.current = null;
  };
  
  // Handle drag over
  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnStatus) {
      console.log('🎯 Dragging over column:', columnStatus);
      setDragOverColumn(columnStatus);
    }
  };
  
  // Handle drag leave
  const handleDragLeave = (e, columnStatus) => {
    // Only clear if we're actually leaving the column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      console.log('👋 Left column:', columnStatus);
      setDragOverColumn(null);
    }
  };
  
  // Handle drop
  const handleDrop = (e, columnStatus) => {
    e.preventDefault();
    setDragOverColumn(null); // Clear drag over state
    console.log('🎪 Drop event triggered on column:', columnStatus);
    
    const taskIdString = e.dataTransfer.getData('text/plain');
    console.log('📝 Retrieved task ID from dataTransfer:', taskIdString);
    
    // Skip if this is the test drag
    if (taskIdString === 'test') {
      console.log('🧪 Test drag detected, ignoring');
      return;
    }
    
    // Handle both string and number IDs
    const taskId = isNaN(taskIdString) ? taskIdString : parseInt(taskIdString);
    console.log('🔢 Parsed task ID:', taskId, typeof taskId);
    
    // Mark task as syncing
    setSyncingTasks(prev => new Set([...prev, taskId]));
    
    if (!dragItem.current) {
      console.error('❌ No drag item found - this might be a legitimate task drag');
      // Try to find the task in the current tasks to get its status
      const task = tasks.find(t => String(t.id) === String(taskId));
      if (task) {
        console.log('🔍 Found task in tasks array:', task);
        const sourceStatus = task.status;
        console.log('📊 Moving task from', sourceStatus, 'to', columnStatus);
        
        if (sourceStatus !== columnStatus) {
          console.log('🚀 Calling onTaskMove with:', taskId, columnStatus);
          // Call with callback to clear syncing state
          onTaskMove(taskId, columnStatus).finally(() => {
            setSyncingTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskId);
              return newSet;
            });
          });
        } else {
          console.log('📍 Task dropped in same column, no action needed');
          setSyncingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        }
      } else {
        console.error('❌ Could not find task with ID:', taskId);
        setSyncingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
      setDraggedTask(null);
      return;
    }
    
    const sourceStatus = dragItem.current.status;
    console.log('📊 Moving task from', sourceStatus, 'to', columnStatus);
    
    if (sourceStatus !== columnStatus) {
      console.log('🚀 Calling onTaskMove with:', taskId, columnStatus);
      // Call with callback to clear syncing state
      onTaskMove(taskId, columnStatus).finally(() => {
        setSyncingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      });
    } else {
      console.log('📍 Task dropped in same column, no action needed');
      setSyncingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
    
    setDraggedTask(null);
  };
  
  // Handle new task submission
  const handleAddTask = (status) => {
    if (!newTaskData.title.trim()) return;
    
    const task = {
      title: newTaskData.title.trim(),
      description: newTaskData.description.trim(),
      status,
      assignedTo: newTaskData.assignedTo ? String(newTaskData.assignedTo) : null, // Convert to string
      priority: newTaskData.priority.toLowerCase(), // Convert to lowercase for backend
      dueDate: newTaskData.dueDate || null,
      // Remove these fields as they should be set by the backend
      // id: Date.now(), 
      // subtasks: [],
      // attachments: [],
      // history: [{ action: 'created', timestamp: new Date().toISOString() }]
    };
    
    console.log('Creating task with data:', task);
    onTaskCreate(task);
    setNewTaskData({ title: '', description: '', assignedTo: null, priority: 'Medium', dueDate: '' });
    setShowAddTask(null);
  };
  
  // Handle new column/status creation
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    onStatusCreate(newColumnTitle);
    setNewColumnTitle('');
    setShowAddColumn(false);
  };
  
  // Get priority class
  const getPriorityClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };
  
  // Get the color for due date
  const getDueDateClass = (dueDate) => {
    if (!dueDate) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'date-overdue';
    if (diffDays === 0) return 'date-today';
    if (diffDays <= 2) return 'date-soon';
    return '';
  };
  
  // Handle task update
  const handleTaskUpdate = (task) => {
    onTaskUpdate(task);
    setEditingTask(null);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="kanban-board-container">
      <div className="kanban-board">
        {statuses.map(status => (
          <div 
            key={status} 
            className={`kanban-column ${dragOverColumn === status ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            onDragLeave={(e) => handleDragLeave(e, status)}
          >
            <div className="kanban-column-header">
              <h3>{status}</h3>
              <span className="task-count">{tasks.filter(t => t.status === status).length}</span>
              <button 
                className="add-task-button" 
                onClick={() => setShowAddTask(status)}
                aria-label="Add task"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="tasks-container">
              {tasks
                .filter(task => task.status === status)
                .map(task => (
                  <div 
                    key={task.id}
                    className={`task-card ${draggedTask === task.id ? 'dragging' : ''} ${task.tempId ? 'creating' : ''} ${syncingTasks.has(task.id) ? 'syncing' : ''}`}
                    draggable={!task.tempId && editingTask !== task.id}
                    onDragStart={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      console.log('🚀 Task card drag start triggered:', task.id, 'tempId:', task.tempId, 'editingTask:', editingTask, 'task editing:', editingTask === task.id);
                      if (!task.tempId && editingTask !== task.id) {
                        handleDragStart(e, task.id, status);
                      } else {
                        console.log('🚫 Drag prevented - tempId:', task.tempId, 'editing this task:', editingTask === task.id);
                        e.preventDefault();
                        return false;
                      }
                    }}
                    onMouseDown={(e) => {
                      console.log('🖱️ Mouse down on task:', task.id);
                      // Don't prevent default here to allow drag
                    }}
                    style={{ 
                      cursor: (!task.tempId && editingTask !== task.id) ? 'grab' : 'default',
                      userSelect: 'none' // Prevent text selection
                    }}
                    onMouseEnter={() => console.log('🖱️ Mouse entered task:', task.id, 'draggable:', !task.tempId && editingTask !== task.id)}
                  >
                    {syncingTasks.has(task.id) && (
                      <div className="task-syncing-indicator">
                        <div className="spinner"></div>
                        <span>Syncing...</span>
                      </div>
                    )}
                    {editingTask === task.id ? (
                      <div className="task-edit-form">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => onTaskUpdate({ ...task, title: e.target.value })}
                          className="task-edit-title"
                        />
                        <textarea
                          value={task.description || ''}
                          onChange={(e) => onTaskUpdate({ ...task, description: e.target.value })}
                          className="task-edit-description"
                          placeholder="Add description..."
                        />
                        <div className="task-edit-row">
                          <label>Assigned to:</label>
                          <select 
                            value={task.assignedTo?.id || task.assignedTo || ''}
                            onChange={(e) => onTaskUpdate({ ...task, assignedTo: e.target.value || null })}
                          >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="task-edit-row">
                          <label>Priority:</label>
                          <select
                            value={task.priority || 'Medium'}
                            onChange={(e) => onTaskUpdate({ ...task, priority: e.target.value })}
                          >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </div>
                        <div className="task-edit-row">
                          <label>Due date:</label>
                          <input
                            type="date"
                            value={task.dueDate || ''}
                            onChange={(e) => onTaskUpdate({ ...task, dueDate: e.target.value })}
                          />
                        </div>
                        <div className="task-edit-actions">
                          <button 
                            className="save-task-btn"
                            onClick={() => setEditingTask(null)}
                          >
                            Save
                          </button>
                          <button 
                            className="cancel-edit-btn"
                            onClick={() => setEditingTask(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="task-header">
                          <div className={`task-priority ${getPriorityClass(task.priority)}`}>
                            <FaFlag />
                          </div>
                          <div className="task-menu-container">
                            <button 
                              className="task-menu-button" 
                              onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
                              aria-label="Task menu"
                            >
                              <FaEllipsisH />
                            </button>
                            {taskMenuOpen === task.id && (
                              <div className="task-menu">
                                <button onClick={() => setEditingTask(task.id)}>
                                  Edit
                                </button>
                                <button className="delete-btn" onClick={() => onTaskDelete(task.id)}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <h4 className="task-title">{task.title}</h4>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <div className="task-footer">
                          {task.dueDate && (
                            <div className={`task-due-date ${getDueDateClass(task.dueDate)}`}>
                              <FaClock />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          {task.assignedTo ? (
                            <div className="task-assignee">
                              <img 
                                src={
                                  task.assignedTo.image || 
                                  task.assignedTo.avatar || 
                                  users.find(u => u.id === (task.assignedTo?.id || task.assignedTo))?.avatar || 
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    task.assignedTo.displayName || 
                                    task.assignedTo.name || 
                                    users.find(u => u.id === (task.assignedTo?.id || task.assignedTo))?.name || 
                                    'User'
                                  )}`
                                } 
                                alt={
                                  task.assignedTo.displayName || 
                                  task.assignedTo.name || 
                                  users.find(u => u.id === (task.assignedTo?.id || task.assignedTo))?.name || 
                                  'User'
                                } 
                              />
                            </div>
                          ) : (
                            <div className="task-unassigned">
                              <FaUser />
                            </div>
                          )}
                          {task.attachments?.length > 0 && (
                            <div className="task-attachments">
                              <FaPaperclip />
                              <span>{task.attachments.length}</span>
                            </div>
                          )}
                          {task.subtasks?.length > 0 && (
                            <div className="task-subtasks">
                              <FaCheckCircle />
                              <span>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              
              {showAddTask === status && (
                <div className="add-task-form">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                    autoFocus
                  />
                  <textarea
                    placeholder="Description"
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                  />
                  <div className="form-row">
                    <label>Assigned to:</label>
                    <select 
                      value={newTaskData.assignedTo || ''}
                      onChange={(e) => setNewTaskData({...newTaskData, assignedTo: e.target.value || null})}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Priority:</label>
                    <select
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value})}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Due date:</label>
                    <input
                      type="date"
                      value={newTaskData.dueDate}
                      onChange={(e) => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="add-btn"
                      onClick={() => handleAddTask(status)}
                    >
                      Add Task
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => setShowAddTask(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Add new column section */}
        {showAddColumn ? (
          <div className="kanban-column add-column-form">
            <input
              type="text"
              placeholder="Column title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              autoFocus
            />
            <div className="add-column-actions">
              <button 
                className="add-btn"
                onClick={handleAddColumn}
              >
                Add Column
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowAddColumn(false)}
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ) : (
          <div className="kanban-column add-column" onClick={() => setShowAddColumn(true)}>
            <div className="add-column-button">
              <FaPlus />
              <span>Add Column</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;
