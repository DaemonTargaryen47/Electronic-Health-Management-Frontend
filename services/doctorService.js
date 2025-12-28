import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';
import { isAuthenticated } from './authService';

/**
 * Register current user as a doctor
 * @param {Object} doctorData - Doctor registration data
 * @returns {Promise} - Registration response
 */
export const registerAsDoctor = async (doctorData) => {
  try {
    const token = localStorage.getItem('token');
    let response;
    
    // Check if we have a file to upload
    if (doctorData.certificate_file instanceof File) {
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      
      // Add certificate file
      formData.append('certificate_file', doctorData.certificate_file);
      
      // Add other data as strings for FormData
      formData.append('specialties', JSON.stringify(doctorData.specialties));
      formData.append('certificate_details', JSON.stringify(doctorData.certificate_details));
      
      // Use FormData with proper headers (browser will set multipart/form-data)
      response = await fetch(`${BACKEND_SERVER}/api/doctors/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Let browser set the correct content type with boundary
        },
        body: formData,
      });
    } else {
      // No file - use JSON format
      const jsonData = {
        specialties: doctorData.specialties,
        certificate_details: doctorData.certificate_details,
        // Either null or a string URL if that's what we have
        certificate_file: doctorData.certificate_file 
      };
      
      // Use JSON with application/json content type
      response = await fetch(`${BACKEND_SERVER}/api/doctors/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData),
      });
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to register as doctor',
        errors: data.errors || {},
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error registering as doctor:', error);
    throw error;
  }
};

/**
 * Get current user's doctor profile
 * @returns {Promise} - Doctor profile data
 */
export const getDoctorProfile = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/me`);
    const data = await response.json();
    
    // Log the API response to console debug line
    console.log('getDoctorProfile API Response:', data);

    if (!response.ok) {
      throw {
        message: data.message || 'Failed to get doctor profile',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting doctor profile:', error);
    throw error;
  }
};

/**
 * Update doctor profile information
 * @param {Object} doctorData - Updated doctor information
 * @returns {Promise} - Update response
 */
export const updateDoctorProfile = async (doctorData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update doctor profile',
        errors: data.errors || {},
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    throw error;
  }
};

/**
 * Get all doctors with optional filtering
 * @param {Object} options - Filter options
 * @returns {Promise} - Doctors list
 */
export const getAllDoctors = async (options = {}) => {
  try {
    const { status, limit = 20, offset = 0 } = options;
    let url = `${BACKEND_SERVER}/api/doctors/all?limit=${limit}&offset=${offset}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    // Log the API response to console debug line
    //console.log('getAllDoctors API Response:', data);
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch doctors',
        status: response.status
      };
    }
    
    
    
    return data;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

/**
 * Get doctors with pending verification
 * @returns {Promise} - Pending doctors list
 */
export const getPendingDoctors = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/pending`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch pending doctors',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    throw error;
  }
};

/**
 * Get doctor by ID (public endpoint, no authentication required)
 * @param {number} doctorId - Doctor ID
 * @returns {Promise} - Doctor data
 */
export const getDoctorById = async (doctorId) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/doctors/${doctorId}/public-profile`);
    const data = await response.json();

    // Log the API response to console debug line
    console.log('getDoctorById API Response:', data);
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch doctor',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor:', error);
    throw error;
  }
};

/**
 * Verify a doctor (admin only)
 * @param {number} doctorId - Doctor ID
 * @param {string} status - Verification status (approved/rejected)
 * @returns {Promise} - Verification response
 */
export const verifyDoctor = async (doctorId, status) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/${doctorId}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to verify doctor',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error verifying doctor:', error);
    throw error;
  }
};

/**
 * Get doctors at a specific hospital
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} - Hospital doctors list with their details including specialties, working hours, and doctor_fees
 */
export const getHospitalDoctors = async (hospitalId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/hospital/${hospitalId}`);
    const data = await response.json();
    
    console.log('getHospitalDoctors API Response:', data);

    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospital doctors',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital doctors:', error);
    throw error;
  }
};

/**
 * Add a doctor to a hospital (hospital admin only)
 * @param {number} hospitalId - Hospital ID
 * @param {Object} doctorData - Doctor data for hospital
 * @returns {Promise} - Response
 */
export const addDoctorToHospital = async (hospitalId, doctorData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/hospital/${hospitalId}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to add doctor to hospital',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error adding doctor to hospital:', error);
    throw error;
  }
};

/**
 * Remove a doctor from a hospital (hospital admin only)
 * @param {number} hospitalId - Hospital ID
 * @param {number} doctorId - Doctor ID
 * @returns {Promise} - Response
 */
export const removeDoctorFromHospital = async (hospitalId, doctorId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/hospital/${hospitalId}/remove/${doctorId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to remove doctor from hospital',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error removing doctor from hospital:', error);
    throw error;
  }
};

/**
 * Update doctor details at a hospital (hospital admin only)
 * @param {number} hospitalId - Hospital ID
 * @param {number} hospitalDoctorId - Hospital-Doctor relationship ID
 * @param {Object} updateData - Updated doctor details
 * @returns {Promise} - Response
 */
export const updateHospitalDoctor = async (hospitalId, hospitalDoctorId, updateData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctors/hospital/doctor/${hospitalDoctorId}?hospital_id=${hospitalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update doctor details',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating hospital doctor details:', error);
    throw error;
  }
};

/**
 * Search doctors by name, specialties, or hospital affiliation
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @param {number} offset - Number of results to skip
 * @returns {Promise} - Doctors search results
 */
export const searchDoctors = async (query, limit = 20, offset = 0) => {
  try {
    const url = `${BACKEND_SERVER}/api/doctors/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
    
    let response;
    if (isAuthenticated()) {
      response = await authFetch(url);
    } else {
      response = await fetch(url);
    }
    
    const data = await response.json();
    
    // Log the API response to console debug line
    //console.log('searchDoctors API Response:', data);
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to search doctors',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error searching doctors:', error);
    throw error;
  }
};
