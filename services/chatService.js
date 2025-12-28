import BACKEND_SERVER from '../config';
import { authFetch } from '../utils/authUtils';

/**
 * Get chat messages for a specific appointment
 * @param {number} appointmentId - Appointment ID
 * @param {Object} options - Query options (limit, offset)
 * @returns {Promise} - Chat messages
 */
export const getAppointmentChats = async (appointmentId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;
    const response = await authFetch(
      `${BACKEND_SERVER}/api/chats/appointment/${appointmentId}?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch chat messages',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

/**
 * Send a new chat message for an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {string} messageContent - Message content
 * @param {File} attachment - Optional file attachment
 * @returns {Promise} - Response with the new message
 */
export const sendChatMessage = async (appointmentId, messageContent, attachment = null) => {
  try {
    let response;
    
    if (attachment) {
      // Use FormData to handle file upload
      const formData = new FormData();
      formData.append('message_content', messageContent);
      formData.append('attachment', attachment);
      
      response = await authFetch(
        `${BACKEND_SERVER}/api/chats/appointment/${appointmentId}/send`,
        {
          method: 'POST',
          body: formData
        }
      );
    } else {
      // Text-only message
      response = await authFetch(
        `${BACKEND_SERVER}/api/chats/appointment/${appointmentId}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message_content: messageContent }),
        }
      );
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to send message',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

/**
 * Mark chat messages as read
 * @param {Array<number>} chatIds - Array of chat IDs to mark as read
 * @returns {Promise} - Response with count of updated messages
 */
export const markMessagesAsRead = async (chatIds) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/chats/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_ids: chatIds }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to mark messages as read',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Delete a specific chat message
 * @param {number} chatId - Chat message ID
 * @returns {Promise} - Response
 */
export const deleteChatMessage = async (chatId) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/chats/${chatId}/delete`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to delete message',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting chat message:', error);
    throw error;
  }
};

/**
 * Get chat history summary for the current user
 * @returns {Promise} - Response with chat history
 */
export const getChatHistory = async () => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/chats/history`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch chat history',
        status: response.status
      };
    }
    
    // Process chats to determine the user's role in each chat
    if (data.success && data.chats) {
      // Get current user ID
      const { getCurrentUser } = await import('./authService');
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.id || currentUser?.user_id;
      
      // Add a field to each chat to indicate if the user is acting as a doctor in this conversation
      data.chats = data.chats.map(chat => {
        let isUserDoctor = false;
        
        // Determine if the current user is acting as a doctor in this chat
        if (chat.sender_id == currentUserId) {
          // If current user is the sender, use sender_is_doctor flag directly
          isUserDoctor = chat.sender_is_doctor === true || chat.sender_is_doctor === 1;
        } else if (chat.receiver_id == currentUserId) {
          // If current user is the receiver, it's opposite of sender's doctor status
          // In a doctor-patient chat, if sender is doctor, receiver must be patient and vice versa
          isUserDoctor = !(chat.sender_is_doctor === true || chat.sender_is_doctor === 1);
        }
        
        return {
          ...chat,
          isUserDoctor
        };
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Get count of unread messages for the current user
 * @param {number} appointmentId - Optional appointment ID to filter by
 * @returns {Promise} - Response with unread count
 */
export const getUnreadCount = async (appointmentId = null) => {
  try {
    let url = `${BACKEND_SERVER}/api/chats/unread/count`;
    if (appointmentId) {
      url += `?appointment_id=${appointmentId}`;
    }
    
    const response = await authFetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || 'Failed to fetch unread count',
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};
