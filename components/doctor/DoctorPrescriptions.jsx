"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getDoctorPrescriptions } from '@/services/doctorDashboardService';
import { FileText, Filter, Search, ArrowLeft, Clock } from 'lucide-react';

const DoctorPrescriptions = () => {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchPrescriptions();
  }, [router, page]);
  
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await getDoctorPrescriptions(limit, offset);
      
      if (response.success) {
        if (page === 1) {
          setPrescriptions(response.prescriptions || []);
        } else {
          setPrescriptions(prev => [...prev, ...(response.prescriptions || [])]);
        }
        
        // Check if there might be more prescriptions to load
        setHasMore(response.prescriptions && response.prescriptions.length === limit);
      } else {
        setError('Failed to load prescriptions');
      }
    } catch (err) {
      setError('An error occurred while fetching prescriptions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    try {
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (error) {
      return '';
    }
  };
  
  const filteredPrescriptions = searchQuery 
    ? prescriptions.filter(prescription => 
        prescription.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prescriptions;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/doctor')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Prescriptions</h1>
        
        <div className="w-full md:w-auto">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search by patient name..."
              className="input input-bordered"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="btn btn-square">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}
      
      {loading && page === 1 ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium">No prescriptions found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery 
              ? 'No prescriptions match your search query' 
              : 'You haven\'t created any prescriptions yet'}
          </p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-md overflow-x-auto">
          <div className="card-body p-0">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Medications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.prescription_id}>
                    <td>
                      <div className="flex flex-col">
                        <span>{formatDate(prescription.prescribed_date)}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {formatTime(prescription.prescribed_date)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{prescription.patient_name}</div>
                      <div className="text-xs">ID: {prescription.patient_id}</div>
                    </td>
                    <td>
                      {prescription.medication_details ? (
                        <div className="max-w-xs truncate">
                          {Array.isArray(prescription.medication_details) 
                            ? prescription.medication_details.map(med => med.name || 'Unnamed').join(', ')
                            : Object.keys(prescription.medication_details).join(', ')}
                        </div>
                      ) : (
                        <span className="text-gray-500">No medication details</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => router.push(`/doctor/patients/${prescription.patient_id}`)}
                        >
                          View Patient
                        </button>
                        {prescription.appointment_id && (
                          <button
                            className="btn btn-sm btn-outline btn-secondary"
                            onClick={() => router.push(`/doctor/appointments/${prescription.appointment_id}`)}
                          >
                            View Appointment
                          </button>
                        )}
                        {prescription.prescription_file && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => window.open(prescription.prescription_file, '_blank')}
                          >
                            <FileText size={16} />
                            View File
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {loading && page > 1 && (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}
            
            {hasMore && !loading && (
              <div className="flex justify-center py-4">
                <button 
                  className="btn btn-outline"
                  onClick={() => setPage(page + 1)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptions;
