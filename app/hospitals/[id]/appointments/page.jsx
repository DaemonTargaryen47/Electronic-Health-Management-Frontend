"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHospitalById } from '@/services/hospitalService';
import { getHospitalAppointments } from '@/services/appointmentService';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { Calendar, Clock, AlertCircle, Search, Filter, ChevronLeft, 
         UserPlus, Check, X, ArrowLeft, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';

export default function HospitalAppointmentsPage({ params }) {
  const router = useRouter();
  const hospitalId = params.id;
  
  const [hospital, setHospital] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [date, setDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  
  const limit = 20;

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch hospital details
        const hospitalResponse = await getHospitalById(hospitalId);
        
        if (!hospitalResponse.success) {
          setError('Hospital not found');
          return;
        }
        
        setHospital(hospitalResponse.hospital);
        
        // Fetch appointments
        await fetchAppointments();
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [hospitalId, router]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const options = {
        limit,
        offset: (currentPage - 1) * limit
      };
      
      if (filter !== 'all') {
        options.status = filter;
      }
      
      if (date) {
        options.date = date;
      }
      
      const response = await getHospitalAppointments(hospitalId, options);
      
      if (response.success) {
        setAppointments(response.appointments);
        setTotalAppointments(response.count || response.appointments.length);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hospital) {
      fetchAppointments();
    }
  }, [currentPage, filter, date, hospital]);

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

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilter('all');
    setDate('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalAppointments / limit);

  if (loading && !hospital) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-sm btn-ghost">
          <ChevronLeft size={16} />
          Back to Hospital Management
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hospital Appointments</h1>
          {hospital && <h2 className="text-lg">{hospital.name}</h2>}
        </div>
        
        <Link href={`/appointments/new?hospital=${hospitalId}`} className="btn btn-primary">
          <UserPlus size={18} className="mr-1" />
          New Appointment
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="form-control">
          <div className="input-group">
            <span className="bg-base-300">
              <Filter size={16} />
            </span>
            <select 
              className="select select-bordered" 
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
        
        <div className="form-control">
          <div className="input-group">
            <span className="bg-base-300">
              <CalendarIcon size={16} />
            </span>
            <input
              type="date"
              className="input input-bordered"
              value={date}
              onChange={handleDateChange}
            />
          </div>
        </div>
        
        {(filter !== 'all' || date) && (
          <button 
            className="btn btn-sm btn-ghost"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {/* Appointments Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date & Time</th>
              <th>Doctor</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No appointments found with the current filters.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.appointment_id}>
                  <td>
                    <div>
                      <div className="font-bold">{appointment.patient_name}</div>
                      <div className="text-sm opacity-50">{appointment.patient_email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span>{formatDate(appointment.appointment_time)}</span>
                      <span className="text-sm opacity-70">{formatTime(appointment.appointment_time)}</span>
                    </div>
                  </td>
                  <td>
                    {appointment.doctor_name ? (
                      <span>Dr. {appointment.doctor_name}</span>
                    ) : (
                      <span className="text-gray-400">No specific doctor</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-outline">
                      {appointment.type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/appointments/${appointment.appointment_id}`} className="btn btn-sm btn-primary mr-2">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center my-6">
          <div className="btn-group">
            <button 
              className="btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft size={16} />
            </button>
            
            <button className="btn">
              Page {currentPage} of {totalPages}
            </button>
            
            <button 
              className="btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
