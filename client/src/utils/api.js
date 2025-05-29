import axios from 'axios';

const API_URL = 'http://localhost:5000';

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

// Tasks API
export const getProjectTasks = (projectId) => api.get(`/api/tasks/project/${projectId}`);
export const getMyTasks = () => api.get('/api/tasks/my-tasks');
export const getTaskStats = () => api.get('/api/tasks/stats');
export const createTask = (taskData) => api.post('/api/tasks', taskData);
export const updateTaskStatus = (taskId, status) => api.patch(`/api/tasks/${taskId}/status`, { status });
export const deleteTask = (taskId) => api.delete(`/api/tasks/${taskId}`);

// Users API
export const getUsers = () => api.get('/api/users');
export const getCurrentUser = () => api.get('/api/users/me');
export const updateUser = (userData) => api.put('/api/users', userData);

export default api; 