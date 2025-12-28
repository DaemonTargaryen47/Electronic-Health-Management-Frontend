"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getCurrentUserProfile } from '@/services/profileService';
import { getCompleteProfile } from '@/services/healthService';
import AppointmentsWidget from '@/components/dashboard/AppointmentsWidget';
import { User, Settings, Building2, StethoscopeIcon, MessageSquare, Calendar, Heart, AlertCircle, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get complete user profile including health info
      const response = await getCompleteProfile();
      
      if (response.success) {
        setUser(response.user);
        setHealthInfo(response.health_info);
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      
      // Fallback to basic profile if complete profile fails
      try {
        const basicResponse = await getCurrentUserProfile();
        if (basicResponse.success && basicResponse.user) {
          setUser(basicResponse.user);
        } else {
          setError('Failed to load user profile');
        }
      } catch (fallbackErr) {
        console.error('Error in fallback profile load:', fallbackErr);
        setError('Error loading user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    // Listen for login events to refresh data
    const handleLoginEvent = () => {
      fetchUserData();
    };
    
    window.addEventListener('userLoggedIn', handleLoginEvent);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleLoginEvent);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name || 'User'}</p>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          {/* User profile card */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-16">
                    <span className="text-xl">{user?.name?.charAt(0) || 'U'}</span>
                  </div>
                </div>
                
                <div>
                  <h2 className="card-title">{user?.name}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push('/profile')}
                >
                  <User size={16} className="mr-1" />
                  Profile
                </button>
                
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => router.push('/profile/settings')}
                >
                  <Settings size={16} className="mr-1" />
                  Settings
                </button>
              </div>
            </div>
          </div>
          
          {/* Health Information Card */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Heart className="text-error" size={20} />
                Health Information
              </h2>
              
              {healthInfo ? (
                <div className="space-y-3">
                  {healthInfo.blood_group && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Blood Group:</span>
                      <span className="badge badge-primary">{healthInfo.blood_group}</span>
                    </div>
                  )}
                  
                  {healthInfo.allergies && (
                    <div>
                      <span className="text-sm font-medium">Allergies:</span>
                      <p className="text-sm mt-1 text-gray-600 line-clamp-2">{healthInfo.allergies}</p>
                    </div>
                  )}
                  
                  {healthInfo.details?.emergency_contact && (
                    <div>
                      <span className="text-sm font-medium">Emergency Contact:</span>
                      <p className="text-sm mt-1 text-gray-600">{healthInfo.details.emergency_contact}</p>
                    </div>
                  )}
                  
                  <div className="divider my-1"></div>
                  
                  <div className="card-actions">
                    <Link href="/profile#health" className="btn btn-sm btn-outline w-full">
                      View Complete Health Info
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-4">
                    <Activity size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-center text-gray-500">No health information added yet</p>
                  <div className="card-actions">
                    <Link href="/profile" className="btn btn-sm btn-primary w-full">
                      Add Health Information
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick links */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Quick Links</h2>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/doctors" className="btn btn-outline justify-start">
                  <StethoscopeIcon size={16} className="mr-2" />
                  Find Doctors
                </Link>
                <Link href="/appointments/new" className="btn btn-outline justify-start">
                  <Calendar size={16} className="mr-2" />
                  Book Appointment
                </Link>
                <Link href="/hospitals" className="btn btn-outline justify-start">
                  <Building2 size={16} className="mr-2" />
                  Find Hospitals
                </Link>
                <Link href="/chats" className="btn btn-outline justify-start">
                  <MessageSquare size={16} className="mr-2" />
                  Messages
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Appointments widget */}
          <AppointmentsWidget />
          
          {/* Health Alert - Show if critical health info exists */}
          {(healthInfo?.allergies || healthInfo?.drug_reactions || healthInfo?.complexities) && (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                  <AlertCircle size={20} className="text-warning" />
                  Health Alerts
                </h2>
                <div className="space-y-3">
                  {healthInfo.allergies && (
                    <div className="alert alert-warning">
                      <div>
                        <h3 className="font-bold">Allergies</h3>
                        <div className="text-sm">{healthInfo.allergies}</div>
                      </div>
                    </div>
                  )}
                  
                  {healthInfo.drug_reactions && (
                    <div className="alert alert-warning">
                      <div>
                        <h3 className="font-bold">Drug Reactions</h3>
                        <div className="text-sm">{healthInfo.drug_reactions}</div>
                      </div>
                    </div>
                  )}
                  
                  {healthInfo.complexities && (
                    <div className="alert alert-warning">
                      <div>
                        <h3 className="font-bold">Medical Complexities</h3>
                        <div className="text-sm">{healthInfo.complexities}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-actions justify-end mt-2">
                  <Link href="/profile" className="btn btn-sm">
                    Manage Health Information
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
