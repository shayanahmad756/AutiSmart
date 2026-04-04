import http from './http';

const chatAPI = {
  /**
   * Get role-aware contact list (with last message + unread count).
   */
  getContacts: async () => {
    const response = await http.get('/chat/contacts');
    return response.data;
  },

  /**
   * Get paginated message history with a specific contact.
   */
  getMessages: async (contactId, page = 1) => {
    const response = await http.get(`/chat/${contactId}/messages`, { params: { page } });
    return response.data;
  },

  /**
   * Send a message via REST (socket fallback).
   */
  sendMessage: async (contactId, data) => {
    const response = await http.post(`/chat/${contactId}/message`, data);
    return response.data;
  },

  /**
   * Upload a file for chat sharing.
   * @param {FormData} formData - Must contain a 'file' field
   */
  uploadFile: async (formData) => {
    const response = await http.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Send a message to AutiSmart AI and get a reply.
   */
  sendAIMessage: async (message, history = []) => {
    const response = await http.post('/chat/ai', { message, history });
    return response.data;
  },

  /**
   * Mark all messages from a contact as read.
   */
  markRead: async (contactId) => {
    const response = await http.patch(`/chat/${contactId}/read`);
    return response.data;
  },
};

export default chatAPI;
