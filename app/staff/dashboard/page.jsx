"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getMyStaffRoles } from '@/services/hospitalStaffService';
import { Clipboard, Heart, Building2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const StaffDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffRoles, setStaffRoles] = useState([]);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchStaffRoles();
    };
    
    checkAuth();
  }, [router]);
  
  const fetchStaffRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getMyStaffRoles();
      
      if (response.success) {
        setStaffRoles(response.roles || []);
        
        // If user has only one role and it's a specific type, redirect to that dashboard
        if (response.roles.length === 1) {
          const role = response.roles[0].role;
          if (role === 'pathologist') {
            router.push('/staff/pathologist/dashboard');
            return;
          } else if (role === 'nurse') {
            router.push('/staff/nurse/dashboard');
            return;
          }
        }
      } else {
        setError('Failed to load your staff roles');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading your staff roles');
      console.error('Error loading staff roles:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleIcon = (role) => {
    switch (role) {
      case 'pathologist':
        return <Clipboard size={24} className="text-indigo-500" />;
      case 'nurse':
        return <Heart size={24} className="text-pink-500" />;
      default:
        return <Building2 size={24} />;
    }
  };
  
  const getRoleDescription = (role) => {
    switch (role) {
      case 'pathologist':
        return 'Process and submit test results for patients';
      case 'nurse':
        return 'Assist with patient care and appointments';
      default:
        return 'General hospital staff duties';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (staffRoles.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <AlertCircle size={18} />
          <span>You don't have any staff roles assigned. Please contact your hospital administrator.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Staff Dashboard</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffRoles.map((staffRole) => (
          <div key={staffRole.hospital_staff_id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title">
                  {staffRole.hospital_name}
                </h2>
                {getRoleIcon(staffRole.role)}
              </div>
              
              <div className="py-4">
                <div className="badge badge-lg">{staffRole.role.charAt(0).toUpperCase() + staffRole.role.slice(1)}</div>
                <p className="mt-3 text-gray-600">{getRoleDescription(staffRole.role)}</p>
              </div>
              
              <div className="card-actions justify-end mt-4">
                {staffRole.role === 'pathologist' && (
                  <Link href="/staff/pathologist/dashboard" className="btn btn-primary">
                    Go to Pathologist Dashboard
                  </Link>
                )}
                {staffRole.role === 'nurse' && (
                  <Link href="/staff/nurse/dashboard" className="btn btn-primary">
                    Go to Nurse Dashboard
                  </Link>
                )}
                {staffRole.role === 'other' && (
                  <Link href={`/hospitals/${staffRole.hospital_id}`} className="btn btn-primary">
                    View Hospital
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffDashboard;
