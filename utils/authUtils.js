import { getToken, logoutUser } from '../services/authService';

/**
 * Add JWT token to fetch requests
 * @param {Object} options - Fetch options object
 * @returns {Object} - Updated fetch options with auth header
 */
export const addAuthHeader = (options = {}) => {
  const token = getToken();
  
  if (!token) return options;
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return {
    ...options,
    headers
  };
};

/**
 * Handle fetch responses that might return 401 Unauthorized
 * @param {Response} response - Fetch response
 * @returns {Response|Promise} - Response or redirects on auth error
 */
export const handleAuthResponse = async (response) => {
  if (response.status === 401) {
    // Token is invalid or expired
    logoutUser();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    throw new Error('Your session has expired. Please log in again.');
  }
  
  return response;
};

/**
 * Authenticated fetch utility with JWT token
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch response
 */
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication token is missing. Please log in again.');
  }
  
  // Ensure headers object exists
  const headers = options.headers || {};
  
  // Properly format the Authorization header with 'Bearer ' prefix
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${token}`
  };
  
  // Merge the headers with the rest of the options
  const requestOptions = {
    ...options,
    headers: authHeaders,
  };
  
  console.log('Making authenticated request to:', url);
  return fetch(url, requestOptions);
};

/**
 * Decode JWT token
 * @param {string} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT tokens are in format header.payload.signature
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Get token expiration time in milliseconds
 * @returns {number|null} - Expiration time in milliseconds or null if no valid token
 */
export const getTokenExpirationTime = () => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return decoded.exp * 1000; // Convert to milliseconds
};

/**
 * Get remaining time until token expiration
 * @returns {number} - Milliseconds until expiration or 0 if expired/invalid
 */
export const getTimeUntilExpiration = () => {
  const expTime = getTokenExpirationTime();
  if (!expTime) return 0;
  
  const remaining = expTime - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Check if JWT token is expired
 * @returns {boolean} - True if expired or invalid, false otherwise
 */
export const isTokenExpired = () => {
  const expTime = getTokenExpirationTime();
  return !expTime || Date.now() >= expTime;
};
