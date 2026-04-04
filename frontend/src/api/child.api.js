import http from './http';

/**
 * Child Management API endpoints
 */
const childAPI = {
  /**
   * Add a new child
   */
  addChild: async (childData) => {
    try {
      const response = await http.post('/caregiver/children', childData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add child' };
    }
  },

  /**
   * Get all children for the logged-in caregiver
   */
  getChildren: async () => {
    try {
      const response = await http.get('/caregiver/children');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch children' };
    }
  },

  /**
   * Get all children (for experts and admins)
   */
  getAllChildren: async () => {
    try {
      const response = await http.get('/caregiver/all-children');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch all children' };
    }
  },

  /**
   * Get a specific child
   */
  getChild: async (childId) => {
    try {
      const response = await http.get(`/caregiver/children/${childId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch child' };
    }
  },

  /**
   * Update child information
   */
  updateChild: async (childId, childData) => {
    try {
      const response = await http.put(`/caregiver/children/${childId}`, childData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update child' };
    }
  },

  /**
   * Delete a child
   */
  deleteChild: async (childId) => {
    try {
      const response = await http.delete(`/caregiver/children/${childId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete child' };
    }
  },

  /**
   * Get child statistics
   */
  getChildStats: async (childId) => {
    try {
      const response = await http.get(`/caregiver/children/${childId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch child stats' };
    }
  },

  /**
   * Get activities for a child
   */
  getChildActivities: async (childId, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/caregiver/children/${childId}/activities${queryString ? `?${queryString}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch activities' };
    }
  },

  /**
   * Record an activity for a child
   */
  recordActivity: async (childId, activityData) => {
    try {
      const response = await http.post(`/caregiver/children/${childId}/activities`, activityData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to record activity' };
    }
  },

  /**
   * Get child report with statistics (uses stats endpoint for JSON data)
   */
  getChildReport: async (childId) => {
    try {
      // Use stats endpoint which returns JSON data including child info
      const response = await http.get(`/caregiver/children/${childId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch report' };
    }
  },

  /**
   * Download child report as PDF
   */
  /**
   * Generate Gemini scenarios for Emotion Explorer levels 7-10
   */
  getEmotionScenarios: async (childId, payload) => {
    try {
      const response = await http.post(`/caregiver/children/${childId}/emotion-scenarios`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate scenarios' };
    }
  },

  /**
   * Get Gemini AI feedback for Emotion Explorer game level
   */
  getEmotionFeedback: async (childId, payload) => {
    try {
      const response = await http.post(`/caregiver/children/${childId}/emotion-feedback`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get emotion feedback' };
    }
  },

  /**
   * Get game recommendations for a child based on their latest assessment results.
   * Returns ranked games with isRecommended flag and problemAreas tags.
   */
  getGameRecommendations: async (childId) => {
    try {
      const response = await http.get(`/caregiver/children/${childId}/recommendations`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game recommendations' };
    }
  },

  downloadChildReportPDF: async (childId) => {
    try {
      // Receive base64-encoded JSON to avoid IDM intercepting binary streams
      const res = await http.get(`/caregiver/children/${childId}/report`);
      const payload = res.data;

      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.message || 'Server returned empty PDF data');
      }

      const base64 = payload.data;

      const byteCharacters = atob(base64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      return new Blob([byteNumbers], { type: 'application/pdf' });
    } catch (error) {
      console.error('PDF download error:', error);
      throw { message: error.response?.data?.message || error.message || 'Failed to download report' };
    }
  },

  /**
   * Run autism screen-based detection for a child.
   * @param {string} childId
   * @param {FormData} formData - must contain field "image" with the image file, optionally "note"
   */
  detectAutism: async (childId, formData) => {
    try {
      const response = await http.post(`/caregiver/children/${childId}/autism-detect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to run autism detection' };
    }
  },

  /**
   * Get stored autism detection history for a child.
   */
  getAutismDetections: async (childId) => {
    try {
      const response = await http.get(`/caregiver/children/${childId}/autism-detections`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch detection history' };
    }
  },
};

export default childAPI;
