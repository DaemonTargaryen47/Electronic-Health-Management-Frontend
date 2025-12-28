import BACKEND_SERVER from '@/config';
import { getAuthHeaders, setUserAsAdmin } from './authService';

export const checkAdminStatus = async (userId) => {
  try {
    console.log(`Checking admin status for user ID: ${userId}`);
    const url = `${BACKEND_SERVER}/api/admin/check/${userId}`;
    console.log(`Making request to: ${url}`);
    
    const headers = getAuthHeaders();
    console.log("Request headers:", headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log("Admin check response status:", response.status);
    const data = await response.json();
    console.log("Admin check API response data:", data);
    
    if (response.ok) {
      // Update local storage when admin status is checked
      if (data.is_admin !== undefined) {
        console.log(`Setting user admin status to: ${data.is_admin}`);
        setUserAsAdmin(data.is_admin);
        
        // Dispatch a custom event to notify components about admin status change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adminStatusChanged', { 
            detail: { isAdmin: data.is_admin } 
          }));
        }
      }
      
      return {
        success: true,
        isAdmin: data.is_admin
      };
    }
    
    console.log("Admin check failed:", data.message);
    return {
      success: false,
      message: data.message || 'Failed to check admin status'
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
};

export const getAllAdmins = async () => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/admin/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        admins: data.data
      };
    }
    
    return {
      success: false,
      message: data.message || 'Failed to retrieve admins'
    };
  } catch (error) {
    console.error('Error fetching admins:', error);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
};

export const getUserIdByEmail = async (email) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/auth/user-by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        userId: data.user.user_id
      };
    }
    
    return {
      success: false,
      message: data.message || `User with email ${email} not found`
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
};

export const addAdmin = async (email) => {
  try {
    // First get the user ID from email
    const userResponse = await getUserIdByEmail(email);
    
    if (!userResponse.success) {
      return {
        success: false,
        message: userResponse.message || `User with email ${email} not found`
      };
    }
    
    // Now add admin with user ID
    const userId = userResponse.userId;
    console.log(`Adding admin for user ID ${userId}`);
    
    const response = await fetch(`${BACKEND_SERVER}/api/admin/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: data.message,
        adminId: data.admin_id
      };
    }
    
    return {
      success: false,
      message: data.message || 'Failed to add admin'
    };
  } catch (error) {
    console.error('Error adding admin:', error);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
};

export const removeAdmin = async (adminId) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/admin/${adminId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        message: data.message
      };
    }
    
    return {
      success: false,
      message: data.message || 'Failed to remove admin'
    };
  } catch (error) {
    console.error('Error removing admin:', error);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
};

export const getSystemStats = async () => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/admin/stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    console.log("System stats response:", data);
    
    if (response.ok) {
      // Handle both possible response formats (data.stats or data.data)
      const statsData = data.data || data.stats || {};
      console.log("Parsed stats data:", statsData);
      
      return {
        success: true,
        stats: statsData
      };
    }
    
    return {
      success: false,
      message: data.message || 'Failed to retrieve system statistics'
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
};
