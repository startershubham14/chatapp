/**
 * Chat Dashboard Component
 * Main chat interface with sidebar and message area
 */

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { LogOut, Plus, MessageCircle, AlertTriangle } from 'lucide-react'; // Removed Users as it's not used
import { useAuth } from '../../App';
import { chatService } from '../../services/chatService';
import { socketService } from '../../services/socketService';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import NewChatModal from './NewChatModal';
import AbuseWarningModal from './AbuseWarningModal';

const ChatDashboard = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==================== ABUSE DETECTION UI STATE ====================
  const [blockedMessage, setBlockedMessage] = useState(null);
  const [showAbuseWarning, setShowAbuseWarning] = useState(false);
  // ================================================================

  // Memoize event handlers with useCallback to ensure stability for useEffect dependencies
  const handleNewMessage = useCallback((message) => {
    setChats(prevChats => {
      const updatedChats = [...prevChats];
      const chatIndex = updatedChats.findIndex(chat => chat.id === message.chat_id);

      if (chatIndex !== -1) {
        // Update the chat with the new last message
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          last_message: message
        };

        // Move the chat to the top of the list
        const [updatedChat] = updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(updatedChat);
      } else {
        // If the chat is new and not in the list, you might want to fetch the chat details
        // and add it. For now, we'll just log an advisory.
        console.warn(`New message for unlisted chat ID: ${message.chat_id}. Consider re-fetching user chats.`);
      }

      return updatedChats;
    });
  }, []);

  const handleUserTyping = useCallback((data) => {
    console.log('User typing:', data);
  }, []);

  const handleUserOnline = useCallback((data) => {
    console.log('User online:', data);
  }, []);

  const handleUserOffline = useCallback((data) => {
    console.log('User offline:', data);
  }, []);

  const handleMessageSent = useCallback((data) => {
    console.log('Message sent confirmation:', data);
  }, []);

  const handleMessagesRead = useCallback((data) => {
    console.log('Messages read:', data);
  }, []);

  const handleMessageBlocked = useCallback((data) => {
    console.warn('Message blocked due to abuse detection:', data);
    setBlockedMessage({
      reason: data.reason,
      blockedContent: data.blocked_content,
      chatId: data.chat_id,
      timestamp: new Date()
    });
    setShowAbuseWarning(true);
  }, []);

  const setupSocketListeners = useCallback(() => {
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_online', handleUserOnline);
    socketService.on('user_offline', handleUserOffline);
    socketService.on('message_blocked', handleMessageBlocked);
    socketService.on('message_sent', handleMessageSent);
    socketService.on('messages_read', handleMessagesRead);
  }, [handleNewMessage, handleUserTyping, handleUserOnline, handleUserOffline, handleMessageBlocked, handleMessageSent, handleMessagesRead]);

  const cleanupSocketListeners = useCallback(() => {
    socketService.off('new_message', handleNewMessage);
    socketService.off('user_typing', handleUserTyping);
    socketService.off('user_online', handleUserOnline);
    socketService.off('user_offline', handleUserOffline);
    socketService.off('message_blocked', handleMessageBlocked);
    socketService.off('message_sent', handleMessageSent);
    socketService.off('messages_read', handleMessagesRead);
  }, [handleNewMessage, handleUserTyping, handleUserOnline, handleUserOffline, handleMessageBlocked, handleMessageSent, handleMessagesRead]);

  const initializeDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const userChats = await chatService.getUserChats();
      setChats(userChats);

      if (userChats.length > 0) {
        setSelectedChat(userChats[0]);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies that change on every render, so empty array is fine for now

  useEffect(() => {
    initializeDashboard();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [initializeDashboard, setupSocketListeners, cleanupSocketListeners]); // Added dependencies

  const handleCloseAbuseWarning = () => {
    setShowAbuseWarning(false);
    setBlockedMessage(null);
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    socketService.joinChat(chat.id);
    socketService.markMessagesAsRead(chat.id);
  };

  const handleNewChatCreated = (newChat) => {
    setChats(prevChats => [newChat, ...prevChats]);
    setSelectedChat(newChat);
    setIsNewChatModalOpen(false);
    socketService.joinChat(newChat.id);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeDashboard}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm border-b z-10 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary-600" />
          <h1 className="text-xl font-semibold text-gray-800">ChatApp</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.username}
          </span>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - with top margin for header */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r">
          <ChatSidebar
            chats={chats}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            currentUser={user}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              currentUser={user}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-600 mb-2">
                  Welcome to ChatApp
                </h2>
                <p className="text-gray-500 mb-4">
                  Select a chat to start messaging or create a new conversation
                </p>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-200 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <NewChatModal
          isOpen={isNewChatModalOpen}
          onClose={() => setIsNewChatModalOpen(false)}
          onChatCreated={handleNewChatCreated}
          currentUser={user}
        />
      )}

      {/* ==================== ABUSE WARNING MODAL ==================== */}
      {showAbuseWarning && blockedMessage && (
        <AbuseWarningModal
          isOpen={showAbuseWarning}
          onClose={handleCloseAbuseWarning}
          blockedMessage={blockedMessage}
        />
      )}
      {/* ============================================================== */}
    </div>
  );
};

export default ChatDashboard;
