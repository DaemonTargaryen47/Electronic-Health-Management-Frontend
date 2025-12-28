import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get all test results for the current patient
 * @returns {Promise} - Patient's test results
 */
export const getMyTestResults = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/me/test-results`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch test results',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
};

/**
 * Get all pending tests for the current patient
 * @returns {Promise} - Patient's pending tests
 */
export const getMyPendingTests = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/me/pending-tests`);
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
 * Check if there are any new test results since a given timestamp
 * @param {string} timestamp - ISO timestamp to check against
 * @returns {Promise} - Whether there are new results
 */
export const checkNewTestResults = async (timestamp) => {
  try {
    const response = await getMyTestResults();
    
    if (!response.success || !response.test_results || response.test_results.length === 0) {
      return { hasNewResults: false, count: 0 };
    }
    
    // Parse the timestamp and compare with result_date
    const compareDate = new Date(timestamp);
    const newResults = response.test_results.filter(result => {
      const resultDate = new Date(result.result_date);
      return resultDate > compareDate;
    });
    
    return { 
      hasNewResults: newResults.length > 0, 
      count: newResults.length,
      lastCheckedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error checking for new test results:', error);
    return { hasNewResults: false, count: 0 };
  }
};

/**
 * Get test results for a specific appointment
 * @param {number} appointmentId - Appointment ID
 * @param {Object} appointmentData - Optional appointment data that may contain test results
 * @returns {Promise} - Test results for the appointment
 */
export const getTestResultsByAppointment = async (appointmentId, appointmentData = null) => {
  try {
    // If appointment data is provided and contains services with results
    if (appointmentData && appointmentData.services && appointmentData.services.length > 0) {
      // Filter services that have result data
      const servicesWithResults = appointmentData.services.filter(
        service => service.result_id || service.result_date || service.result_details || service.result_file
      );
      
      if (servicesWithResults.length > 0) {
        return {
          success: true,
          test_results: servicesWithResults,
          count: servicesWithResults.length
        };
      }
    }

    // If no results found in provided data or no data provided, fetch all results
    const allResults = await getMyTestResults();
    
    if (!allResults.success) {
      throw new Error(allResults.message || 'Failed to fetch test results');
    }
    
    // Filter results for the specific appointment
    const appointmentResults = allResults.test_results.filter(
      result => result.appointment_id === parseInt(appointmentId)
    );
    
    return {
      success: true,
      test_results: appointmentResults,
      count: appointmentResults.length
    };
  } catch (error) {
    console.error('Error fetching appointment test results:', error);
    throw error;
  }
};
