import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { getUnreadCount } from '@/services/chatService';
import { isAuthenticated } from '@/services/authService';

/**
 * Chat notification badge component that displays unread message count
 * @param {Object} props - Component props
 * @param {number} props.appointmentId - Optional appointment ID to filter notifications for
 * @param {boolean} props.showZero - Show badge even when count is zero
 * @param {number} props.refreshInterval - Refresh interval in ms (default: 30000)
 */
const ChatNotificationBadge = ({ 
  appointmentId = null,
  showZero = false,
  refreshInterval = 30000,
  className = ""
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated()) return;
    
    try {
      setLoading(true);
      const response = await getUnreadCount(appointmentId);
      
      if (response.success) {
        setUnreadCount(response.unread_count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for new messages
    const interval = setInterval(fetchUnreadCount, refreshInterval);
    
    return () => clearInterval(interval);
  }, [appointmentId, refreshInterval]);

  // Don't render if no unread messages and showZero is false
  if (unreadCount === 0 && !showZero) return null;

  return (
    <div className={`indicator ${className}`}>
      <MessageSquare size={16} />
      <span className="indicator-item badge badge-sm badge-primary">
        {loading ? '...' : unreadCount}
      </span>
    </div>
  );
};

export default ChatNotificationBadge;
