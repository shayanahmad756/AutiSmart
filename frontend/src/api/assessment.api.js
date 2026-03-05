import http from './http';

/**
 * Assessment API endpoints
 */
const assessmentAPI = {
  /**
   * Get all active assessments
   */
  getAssessments: async () => {
    try {
      const response = await http.get('/assessments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch assessments' };
    }
  },

  /**
   * Get active assessment by level
   */
  getAssessmentByLevel: async (level) => {
    try {
      const response = await http.get(`/assessments/${level}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch assessment' };
    }
  },

  /**
   * Admin: Get all assessments (including inactive)
   */
  getAllAssessments: async () => {
    try {
      const response = await http.get('/assessments/admin/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch assessments' };
    }
  },

  /**
   * Get personalized quiz for a child
   */
  getChildQuiz: async (childId) => {
    try {
      const response = await http.get(`/assessments/child/${childId}/quiz`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch child quiz' };
    }
  },

  /**
   * Admin: Generate personalized quiz for a child
   */
  generateChildQuiz: async (childId) => {
    try {
      const response = await http.post(`/assessments/child/${childId}/generate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate child quiz' };
    }
  },

  /**
   * Submit assessment results for a child
   */
  submitResult: async (childId, resultData) => {
    try {
      const response = await http.post('/assessments/results', { childId, ...resultData });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to save assessment result' };
    }
  },

  /**
   * Get past results for a child
   */
  getChildResults: async (childId) => {
    try {
      const response = await http.get(`/assessments/child/${childId}/results`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch child results' };
    }
  },
};

export default assessmentAPI;
