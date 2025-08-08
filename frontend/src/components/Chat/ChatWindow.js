/**
 * Chat Window Component
 * Displays messages for the selected chat and provides an input for new messages.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, User, PlusCircle } from 'lucide-react';
import { chatService } from '../../services/chatService'; // Assuming chatService has methods to fetch/send messages
import { socketService } from '../../services/socketService'; // For real-time communication
import Avatar from '../common/Avatar';

const ChatWindow = ({ chat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to the latest message

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    setError('');
    try {
      const chatMessages = await chatService.getChatMessages(chat.id);
      setMessages(chatMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [chat?.id]);

  // Handler for new messages coming from the socket
  const handleNewMessageUpdate = useCallback((message) => {
    if (message.chat_id === chat.id) {
      setMessages((prevMessages) => [...prevMessages, message]);
      // Mark as read if the message is for the currently viewed chat and sent by someone else
      if (message.sender_id !== currentUser.id) {
        socketService.markMessagesAsRead(chat.id);
      }
    }
  }, [chat?.id, currentUser?.id]);

  useEffect(() => {
    if (chat) {
      fetchMessages();
      // Listen for new messages specifically for this chat
      socketService.on('new_message', handleNewMessageUpdate);
    }

    return () => {
      // Clean up the socket listener when the component unmounts or chat changes
      socketService.off('new_message', handleNewMessageUpdate);
    };
  }, [chat, fetchMessages, handleNewMessageUpdate]); // Re-run effect when chat changes

  // Scroll to the bottom of the message list whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim()) return;

    const messagePayload = {
      chat_id: chat.id,
      sender_id: currentUser.id,
      sender_username: currentUser.username,
      content: newMessageContent.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending', // Temporary status
    };

    // Optimistically add the message to the UI
    setMessages((prevMessages) => [...prevMessages, messagePayload]);
    setNewMessageContent(''); // Clear input immediately
    scrollToBottom(); // Scroll to bottom to show the new message

    try {
      // Send message via socket
      socketService.sendMessage(messagePayload);
      // Backend should confirm with 'message_sent' event and handle persistence
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message.');
      // Revert optimistic update or show error for this message
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg === messagePayload ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loadingMessages) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchMessages}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white shadow-sm flex items-center gap-3">
        {chat.type === 'group' ? (
          <Users className="h-6 w-6 text-primary-600" />
        ) : (
          <User className="h-6 w-6 text-primary-600" />
        )}
        <h2 className="text-lg font-semibold text-gray-800">
          {chat.type === 'group'
            ? chat.name || 'Group Chat'
            : chat.participants.find((p) => p.id !== currentUser.id)
                ?.username || 'Unknown User'}
        </h2>
        {/* You can add online status or participant count here */}
        <span className="text-sm text-gray-500 ml-auto">
          {chat.type === 'group' ? `${chat.participants.length} members` : 'Online'}
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id || message.timestamp} // Use ID if available, otherwise timestamp for optimistic updates
              className={`flex items-end gap-2 ${
                message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender_id !== currentUser.id && (
                <Avatar 
                  user={message.sender} 
                  size="sm" 
                  className="flex-shrink-0"
                />
              )}
              
              <div
                className={`flex items-end max-w-[70%] rounded-lg p-3 shadow-sm ${
                  message.sender_id === currentUser.id
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="flex flex-col">
                  {message.sender_id !== currentUser.id && (
                    <span className="text-xs font-semibold mb-1 opacity-80">
                      {message.sender?.display_name || message.sender?.username || message.sender_username}
                    </span>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <span
                    className={`text-xs mt-1 ${
                      message.sender_id === currentUser.id ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {/* Optional: Add message status (sent, delivered, read) */}
                    {message.sender_id === currentUser.id && message.status === 'sending' && (
                      <span className="ml-2 text-yellow-300">...</span>
                    )}
                    {/* Add checkmark icons here for delivered/read */}
                  </span>
                </div>
              </div>
              
              {message.sender_id === currentUser.id && (
                <Avatar 
                  user={currentUser} 
                  size="sm" 
                  className="flex-shrink-0"
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} /> {/* Element to scroll to */}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-primary-600 transition duration-200"
          >
            <PlusCircle className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            onKeyPress={(e) => {
              // Optional: Emit typing event
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSendMessage(e);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
