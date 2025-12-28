"use client";

import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Building2, Stethoscope, User, Video } from 'lucide-react';

const AppointmentCard = ({ appointment }) => {
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

  return (
    <Link 
      href={`/appointments/${appointment.appointment_id}`}
      className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="badge badge-lg font-medium mb-2 mr-2 gap-1 py-3 px-3 overflow-visible whitespace-nowrap text-ellipsis max-w-[180px]">
            {appointment.appointment_time && (
              <Calendar size={14} className="mr-1" />
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
          {appointment.type === 'virtual' ? (
            <div className="badge badge-outline badge-accent gap-1">
              <Video size={12} />
              Virtual
            </div>
          ) : (
            <div className="badge badge-outline gap-1">
              <User size={12} />
              In-person
            </div>
          )}
          
          {appointment.services && appointment.services.length > 0 && (
            <div className="badge badge-outline">
              {appointment.services.length} service{appointment.services.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default AppointmentCard;
