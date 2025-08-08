/**
 * Authentication Service
 * Handles API calls for user authentication
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class AuthService {
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

    // Add response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, remove it
          localStorage.removeItem('token');
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new user
   */
  async register(username, email, password) {
    const response = await this.api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  }

  /**
   * Login user
   */
  async login(email, password) {
    const response = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  /**
   * Get all users (for starting chats)
   */
  async getUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Logout user (client-side)
   */
  logout() {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();