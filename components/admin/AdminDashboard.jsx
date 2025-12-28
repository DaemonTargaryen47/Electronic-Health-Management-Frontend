"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSystemStats } from '@/services/adminService';
import { isAuthenticated, isAdmin, isSynapAIAdmin, refreshAdminStatus, getCurrentUser } from '@/services/authService';
import { 
  Users, HospitalIcon, ClipboardList, Activity, Shield, CreditCard, 
  Brain, AlertTriangle, FileText, MessageSquare, Search, UserCheck, StethoscopeIcon
} from 'lucide-react';

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminCheckFailed, setAdminCheckFailed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Check authentication first
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      // First perform quick local check
      const syncAdminCheck = isAdmin();
      
      if (syncAdminCheck) {
        // If local check passes, fetch stats immediately
        await fetchSystemStats();
        return;
      }
      
      // Otherwise try async check (with cached results if available)
      try {
        const adminStatus = await isSynapAIAdmin();
        
        if (adminStatus) {
          await fetchSystemStats();
          return;
        }
        
        // If both local and cached check fail, do one final server check
        // but only if we haven't received a definitive no yet
        const refreshResult = await refreshAdminStatus();
        
        if (refreshResult) {
          await fetchSystemStats();
          return;
        }
        
        // If we get here, user is definitely not an admin
        router.push('/unauthorized');
      } catch (err) {
        console.error("Error checking admin status:", err);
        router.push('/unauthorized');
      }
    };
    
    checkAccess();
  }, [router]);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const response = await getSystemStats();
      
      if (response.success) {
        console.log("Stats received in component:", response.stats);
        setStats(response.stats || {});
      } else {
        setError('Failed to load system statistics');
      }
    } catch (err) {
      setError('An error occurred while fetching system data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">System Administration Dashboard</h1>
      
      {/* Debug information during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <details>
            <summary className="cursor-pointer font-semibold">Debug: Available Stats Keys</summary>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(Object.keys(stats), null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {/* Alert for pending doctor verifications */}
      {stats?.pending_doctors > 0 && (
        <div className="alert alert-warning mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <StethoscopeIcon size={20} />
            <span>
              <strong>{stats.pending_doctors}</strong> doctor verification requests pending review
            </span>
          </div>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => router.push('/admin/doctor-verification')}
          >
            Review Requests
          </button>
        </div>
      )}
      
      {/* Main Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Users</div>
            <div className="stat-value text-primary">{stats?.total_users ?? 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <HospitalIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">Hospitals</div>
            <div className="stat-value text-secondary">{stats?.total_hospitals ?? 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-accent">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div className="stat-title">Appointments</div>
            <div className="stat-value text-accent">{stats?.total_appointments ?? 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-info">
              <Shield className="w-8 h-8" />
            </div>
            <div className="stat-title">System Admins</div>
            <div className="stat-value text-info">{stats?.total_admins ?? 0}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User & Doctor Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">User Statistics</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-lg">Patients:</span>
                <span className="badge badge-lg">{stats?.total_patients ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Doctors:</span>
                <span className="badge badge-lg">{stats?.total_doctors ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Verified Doctors:</span>
                <span className="badge badge-lg badge-success">{stats?.verified_doctors ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Pending Verification:</span>
                <div className="flex items-center gap-2">
                  <span className="badge badge-lg badge-warning">{stats?.pending_doctors ?? 0}</span>
                  {stats?.pending_doctors > 0 && (
                    <button 
                      className="btn btn-xs btn-primary"
                      onClick={() => router.push('/admin/doctor-verification')}
                    >
                      <UserCheck size={12} />
                      Verify
                    </button>
                  )}
                </div>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg">MFA Adoption:</span>
                <div className="flex items-center gap-2">
                  <progress 
                    className="progress progress-success" 
                    value={stats?.mfa_adoption_percentage ?? 0} 
                    max="100"
                  ></progress>
                  <span className="badge badge-lg badge-success">{stats?.mfa_adoption_percentage ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Appointment Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">Appointment Statistics</h2>
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Scheduled</div>
                <div className="stat-value text-primary">{stats?.scheduled_appointments ?? 0}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Completed</div>
                <div className="stat-value text-success">{stats?.completed_appointments ?? 0}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Canceled</div>
                <div className="stat-value text-error">{stats?.canceled_appointments ?? 0}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mt-3">
                <span className="text-lg">Virtual Appointments:</span>
                <span className="badge badge-lg badge-info">{stats?.virtual_appointments ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Hospital Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4"><HospitalIcon size={20} /> Hospital Info</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span>Total Hospitals:</span>
                <span className="badge badge-lg">{stats?.total_hospitals ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Advertised:</span>
                <span className="badge badge-lg badge-primary">{stats?.advertised_hospitals ?? 0}</span>
              </div>
              <div className="radial-progress text-primary mx-auto my-3" style={{"--value": stats?.total_hospitals ? (stats?.advertised_hospitals / stats?.total_hospitals) * 100 : 0}}>
                {stats?.total_hospitals ? Math.round((stats?.advertised_hospitals / stats?.total_hospitals) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4"><CreditCard size={20} /> Payment Stats</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span>Total Payments:</span>
                <span className="badge badge-lg">{stats?.total_payments ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Successful:</span>
                <span className="badge badge-lg badge-success">{stats?.successful_payments ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending:</span>
                <span className="badge badge-lg badge-warning">{stats?.pending_payments ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Failed:</span>
                <span className="badge badge-lg badge-error">{stats?.failed_payments ?? 0}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span>Total Revenue:</span>
                <span className="text-lg font-semibold">
                  ${typeof stats?.total_revenue === 'number' ? stats.total_revenue.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Emergency Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4"><AlertTriangle size={20} /> Emergency Requests</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span>Total Requests:</span>
                <span className="badge badge-lg">{stats?.total_emergency_requests ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending:</span>
                <span className="badge badge-lg badge-warning">{stats?.pending_emergencies ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Responded:</span>
                <span className="badge badge-lg badge-info">{stats?.responded_emergencies ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Resolved:</span>
                <span className="badge badge-lg badge-success">{stats?.resolved_emergencies ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* AI Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4"><Brain size={20} /> AI System Activity</h2>
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Total Interactions</div>
                <div className="stat-value">{stats?.total_ai_interactions ?? 0}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Medical Record Chats</div>
                <div className="stat-value text-secondary">{stats?.medical_record_ai_chats ?? 0}</div>
              </div>
              <div className="stat">
                <div className="stat-title">General Chats</div>
                <div className="stat-value text-primary">{stats?.general_ai_chats ?? 0}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg">AI-Analyzed Medical Records:</span>
              <span className="badge badge-lg badge-secondary">{stats?.ai_analyzed_records ?? 0}</span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span>AI Usage Distribution:</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-primary">General</span>
                <progress 
                  className="progress progress-primary flex-grow" 
                  value={stats?.general_ai_chats ?? 0} 
                  max={(stats?.general_ai_chats ?? 0) + (stats?.medical_record_ai_chats ?? 0)}
                ></progress>
                <span className="text-secondary">Medical</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Medical Records Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4"><FileText size={20} /> Medical Records</h2>
            
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Total Records</div>
                <div className="stat-value">{stats?.total_medical_records ?? 0}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span>Lab Results:</span>
                  <span className="badge badge-lg">{stats?.lab_results ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Progress Notes:</span>
                  <span className="badge badge-lg">{stats?.progress_notes ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Prescriptions:</span>
                  <span className="badge badge-lg">{stats?.prescriptions ?? 0}</span>
                </div>
              </div>
            </div>
            
            <div className="divider">Record Types</div>
            
            {/* Pie chart representation using tailwind */}
            <div className="flex justify-around mt-2">
              {[
                { name: 'Lab', value: stats?.lab_results ?? 0, color: 'bg-blue-500' },
                { name: 'Notes', value: stats?.progress_notes ?? 0, color: 'bg-green-500' },
                { name: 'Rx', value: stats?.prescriptions ?? 0, color: 'bg-yellow-500' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-4 h-4 ${item.color} rounded-full mb-1`}></div>
                  <div className="text-xs">{item.name}</div>
                  <div className="font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Communication Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4"><MessageSquare size={20} /> Communication</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-lg">Doctor-Patient Messages:</span>
                <span className="badge badge-lg badge-primary">{stats?.doctor_patient_messages ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Search Queries:</span>
                <span className="badge badge-lg">{stats?.total_searches ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Administrative Actions */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Administrative Actions</h2>
            <div className="flex flex-col gap-3">
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/admin/users')}
              >
                <Users size={18} />
                Manage Users
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/admin/hospitals')}
              >
                <HospitalIcon size={18} />
                Manage Hospitals
              </button>
              
              <button 
                className="btn btn-accent"
                onClick={() => router.push('/admin/appointments')}
              >
                <ClipboardList size={18} />
                Manage Appointments
              </button>
              
              <button 
                className="btn btn-warning"
                onClick={() => router.push('/admin/doctor-verification')}
              >
                <StethoscopeIcon size={18} className="mr-1" />
                Doctor Verification
                {stats?.pending_doctors > 0 && (
                  <div className="badge badge-sm badge-error ml-2">{stats?.pending_doctors}</div>
                )}
              </button>
              
              <button 
                className="btn btn-info"
                onClick={() => router.push('/admin/system-admins')}
              >
                <Shield size={18} />
                Manage System Admins
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
