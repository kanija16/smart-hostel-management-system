import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login page, clear token
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getAvailable: () => api.get('/rooms/available'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const roomRequestsAPI = {
  getAll: () => api.get('/room-requests'),
  submit: (data) => api.post('/room-requests', data),
  updateStatus: (id, data) => api.patch(`/room-requests/${id}`, data),
};

export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  submit: (data) => api.post('/complaints', data),
  preview: (data) => api.post('/complaints/preview', data),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  overrideClassification: (id, data) => api.patch(`/complaints/${id}/override`, data),
};

export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getUsers: (params) => api.get('/stats/users', { params }),
  createUser: (data) => api.post('/stats/users', data),
  deleteUser: (id) => api.delete(`/stats/users/${id}`),
  assignRoom: (id, data) => api.patch(`/stats/users/${id}/room`, data),
};

export default api;
