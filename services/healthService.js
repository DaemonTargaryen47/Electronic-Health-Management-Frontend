import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get the current user's health information
 * @returns {Promise} - Health information data
 */
export const getHealthInfo = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/health-info`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch health information',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting health information:', error);
    throw error;
  }
};

/**
 * Create new health information for the user
 * @param {Object} healthData - The health information to save
 * @returns {Promise} - Creation response
 */
export const createHealthInfo = async (healthData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/health-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(healthData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create health information',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating health information:', error);
    throw error;
  }
};

/**
 * Update existing health information
 * @param {Object} healthData - The updated health information
 * @returns {Promise} - Update response
 */
export const updateHealthInfo = async (healthData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/health-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(healthData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update health information',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating health information:', error);
    throw error;
  }
};

/**
 * Delete user's health information
 * @returns {Promise} - Deletion response
 */
export const deleteHealthInfo = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/health-info`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to delete health information',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting health information:', error);
    throw error;
  }
};

/**
 * Get user's complete profile including health information
 * @returns {Promise} - Complete profile data
 */
export const getCompleteProfile = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/complete-profile`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch complete profile',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting complete profile:', error);
    throw error;
  }
};
