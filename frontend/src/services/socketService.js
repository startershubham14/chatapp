/**
 * Socket.IO Service
 * Handles real-time communication with WebSocket server
 */

import { io } from 'socket.io-client';

// Dynamically determine WebSocket URL based on current domain
const getWsUrl = () => {
  const currentHost = window.location.hostname;
  
  // If accessing through ngrok, use localhost for WebSocket connections
  if (currentHost.includes('ngrok-free.app')) {
    return 'ws://localhost:8000';
  }
  
  // Otherwise use the environment variable or default
  return process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
};

const WS_URL = getWsUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to socket server with authentication
   */
  async connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      // Connection successful
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.isConnected = true;
        
        // Authenticate with the server
        this.socket.emit('authenticate', { token });
      });

      // Authentication successful
      this.socket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data);
        resolve(data);
      });

      // Authentication failed
      this.socket.on('auth_error', (error) => {
        console.error('Socket authentication failed:', error);
        this.disconnect();
        reject(new Error(error.message));
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      // Setup default event listeners
      this.setupDefaultListeners();
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Setup default event listeners
   */
  setupDefaultListeners() {
    if (!this.socket) return;

    // Handle general errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket_error', error);
    });

    // Handle new messages
    this.socket.on('new_message', (message) => {
      this.emit('new_message', message);
    });

    // Handle message status updates
    this.socket.on('message_sent', (data) => {
      this.emit('message_sent', data);
    });

    // Handle message blocking (abuse detection)
    this.socket.on('message_blocked', (data) => {
      console.warn('Message blocked:', data);
      this.emit('message_blocked', data);
    });

    // Handle typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    // Handle user online/offline status
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Handle message read receipts
    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });
  }

  /**
   * Join a chat room
   */
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { chat_id: chatId });
    }
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { chat_id: chatId });
    }
  }

  /**
   * Send a message
   * 
   * ==================== ABUSE DETECTION INTEGRATION POINT ====================
   * This is where messages are sent to the server for processing.
   * The server will handle abuse detection before broadcasting the message.
   * If a message is blocked, a 'message_blocked' event will be received.
   * =========================================================================
   */
  sendMessage(chatId, content) {
    if (this.socket && this.isConnected) {
      // Send message to server - abuse detection happens server-side
      this.socket.emit('send_message', {
        chat_id: chatId,
        content: content.trim()
      });
      
      // Note: The server will either:
      // 1. Broadcast the message if it passes abuse detection
      // 2. Send a 'message_blocked' event if it's flagged as abusive
    }
  }

  /**
   * Send typing indicator (start)
   */
  startTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { chat_id: chatId });
    }
  }

  /**
   * Send typing indicator (stop)
   */
  stopTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { chat_id: chatId });
    }
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_messages_read', { chat_id: chatId });
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

export const socketService = new SocketService();