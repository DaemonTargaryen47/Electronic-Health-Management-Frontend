import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get dashboard summary metrics for the doctor
 * @returns {Promise} - Dashboard metrics
 */
export const getDashboardSummary = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/summary`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch dashboard summary',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor dashboard summary:', error);
    throw error;
  }
};

/**
 * Get today's appointments for the doctor
 * @returns {Promise} - Today's appointments
 */
export const getTodaysAppointments = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/appointments/today`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch today\'s appointments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    throw error;
  }
};

/**
 * Get upcoming appointments for the doctor
 * @returns {Promise} - Upcoming appointments
 */
export const getUpcomingAppointments = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/appointments/upcoming`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch upcoming appointments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
};

/**
 * Get calendar appointments for a specific date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Calendar appointments
 */
export const getCalendarAppointments = async (startDate, endDate) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/appointments/calendar?start=${startDate}&end=${endDate}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch calendar appointments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching calendar appointments:', error);
    throw error;
  }
};

/**
 * Update appointment status
 * @param {number} appointmentId - Appointment ID
 * @param {string} status - New status (scheduled, completed, canceled)
 * @returns {Promise} - Update response
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/appointments/update-status/${appointmentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update appointment status',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

/**
 * Get doctor's patients
 * @param {number} limit - Number of patients to return
 * @param {number} offset - Number of patients to skip
 * @returns {Promise} - Doctor's patients
 */
export const getDoctorPatients = async (limit = 20, offset = 0) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/patients?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch patients',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    throw error;
  }
};

/**
 * Get patient details with history
 * @param {number} patientId - Patient ID
 * @returns {Promise} - Patient details with history
 */
export const getPatientDetails = async (patientId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/patients/${patientId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch patient details',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching patient details:', error);
    throw error;
  }
};

/**
 * Get patient health information
 * @param {number} patientId - Patient ID
 * @returns {Promise} - Patient health information
 */
export const getPatientHealthInfo = async (patientId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/patients/${patientId}/health-info`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch patient health information',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching patient health information:', error);
    throw error;
  }
};

/**
 * Get doctor's hospitals
 * @returns {Promise} - Doctor's hospitals
 */
export const getDoctorHospitals = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/hospitals`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospitals',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor hospitals:', error);
    throw error;
  }
};

/**
 * Get appointment analytics for visualization
 * @param {string} period - Analytics period ('month' or 'year')
 * @returns {Promise} - Appointment analytics
 */
export const getAppointmentAnalytics = async (period = 'month') => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/analytics/appointments?period=${period}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch appointment analytics',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    throw error;
  }
};

/**
 * Get doctor's prescriptions
 * @param {number} limit - Number of prescriptions to return
 * @param {number} offset - Number of prescriptions to skip
 * @returns {Promise} - Doctor's prescriptions
 */
export const getDoctorPrescriptions = async (limit = 20, offset = 0) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/prescriptions?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch prescriptions',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    throw error;
  }
};

/**
 * Get doctor's test results
 * @param {number} limit - Number of test results to return
 * @param {number} offset - Number of test results to skip
 * @returns {Promise} - Doctor's test results
 */
export const getDoctorTestResults = async (limit = 20, offset = 0) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/test-results?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch test results',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor test results:', error);
    throw error;
  }
};

/**
 * Get doctor's working hours across all hospitals
 * @param {number} hospitalId - Optional hospital ID to filter
 * @returns {Promise} - Doctor's working hours
 */
export const getDoctorWorkingHours = async (hospitalId = null) => {
  try {
    let url = `${BACKEND_SERVER}/api/doctor/dashboard/working-hours`;
    if (hospitalId) {
      url += `?hospital_id=${hospitalId}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch working hours',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor working hours:', error);
    throw error;
  }
};

/**
 * Update doctor's working hours at a specific hospital
 * @param {number} hospitalDoctorId - Hospital-Doctor relationship ID
 * @param {Object} workingHours - Working hours data
 * @returns {Promise} - Update response
 */
export const updateWorkingHours = async (hospitalDoctorId, workingHours) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/working-hours/${hospitalDoctorId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ working_hours: workingHours }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update working hours',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating working hours:', error);
    throw error;
  }
};

/**
 * Get appointment details by ID
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise} - Appointment details
 */
export const getAppointmentDetails = async (appointmentId) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/appointments/${appointmentId}`
    );
    const data = await response.json();
    
    console.log('Doctor Dashboard Appointment details api response:', data);

    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch appointment details',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    throw error;
  }
};

/**
 * Add medical notes to an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {Object} notesData - Notes data including diagnosis, prescription, etc.
 * @returns {Promise} - Response with updated appointment
 */
export const addMedicalNotes = async (appointmentId, notesData) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/appointments/${appointmentId}/notes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notesData),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to add medical notes',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error adding medical notes:', error);
    throw error;
  }
};

/**
 * Reschedule an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {string} newDateTime - New date and time (ISO format)
 * @returns {Promise} - Response with updated appointment
 */
export const rescheduleAppointment = async (appointmentId, newDateTime) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/appointments/${appointmentId}/reschedule`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_datetime: newDateTime }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to reschedule appointment',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    throw error;
  }
};

/**
 * Get patient prescriptions
 * @param {number} patientId - Patient ID
 * @returns {Promise} - Patient prescriptions
 */
export const getPatientPrescriptions = async (patientId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/patients/${patientId}/prescriptions`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch patient prescriptions',
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
 * Create a prescription for patient
 * @param {number} patientId - Patient ID
 * @param {Object} prescriptionData - Prescription details
 * @returns {Promise} - Created prescription
 */
export const createPatientPrescription = async (patientId, prescriptionData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/patients/${patientId}/prescribe`, {
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
 * @param {number} patientId - Patient ID
 * @param {FormData} formData - Form data including file and prescription details
 * @returns {Promise} - Created prescription
 */
export const createPatientPrescriptionWithFile = async (patientId, formData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/doctor/dashboard/patients/${patientId}/prescribe`, {
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
 * Order diagnostic tests for a patient
 * @param {number} patientId - Patient ID
 * @param {number} appointmentId - Appointment ID
 * @param {Array} serviceIds - Array of service IDs to order
 * @returns {Promise} - API response
 */
export const orderTestsForPatient = async (patientId, appointmentId, serviceIds) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/doctor/dashboard/patient/${patientId}/order-tests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          services: serviceIds
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to order tests',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error ordering tests for patient:', error);
    throw error;
  }
};
