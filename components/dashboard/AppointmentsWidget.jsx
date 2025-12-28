"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, AlertCircle, CalendarClock, Video } from 'lucide-react';
import { getUserAppointments } from '@/services/appointmentService';

const AppointmentsWidget = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await getUserAppointments('scheduled');
        
        if (response.success) {
          // Sort by appointment time (nearest first)
          const sortedAppointments = response.appointments
            .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
            .slice(0, 3); // Only take the next 3 appointments
          
          setAppointments(sortedAppointments);
        } else {
          setError('Failed to load appointments');
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Error loading appointments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // Get friendly time message (today, tomorrow, etc.)
  const getTimeMessage = (dateString) => {
    if (!dateString) return '';
    
    const appointmentDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset hours to compare just the dates
    const appointmentDay = new Date(appointmentDate);
    appointmentDay.setHours(0, 0, 0, 0);
    
    const todayDay = new Date(today);
    todayDay.setHours(0, 0, 0, 0);
    
    const tomorrowDay = new Date(tomorrow);
    tomorrowDay.setHours(0, 0, 0, 0);
    
    if (appointmentDay.getTime() === todayDay.getTime()) {
      return 'Today';
    } else if (appointmentDay.getTime() === tomorrowDay.getTime()) {
      return 'Tomorrow';
    }
    
    // Calculate days difference for "In X days" message
    const diffTime = Math.abs(appointmentDay - todayDay);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return `In ${diffDays} days`;
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <Calendar className="text-primary" />
            Upcoming Appointments
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
            <Calendar className="text-primary" />
            Upcoming Appointments
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
                <Calendar className="text-primary" />
                Upcoming Appointments
            </h2>
            
            {appointments.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-500">No upcoming appointments scheduled.</p>
                    <Link href="/appointments/new" className="btn btn-primary btn-sm mt-2">
                        <CalendarClock size={16} className="mr-1" />
                        Book an Appointment
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <Link
                            key={appointment.appointment_id}
                            href={`/appointments/${appointment.appointment_id}`}
                            className="block hover:bg-base-200 rounded-lg p-3 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{appointment.hospital_name}</p>
                                    <div className="flex items-center mt-1 text-sm">
                                        <Clock size={14} className="mr-1" />
                                        {formatTime(appointment.appointment_time)}
                                        {appointment.doctor_name && (
                                            <span className="ml-2">• Dr. {appointment.doctor_name}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end space-y-1">
                                    {getTimeMessage(appointment.appointment_time) && (
                                        <span className="badge badge-primary text-sm px-3 py-2">
                                            {getTimeMessage(appointment.appointment_time)}
                                        </span>
                                    )}
                                    {appointment.type === 'virtual' && (
                                        <span className="badge badge-outline badge-accent gap-2 text-sm px-3 py-2">
                                            <Video size={14} />
                                            Virtual
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                    
                    <div className="pt-2">
                        <Link href="/appointments" className="btn btn-outline btn-sm w-full">
                            View All Appointments
                        </Link>
                    </div>
                </div>
            )}
        </div>
    </div>
);
};

export default AppointmentsWidget;
