import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Save, User, MessageCircle, FileText } from 'lucide-react';
import Avatar from '../common/Avatar';
import AvatarUpload from '../common/AvatarUpload';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';

const ProfileModal = ({ isOpen, onClose, currentUser, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    status_message: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        display_name: currentUser.display_name || '',
        bio: currentUser.bio || '',
        status_message: currentUser.status_message || ''
      });
      setErrors({});
    }
  }, [currentUser, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.display_name && formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be less than 100 characters';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    if (formData.status_message && formData.status_message.length > 200) {
      newErrors.status_message = 'Status message must be less than 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const updatedUser = await profileService.updateProfile(formData);
      onProfileUpdate(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleAvatarUpload = async (blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      
      const result = await profileService.uploadAvatar(formData);
      onProfileUpdate({ ...currentUser, profile_image_url: result.profile_image_url });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentUser.profile_image_url) return;
    
    if (!confirm('Are you sure you want to delete your profile picture?')) return;
    
    setIsDeleting(true);
    try {
      await profileService.deleteAvatar();
      onProfileUpdate({ ...currentUser, profile_image_url: null });
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      alert('Failed to delete avatar. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar 
                user={currentUser} 
                size="2xl" 
                onClick={isEditing ? undefined : () => setIsEditing(true)}
                className={isEditing ? '' : 'cursor-pointer hover:opacity-80'}
              />
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="absolute top-0 right-0 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditing && (
              <div className="space-y-4">
                <AvatarUpload
                  currentImageUrl={currentUser.profile_image_url}
                  onUpload={handleAvatarUpload}
                  onCancel={() => {}}
                />
                
                {currentUser.profile_image_url && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors mx-auto"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Remove Photo
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Enter display name"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.display_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength={100}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {currentUser.display_name || currentUser.username}
                </p>
              )}
              {errors.display_name && (
                <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {currentUser.username}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {currentUser.email}
              </p>
            </div>

            {/* Status Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Status Message
              </label>
              {isEditing ? (
                <textarea
                  value={formData.status_message}
                  onChange={(e) => handleInputChange('status_message', e.target.value)}
                  placeholder="What's on your mind?"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                    errors.status_message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={2}
                  maxLength={200}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg text-gray-900 min-h-[3rem]">
                  {currentUser.status_message || 'No status message'}
                </p>
              )}
              {errors.status_message && (
                <p className="text-red-500 text-sm mt-1">{errors.status_message}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                    errors.bio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  maxLength={500}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg text-gray-900 min-h-[4rem]">
                  {currentUser.bio || 'No bio added'}
                </p>
              )}
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition duration-200"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition duration-200"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
