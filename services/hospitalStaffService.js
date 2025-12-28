import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Add a user as hospital staff with a specific role
 * @param {number} hospitalId - Hospital ID
 * @param {number} userId - User ID
 * @param {string} role - Staff role (nurse, pathologist, other)
 * @returns {Promise} - Response data
 */
export const addHospitalStaff = async (hospitalId, userId, role) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/hospital/${hospitalId}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, role }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to add hospital staff',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error adding hospital staff:', error);
    throw error;
  }
};

/**
 * Get all staff members for a specific hospital
 * @param {number} hospitalId - Hospital ID
 * @param {string} role - Optional role filter
 * @returns {Promise} - Staff members
 */
export const getHospitalStaff = async (hospitalId, role = null) => {
  try {
    let url = `${BACKEND_SERVER}/api/hospital-staff/hospital/${hospitalId}/staff`;
    if (role) {
      url += `?role=${role}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospital staff',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital staff:', error);
    throw error;
  }
};

/**
 * Update a staff member's role
 * @param {number} staffId - Hospital staff ID
 * @param {string} role - New role (nurse, pathologist, other)
 * @returns {Promise} - Response data
 */
export const updateStaffRole = async (staffId, role) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update staff role',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating staff role:', error);
    throw error;
  }
};

/**
 * Remove a staff member from a hospital
 * @param {number} staffId - Hospital staff ID
 * @returns {Promise} - Response data
 */
export const removeHospitalStaff = async (staffId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/staff/${staffId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to remove hospital staff',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error removing hospital staff:', error);
    throw error;
  }
};

/**
 * Get all roles for the current user
 * @returns {Promise} - User's staff roles
 */
export const getMyStaffRoles = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/my-roles`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch staff roles',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching staff roles:', error);
    throw error;
  }
};

/**
 * Get all hospitals where the current user is staff
 * @returns {Promise} - User's hospitals
 */
export const getMyHospitals = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/my-hospitals`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch staff hospitals',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching staff hospitals:', error);
    throw error;
  }
};

/**
 * Get dashboard information for a pathologist
 * @returns {Promise} - Dashboard metrics and pending tests
 */
export const getPathologistDashboard = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/dashboard/pathologist`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch pathologist dashboard',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching pathologist dashboard:', error);
    throw error;
  }
};

/**
 * Get dashboard information for a nurse
 * @returns {Promise} - Dashboard metrics
 */
export const getNurseDashboard = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/dashboard/nurse`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch nurse dashboard',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching nurse dashboard:', error);
    throw error;
  }
};

/**
 * Get pending tests for the current pathologist
 * @param {number} limit - Number of results to return
 * @param {number} offset - Number of results to skip
 * @returns {Promise} - Pending tests
 */
export const getPendingTests = async (limit = 50, offset = 0) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/hospital-staff/test-results/pending?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch pending tests',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching pending tests:', error);
    throw error;
  }
};

/**
 * Create a test result for a specific service
 * @param {number} appointmentServiceId - Appointment service ID
 * @param {Object} resultDetails - Test result details
 * @param {File} resultFile - Optional file to upload with the test result
 * @returns {Promise} - Created test result
 */
export const createTestResult = async (appointmentServiceId, resultDetails, resultFile = null) => {
  try {
    let response;
    
    // If we have a file, use FormData
    if (resultFile) {
      const formData = new FormData();
      formData.append('appointment_service_id', appointmentServiceId);
      formData.append('result_details', JSON.stringify(resultDetails));
      formData.append('result_file', resultFile);
      
      response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/test-results`, {
        method: 'POST',
        body: formData
      });
    } else {
      // Otherwise use JSON
      response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/test-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_service_id: appointmentServiceId,
          result_details: resultDetails
        }),
      });
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create test result',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating test result:', error);
    throw error;
  }
};

/**
 * Get a specific test result
 * @param {number} resultId - Test result ID
 * @returns {Promise} - Test result
 */
export const getTestResult = async (resultId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/test-results/${resultId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch test result',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching test result:', error);
    throw error;
  }
};

/**
 * Get all test results for a patient
 * @param {number} patientId - Patient ID
 * @returns {Promise} - Patient's test results
 */
export const getPatientTestResults = async (patientId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/hospital-staff/patient/${patientId}/test-results`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch patient test results',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching patient test results:', error);
    throw error;
  }
};

/**
 * Get all test results for a hospital
 * @param {number} hospitalId - Hospital ID
 * @param {number} limit - Number of results to return
 * @param {number} offset - Number of results to skip
 * @returns {Promise} - Hospital's test results
 */
export const getHospitalTestResults = async (hospitalId, limit = 50, offset = 0) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/hospital-staff/hospital/${hospitalId}/test-results?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospital test results',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital test results:', error);
    throw error;
  }
};

/**
 * Get all test results submitted by the pathologist
 * @param {Object} options - Query options (limit, offset, search)
 * @returns {Promise} - Test results
 */
export const getMyTestResultsSubmissions = async (options = {}) => {
  try {
    const { limit = 50, offset = 0, search = '' } = options;
    let url = `${BACKEND_SERVER}/api/hospital-staff/my-test-results?limit=${limit}&offset=${offset}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch test results',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching pathologist test results:', error);
    throw error;
  }
};

/**
 * Get all test results for a hospital with search and filtering
 * @param {number} hospitalId - Hospital ID
 * @param {Object} options - Query options (limit, offset, search)
 * @returns {Promise} - Test results
 */
export const getHospitalTestResultsWithFilters = async (hospitalId, options = {}) => {
  try {
    const { limit = 50, offset = 0, search = '' } = options;
    let url = `${BACKEND_SERVER}/api/hospital-staff/hospital/${hospitalId}/test-results?limit=${limit}&offset=${offset}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospital test results',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital test results:', error);
    throw error;
  }
};
