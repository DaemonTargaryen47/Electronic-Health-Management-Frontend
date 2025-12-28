"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAppointmentById } from '@/services/appointmentService';
import { isAuthenticated } from '@/services/authService';
import PaymentForm from '@/components/appointments/PaymentForm';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentPaymentPage({ params }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        const response = await getAppointmentById(params.id);
        
        if (response.success) {
          setAppointment(response.appointment);
          
          // Check if appointment already paid
          if (response.appointment.fee_details?.payment_status === 'paid') {
            setError('This appointment has already been paid for');
          }
        } else {
          setError('Failed to fetch appointment details');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching appointment details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointmentDetails();
  }, [params.id, router]);
  
  const handlePaymentSuccess = (paymentResponse) => {
    // Redirect to appointment details page after successful payment
    setTimeout(() => {
      router.push(`/appointments/${params.id}`);
    }, 2000);
  };
  
  const calculateTotalAmount = () => {
    let total = 0;
    
    // Add consultation fee
    if (appointment.fee_details?.amount) {
      total += parseFloat(appointment.fee_details.amount);
    }
    
    // Add service costs
    if (appointment.services && appointment.services.length > 0) {
      appointment.services.forEach(service => {
        const price = parseFloat(service.service_price || 0);
        const quantity = parseInt(service.quantity || 1);
        total += price * quantity;
      });
    }
    
    return total;
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
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
        <div className="mt-4">
          <Link href={`/appointments/${params.id}`} className="btn btn-outline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Appointment
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
          <Link href="/appointments" className="btn btn-outline flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link 
        href={`/appointments/${params.id}`} 
        className="btn btn-outline btn-sm mb-4 flex items-center gap-2 w-fit"
      >
        <ArrowLeft size={18} />
        Back to Appointment
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Payment for Appointment</h1>
      
      <div className="card bg-base-100 shadow-lg mb-8">
        <div className="card-body">
          <h2 className="card-title text-lg">Appointment Summary</h2>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-gray-600">Hospital:</p>
              <p className="font-medium">{appointment.hospital_name}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Date & Time:</p>
              <p className="font-medium">
                {new Date(appointment.appointment_time).toLocaleString()}
              </p>
            </div>
            
            {appointment.doctor_name && (
              <div>
                <p className="text-gray-600">Doctor:</p>
                <p className="font-medium">Dr. {appointment.doctor_name}</p>
              </div>
            )}
            
            <div>
              <p className="text-gray-600">Appointment Type:</p>
              <p className="font-medium capitalize">{appointment.type}</p>
            </div>
          </div>
          
          <div className="divider">Payment Details</div>
          
          <div>
            {/* Show consultation fee */}
            {appointment.fee_details && appointment.fee_details.amount && (
              <div className="flex justify-between items-center mb-2">
                <span>Consultation Fee ({appointment.fee_details.service_type}):</span>
                <span>${parseFloat(appointment.fee_details.amount).toFixed(2)}</span>
              </div>
            )}
            
            {/* Show services */}
            {appointment.services && appointment.services.length > 0 && (
              <div className="mb-2">
                <p className="font-medium mb-1">Additional Services:</p>
                {appointment.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center pl-4 py-1">
                    <span>
                      {service.service_name} 
                      {service.quantity > 1 ? ` x${service.quantity}` : ''}
                    </span>
                    <span>
                      ${(parseFloat(service.service_price || service.price || 0) * (service.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="divider my-2"></div>
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span>${calculateTotalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Enter Payment Information</h2>
          
          <PaymentForm
            appointmentId={appointment.appointment_id}
            amount={calculateTotalAmount()}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    </div>
  );
}
