"use client";

import DoctorVerification from '@/components/admin/DoctorVerification';
import { isAuthenticated, isAdmin } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorVerificationPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      if (!isAdmin()) {
        router.push('/unauthorized');
        return;
      }

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

  return <DoctorVerification />;
}
