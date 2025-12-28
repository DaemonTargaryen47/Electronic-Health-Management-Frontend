"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { getChatHistory } from '@/services/chatService';
import Link from 'next/link';
import { MessageSquare, Clock, Search, AlertCircle, Calendar, Stethoscope, Building2, ChevronLeft, User } from 'lucide-react';

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // Options: 'all', 'doctor', 'patient'
  const [isDoctor, setIsDoctor] = useState(false);

  // Check if user is a doctor
  useEffect(() => {
    const checkDoctorStatus = async () => {
      try {
        const { getDoctorProfile } = await import('@/services/doctorService');
        const response = await getDoctorProfile();
        setIsDoctor(response.success && response.doctor);
      } catch (err) {
        setIsDoctor(false);
      }
    };

    if (isAuthenticated()) {
      checkDoctorStatus();
    }
  }, []);

  // Add a refresh interval constant
  const CHAT_REFRESH_INTERVAL = 30000; // 30 seconds for the overview page

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchChats();
    
    // Set up polling for refreshing chat list
    const chatsRefreshInterval = setInterval(() => {
      fetchChats(false); // Pass false to indicate this is a background refresh
    }, CHAT_REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(chatsRefreshInterval);
    };
  }, [router]);

  const fetchChats = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      const response = await getChatHistory();
      
      if (response.success) {
        console.log('Chat history:', response.chats); // Log for debugging
        setChats(response.chats || []);
      } else {
        setError('Failed to load chat history');
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('An error occurred while loading your messages');
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

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

  const formatAppointmentTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Filter chats based on search query and active tab
  const filteredChats = chats.filter(chat => {
    // First filter by search query
    const matchesSearch = !searchQuery ? true : (
      chat.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.message_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Then filter by active tab
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'doctor') {
      return matchesSearch && chat.isUserDoctor === true;
    } else if (activeTab === 'patient') {
      return matchesSearch && chat.isUserDoctor === false;
    }
    
    return matchesSearch;
  });

  // Separate chats by role based on the isUserDoctor flag
  const doctorChats = chats.filter(chat => chat.isUserDoctor === true);
  const patientChats = chats.filter(chat => chat.isUserDoctor === false);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Message History</h1>
        
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              className="input input-bordered w-full pr-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-3 right-3 h-5 w-5 text-gray-400" />
          </div>
          
          <Link href="/dashboard" className="btn btn-outline">
            <ChevronLeft size={16} className="mr-1" />
            Dashboard
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Tab selection */}
      <div className="tabs tabs-boxed mb-6">
        <a 
          className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Messages
        </a>
        {isDoctor && (
          <a 
            className={`tab ${activeTab === 'doctor' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('doctor')}
          >
            <Stethoscope size={16} className="mr-1" />
            As Doctor
          </a>
        )}
        <a 
          className={`tab ${activeTab === 'patient' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('patient')}
        >
          <User size={16} className="mr-1" />
          As Patient
        </a>
      </div>
      
      {/* Doctor chats section */}
      {(activeTab === 'all' || activeTab === 'doctor') && isDoctor && doctorChats.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope size={18} className="text-primary" />
            <h2 className="text-xl font-bold">Your Doctor Conversations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctorChats
              .filter(chat => {
                if (!searchQuery) return true;
                return (
                  chat.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.message_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
                );
              })
              .map(chat => (
                <Link 
                  key={chat.chat_id} 
                  href={`/doctor/appointments/${chat.appointment_id}`}
                  className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{chat.other_user_name}</h3>
                      {chat.unread_count > 0 && (
                        <div className="badge badge-primary">{chat.unread_count}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      <span>{formatTime(chat.timestamp)}</span>
                    </div>
                    
                    <p className="text-gray-700 line-clamp-2 mt-2">
                      {chat.message_content || 'Attachment'}
                    </p>
                    
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="flex items-start gap-2">
                        <Building2 size={16} className="mt-1 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{chat.hospital_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <Calendar size={14} />
                        <span>
                          {formatAppointmentTime(chat.appointment_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      )}
      
      {/* Patient chats section */}
      {(activeTab === 'all' || activeTab === 'patient') && patientChats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-primary" />
            <h2 className="text-xl font-bold">Your Patient Conversations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patientChats
              .filter(chat => {
                if (!searchQuery) return true;
                return (
                  chat.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.message_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
                );
              })
              .map(chat => (
                <Link 
                  key={chat.chat_id} 
                  href={`/appointments/${chat.appointment_id}`}
                  className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{chat.other_user_name}</h3>
                      {chat.unread_count > 0 && (
                        <div className="badge badge-primary">{chat.unread_count}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      <span>{formatTime(chat.timestamp)}</span>
                    </div>
                    
                    <p className="text-gray-700 line-clamp-2 mt-2">
                      {chat.message_content || 'Attachment'}
                    </p>
                    
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="flex items-start gap-2">
                        <Building2 size={16} className="mt-1 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{chat.hospital_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <Calendar size={14} />
                        <span>
                          {formatAppointmentTime(chat.appointment_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      )}
      
      {/* No results message */}
      {filteredChats.length === 0 && (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium">
            {searchQuery ? 'No matching messages found' : 'No message history yet'}
          </h3>
          <p className="mt-1 text-gray-500">
            {searchQuery 
              ? 'Try using different search terms' 
              : 'Messages from your appointments will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}
