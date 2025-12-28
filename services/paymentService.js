import { authFetch } from '../utils/authUtils';
import BACKEND_SERVER from '../config';

/**
 * Create a payment for an entire appointment
 * @param {number} appointmentId - ID of the appointment
 * @param {number} amount - Payment amount
 * @param {string} transactionId - Optional transaction identifier
 * @param {string} paymentType - Type of payment (not used in backend but kept for frontend context)
 * @returns {Promise} - Payment creation response
 */
export const createAppointmentPayment = async (appointmentId, amount, transactionId, paymentType = 'full') => {
  try {
    // The backend only has one endpoint for appointment payments
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/appointment/${appointmentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount, 
        transaction_id: transactionId,
        status: 'completed' // Backend defaults to 'completed' but we're explicitly setting it
      }),
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
    console.error('Error creating appointment payment:', error);
    throw error;
  }
};

/**
 * Create a payment for a specific service within an appointment
 * @param {number} appointmentServiceId - ID of the service
 * @param {number} amount - Payment amount
 * @param {string} transactionId - Optional transaction identifier
 * @returns {Promise} - Payment creation response
 */
export const createServicePayment = async (appointmentServiceId, amount, transactionId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/service/${appointmentServiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount, 
        transaction_id: transactionId,
        status: 'completed' // Backend defaults to 'completed' but we're explicitly setting it
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to create service payment',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating service payment:', error);
    throw error;
  }
};

/**
 * Get all payments associated with an appointment
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise} - Payments list response
 */
export const getAppointmentPayments = async (appointmentId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/appointment/${appointmentId}/all`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to get appointment payments',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting appointment payments:', error);
    throw error;
  }
};

/**
 * Update the status of a payment
 * @param {number} paymentId - Payment ID
 * @param {string} status - New status (pending, completed, failed)
 * @returns {Promise} - Payment status update response
 */
export const updatePaymentStatus = async (paymentId, status) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/${paymentId}/status`, {
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
 * Get payment details by ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise} - Payment details response
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/${paymentId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to get payment details',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error getting payment details:', error);
    throw error;
  }
};

/**
 * Get details for a service payment
 * @param {number} serviceId - ID of the appointment service
 * @returns {Promise} - Service and appointment details
 */
export const getServicePaymentDetails = async (serviceId) => {
  try {
    // Use the updated backend endpoint for service payment details
    const response = await authFetch(`${BACKEND_SERVER}/api/payments/service/${serviceId}/details`);
    const data = await response.json();
    
    console.log('Service payment details response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch service details',
        status: response.status
      };
    }
    
    // Correctly structure the returned data for the component
    return {
      success: true,
      service: data.service_details || {},
      serviceDetails: data.service_details || {},
      // Include appointment details from the service_details
      appointment: {
        appointment_id: data.service_details?.appointment_id,
        hospital_name: data.service_details?.hospital_name,
        hospital_address: data.service_details?.hospital_address,
        appointment_time: data.service_details?.appointment_time,
        patient_name: data.service_details?.patient_name,
      },
      // Process price as float if needed
      price: data.service_details?.price ? parseFloat(data.service_details.price) : 0
    };
  } catch (error) {
    console.error('Error getting service payment details:', error);
    // Return a more structured error to help with debugging
    throw {
      message: error.message || 'Error retrieving service payment details',
      originalError: error,
      serviceId: serviceId
    };
  }
};

/**
 * Get payment status for an appointment's consultation fee only
 * @param {number} appointmentId - Appointment ID to check
 * @returns {Promise} - Consultation fee payment status response
 */
export const getConsultationPaymentStatus = async (appointmentId) => {
  try {
    // Since there's no specific consultation endpoint in backend
    // We'll use the appointment details to get consultation payment status
    const appointmentResponse = await authFetch(`${BACKEND_SERVER}/api/patients/appointments/${appointmentId}`);
    const appointmentData = await appointmentResponse.json();
    
    if (!appointmentResponse.ok) {
      throw {
        message: appointmentData.message || 'Failed to fetch appointment details',
        status: appointmentResponse.status
      };
    }
    
    return {
      success: true,
      payment_status: appointmentData.appointment?.fee_details?.payment_status || 'unpaid',
      amount: appointmentData.appointment?.fee_details?.amount || 0
    };
  } catch (error) {
    console.error('Error getting consultation payment status:', error);
    throw error;
  }
};

/**
 * Get payment status for all services in an appointment (excluding consultation fee)
 * @param {number} appointmentId - Appointment ID to check
 * @returns {Promise} - Services payment status response
 */
export const getServicesPaymentStatus = async (appointmentId) => {
  try {
    // Use appointment details API since there's no specific service payment status endpoint
    const appointmentResponse = await authFetch(`${BACKEND_SERVER}/api/patients/appointments/${appointmentId}`);
    const appointmentData = await appointmentResponse.json();
    
    if (!appointmentResponse.ok) {
      throw {
        message: appointmentData.message || 'Failed to fetch appointment details',
        status: appointmentResponse.status
      };
    }
    
    return {
      success: true,
      services: appointmentData.appointment?.services || []
    };
  } catch (error) {
    console.error('Error getting services payment status:', error);
    throw error;
  }
};
