/**
 * Chat Service
 * Handles chat-related API calls
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ChatService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
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

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all chats for current user
   */
  async getUserChats() {
    const response = await this.api.get('/chats');
    return response.data;
  }

  /**
   * Create a new chat
   */
  async createChat(name, isGroup, participantIds) {
    const response = await this.api.post('/chats', {
      name,
      is_group: isGroup,
      participant_ids: participantIds,
    });
    return response.data;
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(chatId, limit = 50, offset = 0) {
    const response = await this.api.get(`/chats/${chatId}/messages`, {
      params: { limit, offset },
    });
    return response.data;
  }

  /**
   * Get all users (for creating chats)
   */
  async getUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }
}

export const chatService = new ChatService();