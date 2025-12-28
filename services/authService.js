import BACKEND_SERVER from '../config';
import { getTimeUntilExpiration, isTokenExpired } from '../utils/authUtils';

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle field-specific errors using the error_type field
      if (data.error_type) {
        const errors = {};
        errors[data.error_type] = data.message;
        
        throw {
          message: data.message || 'Login failed',
          errors: errors,
          error_type: data.error_type,
          status: response.status
        };
      }
      // If we have field-specific errors, structure them for the frontend
      else if (data.errors) {
        throw {
          message: data.message || 'Login failed',
          errors: data.errors,
          status: response.status
        };
      }
      throw new Error(data.message || 'Login failed');
    }
    
    // Store the token in localStorage and check admin status
    if (data.access_token) {
      await setupUserSession(data);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (name, email, password, phone) => {
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, phone }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // If we have field-specific errors, structure them for the frontend
      if (data.errors) {
        throw {
          message: data.message || 'Registration failed',
          errors: data.errors,
          response: { data },
          status: response.status
        };
      }
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Clear admin status cache when logging out
export const logoutUser = () => {
  clearTokenTimers();
  removeActivityTracking();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear admin status cache
  adminStatusCache.status = null;
  adminStatusCache.timestamp = 0;
  
  // Optionally clear any other user-related data from localStorage
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const userData = JSON.parse(userStr);
    
    // If the data is nested under 'user' object, extract it
    if (userData.success && userData.user) {
      return userData.user;
    }
    
    return userData;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token; // Returns true if token exists
};

export const getToken = () => {
  return localStorage.getItem('token');
};

// Add a cache mechanism for admin status
const adminStatusCache = {
  status: null,
  timestamp: 0,
  // Cache admin status for 5 minutes
  TTL: 5 * 60 * 1000
};

/**
 * Check if current user is a SynapAI admin
 * @param {boolean} forceRefresh - Force check against server
 * @returns {Promise<boolean>} - True if user is admin
 */
export const isSynapAIAdmin = async (forceRefresh = false) => {
  // First check cached result if not forcing refresh
  if (!forceRefresh && adminStatusCache.status !== null) {
    const cacheAge = Date.now() - adminStatusCache.timestamp;
    if (cacheAge < adminStatusCache.TTL) {
      console.log("Using cached admin status:", adminStatusCache.status);
      return adminStatusCache.status;
    }
  }
  
  let user = getCurrentUser();
  
  // Check local user data first
  if (user) {
    const isAdminUser = user.role === 'admin' || user.is_admin === true || user.isAdmin === true;
    if (isAdminUser) {
      // Cache positive result and return immediately
      adminStatusCache.status = true;
      adminStatusCache.timestamp = Date.now();
      return true;
    }
  }
  
  // Only refresh from server if explicitly requested or no valid user
  if (forceRefresh || !user) {
    try {
      // Import dynamically to avoid circular dependency
      const { refreshCurrentUser } = await import('./userService');
      user = await refreshCurrentUser();
      
      // Check refreshed user data
      const isAdminUser = user.role === 'admin' || user.is_admin === true || user.isAdmin === true;
      
      // Cache result
      adminStatusCache.status = isAdminUser;
      adminStatusCache.timestamp = Date.now();
      
      return isAdminUser;
    } catch (error) {
      console.error('Failed to refresh user admin status:', error);
      return false;
    }
  }
  
  // Cache negative result
  adminStatusCache.status = false;
  adminStatusCache.timestamp = Date.now();
  return false;
};

// Keep the synchronous version for immediate checks
export const isSynapAIAdminSync = () => {
  // Check cache first
  const cacheAge = Date.now() - adminStatusCache.timestamp;
  if (adminStatusCache.status !== null && cacheAge < adminStatusCache.TTL) {
    return adminStatusCache.status;
  }
  
  const user = getCurrentUser();
  if (!user) return false;
  
  // Check if the user has admin role or admin property
  const isAdminUser = user.role === 'admin' || user.is_admin === true || user.isAdmin === true;
  
  // Update cache
  adminStatusCache.status = isAdminUser;
  adminStatusCache.timestamp = Date.now();
  
  return isAdminUser;
};

export const isAdmin = () => {
  return isSynapAIAdminSync();
};

export const refreshAdminStatus = async () => {
  // Skip if we have a recent cached result
  const cacheAge = Date.now() - adminStatusCache.timestamp;
  if (adminStatusCache.status === true && cacheAge < adminStatusCache.TTL) {
    return true;
  }
  
  try {
    // Import this way to avoid circular dependency
    const { checkAdminStatus } = await import('./adminService');
    const user = getCurrentUser();
    if (!user) {
      return false;
    }
    
    const userId = user.id || user.user_id || (user._id ? user._id.toString() : null);
    if (!userId) {
      return false;
    }
    
    const result = await checkAdminStatus(userId);
    
    if (result.success) {
      setUserAsAdmin(result.isAdmin);
      
      // Update cache
      adminStatusCache.status = result.isAdmin;
      adminStatusCache.timestamp = Date.now();
      
      return result.isAdmin;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing admin status:', error);
    return false;
  }
};

export const setUserAsAdmin = (isAdmin = true) => {
  try {
    const user = getCurrentUser();
    if (!user) return false;
    
    user.isAdmin = isAdmin;
    user.is_admin = isAdmin; // Add for consistency
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error updating admin status:', error);
    return false;
  }
};

/**
 * Check if current user is a hospital admin
 * @param {number} hospitalId - Hospital ID
 * @returns {Promise<boolean>} - True if user is admin for this hospital
 */
export const isHospitalAdmin = async (hospitalId) => {
  if (!isAuthenticated()) return false;
  
  try {
    const response = await fetch(`${BACKEND_SERVER}/api/hospitals/${hospitalId}/check-admin`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = await response.json();
    return data.success && data.is_admin;
  } catch (error) {
    console.error('Error checking hospital admin status:', error);
    return false;
  }
};

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Session management variables
let inactivityTimer = null;
let tokenExpirationTimer = null;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

/**
 * Setup token expiration monitoring and inactivity tracking
 */
export const setupTokenMonitoring = () => {
  // Clear any existing timers
  clearTokenTimers();
  
  if (!isAuthenticated()) return;
  
  // Set timer to logout when token expires
  const timeUntilExpiration = getTimeUntilExpiration();
  if (timeUntilExpiration > 0) {
    console.log(`Token will expire in ${Math.round(timeUntilExpiration/1000)} seconds`);
    tokenExpirationTimer = setTimeout(() => {
      console.log('Token expired, logging out');
      autoLogout('Your session has expired.');
    }, timeUntilExpiration);
    
    // Set inactivity timer to 80% of token lifetime to provide buffer
    const inactivityThreshold = Math.min(timeUntilExpiration * 0.8, 30 * 60 * 1000); // Max 30 minutes
    startInactivityTimer(inactivityThreshold);
    
    // Setup activity listeners
    setupActivityTracking();
  } else if (isTokenExpired()) {
    // Token is already expired
    autoLogout('Your session has expired.');
  }
};

/**
 * Start inactivity timer
 * @param {number} timeout - Timeout in milliseconds
 */
const startInactivityTimer = (timeout) => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    console.log('User inactive, logging out');
    autoLogout('You have been logged out due to inactivity.');
  }, timeout);
};

/**
 * Setup activity tracking to reset inactivity timer
 */
const setupActivityTracking = () => {
  // Remove any existing listeners first
  removeActivityTracking();
  
  // Add event listeners for user activity
  ACTIVITY_EVENTS.forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });
};

/**
 * Reset inactivity timer on user activity
 */
const resetInactivityTimer = () => {
  if (!isAuthenticated()) return;
  
  const timeUntilExpiration = getTimeUntilExpiration();
  if (timeUntilExpiration <= 0) {
    autoLogout('Your session has expired.');
    return;
  }
  
  // Reset inactivity timer with 80% of remaining token life, max 30 minutes
  const inactivityThreshold = Math.min(timeUntilExpiration * 0.8, 30 * 60 * 1000);
  startInactivityTimer(inactivityThreshold);
};

/**
 * Remove activity tracking event listeners
 */
const removeActivityTracking = () => {
  ACTIVITY_EVENTS.forEach(event => {
    window.removeEventListener(event, resetInactivityTimer);
  });
};

/**
 * Clear all token-related timers
 */
const clearTokenTimers = () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (tokenExpirationTimer) clearTimeout(tokenExpirationTimer);
  inactivityTimer = null;
  tokenExpirationTimer = null;
};

/**
 * Auto logout user with optional message
 * @param {string} message - Message to display
 */
export const autoLogout = (message) => {
  clearTokenTimers();
  removeActivityTracking();
  logoutUser();
  
  // Force redirect to login page with message
  if (typeof window !== 'undefined') {
    // Store message to be displayed on login page
    if (message) {
      sessionStorage.setItem('logout_message', message);
    }
    window.location.href = '/login';
  }
};

/**
 * Update user login and setup monitoring
 * @param {Object} userData - User data and token from login
 */
export const setupUserSession = async (userData) => {
  if (userData && userData.access_token) {
    localStorage.setItem('token', userData.access_token);
    
    // Make sure we're storing just the user object, not nested under 'user'
    const userToStore = userData.user || userData;
    localStorage.setItem('user', JSON.stringify(userToStore));
    
    console.log("User data stored in localStorage:", userToStore);
    
    // Check and store admin status immediately after login
    try {
      // Set the initial admin status based on the user role or admin flag
      const isAdminUser = userToStore.role === 'admin' || 
                          userToStore.is_admin === true || 
                          userToStore.isAdmin === true;
      
      // Update the admin status cache
      adminStatusCache.status = isAdminUser;
      adminStatusCache.timestamp = Date.now();

      // If the user might be an admin, double-check with the server
      const { checkAdminStatus } = await import('./adminService');
      const userId = userToStore.id || userToStore.user_id || (userToStore._id ? userToStore._id.toString() : null);
      
      if (userId) {
        // This will update the cache and user object in localStorage if necessary
        await refreshAdminStatus();
      }
    } catch (error) {
      console.error('Error checking admin status during login:', error);
    }
    
    // Setup token monitoring
    if (typeof window !== 'undefined') {
      setupTokenMonitoring();
      
      // Dispatch a custom event to notify components that user has logged in
      const loginEvent = new CustomEvent('userLoggedIn', { 
        detail: { user: userToStore } 
      });
      window.dispatchEvent(loginEvent);
    }
  }
};

// Initialize token monitoring when this module is imported
if (typeof window !== 'undefined') {
  // Check if user is logged in and setup monitoring
  if (isAuthenticated()) {
    setupTokenMonitoring();
  }
}
