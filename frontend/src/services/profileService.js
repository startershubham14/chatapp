import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with auth token
const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Create axios instance for file uploads
const createUploadInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const profileService = {
  /**
   * Update user profile information
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(profileData) {
    try {
      const response = await createAuthInstance().put('/api/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update profile');
    }
  },

  /**
   * Upload user avatar
   * @param {FormData} formData - Form data containing the image file
   * @returns {Promise<Object>} Upload result with image URL
   */
  async uploadAvatar(formData) {
    try {
      const response = await createUploadInstance().post('/api/users/profile/avatar', formData);
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error(error.response?.data?.detail || 'Failed to upload avatar');
    }
  },

  /**
   * Delete user avatar
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAvatar() {
    try {
      const response = await createAuthInstance().delete('/api/users/profile/avatar');
      return response.data;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete avatar');
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentUser() {
    try {
      const response = await createAuthInstance().get('/api/users/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get current user');
    }
  },
};
