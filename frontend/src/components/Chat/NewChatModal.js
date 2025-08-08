/**
 * New Chat Modal Component
 * Allows users to create a new private or group chat.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, MessageSquare } from 'lucide-react';
import { chatService } from '../../services/chatService'; // Assuming chatService has methods to fetch users and create chats

const NewChatModal = ({ isOpen, onClose, onChatCreated, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatName, setChatName] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState('');

  const fetchAllUsers = useCallback(async () => {
    try {
      // Fetch all users available for chat, excluding the current user
      const allUsers = await chatService.getAllUsers();
      setUsers(allUsers.filter(user => user.id !== currentUser.id));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users for new chat.');
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSearchTerm('');
      setUsers([]);
      setSelectedUsers([]);
      setChatName('');
      setError('');
      fetchAllUsers(); // Fetch all users when the modal opens
    }
  }, [isOpen, fetchAllUsers]);

  const handleUserSelect = (user) => {
    setSelectedUsers((prevSelected) => {
      if (prevSelected.some((u) => u.id === user.id)) {
        return prevSelected.filter((u) => u.id !== user.id); // Deselect
      } else {
        return [...prevSelected, user]; // Select
      }
    });
  };

  const handleCreateChat = async () => {
    setCreatingChat(true);
    setError('');

    if (selectedUsers.length === 0) {
      setError('Please select at least one user to start a chat.');
      setCreatingChat(false);
      return;
    }

    try {
      let newChat;
      if (selectedUsers.length === 1) {
        // Private chat
        newChat = await chatService.createPrivateChat(currentUser.id, selectedUsers[0].id);
      } else {
        // Group chat
        const participantIds = [currentUser.id, ...selectedUsers.map(user => user.id)];
        newChat = await chatService.createGroupChat(
          chatName.trim() || `Group Chat with ${selectedUsers.length} members`,
          participantIds
        );
      }
      onChatCreated(newChat); // Callback to update parent component
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError('Failed to create chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Start New Chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {selectedUsers.length > 1 && (
            <div className="mb-4">
              <label htmlFor="chatName" className="block text-sm font-medium text-gray-700 mb-1">
                Group Chat Name (Optional)
              </label>
              <input
                type="text"
                id="chatName"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="e.g., Team Alpha, Family Fun"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Search and Select Users */}
          <div>
            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Select Participants:
            </label>
            <input
              type="text"
              id="userSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {filteredUsers.length === 0 && !creatingChat ? (
                <p className="p-4 text-gray-500 text-sm text-center">No users found.</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex items-center justify-between w-full p-3 border-b last:border-b-0 hover:bg-gray-50 transition duration-150 ease-in-out
                      ${selectedUsers.some((u) => u.id === user.id) ? 'bg-primary-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://placehold.co/30x30/cbd5e1/475569?text=${user.username.charAt(0).toUpperCase()}`}
                        alt="User Avatar"
                        className="rounded-full w-8 h-8 object-cover border border-gray-200"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/30x30/cbd5e1/475569?text=U" }}
                      />
                      <span className="text-sm font-medium text-gray-800">{user.username}</span>
                    </div>
                    {selectedUsers.some((u) => u.id === user.id) && (
                      <MessageSquare className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                Selected: {selectedUsers.map((u) => u.username).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
            disabled={creatingChat}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200"
            disabled={creatingChat || selectedUsers.length === 0}
          >
            {creatingChat ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
