"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/services/authService';
import { getHospitalById } from '@/services/hospitalService';
import HospitalStaffManagement from '@/components/hospitals/HospitalStaffManagement';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const HospitalStaffPage = ({ params }) => {
  const router = useRouter();
  const hospitalId = params.id;
  
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchHospital();
    };
    
    checkAuth();
  }, [hospitalId, router]);
  
  const fetchHospital = async () => {
    try {
      setLoading(true);
      const response = await getHospitalById(hospitalId);
      
      if (response.success) {
        setHospital(response.hospital);
      } else {
        setError('Failed to load hospital information');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading hospital');
      console.error('Error loading hospital:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshData = async () => {
    await fetchHospital();
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
        <div className="alert alert-error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-outline">
          <ArrowLeft size={18} />
          Back to Hospital Management
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-outline">
          <ArrowLeft size={18} />
          Back to Hospital Management
        </Link>
      </div>
      
      <div>
        <HospitalStaffManagement hospitalId={hospitalId} />
      </div>
    </div>
  );
};

export default HospitalStaffPage;
