"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getServicePaymentDetails } from '@/services/paymentService';
import { isAuthenticated } from '@/services/authService';
import ServicePaymentForm from '@/components/appointments/ServicePaymentForm';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ServicePaymentPage({ params }) {
  const router = useRouter();
  const serviceId = params.id;
  
  const [appointment, setAppointment] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching service details for ID:', serviceId);
        
        // Ensure serviceId is parsed as integer to avoid type mismatches
        const parsedServiceId = parseInt(serviceId);
        
        if (isNaN(parsedServiceId)) {
          throw new Error('Invalid service ID provided');
        }
        
        // Get the service payment details
        const response = await getServicePaymentDetails(parsedServiceId);
        console.log('Service payment API response:', response);
        
        if (response.success && response.service) {
          // Set both service and appointment from the response
          setService(response.service);
          // Make sure we have valid appointment data
          if (response.appointment && response.appointment.appointment_id) {
            setAppointment(response.appointment);
          } else {
            // Create a minimal appointment object if necessary
            setAppointment({
              appointment_id: response.service.appointment_id,
              hospital_name: response.service.hospital_name || 'Hospital'
            });
          }
          
          // Check if payment already made
          if (response.service.payment_status === 'paid' || response.service.is_paid === true) {
            setError('This service has already been paid for');
          }
        } else {
          setError(response.message || 'Failed to fetch service details');
          console.error('API Error:', response);
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching service details');
        console.error('Error fetching service details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [serviceId, router]);
  
  const handlePaymentSuccess = (paymentResponse) => {
    // Redirect to appointment details page after successful payment
    setTimeout(() => {
      router.push(`/appointments/${service?.appointment_id || appointment?.appointment_id}`);
    }, 2000);
  };
  
  // Parse price as float and handle null/undefined values
  const getServicePrice = () => {
    const price = service?.price || service?.service_price || "0";
    return typeof price === 'string' ? parseFloat(price) : price || 0;
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
          {appointment && appointment.appointment_id ? (
            <Link 
              href={`/appointments/${appointment.appointment_id}`}
              className="btn btn-outline"
            >
              Back to Appointment
            </Link>
          ) : (
            <Link href="/appointments" className="btn btn-outline">
              Back to Appointments
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Service not found</span>
        </div>
        <div className="mt-4">
          <Link href="/appointments" className="btn btn-outline">
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link 
        href={`/appointments/${service.appointment_id || appointment?.appointment_id}`} 
        className="btn btn-outline btn-sm mb-4 flex items-center gap-2 w-fit"
      >
        <ArrowLeft size={18} />
        Back to Appointment
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Service Payment</h1>
      
      <div className="card bg-base-100 shadow-lg mb-8">
        <div className="card-body">
          <h2 className="card-title text-lg">Service Details</h2>
          
          <div className="mt-2">
            <div>
              <p className="text-gray-600">Service Name:</p>
              <p className="font-medium">{service.service_name}</p>
            </div>
            
            {service.service_description && (
              <div className="mt-2">
                <p className="text-gray-600">Description:</p>
                <p className="font-medium">{service.service_description}</p>
              </div>
            )}
            
            <div className="mt-2">
              <p className="text-gray-600">Hospital:</p>
              <p className="font-medium">{service.hospital_name || appointment?.hospital_name}</p>
            </div>
            
            <div className="mt-2">
              <p className="text-gray-600">Quantity:</p>
              <p className="font-medium">{service.quantity || 1}</p>
            </div>
            
            <div className="mt-2">
              <p className="text-gray-600">Price:</p>
              <p className="font-medium">${getServicePrice().toFixed(2)}</p>
            </div>
            
            <div className="divider my-2"></div>
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span>${(getServicePrice() * (service.quantity || 1)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Enter Payment Information</h2>
          
          <ServicePaymentForm
            appointmentServiceId={service.appointment_service_id}
            serviceName={service.service_name}
            amount={getServicePrice() * (service.quantity || 1)}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    </div>
  );
}
