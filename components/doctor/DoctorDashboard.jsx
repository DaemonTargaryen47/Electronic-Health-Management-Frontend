"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getDashboardSummary } from '@/services/doctorDashboardService';
import { 
  Users, Calendar, Activity, CreditCard, FileText, ChevronRight,
  Clock, Percent, PieChart, CheckCircle, XCircle, Stethoscope, MessageSquare
} from 'lucide-react';
import TodayAppointments from './TodayAppointments';
import UpcomingAppointments from './UpcomingAppointments';
import AppointmentChart from './AppointmentChart';
import RecentChatsWidget from './RecentChatsWidget';

const DoctorDashboard = () => {
  const router = useRouter();
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('month');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchDashboardMetrics();
  }, [router]);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await getDashboardSummary();
      console.log('Dashboard summery response:', response);

      if (response.success && response.metrics) {
        setMetrics(response.metrics);
      } else {
        setError('Failed to load dashboard metrics');
      }
    } catch (err) {
      setError('An error occurred while fetching dashboard data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentClick = (appointmentId) => {
    router.push(`/doctor/appointments/${appointmentId}`);
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
      <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-title">Today's Appointments</div>
            <div className="stat-value text-primary">{metrics?.appointments?.today || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Patients</div>
            <div className="stat-value text-secondary">{metrics?.total_patients || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-accent">
              <Clock className="w-8 h-8" />
            </div>
            <div className="stat-title">Upcoming</div>
            <div className="stat-value text-accent">{metrics?.appointments?.upcoming || 0}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-info">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="stat-title">This Month Revenue</div>
            <div className="stat-value text-info">${metrics?.revenue?.this_month?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
      </div>
      
      {/* Second row of stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stats shadow col-span-1">
          <div className="stat">
            <div className="stat-figure text-success">
              <div className="radial-progress text-success" style={{"--value": metrics?.completion_rate || 0, "--thickness": "4px"}}>
                {metrics?.completion_rate || 0}%
              </div>
            </div>
            <div className="stat-title">Completion Rate</div>
            <div className="stat-desc">Appointments successfully completed</div>
            <div className="mt-2 flex items-center">
              <CheckCircle size={16} className="text-success mr-2" /> 
              <span>Completed: {metrics?.appointments?.completed || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="stats shadow col-span-1">
          <div className="stat">
            <div className="stat-figure text-warning">
              <div className="radial-progress text-warning" style={{"--value": metrics?.cancellation_rate || 0, "--thickness": "4px"}}>
                {metrics?.cancellation_rate || 0}%
              </div>
            </div>
            <div className="stat-title">Cancellation Rate</div>
            <div className="stat-desc">Appointments canceled</div>
            <div className="mt-2 flex items-center">
              <XCircle size={16} className="text-error mr-2" />
              <span>Canceled: {metrics?.appointments?.canceled || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="stats shadow col-span-1">
          <div className="stat">
            <div className="stat-figure text-info">
              <div className="radial-progress text-info" style={{"--value": metrics?.virtual_consultation_rate || 0, "--thickness": "4px"}}>
                {metrics?.virtual_consultation_rate || 0}%
              </div>
            </div>
            <div className="stat-title">Virtual Consultations</div>
            <div className="stat-desc">Percentage of virtual appointments</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <Calendar size={20} /> Today's Appointments
                </h2>
                <button 
                  onClick={() => router.push('/doctor/appointments')}
                  className="btn btn-sm btn-ghost"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="mt-4">
                <TodayAppointments onAppointmentClick={handleAppointmentClick} />
              </div>
            </div>
          </div>
          
          {/* Appointments Chart */}
          <div className="card bg-base-100 shadow-md mt-8">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <Activity size={20} /> Appointment Analytics
                </h2>
                <div className="tabs tabs-boxed">
                  <a 
                    className={`tab ${analyticsPeriod === 'month' ? 'tab-active' : ''}`}
                    onClick={() => setAnalyticsPeriod('month')}
                  >
                    Month
                  </a>
                  <a 
                    className={`tab ${analyticsPeriod === 'year' ? 'tab-active' : ''}`}
                    onClick={() => setAnalyticsPeriod('year')}
                  >
                    Year
                  </a>
                </div>
              </div>
              <div className="mt-4 h-80">
                <AppointmentChart period={analyticsPeriod} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => router.push('/doctor/appointments')}
                  className="btn btn-primary w-full"
                >
                  <Calendar size={18} /> Manage Appointments
                </button>
                <button 
                  onClick={() => router.push('/doctor/patients')}
                  className="btn btn-secondary w-full"
                >
                  <Users size={18} /> View Patients
                </button>
                <button 
                  onClick={() => router.push('/doctor/prescriptions')}
                  className="btn btn-accent w-full"
                >
                  <FileText size={18} /> Manage Prescriptions
                </button>
                <button 
                  onClick={() => router.push('/doctor/working-hours')}
                  className="btn btn-info w-full"
                >
                  <Clock size={18} /> Set Working Hours
                </button>
              </div>
            </div>
          </div>
          
          {/* Recent Chats Widget - New Addition */}
          <RecentChatsWidget />
          
          {/* Upcoming Appointments */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <Calendar size={20} /> Upcoming Appointments
                </h2>
                <button 
                  onClick={() => router.push('/doctor/appointments')}
                  className="btn btn-sm btn-ghost"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="mt-4">
                <UpcomingAppointments />
              </div>
            </div>
          </div>
          
          {/* Medical Records Summary */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-xl flex items-center gap-2">
                <FileText size={20} /> Records Summary
              </h2>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span>Prescriptions:</span>
                  <span className="badge badge-primary badge-lg">{metrics?.records?.prescriptions || 0}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Lab Results:</span>
                  <span className="badge badge-secondary badge-lg">{metrics?.records?.lab_results || 0}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Progress Notes:</span>
                  <span className="badge badge-accent badge-lg">{metrics?.records?.progress_notes || 0}</span>
                </div>
                <div className="divider my-2"></div>
                <button 
                  onClick={() => router.push('/doctor/records')}
                  className="btn btn-outline w-full btn-sm mt-1"
                >
                  <FileText size={16} /> View All Medical Records
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
