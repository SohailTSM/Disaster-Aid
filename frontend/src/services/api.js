import axios from "axios";

const API_URL = "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: This enables sending cookies with requests
});

// Remove the authorization header interceptor since we're using cookies now
// The httpOnly cookie will be automatically sent with each request

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const requestService = {
  createRequest: async (requestData) => {
    const response = await api.post("/requests", requestData);
    return response.data;
  },
  getRequests: async (filters = {}) => {
    const response = await api.get("/requests", { params: filters });
    return response.data;
  },
  getRequestById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },
  getRequestByRequestId: async (requestId) => {
    const response = await api.get(`/requests/by-requestid/${requestId}`);
    return response.data;
  },
  updateRequest: async (id, updateData) => {
    const response = await api.put(`/requests/${id}`, updateData);
    return response.data;
  },
  updateRequestStatus: async (id, status) => {
    const response = await api.put(`/requests/${id}/status`, { status });
    return response.data;
  },
};

export const organizationService = {
  // For admin
  getOrganizations: async (verified = true) => {
    const response = await api.get(`/organizations?verified=${verified}`);
    return response.data;
  },
  getPendingOrganizations: async () => {
    const response = await api.get("/organizations/pending");
    return response.data;
  },
  createOrganization: async (orgData) => {
    const response = await api.post("/organizations", orgData);
    return response.data;
  },
  approveOrganization: async (id) => {
    const response = await api.put(`/organizations/${id}/approve`);
    return response.data;
  },
  rejectOrganization: async (id) => {
    const response = await api.put(`/organizations/${id}/reject`);
    return response.data;
  },
  deleteOrganization: async (id) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },
  exportIncidents: async () => {
    const response = await api.get("/organizations/export/incidents", {
      responseType: "blob", // Important for file downloads
    });
    return response.data;
  },
};

export const assignmentService = {
  createAssignment: async (data) => {
    const response = await api.post("/assignments", data);
    return response.data;
  },
  getMyAssignments: async () => {
    const response = await api.get("/assignments/my");
    return response.data;
  },
  getAssignmentsByRequest: async (requestId) => {
    const response = await api.get(`/assignments/request/${requestId}`);
    return response.data;
  },
  updateAssignmentStatus: async (id, status, notes = "") => {
    const response = await api.put(`/assignments/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },
  getAssignment: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },
};

export default api;
