"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/services/authService';
import { getPendingTests } from '@/services/hospitalStaffService';
import TestResultForm from '@/components/staff/TestResultForm';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const TestResultSubmissionPage = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentService, setAppointmentService] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchAppointmentService();
    };
    
    checkAuth();
  }, [params.id, router]);
  
  const fetchAppointmentService = async () => {
    try {
      setLoading(true);
      
      // Get all pending tests and filter for the one we need
      const response = await getPendingTests(100, 0);
      
      if (response.success) {
        const appointmentServiceId = parseInt(params.id);
        const service = response.tests.find(
          test => test.appointment_service_id === appointmentServiceId
        );
        
        if (service) {
          setAppointmentService(service);
        } else {
          setError('Appointment service not found or already has a test result');
        }
      } else {
        setError('Failed to load appointment service');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading data');
      console.error('Error loading appointment service:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccess = () => {
    // Wait a bit before redirecting
    setTimeout(() => {
      router.push('/staff/pathologist/tests');
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
          <Link href="/staff/pathologist/tests" className="btn btn-outline">
            <ArrowLeft size={18} /> Back to Tests
          </Link>
        </div>
      </div>
    );
  }
  
  if (!appointmentService) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Test not found or already has a result</span>
        </div>
        <div className="mt-4">
          <Link href="/staff/pathologist/tests" className="btn btn-outline">
            <ArrowLeft size={18} /> Back to Tests
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/staff/pathologist/tests" className="btn btn-outline btn-sm">
          <ArrowLeft size={18} /> Back to Tests
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Submit Test Result</h1>
      
      <TestResultForm 
        appointmentService={appointmentService} 
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default TestResultSubmissionPage;
