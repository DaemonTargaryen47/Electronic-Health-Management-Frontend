"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDoctorById } from '@/services/doctorService';
import DoctorPublicProfile from '@/components/doctors/DoctorPublicProfile';

export default function DoctorProfilePage({ params }) {
  const router = useRouter();
  // Use React.use() to unwrap the params Promise
  const doctorId = React.use(params).id;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getDoctorById(doctorId);
        
        if (response.success && response.profile) {
          setDoctor(response.profile);
        } else {
          setError(response.message || 'Failed to load doctor information');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while loading doctor information');
        console.error('Error fetching doctor:', err);
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

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
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        <div className="mt-4">
          <button 
            className="btn btn-primary"
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Doctor not found</span>
        </div>
        <div className="mt-4">
          <button 
            className="btn btn-primary"
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <DoctorPublicProfile doctor={doctor} />;
}
