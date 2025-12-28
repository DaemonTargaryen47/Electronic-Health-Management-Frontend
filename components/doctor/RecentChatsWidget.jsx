import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { getChatHistory } from '@/services/chatService';

const RecentChatsWidget = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      setLoading(true);
      const response = await getChatHistory();
      
      if (response.success) {
        // Take only first 5 most recent chats
        setChats(response.chats?.slice(0, 5) || []);
      } else {
        setError('Failed to load recent messages');
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show only time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    
    // If this year, show day and month
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date with year
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <MessageSquare className="text-primary" />
            Recent Messages
          </h2>
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <MessageSquare className="text-primary" />
            Recent Messages
          </h2>
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <MessageSquare className="text-primary" />
          Recent Messages
        </h2>
        
        {chats.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No recent messages.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Link
                key={chat.chat_id}
                href={`/doctor/appointments/${chat.appointment_id}`}
                className="block hover:bg-base-200 rounded-lg p-3 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{chat.other_user_name}</p>
                    <p className="text-sm text-gray-500 truncate max-w-[220px]">
                      {chat.message_content || 'Attachment'}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-400">
                      <Clock size={12} className="mr-1" />
                      {formatTime(chat.timestamp)}
                    </div>
                  </div>
                  
                  {chat.unread_count > 0 && (
                    <div className="badge badge-primary">{chat.unread_count}</div>
                  )}
                </div>
              </Link>
            ))}
            
            <div className="pt-2">
              <Link href="/chats" className="btn btn-outline btn-sm w-full">
                View All Messages <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentChatsWidget;
