import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get all services for a specific hospital
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} - Hospital services
 */
export const getHospitalServices = async (hospitalId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/services`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospital services',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital services:', error);
    throw error;
  }
};

/**
 * Add a new service to a hospital
 * @param {number} hospitalId - Hospital ID
 * @param {Object} serviceData - Service details (name, description, price)
 * @returns {Promise} - Created service
 */
export const addHospitalService = async (hospitalId, serviceData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to add service',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error adding hospital service:', error);
    throw error;
  }
};

/**
 * Update an existing hospital service
 * @param {number} hospitalId - Hospital ID
 * @param {number} serviceId - Service ID
 * @param {Object} serviceData - Updated service details
 * @returns {Promise} - Updated service
 */
export const updateHospitalService = async (hospitalId, serviceId, serviceData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update service',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating hospital service:', error);
    throw error;
  }
};

/**
 * Delete a hospital service
 * @param {number} hospitalId - Hospital ID
 * @param {number} serviceId - Service ID
 * @returns {Promise} - Response
 */
export const deleteHospitalService = async (hospitalId, serviceId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/services/${serviceId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to delete service',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting hospital service:', error);
    throw error;
  }
};

/**
 * Add multiple services to a hospital at once
 * @param {number} hospitalId - Hospital ID
 * @param {Array} services - Array of service objects
 * @returns {Promise} - Response with created services
 */
export const addBulkHospitalServices = async (hospitalId, services) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/services/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ services }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to add services in bulk',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error adding bulk hospital services:', error);
    throw error;
  }
};

/**
 * Search hospital services by name or description
 * @param {number} hospitalId - Hospital ID
 * @param {string} query - Search query
 * @returns {Promise} - Search results
 */
export const searchHospitalServices = async (hospitalId, query) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/hospitals/${hospitalId}/services/search?q=${encodeURIComponent(query)}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to search services',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error searching hospital services:', error);
    throw error;
  }
};
