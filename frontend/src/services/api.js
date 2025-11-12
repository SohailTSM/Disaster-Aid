import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export const requestService = {
  createRequest: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },
  getRequests: async () => {
    const response = await api.get('/requests');
    return response.data;
  },
  getRequestById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },
};

export const organizationService = {
  getOrganizations: async (verified = true) => {
    const response = await api.get(`/organizations?verified=${verified}`);
    return response.data;
  },
  verifyOrganization: async (id) => {
    const response = await api.put(`/organizations/${id}/verify`);
    return response.data;
  },
};

export const assignmentService = {
  createAssignment: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },
  getMyAssignments: async () => {
    const response = await api.get('/assignments/my');
    return response.data;
  },
  updateAssignmentStatus: async (id, status) => {
    const response = await api.put(`/assignments/${id}/status`, { status });
    return response.data;
  },
};

export default api;
