'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAppointmentDetails, 
  updateAppointmentStatus, 
  addMedicalNotes, 
  rescheduleAppointment,
  getPatientHealthInfo,
  orderTestsForPatient
} from '@/services/doctorDashboardService';
import { getAppointmentChats, sendChatMessage, markMessagesAsRead } from '@/services/chatService';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ChevronLeft,
  Edit,
  Plus,
  MessageSquare,
  BookOpen,
  Activity,
  Send,
  PaperclipIcon,
  Trash2,
  Pill,
  FilePlus,
  Minus,
  StethoscopeIcon,
  PlusCircle,
  X
} from 'lucide-react';
import { 
  createPrescription,
  createPrescriptionWithFile
} from '@/services/prescriptionService';
import { getHospitalServices } from '@/services/hospitalServices';

// Helper functions to replace date-fns functionality
function parseDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format: "Jan 01, 2023"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

function formatTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';
    
    // Format: "12:00 PM"
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Invalid Time';
  }
}

function getDateInputFormat(date) {
  if (!date) return '';
  try {
    // Format: "YYYY-MM-DD"
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}

function getTimeInputFormat(date) {
  if (!date) return '';
  try {
    // Format: "HH:MM"
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toTimeString().slice(0, 5);
  } catch (error) {
    return '';
  }
}

export default function AppointmentDetailsPage({ params }) {
  const router = useRouter();
  const appointmentId = params.id;
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState(null);
  const [showPrescribeForm, setShowPrescribeForm] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }]
  });
  const [healthInfo, setHealthInfo] = useState(null);
  const [healthInfoLoading, setHealthInfoLoading] = useState(false);
  const [healthInfoError, setHealthInfoError] = useState(null);
  const [showOrderTestForm, setShowOrderTestForm] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [orderTestsError, setOrderTestsError] = useState(null);
  const [orderTestsSuccess, setOrderTestsSuccess] = useState(null);
  
  // Form states
  const [noteData, setNoteData] = useState({
    diagnosis: '',
    prescription: '',
    instructions: '',
    follow_up_needed: false,
    follow_up_date: '',
  });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  
  // Chat related states
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessageIds, setUnreadMessageIds] = useState([]);
  
  // Add a refresh interval constant
  const CHAT_REFRESH_INTERVAL = 5000; // 10 seconds

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    setCurrentUser(getCurrentUser());
    fetchAppointmentDetails();
    fetchChatMessages();
    
    // Set up polling for new messages
    const chatRefreshInterval = setInterval(() => {
      if (showChatPanel) {
        fetchChatMessages(false); // Pass false to indicate this is a background refresh
      }
    }, CHAT_REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(chatRefreshInterval);
    };
  }, [appointmentId, router, showChatPanel]);
  
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentDetails(appointmentId);
      console.log('Appointment Details Response:', response);

      if (response.success && response.appointment) {
        setAppointment(response.appointment);
        
        // Pre-fill reschedule form if appointment exists
        if (response.appointment.appointment_time) {
          const dateTime = new Date(response.appointment.appointment_time);
          setRescheduleDate(getDateInputFormat(dateTime));
          setRescheduleTime(getTimeInputFormat(dateTime));
        }
        
        // Fetch patient prescriptions if we have a patient ID
        if (response.appointment.patient_id) {
          fetchPatientPrescriptions(response.appointment.patient_id);
          fetchPatientHealthInfo(response.appointment.patient_id);
        }
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
      const { getPatientPrescriptions } = await import('@/services/prescriptionService');
      const response = await getPatientPrescriptions(patientId);
      
      if (response.success) {
        setPrescriptions(response.prescriptions || []);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    }
  };

  const fetchPatientHealthInfo = async (patientId) => {
    try {
      setHealthInfoLoading(true);
      setHealthInfoError(null);
      
      const response = await getPatientHealthInfo(patientId);
      
      if (response.success) {
        setHealthInfo(response.health_info);
      } else {
        setHealthInfoError('Failed to load patient health information');
      }
    } catch (err) {
      setHealthInfoError('An error occurred while fetching health information');
      console.error('Error fetching patient health info:', err);
    } finally {
      setHealthInfoLoading(false);
    }
  };
  
  const fetchChatMessages = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setChatLoading(true);
      }
      setChatError(null);
      
      const response = await getAppointmentChats(appointmentId);
      
      console.log('GetAppintmentChats Response:', response);

      if (response.success) {
        // Check if there are new messages compared to what we already have
        const newMessages = response.messages || [];
        
        // Update messages only if we have new ones
        if (newMessages.length !== chatMessages.length) {
          setChatMessages(newMessages);
          
          // Scroll to bottom if there are new messages
          setTimeout(() => {
            const chatContainer = document.getElementById('chat-messages-container');
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 100);
        }
        
        // Identify unread messages sent to current user
        const currentUserId = getCurrentUser()?.id || getCurrentUser()?.user_id;
        const unreadIds = response.messages
          .filter(msg => !msg.read_status && msg.receiver_id === currentUserId)
          .map(msg => msg.chat_id);
          
        if (unreadIds.length > 0) {
          setUnreadMessageIds(unreadIds);
          // Mark messages as read
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
  
  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      const response = await updateAppointmentStatus(appointmentId, newStatus);
      
      if (response.success) {
        // Update the local appointment data with the new status
        setAppointment(prev => ({ ...prev, status: newStatus }));
        setConfirmActionType(null);
      } else {
        setError('Failed to update appointment status');
      }
    } catch (err) {
      setError('An error occurred while updating appointment status');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await addMedicalNotes(appointmentId, noteData);
      
      if (response.success) {
        // Update the local appointment data with the new note
        setAppointment(prev => ({
          ...prev,
          medical_notes: [...(prev.medical_notes || []), response.note]
        }));
        setShowNoteForm(false);
        setNoteData({
          diagnosis: '',
          prescription: '',
          instructions: '',
          follow_up_needed: false,
          follow_up_date: '',
        });
      } else {
        setError('Failed to add medical note');
      }
    } catch (err) {
      setError('An error occurred while adding medical note');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setError('Please select both date and time');
      return;
    }
    
    try {
      setLoading(true);
      const newDateTime = `${rescheduleDate}T${rescheduleTime}:00`;
      const response = await rescheduleAppointment(appointmentId, newDateTime);
      
      if (response.success) {
        // Update the local appointment data with the new scheduled time
        setAppointment(prev => ({
          ...prev,
          appointment_time: newDateTime
        }));
        setShowRescheduleForm(false);
      } else {
        setError('Failed to reschedule appointment');
      }
    } catch (err) {
      setError('An error occurred while rescheduling appointment');
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
        // Add new message to the chat
        if (response.chat) {
          setChatMessages(prev => [...prev, response.chat]);
        } else {
          // Refresh all messages if we don't get the new message directly
          await fetchChatMessages();
        }
        
        // Reset form
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
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setChatError('File size exceeds 5MB limit');
        return;
      }
      setSelectedAttachment(file);
    }
  };
  
  const removeAttachment = () => {
    setSelectedAttachment(null);
    // Reset the input element to allow selecting the same file again
    const fileInput = document.getElementById('chat-attachment');
    if (fileInput) {
      fileInput.value = '';
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
  
  const handlePrescriptionChange = (index, field, value) => {
    setPrescriptionData(prev => {
      const medications = [...prev.medications];
      medications[index] = { ...medications[index], [field]: value };
      return { ...prev, medications };
    });
  };
  
  const addMedication = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };
  
  const removeMedication = (index) => {
    if (prescriptionData.medications.length <= 1) return;
    
    setPrescriptionData(prev => {
      const medications = [...prev.medications];
      medications.splice(index, 1);
      return { ...prev, medications };
    });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };
  
  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    
    if (!appointment?.patient_id) {
      setError('Patient information not available');
      return;
    }
    
    try {
      setPrescriptionLoading(true);
      
      // Validate medications
      const validMedications = prescriptionData.medications.filter(med => 
        med.name.trim() !== '' && med.dosage.trim() !== ''
      );
      
      if (validMedications.length === 0) {
        setError('At least one medication with name and dosage is required');
        setPrescriptionLoading(false);
        return;
      }
      
      let response;
      
      if (prescriptionFile) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('prescription_file', prescriptionFile);
        formData.append('patient_id', appointment.patient_id);
        formData.append('appointment_id', appointmentId);
        formData.append('medication_details', JSON.stringify(validMedications));
        
        response = await createPrescriptionWithFile(formData);
      } else {
        // JSON data submission
        response = await createPrescription({
          patient_id: appointment.patient_id,
          appointment_id: appointmentId,
          medication_details: validMedications
        });
      }
      
      if (response.success) {
        // Reset form and refresh prescriptions
        setPrescriptionData({ medications: [{ name: '', dosage: '', frequency: '', duration: '' }] });
        setPrescriptionFile(null);
        setShowPrescribeForm(false);
        fetchPatientPrescriptions(appointment.patient_id);
      } else {
        setError(response.message || 'Failed to create prescription');
      }
    } catch (err) {
      setError('An error occurred while creating prescription');
      console.error('Error:', err);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    if (!appointment?.hospital_id) {
      setOrderTestsError("Hospital information not available");
      return;
    }
    
    try {
      setServicesLoading(true);
      setOrderTestsError(null);
      
      const response = await getHospitalServices(appointment.hospital_id);
      
      if (response.success) {
        setAvailableServices(response.services || []);
      } else {
        setOrderTestsError('Failed to fetch available services');
      }
    } catch (err) {
      setOrderTestsError('An error occurred while fetching services');
      console.error('Error:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleOrderTests = async (e) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      setOrderTestsError('Please select at least one service');
      return;
    }
    
    try {
      setServicesLoading(true);
      setOrderTestsError(null);
      
      const response = await orderTestsForPatient(
        appointment.patient_id, 
        appointmentId, 
        selectedServices
      );
      
      if (response.success) {
        setOrderTestsSuccess(response.message || 'Tests ordered successfully');
        setShowOrderTestForm(false);
        setSelectedServices([]);
        fetchAppointmentDetails();
      } else {
        setOrderTestsError(response.message || 'Failed to order tests');
      }
    } catch (err) {
      setOrderTestsError('An error occurred while ordering tests');
      console.error('Error:', err);
    } finally {
      setServicesLoading(false);
    }
  };
  
  if (loading && !appointment) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error && !appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <button 
          className="btn btn-primary mt-4"
          onClick={() => router.push('/doctor/appointments')}
        >
          <ChevronLeft size={16} /> Back to Appointments
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <button 
            className="btn btn-ghost mb-2"
            onClick={() => router.push('/doctor/appointments')}
          >
            <ChevronLeft size={20} /> Back to Appointments
          </button>
          <h1 className="text-3xl font-bold">Appointment Details</h1>
        </div>
        
        {/* Status badge */}
        <div className={`badge badge-lg text-base font-medium mt-2 md:mt-0 whitespace-nowrap p-4 capitalize ${getStatusColor(appointment?.status)}`}>
          {appointment?.status || 'Unknown'}
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - Left and Center */}
        <div className="lg:col-span-2">
          {/* Appointment details card */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Appointment Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <Calendar size={18} className="text-primary mr-3" />
                    <div>
                      <p className="text-sm opacity-70">Date</p>
                      <p className="font-medium">{formatDate(appointment?.appointment_time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <Clock size={18} className="text-primary mr-3" />
                    <div>
                      <p className="text-sm opacity-70">Time</p>
                      <p className="font-medium">{formatTime(appointment?.appointment_time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <MapPin size={18} className="text-primary mr-3" />
                    <div>
                      <p className="text-sm opacity-70">Location</p>
                      <p className="font-medium">
                        {appointment?.hospital_name || 'No hospital specified'}
                        {appointment?.type === "virtual" && ' (Virtual)'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start mb-4">
                    <FileText size={18} className="text-primary mr-3 mt-1" />
                    <div>
                      <p className="text-sm opacity-70">Reason for Visit</p>
                      <p className="font-medium">
                        {appointment?.reason_for_visit || 'No reason specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <Activity size={18} className="text-primary mr-3" />
                    <div>
                      <p className="text-sm opacity-70">Type</p>
                      <p className="font-medium capitalize">
                        {appointment?.type || 'Regular Check-up'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock size={18} className="text-primary mr-3" />
                    <div>
                      <p className="text-sm opacity-70">Duration</p>
                      <p className="font-medium">
                        {appointment?.duration || '30'} minutes
                      </p>
                    </div>
                  </div>

                  {appointment?.fee_details?.service_type && (
                    <div className="flex items-center mb-4">
                      <StethoscopeIcon size={18} className="text-primary mr-3" />
                      <div>
                        <p className="text-sm opacity-70">Consultation Type</p>
                        <p className="font-medium capitalize">
                          {appointment.fee_details.service_type}
                          {appointment.fee_details.amount && (
                            <span className="ml-1">
                              (${parseFloat(appointment.fee_details.amount).toFixed(2)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Section */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <MessageSquare className="text-primary" />
                  Patient Communication
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
                  {/* Chat Messages */}
                  <div id="chat-messages-container" className="bg-base-200 rounded-lg p-4 mb-4 h-[400px] overflow-y-auto flex flex-col">
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
                  
                  {/* Message Input Form */}
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
          
          {/* Prescriptions Section */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <Pill className="text-primary" />
                  Prescriptions
                </h2>
                {appointment?.status === 'completed' && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowPrescribeForm(!showPrescribeForm)}
                  >
                    {showPrescribeForm ? (
                      <><XCircle size={16} /> Cancel</>
                    ) : (
                      <><Plus size={16} /> Prescribe</>
                    )}
                  </button>
                )}
              </div>
              
              {/* Prescription Form */}
              {showPrescribeForm && (
                <form onSubmit={handleCreatePrescription} className="mt-6 p-4 border border-base-300 rounded-lg">
                  <h3 className="font-semibold mb-4">New Prescription</h3>
                  
                  {prescriptionData.medications.map((medication, index) => (
                    <div key={index} className="bg-base-200 p-3 rounded-lg mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Medication #{index + 1}</h4>
                        {prescriptionData.medications.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-error btn-sm btn-circle"
                            onClick={() => removeMedication(index)}
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Medication Name</span>
                          </label>
                          <input 
                            type="text" 
                            className="input input-bordered" 
                            value={medication.name}
                            onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)}
                            placeholder="e.g., Amoxicillin"
                            required
                          />
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Dosage</span>
                          </label>
                          <input 
                            type="text" 
                            className="input input-bordered" 
                            value={medication.dosage}
                            onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Frequency</span>
                          </label>
                          <input 
                            type="text" 
                            className="input input-bordered" 
                            value={medication.frequency}
                            onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                            placeholder="e.g., 3 times a day"
                          />
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Duration</span>
                          </label>
                          <input 
                            type="text" 
                            className="input input-bordered" 
                            value={medication.duration}
                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    className="btn btn-outline w-full mb-4"
                    onClick={addMedication}
                  >
                    <Plus size={16} /> Add Another Medication
                  </button>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Upload Prescription (Optional)</span>
                    </label>
                    <input 
                      type="file" 
                      className="file-input file-input-bordered w-full" 
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, JPG, PNG (max 5MB)
                    </p>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button 
                      type="button"
                      className="btn btn-ghost mr-2"
                      onClick={() => setShowPrescribeForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={prescriptionLoading}
                    >
                      {prescriptionLoading ? <span className="loading loading-spinner loading-xs"></span> : null}
                      Create Prescription
                    </button>
                  </div>
                </form>
              )}
              
              {/* Display existing prescriptions */}
              {prescriptions.length > 0 ? (
                <div className="space-y-6">
                  {prescriptions.map((prescription, index) => (
                    <div key={prescription.prescription_id} className="border-l-4 border-secondary pl-4 py-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Prescription #{prescriptions.length - index}</h3>
                        <span className="text-sm opacity-70">
                          {formatDate(prescription.prescribed_date)} at {formatTime(prescription.prescribed_date)}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-secondary">Medications:</p>
                        <div className="mt-2 space-y-2">
                          {prescription.medication_details && prescription.medication_details.map((med, medIndex) => (
                            <div key={medIndex} className="bg-base-200 p-3 rounded">
                              <div className="flex flex-wrap gap-2">
                                <span className="font-medium">{med.name}</span>
                                {med.dosage && <span className="badge badge-outline">{med.dosage}</span>}
                                {med.frequency && <span className="badge badge-outline">{med.frequency}</span>}
                                {med.duration && <span className="badge badge-outline">For {med.duration}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
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
                            View Prescription File
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Pill size={40} className="mx-auto opacity-30 mb-2" />
                  <p className="text-lg opacity-50">No prescriptions yet</p>
                  <p className="text-sm opacity-50">Create a prescription for this patient</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Medical Tests/Services Section */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <FileText className="text-primary" />
                  Medical Tests & Services
                </h2>
                {appointment?.status === 'completed' || appointment?.status === 'scheduled' ? (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      fetchAvailableServices();
                      setShowOrderTestForm(!showOrderTestForm);
                    }}
                  >
                    {showOrderTestForm ? (
                      <><X size={16} /> Cancel</>
                    ) : (
                      <><PlusCircle size={16} /> Order Tests</>
                    )}
                  </button>
                ) : null}
              </div>
              
              {orderTestsSuccess && !showOrderTestForm && (
                <div className="alert alert-success mb-4">
                  <CheckCircle size={16} />
                  <span>{orderTestsSuccess}</span>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => setOrderTestsSuccess(null)}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              {/* Order Tests Form */}
              {showOrderTestForm && (
                <form onSubmit={handleOrderTests} className="mt-4">
                  {orderTestsError && (
                    <div className="alert alert-error mb-4">
                      <AlertCircle size={16} />
                      <span>{orderTestsError}</span>
                      <button 
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setOrderTestsError(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  
                  {servicesLoading ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  ) : availableServices.length === 0 ? (
                    <div className="alert alert-info">
                      <AlertCircle size={16} />
                      <span>No services available for this hospital</span>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium mb-2">Select tests to order:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                        {availableServices.map(service => (
                          <div 
                            key={service.service_id}
                            className={`border rounded p-3 cursor-pointer transition-colors ${
                              selectedServices.includes(service.service_id) 
                                ? 'bg-primary/10 border-primary' 
                                : 'hover:bg-base-200'
                            }`}
                            onClick={() => toggleServiceSelection(service.service_id)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-medium">{service.service_name}</span>
                                {service.description && (
                                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">${parseFloat(service.price).toFixed(2)}</span>
                                {selectedServices.includes(service.service_id) && (
                                  <CheckCircle size={16} className="text-primary mt-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <button 
                          type="button" 
                          className="btn btn-ghost" 
                          onClick={() => setShowOrderTestForm(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={selectedServices.length === 0 || servicesLoading}
                        >
                          {servicesLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <>Order Selected Tests</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
              
              {/* Display ordered tests if any exist */}
              {appointment?.services && appointment.services.length > 0 ? (
                <div className="mt-2">
                  <h3 className="font-medium">Ordered Tests & Services:</h3>
                  <div className="space-y-6 mt-4">
                    {appointment.services.map((service, index) => (
                      <div key={service.service_id || service.appointment_service_id || index} 
                           className="border rounded-lg p-4 bg-base-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-lg">{service.service_name}</h4>
                            {service.description && (
                              <p className="text-sm text-gray-500">{service.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">${parseFloat(service.service_price || service.price || 0).toFixed(2)}</span>
                            <span className={`badge ${
                              service.payment_status === 'paid' ? 'badge-success' : 'badge-warning'
                            } badge-sm mt-1`}>
                              {service.payment_status || 'unpaid'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Test Results Section */}
                        {service.result_id || service.result_date || service.result_details || service.result_file ? (
                          <div className="mt-3 border-t pt-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-primary">Test Results Available</span>
                              <span className="text-sm">{service.result_date ? formatDate(service.result_date) : ''}</span>
                            </div>
                            
                            {service.pathologist_name && (
                              <div className="mb-2">
                                <span className="text-sm font-medium">Pathologist:</span> {service.pathologist_name}
                              </div>
                            )}
                            
                            {service.result_details && (
                              <div className="mt-3 space-y-3">
                                {service.result_details.summary && (
                                  <div>
                                    <p className="font-medium text-sm">Summary:</p>
                                    <p className="text-sm bg-base-200 p-2 rounded">{service.result_details.summary}</p>
                                  </div>
                                )}
                                
                                {service.result_details.observations && (
                                  <div>
                                    <p className="font-medium text-sm">Observations:</p>
                                    <p className="text-sm bg-base-200 p-2 rounded">{service.result_details.observations}</p>
                                  </div>
                                )}
                                
                                {service.result_details.conclusion && (
                                  <div>
                                    <p className="font-medium text-sm">Conclusion:</p>
                                    <p className="text-sm bg-base-200 p-2 rounded">{service.result_details.conclusion}</p>
                                  </div>
                                )}
                                
                                {service.result_details.values && Object.keys(service.result_details.values).length > 0 && (
                                  <div>
                                    <p className="font-medium text-sm">Test Values:</p>
                                    <div className="overflow-x-auto">
                                      <table className="table table-compact table-zebra w-full mt-1">
                                        <thead>
                                          <tr>
                                            <th>Parameter</th>
                                            <th>Value</th>
                                            {service.result_details.reference_ranges && 
                                             Object.values(service.result_details.reference_ranges).some(range => range.min || range.max) && (
                                              <th>Reference Range</th>
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Object.entries(service.result_details.values).map(([key, value]) => {
                                            const paramKey = key.replace('parameter_', '');
                                            const refRange = service.result_details.reference_ranges?.[key];
                                            
                                            return (
                                              <tr key={key}>
                                                <td>{isNaN(paramKey) ? paramKey : `Parameter ${paramKey}`}</td>
                                                <td>{value}</td>
                                                {service.result_details.reference_ranges && 
                                                 Object.values(service.result_details.reference_ranges).some(range => range.min || range.max) && (
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
                                {service.result_details.recommendations && (
                                  <div>
                                    <p className="font-medium text-sm">Recommendations:</p>
                                    <p className="text-sm bg-base-200 p-2 rounded">{service.result_details.recommendations}</p>
                                  </div>
                                )}
                                
                                {service.result_details.additional_notes && (
                                  <div>
                                    <p className="font-medium text-sm">Additional Notes:</p>
                                    <p className="text-sm bg-base-200 p-2 rounded">{service.result_details.additional_notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {service.result_file && (
                              <div className="mt-3">
                                <a 
                                  href={service.result_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline"
                                >
                                  <FileText size={14} className="mr-1" />
                                  View Full Report
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-gray-500 italic">
                            Results not available yet
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText size={40} className="mx-auto opacity-30 mb-2" />
                  <p className="opacity-50">No tests ordered for this appointment</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Medical Notes Section */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-xl">Medical Notes</h2>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowNoteForm(!showNoteForm)}
                >
                  {showNoteForm ? (
                    <><XCircle size={16} /> Cancel</>
                  ) : (
                    <><Plus size={16} /> Add Note</>
                  )}
                </button>
              </div>
              
              {/* Note Form */}
              {showNoteForm && (
                <form onSubmit={handleAddNote} className="mb-8 p-4 border border-base-300 rounded-lg">
                  <h3 className="font-semibold mb-4">New Medical Note</h3>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Diagnosis</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered" 
                      placeholder="Enter diagnosis"
                      value={noteData.diagnosis}
                      onChange={(e) => setNoteData({...noteData, diagnosis: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Prescription</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered" 
                      placeholder="Enter medication and dosage"
                      value={noteData.prescription}
                      onChange={(e) => setNoteData({...noteData, prescription: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium">Instructions</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered" 
                      placeholder="Special instructions for the patient"
                      value={noteData.instructions}
                      onChange={(e) => setNoteData({...noteData, instructions: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label cursor-pointer">
                      <span className="label-text font-medium">Follow-up required</span>
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-primary" 
                        checked={noteData.follow_up_needed}
                        onChange={(e) => setNoteData({...noteData, follow_up_needed: e.target.checked})}
                      />
                    </label>
                  </div>
                  
                  {noteData.follow_up_needed && (
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-medium">Follow-up Date</span>
                      </label>
                      <input 
                        type="date" 
                        className="input input-bordered" 
                        value={noteData.follow_up_date}
                        onChange={(e) => setNoteData({...noteData, follow_up_date: e.target.value})}
                        required={noteData.follow_up_needed}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <button 
                      type="button"
                      className="btn btn-ghost mr-2"
                      onClick={() => setShowNoteForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? <span className="loading loading-spinner loading-xs"></span> : null}
                      Save Note
                    </button>
                  </div>
                </form>
              )}
              
              {/* Display existing notes */}
              {appointment?.medical_notes && appointment.medical_notes.length > 0 ? (
                <div className="space-y-6">
                  {appointment.medical_notes.map((note, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{note.diagnosis}</h3>
                        <span className="text-sm opacity-70">
                          {formatDate(note.created_at)} at {formatTime(note.created_at)}
                        </span>
                      </div>
                      
                      {note.prescription && (
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-secondary">Prescription:</p>
                          <p>{note.prescription}</p>
                        </div>
                      )}
                      
                      {note.instructions && (
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-accent">Instructions:</p>
                          <p>{note.instructions}</p>
                        </div>
                      )}
                      
                      {note.follow_up_needed && (
                        <div className="flex items-center mt-2">
                          <Calendar size={16} className="text-primary mr-2" />
                          <p>Follow-up on: <span className="font-semibold">{formatDate(note.follow_up_date)}</span></p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare size={40} className="mx-auto opacity-30 mb-2" />
                  <p className="text-lg opacity-50">No medical notes yet</p>
                  <p className="text-sm opacity-50">Add a note to keep track of the patient's condition</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Medical History Section */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Patient Medical History</h2>
              
              {appointment?.patient_history && appointment.patient_history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointment.patient_history.map((record, index) => (
                        <tr key={index}>
                          <td>{formatDate(record.date)}</td>
                          <td>
                            <span className="badge badge-outline">
                              {record.type || 'Visit'}
                            </span>
                          </td>
                          <td>{record.description}</td>
                          <td>
                            <button className="btn btn-ghost btn-xs">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen size={40} className="mx-auto opacity-30 mb-2" />
                  <p className="opacity-50">No previous medical history available</p>
                </div>
              )}
            </div>
          </div>

        </div>
        
        {/* Sidebar - Patient Info and Actions */}
        <div>
          {/* Patient Info Card */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Patient Information</h2>
              
              <div className="flex items-center mb-6">
                <div className="avatar placeholder mr-4">
                  <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                    <span className="text-xl">
                      {appointment?.patient_name?.charAt(0) || 'P'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{appointment?.patient_name || 'Patient Name'}</h3>
                  <p className="text-sm opacity-70">
                    {appointment?.patient_age ? `${appointment.patient_age} years` : 'Age not available'}, 
                    {appointment?.patient_gender || 'Gender not specified'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone size={16} className="mr-3 text-primary" />
                  <span>{appointment?.patient_phone || 'Phone not available'}</span>
                </div>
                
                <div className="flex items-center">
                  <Mail size={16} className="mr-3 text-primary" />
                  <span>{appointment?.patient_email || 'Email not available'}</span>
                </div>
                
                {appointment?.patient_address && (
                  <div className="flex items-start">
                    <MapPin size={16} className="mr-3 text-primary mt-1" />
                    <span>{appointment.patient_address}</span>
                  </div>
                )}
              </div>
              
              <div className="divider my-4"></div>
              
              {/* Patient medical details like allergies, chronic conditions */}
              <h3 className="font-semibold mb-2">Patient's Health Info</h3>
              
              {healthInfoLoading ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : healthInfoError ? (
                <div className="alert alert-error text-sm">
                  <AlertCircle size={16} />
                  <span>{healthInfoError}</span>
                </div>
              ) : !healthInfo ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No health information available for this patient</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Blood Group:</p>
                    <p>{healthInfo.blood_group || 'Not Available'}</p>
                  </div>
                  
                  {healthInfo.details?.height && (
                    <div>
                      <p className="text-sm font-medium">Height:</p>
                      <p>{healthInfo.details.height}</p>
                    </div>
                  )}
                  
                  {healthInfo.details?.weight && (
                    <div>
                      <p className="text-sm font-medium">Weight:</p>
                      <p>{healthInfo.details.weight}</p>
                    </div>
                  )}
                  
                  {healthInfo.allergies && (
                    <div>
                      <p className="text-sm font-medium">Allergies:</p>
                      <p>{healthInfo.allergies}</p>
                    </div>
                  )}
                  
                  {healthInfo.drug_reactions && (
                    <div>
                      <p className="text-sm font-medium">Drug Reactions:</p>
                      <p>{healthInfo.drug_reactions}</p>
                    </div>
                  )}
                  
                  {healthInfo.complexities && (
                    <div>
                      <p className="text-sm font-medium">Medical Complexities:</p>
                      <p>{healthInfo.complexities}</p>
                    </div>
                  )}
                  
                  {healthInfo.details?.chronic_conditions && (
                    <div>
                      <p className="text-sm font-medium">Chronic Conditions:</p>
                      <p>{healthInfo.details.chronic_conditions}</p>
                    </div>
                  )}
                  
                  {healthInfo.details?.emergency_contact && (
                    <div>
                      <p className="text-sm font-medium">Emergency Contact:</p>
                      <p>{healthInfo.details.emergency_contact}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4">
                <button 
                  className="btn btn-outline btn-primary btn-block"
                  onClick={() => router.push(`/doctor/patients/${appointment?.patient_id}`)}
                >
                  <User size={16} /> View Full Patient Profile
                </button>
              </div>
            </div>
          </div>
          
          {/* Payment Information Card */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Payment Information</h2>
              
              {appointment?.fee_details ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Consultation Details:</h3>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <StethoscopeIcon size={16} className="text-primary" />
                        <span className="capitalize">{appointment.fee_details.service_type || 'Regular'} Consultation</span>
                      </div>
                      <span className="font-medium">
                        ${parseFloat(appointment.fee_details.amount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span>Payment Status:</span>
                      <span className={`badge ${
                        appointment.fee_details.payment_status === 'paid' 
                          ? 'badge-success' 
                          : 'badge-warning'
                      }`}>
                        {appointment.fee_details.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.services && appointment.services.length > 0 && (
                    <div className="mt-2">
                      <h3 className="font-medium">Additional Services:</h3>
                      {appointment.services.map((service, index) => (
                        <div key={service.service_id || service.appointment_service_id || index} 
                             className="flex justify-between items-center mt-2">
                          <div>
                            <span>{service.service_name}</span>
                            {service.quantity > 1 && <span className="text-xs ml-1">x{service.quantity}</span>}
                          </div>
                          <div className="flex gap-2 items-center">
                            <span>
                              ${parseFloat(service.service_price || service.price || 0).toFixed(2)}
                            </span>
                            <span className={`badge ${
                              service.payment_status === 'paid' 
                                ? 'badge-success badge-sm' 
                                : 'badge-warning badge-sm'
                            }`}>
                              {service.payment_status || 'unpaid'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No payment information available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="card bg-base-100 shadow-lg mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Actions</h2>
              
              <div className="space-y-4">
                {/* Status Update Buttons */}
                {appointment?.status === 'scheduled' && (
                  <>
                    <button 
                      className="btn btn-success btn-block"
                      onClick={() => setConfirmActionType('complete')}
                    >
                      <CheckCircle size={16} /> Mark as Completed
                    </button>
                    
                    <button 
                      className="btn btn-error btn-block"
                      onClick={() => setConfirmActionType('cancel')}
                    >
                      <XCircle size={16} /> Cancel Appointment
                    </button>
                    
                    <button 
                      className="btn btn-warning btn-block"
                      onClick={() => setConfirmActionType('no_show')}
                    >
                      <AlertCircle size={16} /> Mark as No-Show
                    </button>
                  </>
                )}
                
                {/* Reschedule Button (available for scheduled and no-show) */}
                {['scheduled', 'no_show'].includes(appointment?.status) && (
                  <button 
                    className="btn btn-info btn-block"
                    onClick={() => setShowRescheduleForm(!showRescheduleForm)}
                  >
                    <RefreshCcw size={16} /> 
                    {showRescheduleForm ? 'Cancel Rescheduling' : 'Reschedule Appointment'}
                  </button>
                )}
              </div>
              
              {/* Reschedule Form */}
              {showRescheduleForm && (
                <form onSubmit={handleReschedule} className="mt-6 p-4 border border-base-300 rounded-lg">
                  <h3 className="font-semibold mb-4">Reschedule Appointment</h3>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">New Date</span>
                    </label>
                    <input 
                      type="date" 
                      className="input input-bordered" 
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">New Time</span>
                    </label>
                    <input 
                      type="time" 
                      className="input input-bordered" 
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? <span className="loading loading-spinner loading-xs"></span> : null}
                      Confirm Reschedule
                    </button>
                  </div>
                </form>
              )}
              
              {/* Confirmation Modal */}
              {confirmActionType && (
                <div className="modal modal-open">
                  <div className="modal-box">
                    <h3 className="font-bold text-lg">
                      {confirmActionType === 'complete' && 'Mark Appointment as Completed?'}
                      {confirmActionType === 'cancel' && 'Cancel this Appointment?'}
                      {confirmActionType === 'no_show' && 'Mark Patient as No-Show?'}
                    </h3>
                    <p className="py-4">
                      {confirmActionType === 'complete' && 'This will mark the appointment as successfully completed.'}
                      {confirmActionType === 'cancel' && 'This will cancel the scheduled appointment.'}
                      {confirmActionType === 'no_show' && 'This indicates the patient did not attend the scheduled appointment.'}
                    </p>
                    <div className="modal-action">
                      <button 
                        className="btn" 
                        onClick={() => setConfirmActionType(null)}
                      >
                        No, Go Back
                      </button>
                      <button
                        className={`btn ${
                          confirmActionType === 'complete' ? 'btn-success' : 
                          confirmActionType === 'cancel' ? 'btn-error' : 'btn-warning'
                        }`}
                        onClick={() => handleStatusUpdate(
                          confirmActionType === 'complete' ? 'completed' : 
                          confirmActionType === 'cancel' ? 'canceled' : 'no_show'
                        )}
                        disabled={loading}
                      >
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : null}
                        Yes, Confirm
                      </button>
                    </div>
                  </div>
                  <div className="modal-backdrop" onClick={() => setConfirmActionType(null)}></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
