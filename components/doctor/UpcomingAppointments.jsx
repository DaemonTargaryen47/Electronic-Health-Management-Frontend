"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUpcomingAppointments } from '@/services/doctorDashboardService';
import { Calendar, Clock, User, MapPin, Video } from 'lucide-react';

const UpcomingAppointments = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true);
      const response = await getUpcomingAppointments();
      
      if (response.success) {
        // Show only next 5 upcoming appointments
        const sortedAppointments = response.appointments
          .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time))
          .slice(0, 5);
        setAppointments(sortedAppointments);
      } else {
        setError('Failed to load upcoming appointments');
      }
    } catch (err) {
      setError('An error occurred while fetching appointments');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date (e.g. "Monday, June 15")
  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time (e.g. "2:30 PM")
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-6 bg-base-200 rounded-lg">
        <Calendar className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-gray-500">No upcoming appointments scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div 
          key={appointment.appointment_id}
          onClick={() => router.push(`/doctor/appointments/${appointment.appointment_id}`)}
          className="flex flex-col p-3 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <Calendar size={14} className="mr-1 text-primary" />
                <span className="font-medium">{formatDate(appointment.appointment_time)}</span>
              </div>
              <div className="flex items-center mt-1 text-sm">
                <Clock size={12} className="mr-1" />
                {formatTime(appointment.appointment_time)}
              </div>
            </div>
            
            {appointment.type === 'virtual' ? (
              <div className="badge badge-accent gap-1">
                <Video size={12} />
                Virtual
              </div>
            ) : (
              <div className="badge gap-1">
                <MapPin size={12} />
                In-person
              </div>
            )}
          </div>
          
          <div className="flex items-center mt-2">
            <User size={14} className="mr-1" />
            <span>{appointment.patient_name}</span>
          </div>
          
          {appointment.hospital_name && (
            <div className="text-sm mt-1 text-gray-500">
              {appointment.hospital_name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UpcomingAppointments;
