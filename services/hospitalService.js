import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';
import { getCurrentUser, isAuthenticated } from './authService';

/**
 * Helper function to get authorization header
 * @returns {Object} - Authorization header object
 */
const getAuthHeader = () => {
  const user = getCurrentUser();
  if (user && user.token) {
    return { 'Authorization': `Bearer ${user.token}` };
  }
  return {};
};



/**
 * Get all hospitals with pagination
 * @param {number} limit - Number of results to return
 * @param {number} offset - Number of results to skip
 * @param {boolean} advertisedFirst - Sort advertised hospitals first
 * @returns {Promise} - Hospitals data
 */
export const getAllHospitals = async (limit = 20, offset = 0, advertisedFirst = true) => {
  try {
    const response = await fetch(
      `${BACKEND_SERVER}/api/hospitals?limit=${limit}&offset=${offset}&advertised_first=${advertisedFirst}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hospitals');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    throw error;
  }
};

/**
 * Get a hospital by ID
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} - Hospital data
 */
export const getHospitalById = async (hospitalId) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hospital');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital:', error);
    throw error;
  }
};

/**
 * Create a new hospital
 * @param {Object} hospitalData - Hospital information
 * @returns {Promise} - Created hospital data
 */
export const createHospital = async (hospitalData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hospitalData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.errors) {
        throw {
          message: data.message || 'Failed to create hospital',
          errors: data.errors,
          status: response.status
        };
      }
      throw new Error(data.message || 'Failed to create hospital');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating hospital:', error);
    throw error;
  }
};

/**
 * Update a hospital
 * @param {number} hospitalId - Hospital ID
 * @param {Object} hospitalData - Updated hospital information
 * @returns {Promise} - Updated hospital data
 */
export const updateHospital = async (hospitalId, hospitalData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hospitalData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update hospital');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating hospital:', error);
    throw error;
  }
};

/**
 * Delete a hospital
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} - Response data
 */
export const deleteHospital = async (hospitalId) => {
  try {
    // Use authFetch to automatically include the JWT token
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete hospital');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting hospital:', error);
    throw error;
  }
};

/**
 * Search hospitals
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @param {number} offset - Number of results to skip
 * @returns {Promise} - Hospitals data
 */
export const searchHospitals = async (query, limit = 20, offset = 0) => {
  try {
    // Build the URL for the search endpoint
    const searchUrl = `${BACKEND_SERVER}/api/hospitals/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
    
    let response;
    
    // If user is authenticated, use authFetch to include JWT token
    // Otherwise, use regular fetch for anonymous search
    if (isAuthenticated()) {
      response = await authFetch(searchUrl);
    } else {
      response = await fetch(searchUrl);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search hospitals');
    }
    
    return data;
  } catch (error) {
    console.error('Error searching hospitals:', error);
    throw error;
  }
};

/**
 * Get all admins for a hospital
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} - Admins data
 */
export const getHospitalAdmins = async (hospitalId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/admins`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hospital admins');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital admins:', error);
    throw error;
  }
};

/**
 * Add an admin to a hospital
 * @param {number} hospitalId - Hospital ID
 * @param {number} userId - User ID
 * @param {string} role - Admin role
 * @returns {Promise} - Response data
 */
export const addHospitalAdmin = async (hospitalId, userId, role) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, role }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add hospital admin');
    }
    
    return data;
  } catch (error) {
    console.error('Error adding hospital admin:', error);
    throw error;
  }
};

/**
 * Remove an admin from a hospital
 * @param {number} hospitalId - Hospital ID
 * @param {number} userId - User ID to remove
 * @returns {Promise} - Response data
 */
export const removeHospitalAdmin = async (hospitalId, userId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/admins/${userId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove hospital admin');
    }
    
    return data;
  } catch (error) {
    console.error('Error removing hospital admin:', error);
    throw error;
  }
};

/**
 * Check if the current user is an admin for a hospital
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise<boolean>} - Whether the user is an admin
 */
export const checkHospitalAdminStatus = async (hospitalId) => {
  try {
    // Use authFetch to handle adding auth headers
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/is_admin`);
    
    if (!response.ok) {
      console.error(`Error checking admin status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    return data.is_admin === true;
  } catch (error) {
    console.error(`Error checking admin status for hospital ${hospitalId}:`, error);
    return false;
  }
};
