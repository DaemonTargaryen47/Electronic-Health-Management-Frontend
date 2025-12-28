import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';
import { setupUserSession } from './authService';

/**
 * Get user by email address
 * @param {string} email - Email address to search
 * @returns {Promise} - User information
 */
export const getUserByEmail = async (email) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/user-by-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || `User with email ${email} not found`,
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

/**
 * Refresh current user information from the server
 * @returns {Promise} - Updated user data
 */
export const refreshCurrentUser = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/me`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to refresh user data',
        status: response.status
      };
    }
    
    // Update the stored user data in localStorage
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user)); 
      return data.user;
    }
    
    throw new Error('Invalid user data received');
  } catch (error) {
    console.error('Error refreshing user data:', error);
    throw error;
  }
};
