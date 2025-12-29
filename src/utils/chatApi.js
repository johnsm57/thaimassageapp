// API utility for chat backend communication
import { CHAT_CONFIG } from '../config/chatConfig';

const API_BASE_URL = CHAT_CONFIG.API_URL ;

export const chatApi = {
  // User endpoints
  async registerUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      // Accept both 200 (user exists) and 201 (user created) as success
      if (response.status === 200 || response.status === 201) {
        return response.json();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to register user');
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  async getUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Conversation endpoints
  async getConversations(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch conversations');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  async createOrGetConversation(userId1, userId2) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1, userId2 }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create/get conversation');
      }
      return response.json();
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  },

  // Message endpoints
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/${conversationId}?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  async markMessagesAsRead(conversationId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, userId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to mark messages as read');
      }
      return response.json();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  async getUnreadCount(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/unread/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch unread count');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Image upload
  async uploadImage(imageBase64, filename) {
    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.includes(',') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, filename }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }
      return response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
};

