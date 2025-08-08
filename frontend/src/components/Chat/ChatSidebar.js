/**
 * Chat Sidebar Component
 * Displays a list of user's chats and handles chat selection.
 */

import React from 'react';
import { User, Users } from 'lucide-react'; // Icons for different chat types and default user

const ChatSidebar = ({ chats, selectedChat, onChatSelect, currentUser }) => {
  // Helper function to get the display name for a chat
  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat'; // Use group name if available, otherwise a generic name
    } else {
      // For private chats, find the other participant
      const otherParticipant = chat.participants.find(
        (p) => p.id !== currentUser.id
      );
      return otherParticipant ? otherParticipant.username : 'Unknown User';
    }
  };

  // Helper function to get the chat icon
  const getChatIcon = (chat) => {
    return chat.type === 'group' ? (
      <Users className="h-5 w-5 text-gray-500" />
    ) : (
      <User className="h-5 w-5 text-gray-500" />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar (optional - can be added here) */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search chats..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chats found.</div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`flex items-center w-full p-4 border-b hover:bg-gray-50 transition duration-150 ease-in-out
                ${selectedChat && selectedChat.id === chat.id ? 'bg-primary-50 border-primary-600 border-l-4' : ''}
              `}
            >
              <div className="flex-shrink-0 mr-3">
                {getChatIcon(chat)}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <h3 className="text-sm font-medium text-gray-800 truncate">
                  {getChatDisplayName(chat)}
                </h3>
                {chat.last_message && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {chat.last_message.sender_username}: {chat.last_message.content}
                  </p>
                )}
              </div>
              {/* You can add unread message count here if available */}
              {/* <div className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">3</div> */}
            </button>
          ))
        )}
      </div>

      {/* User profile info at the bottom (optional) */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <img
              src={`https://placehold.co/40x40/cbd5e1/475569?text=${currentUser?.username?.charAt(0).toUpperCase() || 'U'}`}
              alt="User Avatar"
              className="rounded-full w-full h-full object-cover border border-gray-300"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/40x40/cbd5e1/475569?text=U" }}
            />
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"></span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {currentUser?.username || 'Guest'}
            </p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
