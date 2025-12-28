"use client";

import React, { use } from 'react';
import HospitalDoctors from '@/components/hospitals/HospitalDoctors';
import { isAuthenticated } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HospitalDoctorsPage({ params }) {
  const router = useRouter();
  // Use React.use() to unwrap the params Promise
  const hospitalId = React.use(params).id;
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // We'll let the component handle hospital admin checks
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!authorized) {
    return null; // Will redirect in useEffect
  }

  return <HospitalDoctors hospitalId={hospitalId} />;
}
