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
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};

export const requestService = {
  createRequest: async (requestData) => {
    // Handle FormData differently (for file uploads)
    const config =
      requestData instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const response = await api.post("/requests", requestData, config);
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
  updateNeed: async (requestId, needIndex, needData) => {
    const response = await api.put(
      `/requests/${requestId}/needs/${needIndex}`,
      needData
    );
    return response.data;
  },
  deleteNeed: async (requestId, needIndex) => {
    const response = await api.delete(
      `/requests/${requestId}/needs/${needIndex}`
    );
    return response.data;
  },
  updatePriority: async (id, priority) => {
    const response = await api.put(`/requests/${id}/priority`, { priority });
    return response.data;
  },
};

export const organizationService = {
  // For admin
  getOrganizations: async (verified = null) => {
    const params = verified !== null ? { verified } : {};
    const response = await api.get("/organizations", { params });
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
  suspendOrganization: async (id, reason) => {
    const response = await api.put(`/organizations/${id}/suspend`, { reason });
    return response.data;
  },
  unsuspendOrganization: async (id) => {
    const response = await api.put(`/organizations/${id}/unsuspend`);
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
  // Get geospatially matched NGOs for a request
  getMatchedNGOs: async (requestId, maxDistance = 100, limit = 20) => {
    const response = await api.get(`/organizations/matched/${requestId}`, {
      params: { maxDistance, limit },
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
  acceptAssignment: async (
    id,
    isPartialAcceptance = false,
    acceptedNeeds = []
  ) => {
    const response = await api.put(`/assignments/${id}/accept`, {
      isPartialAcceptance,
      acceptedNeeds,
    });
    return response.data;
  },
  declineAssignment: async (id, declineReason) => {
    const response = await api.put(`/assignments/${id}/decline`, {
      declineReason,
    });
    return response.data;
  },
  updateAssignmentStatus: async (
    id,
    status,
    deliveryDetails = null,
    completionProof = null,
    notes = "",
    imageFile = null
  ) => {
    // If there's an image file, use FormData
    if (imageFile) {
      const formData = new FormData();
      const data = {
        status,
        deliveryDetails,
        completionNotes: completionProof?.completionNotes || "",
        notes,
      };
      formData.append("data", JSON.stringify(data));
      formData.append("image", imageFile);

      const response = await api.put(`/assignments/${id}/status`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    // No image, use regular JSON
    const response = await api.put(`/assignments/${id}/status`, {
      status,
      deliveryDetails,
      completionProof,
      notes,
    });
    return response.data;
  },
  getAssignmentsByRequest: async (requestId) => {
    const response = await api.get(`/assignments/request/${requestId}`);
    return response.data;
  },
  getAssignment: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },
};

export const ngoService = {
  getMyOrganization: async () => {
    const response = await api.get("/organizations/my");
    return response.data;
  },
  updateMyResources: async (offers) => {
    const response = await api.put("/organizations/my/resources", { offers });
    return response.data;
  },
};

export const userService = {
  // Dispatcher management
  createDispatcher: async (userData) => {
    const response = await api.post("/users/create-dispatcher", userData);
    return response.data;
  },
  getDispatchers: async () => {
    const response = await api.get("/users/dispatchers");
    return response.data;
  },

  // Authority management
  createAuthority: async (userData) => {
    const response = await api.post("/users/create-authority", userData);
    return response.data;
  },
  getAuthorities: async () => {
    const response = await api.get("/users/authorities");
    return response.data;
  },

  // Suspend/unsuspend
  suspendUser: async (id, reason) => {
    const response = await api.put(`/users/${id}/suspend`, { reason });
    return response.data;
  },
  unsuspendUser: async (id) => {
    const response = await api.put(`/users/${id}/unsuspend`);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const advisoryService = {
  // Get active advisories (public)
  getActiveAdvisories: async () => {
    const response = await api.get("/advisories");
    return response.data;
  },
  // Get all advisories (authority)
  getAllAdvisories: async () => {
    const response = await api.get("/advisories/all");
    return response.data;
  },
  // Create advisory (authority)
  createAdvisory: async (advisoryData) => {
    const response = await api.post("/advisories", advisoryData);
    return response.data;
  },
  // Update advisory (authority)
  updateAdvisory: async (id, advisoryData) => {
    const response = await api.put(`/advisories/${id}`, advisoryData);
    return response.data;
  },
  // Delete advisory (authority)
  deleteAdvisory: async (id) => {
    const response = await api.delete(`/advisories/${id}`);
    return response.data;
  },
  // Toggle advisory status (authority)
  toggleAdvisoryStatus: async (id) => {
    const response = await api.put(`/advisories/${id}/toggle`);
    return response.data;
  },
};

export const analyticsService = {
  // Get crisis load dashboard data (authority)
  getCrisisLoadDashboard: async () => {
    const response = await api.get("/analytics/crisis-load");
    return response.data;
  },
  // Get resource trends over time (authority)
  getResourceTrend: async (days = 7) => {
    const response = await api.get("/analytics/resource-trend", {
      params: { days },
    });
    return response.data;
  },
};

export default api;
