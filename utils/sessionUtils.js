import { setupTokenMonitoring, refreshAdminStatus } from '../services/authService';

/**
 * Initialize session monitoring
 * Should be called on app initialization
 */
export const initSessionMonitoring = () => {
  if (typeof window !== 'undefined') {
    // Setup token monitoring on page load
    setupTokenMonitoring();
    
    // Check admin status on page load
    refreshAdminStatus().catch(err => {
      console.error('Failed to refresh admin status during init:', err);
    });
    
    // Re-establish session monitoring when user becomes active after tab was inactive
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setupTokenMonitoring();
        
        // Also refresh admin status when tab becomes visible again
        refreshAdminStatus().catch(err => {
          console.error('Failed to refresh admin status on visibility change:', err);
        });
      }
    });
  }
};

/**
 * Get logout message from session storage
 * @returns {string|null} Logout message or null if none exists
 */
export const getLogoutMessage = () => {
  if (typeof window !== 'undefined') {
    const message = sessionStorage.getItem('logout_message');
    // Clear message after retrieving
    if (message) {
      sessionStorage.removeItem('logout_message');
    }
    return message;
  }
  return null;
};
