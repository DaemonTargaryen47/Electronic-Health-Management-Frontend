"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAppointmentById, cancelAppointment, rescheduleAppointment } from '@/services/appointmentService';
import { getDoctorById } from '@/services/doctorService';
import { getHospitalById } from '@/services/hospitalService';
import { Video, AlertCircle, Calendar, Clock, User, MapPin, Phone, Mail, ChevronLeft } from 'lucide-react';

const AppointmentDetail = ({ appointmentId }) => {
  const router = useRouter();
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [updating, setUpdating] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const appointmentResponse = await getAppointmentById(appointmentId);

        console.log('Appointment Details Response:', appointmentResponse);

        if (appointmentResponse.success) {
          setAppointment(appointmentResponse.appointment);
          const doctorResponse = await getDoctorById(appointmentResponse.appointment.doctor_id);
          if (doctorResponse.success) {
            setDoctor(doctorResponse.doctor);
          }
          const hospitalResponse = await getHospitalById(appointmentResponse.appointment.hospital_id);
          if (hospitalResponse.success) {
            setHospital(hospitalResponse.hospital);
          }
        } else {
          setError(appointmentResponse.message || 'Failed to load appointment details');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while loading data');
        console.error('Error loading appointment data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  const handleCancelAppointment = async () => {
    try {
      setUpdating(true);
      const response = await cancelAppointment(appointmentId);
      if (response.success) {
        router.push('/appointments');
      } else {
        setError(response.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while canceling the appointment');
      console.error('Error canceling appointment:', err);
    } finally {
      setUpdating(false);
      setShowCancelConfirm(false);
    }
  };

  const handleRescheduleAppointment = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const response = await rescheduleAppointment(appointmentId, rescheduleDate, rescheduleTime);
      if (response.success) {
        setAppointment(response.appointment);
        setShowRescheduleModal(false);
      } else {
        setError(response.message || 'Failed to reschedule appointment');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while rescheduling the appointment');
      console.error('Error rescheduling appointment:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getMinRescheduleDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  // Helper function to format the date and time from the appointment_time field
  const formatAppointmentDateTime = (appointmentTime) => {
    if (!appointmentTime) return { date: 'Not specified', time: 'Not specified' };
    
    const dateObj = new Date(appointmentTime);
    
    // Format date: e.g., "Wednesday, April 23, 2025"
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString(undefined, dateOptions);
    
    // Format time: e.g., "2:00 PM"
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const formattedTime = dateObj.toLocaleTimeString(undefined, timeOptions);
    
    return { date: formattedDate, time: formattedTime };
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
          <span>{error}</span>
        </div>
        <div className="mt-4">
          <Link href="/appointments" className="btn btn-primary">
            Return to Appointments
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Appointment not found</span>
        </div>
        <div className="mt-4">
          <Link href="/appointments" className="btn btn-primary">
            Return to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ChevronLeft size={18} />
        Back
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h1 className="text-2xl font-bold mb-4">Appointment Details</h1>
              
              <div className="flex flex-col gap-4">

                {appointment.appointment_id && (
                  <div className="flex items-center">
                    <span className="badge badge-primary mr-2">Appointment ID</span>
                    <span>{appointment.appointment_id}</span>
                  </div>
                )}
                {appointment.patient_number && (
                  <div className="flex items-center">
                    <span className="badge badge-primary mr-2">Patient ID</span>
                    <span>{appointment.patient_number}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar size={18} className="mr-2 text-primary" />
                  <span>{formatAppointmentDateTime(appointment.appointment_time).date}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock size={18} className="mr-2 text-primary" />
                  <span>{formatAppointmentDateTime(appointment.appointment_time).time}</span>
                </div>
                
                <div className="flex items-center">
                  <User size={18} className="mr-2 text-primary" />
                  <span>{appointment.patient_name}</span>
                </div>
                
                {doctor && (
                  <div className="flex items-center">
                    <User size={18} className="mr-2 text-primary" />
                    <span>Dr. {doctor.name}</span>
                  </div>
                )}
                
                {hospital && (
                  <div className="flex items-center">
                    <MapPin size={18} className="mr-2 text-primary" />
                    <span>{hospital.name}</span>
                  </div>
                )}
                
                {appointment.contact_info && (
                  <div className="flex items-center">
                    <Phone size={18} className="mr-2 text-primary" />
                    <span>{appointment.contact_info}</span>
                  </div>
                )}
                
                {appointment.email && (
                  <div className="flex items-center">
                    <Mail size={18} className="mr-2 text-primary" />
                    <span>{appointment.email}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  className="btn btn-warning"
                  onClick={() => setShowRescheduleModal(true)}
                >
                  Reschedule
                </button>
                <button 
                  className="btn btn-error"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Join virtual appointment button */}
          {appointment.status === 'scheduled' && appointment.type === 'virtual' && (
            <div className="card bg-base-100 shadow-lg mt-6">
              <div className="card-body">
                <h2 className="card-title mb-2 flex items-center gap-2">
                  <Video size={18} />
                  Virtual Appointment
                </h2>
                
                {appointment.virtual_meeting_link ? (
                  <div>
                    <p className="text-sm mb-2">Click the button below to join your appointment:</p>
                    <a 
                      href={appointment.virtual_meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary w-full"
                    >
                      <Video size={16} className="mr-2" />
                      Join Video Appointment
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">
                      The video link for this appointment will be available 10 minutes before the scheduled time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Cancel Appointment Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Cancel Appointment</h3>
            <p className="py-4">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowCancelConfirm(false)}
                disabled={updating}
              >
                No, Keep Appointment
              </button>
              <button 
                className="btn btn-error" 
                onClick={handleCancelAppointment}
                disabled={updating}
              >
                {updating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Yes, Cancel Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reschedule Appointment</h3>
            <form onSubmit={handleRescheduleAppointment}>
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">New Date</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered" 
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={getMinRescheduleDate()}
                  required
                />
              </div>
              
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">New Time</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  required
                >
                  <option value="">Select a time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              
              <div className="alert alert-info mt-4">
                <AlertCircle size={16} />
                <span>
                  Rescheduling may affect your position in the queue. The hospital might contact you to confirm the new appointment time.
                </span>
              </div>
              
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowRescheduleModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetail;