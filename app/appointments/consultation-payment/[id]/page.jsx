"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { getAppointmentById } from '@/services/appointmentService';
import { isAuthenticated } from '@/services/authService';
import PaymentForm from '@/components/appointments/PaymentForm';

export default function ConsultationPaymentPage({ params }) {
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
          
          // Check payment via multiple methods and force redirect if any payment is found
          const isPaid = 
            response.appointment.fee_details?.payment_status === 'paid' || 
            response.appointment.is_paid === 1 ||
            (response.appointment.payment_history && 
             response.appointment.payment_history.some(payment => payment.status === 'completed'));
          
          if (isPaid) {
            setError('This fee has already been paid');
            console.log('Payment found, redirecting...');
            router.push(`/appointments/${params.id}`);
            return;
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
  
  if (!appointment || !appointment.fee_details) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Consultation fee information not found</span>
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
      
      <h1 className="text-2xl font-bold mb-6">Payment for Consultation</h1>
      
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
              <p className="text-gray-600">Consultation Type:</p>
              <p className="font-medium capitalize">{appointment.fee_details.service_type}</p>
            </div>
          </div>
          
          <div className="divider">Payment Details</div>
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Consultation Fee:</span>
            <span>${parseFloat(appointment.fee_details.amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Enter Payment Information</h2>
          
          <PaymentForm
            appointmentId={appointment.appointment_id}
            amount={parseFloat(appointment.fee_details.amount)}
            onSuccess={handlePaymentSuccess}
            paymentType="consultation"
          />
        </div>
      </div>
    </div>
  );
}
