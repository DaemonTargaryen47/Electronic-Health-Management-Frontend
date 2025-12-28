import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get chat history for a specific appointment's AI chatbot
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise} - Chat history
 */
export const getAppointmentChatHistory = async (appointmentId) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/appointment-chat/${appointmentId}/history`
    );
    const data = await response.json();
    
    console.log('Ai Chat history:', data);

    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch chat history',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching appointment chat history:', error);
    throw error;
  }
};

/**
 * Send a message to the AI chatbot for a specific appointment
 * @param {number} appointmentId - Appointment ID
 * @param {string} message - Message content
 * @returns {Promise} - Response from AI
 */
export const sendAppointmentChatMessage = async (appointmentId, message) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/appointment-chat/${appointmentId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to send message',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error sending message to appointment chatbot:', error);
    throw error;
  }
};

/**
 * Delete all chat messages for a specific appointment's AI chatbot
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise} - Response with success status and deleted count
 */
export const deleteAllAppointmentChatMessages = async (appointmentId) => {
  try {
    const response = await authFetch(
      `${BACKEND_SERVER}/api/appointment-chat/${appointmentId}/messages`,
      {
        method: 'DELETE',
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to delete chat messages',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting appointment chat messages:', error);
    throw error;
  }
};
