import axios from 'axios';

const API_URL = 'http://localhost:5001';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the Firebase auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Projects API
export const getProjects = () => api.get('/api/projects');
export const createProject = (projectData) => api.post('/api/projects', projectData);
export const updateProject = (projectId, projectData) => api.put(`/api/projects/${projectId}`, projectData);
export const deleteProject = (projectId) => api.delete(`/api/projects/${projectId}`);

// Utility function to normalize status values
const normalizeStatus = (status) => {
  if (!status) return 'To Do'; // Default status
  
  // Convert to string and trim
  const normalizedStatus = String(status).trim();
  
  // Map common variations to standard format
  const statusMap = {
    'todo': 'To Do',
    'to-do': 'To Do',
    'to_do': 'To Do',
    'to do': 'To Do',
    'in-progress': 'In Progress',
    'in_progress': 'In Progress',
    'inprogress': 'In Progress',
    'in progress': 'In Progress',
    'done': 'Completed',
    'complete': 'Completed',
    'completed': 'Completed'
  };
  
  // Return the mapped status or the original with first letter uppercase if not found
  return statusMap[normalizedStatus.toLowerCase()] || 
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
};

// Tasks API
export const getProjectTasks = (projectId) => api.get(`/api/tasks/project/${projectId}`);
export const getMyTasks = () => api.get('/api/tasks/my-tasks');
export const getTaskStats = () => api.get('/api/tasks/stats');
export const createTask = (taskData) => {
  // Ensure the status is normalized
  const normalizedData = {
    ...taskData,
    status: normalizeStatus(taskData.status)
  };
  
  console.log('Creating task with normalized data:', normalizedData);
  return api.post('/api/tasks', normalizedData)
    .then(response => {
      console.log('Task created successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Error creating task:', error);
      throw error;
    });
};
export const updateTaskStatus = (taskId, status) => {
  // Normalize the status before sending
  const normalizedStatus = normalizeStatus(status);
  
  console.log(`Updating task ${taskId} status to: ${normalizedStatus}`);
  return api.patch(`/api/tasks/${taskId}/status`, { status: normalizedStatus })
    .then(response => {
      console.log('Task status updated successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Error updating task status:', error);
      throw error;
    });
};
export const deleteTask = (taskId) => api.delete(`/api/tasks/${taskId}`);

// Users API
export const getUsers = () => api.get('/api/users');
export const getCurrentUser = () => api.get('/api/users/me');
export const updateUser = (userData) => api.put('/api/users', userData);

export default api; 