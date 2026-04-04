import http from './http';

/**
 * User/Admin API endpoints
 */
const userAPI = {
  /**
   * Create new user (Admin only)
   */
  createUser: async (userData) => {
    try {
      const response = await http.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  /**
   * Get all users (Admin only)
   */
  getAllUsers: async () => {
    try {
      const response = await http.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  /**
   * Get single user by ID (Admin only)
   */
  getUser: async (userId) => {
    try {
      const response = await http.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },

  /**
   * Update user (Admin only)
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await http.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  /**
   * Update user role (Admin only)
   */
  updateUserRole: async (userId, role) => {
    try {
      const response = await http.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user role' };
    }
  },

  /**
   * Toggle user verification status (Admin only)
   */
  toggleVerification: async (userId) => {
    try {
      const response = await http.put(`/admin/users/${userId}/toggle-verification`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to toggle verification' };
    }
  },

  /**
   * Delete user (Admin only)
   */
  deleteUser: async (userId) => {
    try {
      const response = await http.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  /**
   * Get user statistics (Admin only)
   */
  getStats: async () => {
    try {
      const response = await http.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch statistics' };
    }
  },

  // ── Expert Assignment (Caregiver) ──────────────────────────────────────────

  /** List all experts — for caregivers to browse */
  getExperts: async () => {
    try {
      const response = await http.get('/auth/experts');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch experts' };
    }
  },

  /** Caregiver requests an expert */
  requestExpert: async (expertId) => {
    try {
      const response = await http.post('/auth/expert-request', { expertId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send request' };
    }
  },

  /** Caregiver cancels a pending expert request */
  cancelExpertRequest: async (expertId) => {
    try {
      const response = await http.delete(`/auth/expert-request/${expertId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel request' };
    }
  },

  /** Caregiver views their own expert requests */
  getMyExpertRequests: async () => {
    try {
      const response = await http.get('/auth/my-expert-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch requests' };
    }
  },

  // ── Expert Assignment (Admin) ──────────────────────────────────────────────

  /** Admin: all pending expert requests */
  getAdminExpertRequests: async () => {
    try {
      const response = await http.get('/admin/expert-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expert requests' };
    }
  },

  /** Admin: all approved expert assignments */
  getAdminExpertAssignments: async () => {
    try {
      const response = await http.get('/admin/expert-assignments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch expert assignments' };
    }
  },

  /** Admin: approve a pending request */
  approveExpertRequest: async (caregiverId, expertId) => {
    try {
      const response = await http.put(`/admin/expert-requests/${caregiverId}/${expertId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve request' };
    }
  },

  /** Admin: reject a pending request */
  rejectExpertRequest: async (caregiverId, expertId) => {
    try {
      const response = await http.put(`/admin/expert-requests/${caregiverId}/${expertId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject request' };
    }
  },

  /** Admin: remove an active assignment */
  removeExpertAssignment: async (caregiverId, expertId) => {
    try {
      const response = await http.delete(`/admin/expert-assignments/${caregiverId}/${expertId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove assignment' };
    }
  },
};

export default userAPI;
