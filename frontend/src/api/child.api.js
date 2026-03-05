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
      // Get the auth token
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Create a direct download using fetch to bypass IDM interception
      const response = await fetch(`http://localhost:5000/api/caregiver/children/${childId}/report`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF download failed:', response.status, errorText);
        throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      return blob;
    } catch (error) {
      console.error('PDF download error:', error);
      throw { message: error.message || 'Failed to download report' };
    }
  },
};

export default childAPI;
