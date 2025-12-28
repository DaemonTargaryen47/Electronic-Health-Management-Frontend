"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Check, X, AlertCircle, Filter, User, Building2, Stethoscope, PlusCircle } from 'lucide-react';
import { getUserAppointments } from '@/services/appointmentService';
import { isAuthenticated } from '@/services/authService';

const AppointmentList = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Load appointments on component mount
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchAppointments();
  }, [router]);
  
  // Fetch appointments from API
  const fetchAppointments = async (statusFilter = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserAppointments(statusFilter);
      
      if (response.success) {
        setAppointments(response.appointments || []);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('An error occurred while loading your appointments');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    
    let statusFilter = null;
    if (newFilter !== 'all') {
      statusFilter = newFilter;
    }
    
    await fetchAppointments(statusFilter);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'badge-primary';
      case 'completed':
        return 'badge-success';
      case 'canceled':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };
  
  // Get appointment type icon
  const getAppointmentTypeIcon = (type) => {
    switch (type) {
      case 'virtual':
        return <div className="badge badge-outline badge-accent gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Virtual
        </div>;
      default:
        return <div className="badge badge-outline gap-1">
          <User size={12} />
          In-person
        </div>;
    }
  };
  
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
        <h1 className="text-2xl font-bold mb-4 md:mb-0">My Appointments</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline gap-2">
              <Filter size={16} />
              Filter: {filter === 'all' ? 'All' : filter}
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><button className={filter === 'all' ? 'active' : ''} onClick={() => handleFilterChange('all')}>All</button></li>
              <li><button className={filter === 'scheduled' ? 'active' : ''} onClick={() => handleFilterChange('scheduled')}>Scheduled</button></li>
              <li><button className={filter === 'completed' ? 'active' : ''} onClick={() => handleFilterChange('completed')}>Completed</button></li>
              <li><button className={filter === 'canceled' ? 'active' : ''} onClick={() => handleFilterChange('canceled')}>Canceled</button></li>
            </ul>
          </div>
          
          <Link href="/appointments/new" className="btn btn-primary gap-2">
            <PlusCircle size={16} />
            New Appointment
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium">No appointments found</h3>
          <p className="mt-1 text-gray-500">
            {filter !== 'all' 
              ? `You don't have any ${filter} appointments.` 
              : "You haven't scheduled any appointments yet."}
          </p>
          <div className="mt-6">
            <Link href="/appointments/new" className="btn btn-primary">
              Schedule an Appointment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map(appointment => (
            <Link 
              key={appointment.appointment_id} 
              href={`/appointments/${appointment.appointment_id}`}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="badge badge-lg font-medium mb-2 mr-2 gap-1 py-3 px-3 overflow-visible whitespace-nowrap text-ellipsis max-w-[180px]">
                    {appointment.appointment_time && (
                      <Clock size={14} className="mr-1" />
                    )}
                    {appointment.appointment_time ? formatDate(appointment.appointment_time) : 'Date not set'}
                  </div>
                  <div className={`badge ${getStatusBadgeClass(appointment.status)} badge-lg`}>
                    {appointment.status}
                  </div>
                </div>
                
                {appointment.hospital_name && (
                  <div className="flex items-start gap-2 mt-2">
                    <Building2 size={16} className="mt-1 shrink-0" />
                    <div>
                      <p className="font-medium">{appointment.hospital_name}</p>
                      {appointment.hospital_address && (
                        <p className="text-sm text-gray-600">{appointment.hospital_address}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {appointment.doctor_name && (
                  <div className="flex items-center gap-2 mt-1">
                    <Stethoscope size={16} />
                    <span>Dr. {appointment.doctor_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={16} />
                  <span>
                    {appointment.appointment_time 
                      ? formatTime(appointment.appointment_time) 
                      : 'Time not set'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  {getAppointmentTypeIcon(appointment.type)}
                  
                  {appointment.services && appointment.services.length > 0 && (
                    <div className="badge badge-outline">
                      {appointment.services.length} service{appointment.services.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
