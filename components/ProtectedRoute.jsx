"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '../services/authService';
import { isTokenExpired } from '../utils/authUtils';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated() || isTokenExpired()) {
      // Redirect to login page if not authenticated or token expired
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Render children only if authenticated
  return children;
}
