"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getCalendarAppointments, updateAppointmentStatus } from '@/services/doctorDashboardService';
import { Calendar, Clock, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const DoctorAppointments = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week'); // 'day', 'week', 'month'

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchAppointments();
  }, [router, currentDate, currentView]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on current view
      let startDate, endDate;
      
      if (currentView === 'day') {
        startDate = currentDate.toISOString().split('T')[0];
        endDate = startDate;
      } else if (currentView === 'week') {
        // Calculate the start of the week (Sunday)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        
        // End of week (Saturday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endDate = endOfWeek.toISOString().split('T')[0];
      } else { // month
        // Start of month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        startDate = startOfMonth.toISOString().split('T')[0];
        
        // End of month
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        endDate = endOfMonth.toISOString().split('T')[0];
      }
      
      const response = await getCalendarAppointments(startDate, endDate);
      
      if (response.success) {
        // Filter appointments if needed
        let filteredAppointments = response.appointments;
        if (statusFilter !== 'all') {
          filteredAppointments = filteredAppointments.filter(
            appt => appt.status === statusFilter
          );
        }
        
        setAppointments(filteredAppointments);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err) {
      setError('An error occurred while fetching appointments');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await updateAppointmentStatus(appointmentId, newStatus);
      
      if (response.success) {
        // Update the appointment in the list
        setAppointments(appointments.map(appt => 
          appt.appointment_id === appointmentId 
            ? {...appt, status: newStatus} 
            : appt
        ));
      } else {
        setError('Failed to update appointment status');
      }
    } catch (err) {
      setError('An error occurred while updating appointment');
      console.error('Error:', err);
    }
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Format date range for display
  const formatDateRange = () => {
    if (currentView === 'day') {
      return currentDate.toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    } else if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }
  };

  // Format time (e.g. "2:30 PM")
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Format date (e.g. "Mon, 15 Jun")
  const formatDate = (dateString) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Group appointments by date for better display
  const groupAppointmentsByDate = () => {
    const grouped = {};
    
    appointments.forEach(appointment => {
      const date = new Date(appointment.appointment_time).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    
    // Sort appointments by time within each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.appointment_time) - new Date(b.appointment_time)
      );
    });
    
    return grouped;
  };

  // Add a function to handle row click
  const handleRowClick = (appointmentId) => {
    router.push(`/doctor/appointments/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const groupedAppointments = groupAppointmentsByDate();

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/doctor')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Appointments</h1>
        
        <div className="flex flex-wrap gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline gap-2">
              <Filter size={16} />
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button></li>
              <li><button className={statusFilter === 'scheduled' ? 'active' : ''} onClick={() => setStatusFilter('scheduled')}>Scheduled</button></li>
              <li><button className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}>Completed</button></li>
              <li><button className={statusFilter === 'canceled' ? 'active' : ''} onClick={() => setStatusFilter('canceled')}>Canceled</button></li>
            </ul>
          </div>
          
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline gap-2">
              <Calendar size={16} />
              View: {currentView}
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><button className={currentView === 'day' ? 'active' : ''} onClick={() => setCurrentView('day')}>Day</button></li>
              <li><button className={currentView === 'week' ? 'active' : ''} onClick={() => setCurrentView('week')}>Week</button></li>
              <li><button className={currentView === 'month' ? 'active' : ''} onClick={() => setCurrentView('month')}>Month</button></li>
            </ul>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}
      
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <button className="btn btn-square" onClick={navigatePrevious}>
              <ChevronLeft />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{formatDateRange()}</h2>
            </div>
            <button className="btn btn-square" onClick={navigateNext}>
              <ChevronRight />
            </button>
          </div>
          <div className="flex justify-center mt-2">
            <button className="btn btn-sm btn-outline" onClick={navigateToday}>
              Today
            </button>
          </div>
        </div>
      </div>
      
      {Object.keys(groupedAppointments).length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium">No appointments found</h3>
          <p className="mt-1 text-gray-500">
            There are no appointments scheduled for this period.
          </p>
        </div>
      ) : (
        Object.keys(groupedAppointments).sort().map(date => (
          <div key={date} className="mb-8">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">
              {formatDate(date)}
            </h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Hospital</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedAppointments[date].map(appointment => (
                    <tr 
                      key={appointment.appointment_id} 
                      className="cursor-pointer hover:bg-base-200"
                      onClick={() => handleRowClick(appointment.appointment_id)}
                    >
                      <td>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-2" />
                          {formatTime(appointment.appointment_time)}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{appointment.patient_name}</div>
                        <div className="text-sm opacity-70">ID: {appointment.patient_id}</div>
                      </td>
                      <td>
                        {appointment.hospital_name}
                      </td>
                      <td>
                        <span className={`badge ${
                          appointment.status === 'completed' ? 'badge-success' :
                          appointment.status === 'canceled' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-xs btn-circle btn-success"
                            disabled={appointment.status === 'completed'}
                            onClick={() => handleStatusUpdate(appointment.appointment_id, 'completed')}
                            title="Mark as Completed"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            className="btn btn-xs btn-circle btn-error"
                            disabled={appointment.status === 'canceled'}
                            onClick={() => handleStatusUpdate(appointment.appointment_id, 'canceled')}
                            title="Cancel Appointment"
                          >
                            <XCircle size={14} />
                          </button>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/doctor/patients/${appointment.patient_id}`);
                            }}
                          >
                            View Patient
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DoctorAppointments;
