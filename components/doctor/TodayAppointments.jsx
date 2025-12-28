"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTodaysAppointments, updateAppointmentStatus } from '@/services/doctorDashboardService';
import { Clock, User, MapPin, Check, X, Video } from 'lucide-react';

const TodayAppointments = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingAppointment, setUpdatingAppointment] = useState(null);

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const response = await getTodaysAppointments();
      
      if (response.success) {
        // Sort by time
        const sortedAppointments = response.appointments.sort((a, b) => 
          new Date(a.appointment_time) - new Date(b.appointment_time)
        );
        setAppointments(sortedAppointments);
      } else {
        setError('Failed to load today\'s appointments');
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
      setUpdatingAppointment(appointmentId);
      const response = await updateAppointmentStatus(appointmentId, newStatus);
      
      if (response.success) {
        // Update the local state to reflect the change
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
    } finally {
      setUpdatingAppointment(null);
    }
  };

  // Format time (e.g. "2:30 PM")
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  // Add a navigation handler for appointment details
  const handleAppointmentClick = (appointmentId, event) => {
    // Prevent navigation if clicking on action buttons
    if (event.target.closest('button')) {
      return;
    }
    
    router.push(`/doctor/appointments/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
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
      <div className="text-center py-8 bg-base-200 rounded-lg">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">No appointments for today</h3>
        <p className="mt-1 text-gray-500">You have no scheduled appointments for today.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Time</th>
            <th>Patient</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appointment => (
            <tr 
              key={appointment.appointment_id} 
              onClick={(e) => handleAppointmentClick(appointment.appointment_id, e)}
              className="cursor-pointer hover:bg-base-300"
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
              <td>
                <div className="flex gap-2">
                  <button 
                    className="btn btn-xs btn-success"
                    disabled={appointment.status === 'completed' || updatingAppointment === appointment.appointment_id}
                    onClick={() => handleStatusUpdate(appointment.appointment_id, 'completed')}
                  >
                    {updatingAppointment === appointment.appointment_id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Check size={12} />
                        Complete
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-xs btn-error"
                    disabled={appointment.status === 'canceled' || updatingAppointment === appointment.appointment_id}
                    onClick={() => handleStatusUpdate(appointment.appointment_id, 'canceled')}
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <button
                    className="btn btn-xs btn-info"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the row click
                      router.push(`/doctor/patients/${appointment.patient_id}`);
                    }}
                  >
                    <User size={12} />
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TodayAppointments;
