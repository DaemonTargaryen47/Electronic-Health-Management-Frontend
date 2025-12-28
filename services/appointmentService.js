import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise} - Created appointment data
 */
export const createAppointment = async (appointmentData) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create appointment',
        errors: data.errors || {},
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Get all appointments for the current user
 * @param {string} status - Optional status filter (scheduled, completed, canceled)
 * @returns {Promise} - User appointments
 */
export const getUserAppointments = async (status = null) => {
  try {
    let url = `${BACKEND_SERVER}/api/patients/appointments/me`;
    if (status) {
      url += `?status=${status}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch appointments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific appointment
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise} - Appointment details
 */
export const getAppointmentById = async (appointmentId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/appointments/${appointmentId}`);
    const data = await response.json();
    
    console.log('getAppointmentById API Response:', data);

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
 * Update the status of an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {string} status - New status (scheduled, completed, canceled)
 * @returns {Promise} - Status update response
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
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
 * Cancel an appointment (wrapper for updateAppointmentStatus with 'canceled' status)
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise} - Cancellation response
 */
export const cancelAppointment = async (appointmentId) => {
  return updateAppointmentStatus(appointmentId, 'canceled');
};

/**
 * Reschedule an appointment to a new time
 * @param {number} appointmentId - Appointment ID
 * @param {string} appointmentTime - New appointment time (ISO format)
 * @returns {Promise} - Reschedule response
 */
export const rescheduleAppointment = async (appointmentId, appointmentTime) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/appointments/${appointmentId}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appointment_time: appointmentTime }),
    });
    
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
 * Get all appointments for a specific hospital
 * @param {number} hospitalId - Hospital ID
 * @param {Object} options - Query options (status, date, limit, offset)
 * @returns {Promise} - Hospital appointments
 */
export const getHospitalAppointments = async (hospitalId, options = {}) => {
  try {
    const { status, date, limit = 50, offset = 0 } = options;
    let url = `${BACKEND_SERVER}/api/patients/hospital/${hospitalId}/appointments?limit=${limit}&offset=${offset}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    if (date) {
      url += `&date=${date}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch hospital appointments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hospital appointments:', error);
    throw error;
  }
};

/**
 * Get all appointments for a specific doctor
 * @param {number} doctorId - Doctor ID
 * @param {Object} options - Query options (status, date)
 * @returns {Promise} - Doctor appointments
 */
export const getDoctorAppointments = async (doctorId, options = {}) => {
  try {
    const { status, date } = options;
    let url = `${BACKEND_SERVER}/api/patients/doctor/${doctorId}/appointments`;
    
    const queryParams = [];
    if (status) {
      queryParams.push(`status=${status}`);
    }
    
    if (date) {
      queryParams.push(`date=${date}`);
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch doctor appointments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw error;
  }
};

/**
 * Get all services offered by a specific hospital
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise} - Hospital services
 */
export const getHospitalServices = async (hospitalId) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/patients/hospital/${hospitalId}/services`);
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
 * Create a payment for an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {number} amount - Payment amount
 * @param {string} status - Payment status (default: pending)
 * @returns {Promise} - Payment creation response
 */
export const createPayment = async (appointmentId, amount, status = 'pending') => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/appointments/${appointmentId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, status }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create payment',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

/**
 * Update payment status
 * @param {number} paymentId - Payment ID
 * @param {string} status - New status (pending, completed, failed)
 * @returns {Promise} - Payment status update response
 */
export const updatePaymentStatus = async (paymentId, status) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/payments/${paymentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to update payment status',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

/**
 * Get payment status for an appointment
 * @param {number} appointmentId - Appointment ID to check
 * @returns {Promise} - Payment status response
 */
export const getAppointmentPaymentStatus = async (appointmentId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/appointment/${appointmentId}/all`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to get payment status',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

/**
 * Register the current user as a patient for a hospital
 * @param {number} hospitalId - Hospital ID
 * @param {string} patientNumber - Optional patient number
 * @returns {Promise} - Registration response
 */
export const registerAsPatient = async (hospitalId, patientNumber = null) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        hospital_id: hospitalId,
        patient_number: patientNumber
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to register as patient',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error registering as patient:', error);
    throw error;
  }
};

/**
 * Get all patient profiles for the current user
 * @returns {Promise} - User's patient profiles
 */
export const getMyPatientProfiles = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/patients/me`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch patient profiles',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching patient profiles:', error);
    throw error;
  }
};
