"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Clock, 
  Calendar, 
  Building2, 
  User, 
  AlertCircle, 
  PaperclipIcon,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Pill,
  FilePlus,
  StethoscopeIcon,
  CreditCard,
  RefreshCw,
  FlaskConical,
  BrainCircuit,
  Bot,
  Sparkles,
  Trash,
  AlertTriangle
} from 'lucide-react';
import { 
  isAuthenticated, 
  getCurrentUser 
} from '@/services/authService';
import { 
  getAppointmentById, 
  cancelAppointment,
  getAppointmentPaymentStatus
} from '@/services/appointmentService';
import { 
  getAppointmentChats, 
  sendChatMessage, 
  markMessagesAsRead, 
  deleteChatMessage 
} from '@/services/chatService';
import { 
  getAppointmentChatHistory,
  sendAppointmentChatMessage,
  deleteAllAppointmentChatMessages
} from '@/services/appointmentChatService';
import { getPatientPrescriptions } from '@/services/prescriptionService';
import { 
  getConsultationPaymentStatus, 
  getServicesPaymentStatus 
} from '@/services/paymentService';
import { getTestResultsByAppointment } from '@/services/patientTestService';
import Link from 'next/link';
import { 
  markdownToHtml, 
  formatAiChatMessages 
} from '@/utils/markdownFormatter';

export default function PatientAppointmentDetailsPage({ params }) {
  const router = useRouter();
  const appointmentId = params.id;
  
  const CHAT_REFRESH_INTERVAL = 5000; // 5 seconds
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessageIds, setUnreadMessageIds] = useState([]);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [consultationPayment, setConsultationPayment] = useState(null);
  const [servicesPayment, setServicesPayment] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [testResultsLoading, setTestResultsLoading] = useState(false);
  const [testResultsError, setTestResultsError] = useState(null);

  // AI Chatbot states
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [newAiMessage, setNewAiMessage] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatError, setAiChatError] = useState(null);
  const [showAiChatPanel, setShowAiChatPanel] = useState(true);
  const [sendingAiMessage, setSendingAiMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMessages, setDeletingMessages] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    setCurrentUser(getCurrentUser());
    fetchAppointmentDetails();
    fetchChatMessages();
    fetchAiChatHistory();
    
    const chatRefreshInterval = setInterval(() => {
      if (showChatPanel) {
        fetchChatMessages(false);
      }
    }, CHAT_REFRESH_INTERVAL);
    
    return () => {
      clearInterval(chatRefreshInterval);
    };
  }, [appointmentId, router, showChatPanel]);
  
  useEffect(() => {
    if (appointment && appointment.services && appointment.services.length > 0) {
      fetchTestResults();
    }
  }, [appointment]);

  const fetchChatMessages = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setChatLoading(true);
      }
      setChatError(null);
      
      const response = await getAppointmentChats(appointmentId);

      if (response.success) {
        const newMessages = response.messages || [];
        
        if (newMessages.length !== chatMessages.length) {
          setChatMessages(newMessages);
          
          if (newMessages.length > 0) {
            const latestMessage = newMessages[newMessages.length - 1];
            setLastMessageTimestamp(new Date(latestMessage.timestamp).getTime());
          }
          
          setTimeout(() => {
            const chatContainer = document.getElementById('chat-messages-container');
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 100);
        }
        
        const currentUserId = getCurrentUser()?.id || getCurrentUser()?.user_id;
        const unreadIds = response.messages
          .filter(msg => !msg.read_status && msg.receiver_id === currentUserId)
          .map(msg => msg.chat_id);
          
        if (unreadIds.length > 0) {
          setUnreadMessageIds(unreadIds);
          await markMessagesAsRead(unreadIds);
        }
      } else {
        setChatError('Failed to load chat messages');
      }
    } catch (err) {
      setChatError('An error occurred while fetching chat messages');
      console.error('Error:', err);
    } finally {
      if (showLoadingIndicator) {
        setChatLoading(false);
      }
    }
  };
  
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentById(appointmentId);

      if (response.success && response.appointment) {
        setAppointment(response.appointment);
        
        // Fetch prescriptions if we have a patient ID
        if (response.appointment.patient_id) {
          fetchPatientPrescriptions(response.appointment.patient_id);
        }
        
        // Payment info is already included in the appointment object
        // No need for separate payment API calls if data is already there
      } else {
        setError('Failed to load appointment details');
      }
    } catch (err) {
      setError('An error occurred while fetching appointment data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientPrescriptions = async (patientId) => {
    try {
      const response = await getPatientPrescriptions(patientId);
      
      if (response.success) {
        const appointmentPrescriptions = response.prescriptions.filter(
          p => p.appointment_id === parseInt(appointmentId)
        );
        setPrescriptions(appointmentPrescriptions || []);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    }
  };

  const fetchTestResults = async () => {
    try {
      setTestResultsLoading(true);
      
      // If the appointment already has services with result data, use that directly
      if (appointment && appointment.services && appointment.services.length > 0) {
        // Find services that have result information
        const servicesWithResults = appointment.services.filter(
          service => service.result_id || service.result_date || service.result_details || service.result_file
        );
        
        if (servicesWithResults.length > 0) {
          setTestResults(servicesWithResults);
          setTestResultsLoading(false);
          return;
        }
      }
      
      // Otherwise, try to get results from the separate API endpoint
      const response = await getTestResultsByAppointment(appointmentId);
      
      if (response.success) {
        setTestResults(response.test_results || []);
      } else {
        setTestResultsError('Failed to load test results');
      }
    } catch (err) {
      setTestResultsError('An error occurred while fetching test results');
      console.error('Error:', err);
    } finally {
      setTestResultsLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      setLoading(true);
      
      const response = await cancelAppointment(appointmentId);
      
      if (response.success) {
        setAppointment(prev => ({ ...prev, status: 'canceled' }));
        setShowCancelConfirm(false);
      } else {
        setError('Failed to cancel appointment');
      }
    } catch (err) {
      setError('An error occurred while canceling the appointment');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedAttachment) return;
    
    try {
      setSendingMessage(true);
      
      const response = await sendChatMessage(
        appointmentId, 
        newMessage.trim(), 
        selectedAttachment
      );
      
      if (response.success) {
        if (response.chat) {
          setChatMessages(prev => [...prev, response.chat]);
        } else {
          await fetchChatMessages();
        }
        
        setNewMessage('');
        setSelectedAttachment(null);
      } else {
        setChatError('Failed to send message');
      }
    } catch (err) {
      setChatError('An error occurred while sending your message');
      console.error('Error:', err);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setChatError('File size exceeds 5MB limit');
        return;
      }
      setSelectedAttachment(file);
    }
  };
  
  const removeAttachment = () => {
    setSelectedAttachment(null);
    const fileInput = document.getElementById('chat-attachment');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    try {
      setChatMessages(prev => prev.filter(msg => msg.chat_id !== messageId));
      
      await deleteChatMessage(messageId);
    } catch (err) {
      console.error('Error deleting message:', err);
      await fetchChatMessages();
      setChatError('Failed to delete message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'badge-primary';
      case 'completed':
        return 'badge-success';
      case 'canceled':
        return 'badge-error';
      case 'no_show':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fetchAiChatHistory = async () => {
    try {
      setAiChatLoading(true);
      setAiChatError(null);
      
      const response = await getAppointmentChatHistory(appointmentId);

      if (response.success) {
        // Transform the API response format to match the expected UI format
        const formattedMessages = response.messages.map(msg => ({
          message_id: msg.chat_id,
          message: msg.message_content,
          timestamp: msg.timestamp,
          is_user: msg.sender === 'user',
          // Add formatted content for AI messages
          formattedContent: msg.sender === 'ai' ? markdownToHtml(msg.message_content) : null
        }));
        
        setAiChatMessages(formattedMessages || []);
        
        setTimeout(() => {
          const aiChatContainer = document.getElementById('ai-chat-messages-container');
          if (aiChatContainer) {
            aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
          }
        }, 100);
      } else {
        setAiChatError('Failed to load chat history');
      }
    } catch (err) {
      setAiChatError('An error occurred while fetching chat history');
      console.error('Error:', err);
    } finally {
      setAiChatLoading(false);
    }
  };
  
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    
    if (!newAiMessage.trim()) return;
    
    try {
      setSendingAiMessage(true);
      
      // Add user message immediately for UI responsiveness with proper format
      const userMessage = {
        message_id: Date.now(),
        message: newAiMessage.trim(),
        timestamp: new Date().toISOString(),
        is_user: true
      };
      
      setAiChatMessages(prev => [...prev, userMessage]);
      setNewAiMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        const aiChatContainer = document.getElementById('ai-chat-messages-container');
        if (aiChatContainer) {
          aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
        }
      }, 100);
      
      // Send message to AI
      const response = await sendAppointmentChatMessage(appointmentId, newAiMessage.trim());
      
      if (response.success) {
        // Add AI response to chat with proper format
        const aiResponse = {
          message_id: response.chat_id || Date.now() + 1,
          message: response.response,
          timestamp: new Date().toISOString(),
          is_user: false,
          formattedContent: markdownToHtml(response.response)
        };
        
        setAiChatMessages(prev => [...prev, aiResponse]);
        
        // Scroll to bottom again after response
        setTimeout(() => {
          const aiChatContainer = document.getElementById('ai-chat-messages-container');
          if (aiChatContainer) {
            aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
          }
        }, 100);
      } else {
        setAiChatError('Failed to get response from AI');
      }
    } catch (err) {
      setAiChatError('An error occurred while sending your message');
      console.error('Error:', err);
    } finally {
      setSendingAiMessage(false);
    }
  };

  const handleDeleteAllMessages = async () => {
    try {
      setDeletingMessages(true);
      
      const response = await deleteAllAppointmentChatMessages(appointmentId);
      
      if (response.success) {
        setAiChatMessages([]);
        setShowDeleteConfirm(false);
      } else {
        setAiChatError('Failed to delete messages');
      }
    } catch (err) {
      setAiChatError('An error occurred while deleting messages');
      console.error('Error:', err);
    } finally {
      setDeletingMessages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <div className="mt-4">
          <button 
            className="btn btn-outline"
            onClick={() => router.push('/appointments')}
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <span>Appointment not found</span>
        </div>
        <div className="mt-4">
          <button 
            className="btn btn-outline"
            onClick={() => router.push('/appointments')}
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Appointment Details</h1>
          <p className="text-gray-600">
            <Calendar className="inline mr-2 mb-1" size={16} />
            {formatDate(appointment.appointment_time)}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => router.push('/appointments')}
            className="btn btn-outline"
          >
            Back to Appointments
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <Clock className="text-primary" />
                  Appointment Information
                </h2>
                <div className="badge badge-lg font-medium mt-1 text-sm px-3 py-3 capitalize">
                  Status: <span className={`badge ${getStatusColor(appointment.status)} ml-2 capitalize`}>{appointment.status}</span>
                </div>
              </div>
              
              <div className="divider my-2"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Hospital Details</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Building2 size={16} className="text-primary" />
                      <span className="font-medium">{appointment.hospital_name}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin size={16} className="text-primary shrink-0 mt-1" />
                      <span>{appointment.hospital_address}</span>
                    </p>
                    {appointment.hospital_contact && (
                      <p className="flex items-center gap-2">
                        <Phone size={16} className="text-primary" />
                        <span>{appointment.hospital_contact}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Doctor Information</h3>
                  {appointment.doctor_name ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <User size={16} className="text-primary" />
                        <span className="font-medium">Dr. {appointment.doctor_name}</span>
                      </p>
                      {appointment.doctor_email && (
                        <p className="flex items-center gap-2">
                          <Mail size={16} className="text-primary" />
                          <span>{appointment.doctor_email}</span>
                        </p>
                      )}
                      {appointment.doctor_specialties && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {appointment.doctor_specialties.map((specialty, idx) => (
                            <span key={idx} className="badge badge-outline">{specialty}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">General appointment (no specific doctor)</p>
                  )}
                </div>
              </div>
              
              <div className="divider my-2"></div>
              
              <div>
                <h3 className="font-medium mb-2">Appointment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span>Date & Time: {formatDate(appointment.appointment_time)}</span>
                    </p>
                    <p className="flex items-center gap-2 mt-2">
                      <FileText size={16} className="text-primary" />
                      <span>Type: {appointment.type === 'virtual' ? 'Virtual' : 'In-person'}</span>
                    </p>
                  </div>
                  
                  <div>
                    {appointment.fee_details && appointment.fee_details.service_type && (
                      <p className="flex items-center gap-2 mt-2">
                        <StethoscopeIcon size={16} className="text-primary" />
                        <span>
                          Consultation Type: 
                          <span className="font-medium ml-1 capitalize">
                            {appointment.fee_details.service_type}
                          </span>
                          {appointment.fee_details.amount && (
                            <span className="ml-1">
                              (${parseFloat(appointment.fee_details.amount).toFixed(2)})
                            </span>
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                
                {(appointment.fee_details?.amount > 0 || 
                  (appointment.services && appointment.services.length > 0)) && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 flex justify-between items-center">
                      <span>Cost Breakdown</span>
                    </h4>
                    
                    {appointment.fee_details && appointment.fee_details.amount && (
                      <div>
                        <div className="flex justify-between items-center text-sm border-b pb-2">
                          <div>
                            <span className="capitalize font-medium">
                              {appointment.fee_details.service_type} Consultation Fee
                            </span>
                            <div className="text-xs text-gray-500">Doctor's consultation</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">${parseFloat(appointment.fee_details.amount).toFixed(2)}</span>
                            
                            {/* Payment Status for Consultation */}
                            {appointment.fee_details.payment_status === 'paid' ? (
                              <span className="text-xs badge badge-success badge-sm">Paid</span>
                            ) : appointment.fee_details.payment_status === 'processing' ? (
                              <span className="text-xs badge badge-info badge-sm">Processing</span>
                            ) : (
                              <Link href={`/appointments/payment/${appointment.appointment_id}`}
                                className="text-xs text-primary hover:underline">
                                Pay Now
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {appointment.services && appointment.services.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Services:</p>
                        <ul className="mt-1">
                          {appointment.services.map(service => (
                            <li key={service.service_id || service.appointment_service_id} 
                                className="flex justify-between items-center py-1">
                              <div>
                                <span>{service.service_name}</span>
                                {service.quantity > 1 && <span className="text-xs ml-1">x{service.quantity}</span>}
                              </div>
                              <div className="flex flex-col items-end">
                                <span>
                                  ${parseFloat(service.service_price || service.price || 0).toFixed(2)}
                                </span>
                                
                                {service.payment_status === 'paid' ? (
                                  <span className="text-xs badge badge-success badge-sm">Paid</span>
                                ) : service.payment_status === 'processing' ? (
                                  <span className="text-xs badge badge-info badge-sm">Processing</span>
                                ) : (
                                  <Link href={`/appointments/service-payment/${service.appointment_service_id}`}
                                        className="text-xs text-primary hover:underline">
                                    Pay Now
                                  </Link>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="divider my-2"></div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>
                        <DollarSign size={14} className="inline" />
                        {((appointment.fee_details?.amount || 0) + 
                          (appointment.services?.reduce((sum, service) => 
                            sum + parseFloat(service.service_price || service.price || 0) * (service.quantity || 1), 0) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {appointment.status === 'scheduled' && (
                <div className="mt-6">
                  <button 
                    className="btn btn-error"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <XCircle size={16} /> Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {appointment.medical_notes && appointment.medical_notes.length > 0 && (
            <div className="card bg-base-100 shadow-lg mb-8">
              <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <FileText className="text-primary" />
                  Medical Notes
                </h2>
                
                <div className="space-y-4 mt-4">
                  {appointment.medical_notes.map((note, index) => (
                    <div key={note.note_id || index} className="border rounded-lg p-4 bg-base-200">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{formatDate(note.created_at)}</div>
                      </div>
                      
                      {note.diagnosis && (
                        <div className="mt-2">
                          <p className="font-medium">Diagnosis:</p>
                          <p className="mt-1">{note.diagnosis}</p>
                        </div>
                      )}
                      
                      {note.prescription && (
                        <div className="mt-2">
                          <p className="font-medium">Prescription:</p>
                          <p className="mt-1">{note.prescription}</p>
                        </div>
                      )}
                      
                      {note.instructions && (
                        <div className="mt-2">
                          <p className="font-medium">Instructions:</p>
                          <p className="mt-1">{note.instructions}</p>
                        </div>
                      )}
                      
                      {note.follow_up_needed && (
                        <div className="mt-2">
                          <p className="font-medium">Follow-up:</p>
                          <p className="mt-1">
                            {note.follow_up_date ? 
                              `Recommended on ${formatDate(note.follow_up_date)}` : 
                              'Recommended (date not specified)'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {prescriptions.length > 0 && (
            <div className="card bg-base-100 shadow-lg mb-8">
              <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <Pill className="text-primary" />
                  Prescriptions
                </h2>
                
                <div className="space-y-4 mt-4">
                  {prescriptions.map((prescription, index) => (
                    <div key={prescription.prescription_id} className="border rounded-lg p-4 bg-base-200">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">Prescribed on {formatDate(prescription.prescribed_date)}</div>
                        {prescription.doctor_name && <div>Dr. {prescription.doctor_name}</div>}
                      </div>
                      
                      <div className="mt-2">
                        <p className="font-medium">Medications:</p>
                        <ul className="mt-2 space-y-2">
                          {prescription.medication_details && prescription.medication_details.map((med, medIndex) => (
                            <li key={medIndex} className="bg-base-100 p-3 rounded">
                              <div className="flex flex-wrap gap-2">
                                <span className="font-medium">{med.name}</span>
                                {med.dosage && <span className="badge badge-outline">{med.dosage}</span>}
                                {med.frequency && <span>Take {med.frequency}</span>}
                                {med.duration && <span>For {med.duration}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {prescription.prescription_file && (
                        <div className="mt-3">
                          <a 
                            href={prescription.prescription_file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline gap-2"
                          >
                            <FilePlus size={14} />
                            View Prescription Document
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {appointment && appointment.services && appointment.services.length > 0 && (
            <div className="card bg-base-100 shadow-lg mb-8">
              <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <FlaskConical className="text-primary" />
                  Lab Tests & Results
                </h2>
                
                {testResultsLoading ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : testResultsError ? (
                  <div className="alert alert-error">
                    <AlertCircle size={16} />
                    <span>{testResultsError}</span>
                  </div>
                ) : (
                  <div className="mt-4 space-y-6">
                    {appointment.services.map((service) => {
                      // Check if the service has results directly from appointment data
                      const hasResults = service.result_id || service.result_date || service.result_details || service.result_file;
                      // Or find it in the test results array
                      const result = !hasResults ? testResults.find(r => r.appointment_service_id === service.appointment_service_id) : service;
                      
                      return (
                        <div key={service.appointment_service_id} className="border-b pb-4 last:border-b-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-lg">{service.service_name}</h3>
                              {service.description && (
                                <p className="text-sm text-gray-500">{service.description}</p>
                              )}
                            </div>
                            <span className={`badge ${result && (result.result_date || result.result_details || result.result_file) ? 'badge-success' : 'badge-warning'}`}>
                              {result && (result.result_date || result.result_details || result.result_file) ? 'Result Available' : 'Pending'}
                            </span>
                          </div>
                          
                          {result && (result.result_date || result.result_details || result.result_file) ? (
                            <div className="mt-3 space-y-3">
                              {result.pathologist_name && (
                                <div className="text-sm">
                                  <span className="font-medium">Pathologist:</span> {result.pathologist_name}
                                </div>
                              )}
                              
                              {result.result_date && (
                                <div className="text-sm">
                                  <span className="font-medium">Result Date:</span> {formatDate(result.result_date)}
                                </div>
                              )}
                              
                              {result.result_details && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Test Details:</h4>
                                  <div className="p-3 bg-base-200 rounded-lg">
                                    {typeof result.result_details === 'object' ? (
                                      <div className="space-y-3">
                                        {result.result_details.summary && (
                                          <div>
                                            <p className="font-medium text-sm">Summary:</p>
                                            <p className="text-sm">{result.result_details.summary}</p>
                                          </div>
                                        )}
                                        
                                        {result.result_details.observations && (
                                          <div>
                                            <p className="font-medium text-sm">Observations:</p>
                                            <p className="text-sm">{result.result_details.observations}</p>
                                          </div>
                                        )}
                                        
                                        {result.result_details.conclusion && (
                                          <div>
                                            <p className="font-medium text-sm">Conclusion:</p>
                                            <p className="text-sm">{result.result_details.conclusion}</p>
                                          </div>
                                        )}
                                        
                                        {result.result_details.values && Object.keys(result.result_details.values).length > 0 && (
                                          <div>
                                            <p className="font-medium text-sm">Test Values:</p>
                                            <div className="overflow-x-auto">
                                              <table className="table table-compact table-zebra w-full mt-1">
                                                <thead>
                                                  <tr>
                                                    <th>Parameter</th>
                                                    <th>Value</th>
                                                    {result.result_details.reference_ranges && 
                                                     Object.values(result.result_details.reference_ranges).some(range => range.min || range.max) && (
                                                      <th>Reference Range</th>
                                                    )}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {Object.entries(result.result_details.values).map(([key, value]) => {
                                                    const paramKey = key.replace('parameter_', '');
                                                    const refRange = result.result_details.reference_ranges?.[key];
                                                    
                                                    return (
                                                      <tr key={key}>
                                                        <td>{isNaN(paramKey) ? paramKey : `Parameter ${paramKey}`}</td>
                                                        <td>{value}</td>
                                                        {result.result_details.reference_ranges && 
                                                         Object.values(result.result_details.reference_ranges).some(range => range.min || range.max) && (
                                                          <td>
                                                            {refRange ? (
                                                              <>
                                                                {refRange.min && refRange.max ? (
                                                                  `${refRange.min} - ${refRange.max}`
                                                                ) : refRange.min ? (
                                                                  `> ${refRange.min}`
                                                                ) : refRange.max ? (
                                                                  `< ${refRange.max}`
                                                                ) : (
                                                                  'N/A'
                                                                )}
                                                                {refRange.unit && ` ${refRange.unit}`}
                                                              </>
                                                            ) : (
                                                              'N/A'
                                                            )}
                                                          </td>
                                                        )}
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Additional fields that might be present in different test types */}
                                        {result.result_details.recommendations && (
                                          <div>
                                            <p className="font-medium text-sm">Recommendations:</p>
                                            <p className="text-sm">{result.result_details.recommendations}</p>
                                          </div>
                                        )}
                                        
                                        {result.result_details.diagnosis && (
                                          <div>
                                            <p className="font-medium text-sm">Diagnosis:</p>
                                            <p className="text-sm">{result.result_details.diagnosis}</p>
                                          </div>
                                        )}
                                        
                                        {result.result_details.additional_notes && (
                                          <div>
                                            <p className="font-medium text-sm">Additional Notes:</p>
                                            <p className="text-sm">{result.result_details.additional_notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(result.result_details, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {result.result_file && (
                                <div className="mt-2">
                                  <a 
                                    href={result.result_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline"
                                  >
                                    <FileText size={14} className="mr-1" />
                                    View Full Report
                                  </a>
                                </div>
                              )}
                              
                              {result.notes && (
                                <div className="mt-2">
                                  <h4 className="text-sm font-medium mb-1">Technician Notes:</h4>
                                  <p className="text-sm bg-base-200 p-2 rounded">{result.notes}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3">
                              <p className="text-sm text-gray-500">Results are not available yet. You will be notified when they are ready.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="mt-4">
                      <Link href="/my-tests" className="btn btn-outline">
                        <FlaskConical size={16} className="mr-1" />
                        View All My Tests
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* AI Chatbot Section - With minimal DaisyUI design */}
          <div className="card bg-base-100 shadow-lg border border-accent mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                  </div>
                  <span>AI Health Assistant</span>
                  <span className="badge badge-accent text-xs"><Sparkles size={12} /> AI Powered</span>
                </h2>
                <div className="flex gap-2">
                  {aiChatMessages.length > 0 && (
                    <button 
                      className="btn btn-sm btn-ghost btn-circle"
                      onClick={() => setShowDeleteConfirm(true)}
                      title="Clear conversation"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-ghost btn-circle"
                    onClick={() => setShowAiChatPanel(!showAiChatPanel)}
                  >
                    {showAiChatPanel ? <XCircle size={16} /> : <MessageSquare size={16} />}
                  </button>
                </div>
              </div>
              
              {showAiChatPanel && (
                <>
                  {/* AI Chat Messages */}
                  <div 
                    id="ai-chat-messages-container"
                    className="bg-base-200 rounded-lg p-4 mb-4 h-[350px] overflow-y-auto flex flex-col"
                  >
                    {aiChatLoading && aiChatMessages.length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <span className="loading loading-dots loading-md"></span>
                      </div>
                    ) : aiChatMessages.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-full text-center">
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                            <Bot size={32} className="text-white" />
                          </div>
                        </div>
                        <p className="mt-4 font-medium">Ask me anything about your appointment!</p>
                        <p className="text-sm mt-2 text-gray-500">
                          I can help with questions about your prescriptions, test results, and medical information.
                        </p>
                        <div className="mt-6 space-y-2 w-full max-w-md">
                          <button 
                            className="btn btn-sm btn-outline w-full"
                            onClick={() => setNewAiMessage("Can you explain my test results?")}
                          >
                            Can you explain my test results?
                          </button>
                          <button 
                            className="btn btn-sm btn-outline w-full"
                            onClick={() => setNewAiMessage("What medications were prescribed to me?")}
                          >
                            What medications were prescribed to me?
                          </button>
                          <button 
                            className="btn btn-sm btn-outline w-full"
                            onClick={() => setNewAiMessage("What should I know about my diagnosis?")}
                          >
                            What should I know about my diagnosis?
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="chat chat-start">
                          <div className="chat-image avatar">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                              <Bot size={16} className="text-white" />
                            </div>
                          </div>
                          <div className="chat-bubble chat-bubble-accent">
                            Hello! I'm your health assistant. I can help you understand your appointment details, 
                            including prescriptions and test results. How can I assist you today?
                          </div>
                        </div>
                        
                        {aiChatMessages.map((message) => (
                          <div 
                            key={message.message_id} 
                            className={`chat ${message.is_user ? 'chat-end' : 'chat-start'}`}
                          >
                            {!message.is_user && (
                              <div className="chat-image avatar">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                  <Bot size={16} className="text-white" />
                                </div>
                              </div>
                            )}
                            <div className={`chat-bubble ${message.is_user ? 'chat-bubble-primary' : 'chat-bubble-accent'}`}>
                              {message.is_user ? (
                                <span>{message.message}</span>
                              ) : (
                                <div 
                                  className="prose prose-sm max-w-none" 
                                  dangerouslySetInnerHTML={{ __html: message.formattedContent }}
                                />
                              )}
                            </div>
                            <div className="chat-footer opacity-50 text-xs">
                              {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* AI Message Input Form */}
                  <form onSubmit={handleSendAiMessage} className="flex flex-col gap-3">
                    {aiChatError && (
                      <div className="alert alert-error text-sm p-2">
                        <AlertCircle size={16} />
                        <span>{aiChatError}</span>
                        <button 
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setAiChatError(null)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-grow"
                        placeholder="Ask about your prescriptions, tests, or treatment..."
                        value={newAiMessage}
                        onChange={(e) => setNewAiMessage(e.target.value)}
                        disabled={sendingAiMessage}
                      />
                      
                      <button
                        type="submit"
                        className="btn btn-accent"
                        disabled={!newAiMessage.trim() || sendingAiMessage}
                      >
                        {sendingAiMessage ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
              
              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="modal modal-open">
                  <div className="modal-box">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <AlertTriangle className="text-warning" size={20} /> 
                      Clear conversation?
                    </h3>
                    <p className="py-4">
                      Are you sure you want to delete all messages? This cannot be undone.
                    </p>
                    <div className="modal-action">
                      <button 
                        className="btn" 
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingMessages}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-error" 
                        onClick={handleDeleteAllMessages}
                        disabled={deletingMessages}
                      >
                        {deletingMessages ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          'Delete All'
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <MessageSquare className="text-primary" />
                  Doctor Communication
                </h2>
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowChatPanel(!showChatPanel)}
                >
                  {showChatPanel ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showChatPanel && (
                <>
                  <div 
                    id="chat-messages-container"
                    className="bg-base-200 rounded-lg p-4 mb-4 h-[400px] overflow-y-auto flex flex-col"
                  >
                    {chatLoading && chatMessages.length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-full text-center">
                        <MessageSquare size={40} className="text-gray-400 mb-2" />
                        <p className="text-gray-500">No messages yet.</p>
                        <p className="text-gray-500 text-sm">Send a message to start the conversation.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message) => {
                          const isCurrentUser = message.is_self;
                          return (
                            <div 
                              key={message.chat_id} 
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-3/4 rounded-lg p-3 ${
                                  isCurrentUser 
                                    ? 'bg-primary text-primary-content' 
                                    : 'bg-base-100 border'
                                }`}
                              >
                                {!isCurrentUser && (
                                  <div className="font-medium text-sm mb-1">
                                    {message.sender_name}
                                  </div>
                                )}
                                <div>
                                  {message.message_content && (
                                    <p className="whitespace-pre-wrap">{message.message_content}</p>
                                  )}
                                  
                                  {message.attachment_path && (
                                    <div className="mt-2">
                                      <a 
                                        href={message.attachment_path} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-1 underline ${
                                          isCurrentUser ? 'text-primary-content' : 'text-blue-500'
                                        }`}
                                      >
                                        <PaperclipIcon size={14} />
                                        View Attachment
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <div 
                                  className={`text-xs mt-1 ${
                                    isCurrentUser ? 'text-primary-content/80' : 'text-gray-500'
                                  }`}
                                >
                                  {formatTime(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                    {chatError && (
                      <div className="alert alert-error text-sm p-2">
                        <AlertCircle size={16} />
                        <span>{chatError}</span>
                        <button 
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setChatError(null)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    
                    {selectedAttachment && (
                      <div className="flex items-center justify-between bg-base-200 rounded p-2">
                        <div className="flex items-center gap-2">
                          <PaperclipIcon size={16} />
                          <span className="text-sm truncate max-w-xs">
                            {selectedAttachment.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle"
                          onClick={removeAttachment}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-grow"
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sendingMessage}
                      />
                      
                      <label className="btn">
                        <PaperclipIcon size={18} />
                        <input
                          type="file"
                          id="chat-attachment"
                          className="hidden"
                          onChange={handleAttachmentChange}
                          disabled={sendingMessage}
                        />
                      </label>
                      
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={(!newMessage.trim() && !selectedAttachment) || sendingMessage}
                      >
                        {sendingMessage ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <Send size={18} />
                        )}
                        Send
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-2">Appointment Status</h3>
              <div className={`alert ${appointment.status === 'scheduled' ? 'alert-success' : 
                                       appointment.status === 'canceled' ? 'alert-error' : 
                                       appointment.status === 'completed' ? 'alert-info' : 'alert-warning'}`}>
                <div>
                  {appointment.status === 'scheduled' && <CheckCircle size={18} />}
                  {appointment.status === 'canceled' && <XCircle size={18} />}
                  {appointment.status === 'completed' && <CheckCircle size={18} />}
                  {appointment.status === 'no_show' && <AlertCircle size={18} />}
                  
                  <span className="capitalize font-medium">
                    {appointment.status === 'scheduled' && 'Confirmed'}
                    {appointment.status === 'canceled' && 'Canceled'}
                    {appointment.status === 'completed' && 'Completed'}
                    {appointment.status === 'no_show' && 'Marked as No-Show'}
                  </span>
                </div>
              </div>
              
              {appointment.status === 'scheduled' && (
                <p className="text-sm mt-2">
                  Your appointment is confirmed and scheduled. Please arrive 15 minutes before your appointment time.
                </p>
              )}
              
              {appointment.status === 'virtual' && appointment.virtual_meeting_link && (
                <div className="mt-4">
                  <h4 className="font-medium">Virtual Meeting Link</h4>
                  <a 
                    href={appointment.virtual_meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm mt-2 w-full"
                  >
                    Join Virtual Appointment
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="font-bold mb-2">Important Information</h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>Please bring your ID and insurance card.</li>
                <li>Arrive 15 minutes before your scheduled time.</li>
                <li>If you need to reschedule, please do so at least 24 hours in advance.</li>
                <li>For virtual appointments, ensure you have a stable internet connection.</li>
              </ul>
              
              <div className="mt-4">
                <h4 className="font-medium">Need Help?</h4>
                <p className="text-sm mt-1">
                  If you have any questions or need assistance, please contact us at {appointment.hospital_contact || "the hospital's contact number"}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showCancelConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Cancel Appointment?</h3>
            <p className="py-4">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowCancelConfirm(false)}
              >
                No, Keep Appointment
              </button>
              <button
                className="btn btn-error"
                onClick={handleCancelAppointment}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Yes, Cancel Appointment"
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCancelConfirm(false)}></div>
        </div>
      )}
    </div>
  );
}
