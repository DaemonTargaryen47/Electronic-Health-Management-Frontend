"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getPathologistDashboard, getPendingTests,
  getMyHospitals, getMyStaffRoles
} from '@/services/hospitalStaffService';
import { isAuthenticated } from '@/services/authService';
import { 
  AlertCircle, Clipboard, CheckCircle, FlaskConical, 
  Calendar, Activity, Building2, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

const PathologistDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [pendingTests, setPendingTests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [staffRoles, setStaffRoles] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchDashboardData();
    };
    
    checkAuth();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pathologist dashboard data
      const dashboardResponse = await getPathologistDashboard();
      
      if (dashboardResponse.success) {
        setMetrics(dashboardResponse.metrics || {});
        setPendingTests(dashboardResponse.pending_tests || []);
      }
      
      // Fetch hospitals where user is staff
      const hospitalsResponse = await getMyHospitals();
      
      if (hospitalsResponse.success) {
        setHospitals(hospitalsResponse.hospitals || []);
      }
      
      // Fetch user staff roles
      const rolesResponse = await getMyStaffRoles();
      
      if (rolesResponse.success) {
        setStaffRoles(rolesResponse.roles || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading the dashboard');
      console.error('Error loading pathologist dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pathologist Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Clipboard className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Tests</div>
            <div className="stat-value text-primary">{metrics.total_tests || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <FlaskConical className="w-8 h-8" />
            </div>
            <div className="stat-title">Tests Today</div>
            <div className="stat-value text-secondary">{metrics.tests_today || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-accent">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-title">This Week</div>
            <div className="stat-value text-accent">{metrics.tests_this_week || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-info">
              <Activity className="w-8 h-8" />
            </div>
            <div className="stat-title">Pending Tests</div>
            <div className="stat-value text-info">{metrics.pending_tests || 0}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Pending Tests Section */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <FlaskConical size={20} /> Pending Tests
                </h2>
                <Link href="/staff/pathologist/tests" className="btn btn-sm btn-ghost">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              
              {pendingTests.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="mx-auto h-12 w-12 text-success opacity-50" />
                  <h3 className="mt-2 text-lg font-medium">No pending tests</h3>
                  <p className="mt-1 text-gray-500">
                    You have no tests waiting to be processed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Test</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTests.slice(0, 5).map((test) => (
                        <tr key={test.appointment_service_id}>
                          <td>
                            <div className="font-medium">{test.patient_name}</div>
                            <div className="text-sm text-base-content/70">
                              ID: {test.patient_id}
                              {test.patient_number && ` (${test.patient_number})`}
                            </div>
                          </td>
                          <td>{test.service_name}</td>
                          <td>{formatDate(test.appointment_time)}</td>
                          <td>
                            <Link 
                              href={`/staff/pathologist/tests/${test.appointment_service_id}`} 
                              className="btn btn-sm btn-primary"
                            >
                              Submit Result
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {pendingTests.length > 5 && (
                <div className="card-actions justify-end mt-4">
                  <Link href="/staff/pathologist/tests" className="btn btn-primary btn-sm">
                    View All {pendingTests.length} Pending Tests
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Common Tests Stats */}
          <div className="card bg-base-100 shadow-lg mt-6">
            <div className="card-body">
              <h2 className="card-title text-xl">Common Tests</h2>
              
              {metrics.common_tests && metrics.common_tests.length > 0 ? (
                <div className="mt-4">
                  {metrics.common_tests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="font-medium">{test.service_name}</span>
                      <div className="flex items-center">
                        <span className="badge badge-lg">{test.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No test data available yet.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                <Link href="/staff/pathologist/tests" className="btn btn-primary w-full">
                  <Clipboard size={18} /> View Pending Tests
                </Link>
                <Link href="/staff/pathologist/results" className="btn btn-secondary w-full">
                  <FlaskConical size={18} /> Test Results History
                </Link>
              </div>
            </div>
          </div>
          
          {/* Hospital Affiliations */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl">Your Hospitals</h2>
              
              {hospitals.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  You are not affiliated with any hospitals.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {hospitals.map((hospital) => (
                    <div key={hospital.hospital_id} className="border rounded-lg p-4 hover:bg-base-200 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{hospital.name}</h3>
                          <p className="text-sm flex items-center mt-1">
                            <Building2 size={14} className="mr-1" />
                            {hospital.address?.substring(0, 30)}
                            {hospital.address?.length > 30 ? '...' : ''}
                          </p>
                        </div>
                        <Link href={`/hospitals/${hospital.hospital_id}`} className="btn btn-ghost btn-xs">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathologistDashboard;
