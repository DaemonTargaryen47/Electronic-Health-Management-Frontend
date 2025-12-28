import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get prescriptions for a specific patient
 * @param {number} patientId - Patient ID
 * @returns {Promise} - Patient prescriptions
 */
export const getPatientPrescriptions = async (patientId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/medical-records/prescriptions/patient/${patientId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch prescriptions',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    throw error;
  }
};

/**
 * Get a specific prescription by ID
 * @param {number} prescriptionId - Prescription ID
 * @returns {Promise} - Prescription details
 */
export const getPrescriptionById = async (prescriptionId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/medical-records/prescriptions/${prescriptionId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch prescription',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching prescription:', error);
    throw error;
  }
};

/**
 * Create a new prescription
 * @param {Object} prescriptionData - Prescription details
 * @returns {Promise} - Created prescription
 */
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/medical-records/prescriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prescriptionData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create prescription',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating prescription:', error);
    throw error;
  }
};

/**
 * Create a prescription with file upload
 * @param {FormData} formData - Form data including file and prescription details
 * @returns {Promise} - Created prescription
 */
export const createPrescriptionWithFile = async (formData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/medical-records/prescriptions/create`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create prescription',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating prescription with file:', error);
    throw error;
  }
};

/**
 * Update an existing prescription
 * @param {number} prescriptionId - Prescription ID
 * @param {Object} prescriptionData - Updated prescription data
 * @returns {Promise} - Updated prescription
 */
export const updatePrescription = async (prescriptionId, prescriptionData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/medical-records/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prescriptionData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update prescription',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
};
