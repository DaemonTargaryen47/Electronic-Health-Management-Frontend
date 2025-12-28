"use client";

import React from 'react';
import Link from 'next/link';
import { CalendarPlus, Calendar, StethoscopeIcon, Clock } from 'lucide-react';
import { isAuthenticated } from '@/services/authService';

const HospitalDetailActions = ({ hospital, doctors = [] }) => {
  const userIsAuthenticated = isAuthenticated();

  // Get next 3 available doctors for quick booking
  const getAvailableDoctors = () => {
    // Filter doctors who have working hours information
    const availableDoctors = doctors.filter(doctor => 
      doctor.working_hours && Object.keys(doctor.working_hours).length > 0
    );
    
    // Sort doctors alphabetically
    availableDoctors.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    
    // Get the first 3 available doctors
    return availableDoctors.slice(0, 3);
  };

  return (
    <div className="card bg-base-100 shadow-md mb-6">
      <div className="card-body">
        <h2 className="card-title text-xl flex items-center gap-2">
          <Calendar className="text-primary" />
          Appointments
        </h2>
        
        <div className="space-y-4 mt-2">
          <div>
            <Link 
              href={`/appointments/new?hospital=${hospital.hospital_id}`} 
              className="btn btn-primary w-full"
            >
              <CalendarPlus size={16} className="mr-2" />
              Book an Appointment
            </Link>
          </div>
          
          {!userIsAuthenticated && (
            <div className="alert alert-info">
              <span>
                <Link href="/login" className="underline">Login</Link> to book and manage your appointments.
              </span>
            </div>
          )}
          
          {doctors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Quick Book with Doctor</h3>
              
              <div className="space-y-2">
                {getAvailableDoctors().map(doctor => (
                  <div key={doctor.doctor_id} className="border rounded-lg p-3 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <StethoscopeIcon size={16} className="mr-2" />
                        <span className="font-medium">Dr. {doctor.name}</span>
                      </div>
                      <Link
                        href={`/appointments/new?hospital=${hospital.hospital_id}&doctor=${doctor.doctor_id}`}
                        className="btn btn-xs btn-outline"
                      >
                        Book
                      </Link>
                    </div>
                    
                    {doctor.working_hours && Object.keys(doctor.working_hours).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        Available on: {Object.keys(doctor.working_hours).slice(0, 3).join(', ')}
                        {Object.keys(doctor.working_hours).length > 3 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDetailActions;
