"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HospitalManagement from '@/components/hospitals/HospitalManagement';
import { getHospitalById } from '@/services/hospitalService';
import { isAuthenticated } from '@/services/authService';
import { ArrowLeft } from 'lucide-react';


export default function ManageHospitalPage({ params }) {
  // Unwrap params using React.use() before accessing properties
  const unwrappedParams = React.use(params);
  const hospitalId = unwrappedParams.id;
  const router = useRouter();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      // Instead of using toast, set an error message
      setError('You must be logged in to access this page');
      router.push('/login');
      return;
    }

    const fetchHospitalData = async () => {
      try {
        const data = await getHospitalById(hospitalId);
        setHospital(data.hospital);
      } catch (error) {
        console.error('Error fetching hospital:', error);
        setError('Failed to load hospital details');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [hospitalId, router]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getHospitalById(hospitalId);
      setHospital(data.hospital);
    } catch (error) {
      console.error('Error refreshing hospital data:', error);
      setError('Failed to refresh hospital data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
        <button 
          onClick={() => router.push('/hospitals')} 
          className="btn btn-primary"
        >
          Back to Hospitals
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
      <Link href={`/hospitals/${hospitalId}`} className="btn btn-outline">
          <ArrowLeft size={18} />
            Back to Hospital
          </Link>
      </div>
      
      <div className="bg-base-100 p-6 rounded-lg shadow-md">
        <HospitalManagement 
          hospital={hospital} 
          refreshData={refreshData} 
        />
      </div>
    </div>
  );
}
