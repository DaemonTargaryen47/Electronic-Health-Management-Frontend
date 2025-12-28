import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';
import { getToken } from './authService';

/**
 * Get the current user's profile information
 * @returns {Promise} - User profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    // Check if token exists in localStorage before making the request
    const token = getToken();
    //console.log('Current token:', token);
    if (!token) {
      console.error('Authentication token is missing');
      throw new Error('You are not authenticated. Please log in again.');
    }
    
    console.log('Making authenticated request with token:', token.substring(0, 15) + '...');
    // Log JWT structure for debugging
    try {
      const tokenParts = token.split('.');
      const decodedHeader = JSON.parse(atob(tokenParts[0]));
      const decodedPayload = JSON.parse(atob(tokenParts[1]));
      console.log('JWT Header:', decodedHeader);
      console.log('JWT Payload:', decodedPayload);
      console.log('Request endpoint:', `${BACKEND_SERVER}/api/auth/me`);
    } catch (e) {
      console.log('Error decoding JWT token:', e);
    }
    
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/me`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Server response error:', response.status, data, response.statusText);
      throw new Error(data.message || 'Failed to fetch user profile');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update the current user's profile information
 * @param {Object} profileData - Updated profile data
 * @returns {Promise} - Updated user data
 */
export const updateUserProfile = async (profileData) => {
  try {
    // Log request information for debugging
    console.log('Update profile request data:', profileData);
    console.log('Request endpoint:', `${BACKEND_SERVER}/api/auth/update-profile`);
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        const decodedHeader = JSON.parse(atob(tokenParts[0]));
        const decodedPayload = JSON.parse(atob(tokenParts[1]));
        console.log('JWT Header:', decodedHeader);
        console.log('JWT Payload:', decodedPayload);
      } catch (e) {
        console.log('Error decoding JWT token:', e);
      }
    }
    
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update profile',
        errors: data.errors || {},
        response: { data },
        status: response.status
      };
    }
    
    // Update the stored user data in localStorage
    if (data.success && data.user) {
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
