"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPendingDoctors, verifyDoctor } from '@/services/doctorService';
import { isAuthenticated, isAdmin } from '@/services/authService';
import { CheckCircle, XCircle, FileText, User, Calendar, Award, ArrowLeft } from 'lucide-react';

const DoctorVerification = () => {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      if (!isAdmin()) {
        router.push('/unauthorized');
        return;
      }
      
      await fetchPendingDoctors();
    };
    
    checkAccess();
  }, [router]);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPendingDoctors();
      
      if (response.success) {
        setDoctors(response.doctors || []);
      } else {
        setError(response.message || 'Failed to load pending verifications');
      }
    } catch (err) {
      setError('Failed to load pending verifications');
      console.error('Error loading pending doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId, status) => {
    try {
      setProcessingId(doctorId);
      setError(null);
      
      const response = await verifyDoctor(doctorId, status);
      
      if (response.success) {
        // Remove the doctor from the list
        setDoctors(doctors.filter(doc => doc.doctor_id !== doctorId));
        setSuccessMessage(`Doctor ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.message || 'Failed to update verification status');
      }
    } catch (err) {
      setError('Failed to update verification status');
      console.error('Error verifying doctor:', err);
    } finally {
      setProcessingId(null);
      setViewingDoctor(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Doctor Verification Requests</h1>
        <button 
          onClick={() => router.push('/admin')}
          className="btn btn-outline mt-2 md:mt-0"
        >
            <ArrowLeft size={18} />
          Back to Admin Dashboard
        </button>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success mb-6">
          <span>{successMessage}</span>
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => setSuccessMessage('')}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {doctors.length === 0 ? (
        <div className="alert alert-info">
          <span>No pending doctor verification requests.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Specialties</th>
                <th>Certificate</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doctor => (
                <tr key={doctor.doctor_id}>
                  <td>{doctor.doctor_id}</td>
                  <td>{doctor.user_name}</td>
                  <td>{doctor.user_email}</td>
                  <td>
                    {doctor.specialties && doctor.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {doctor.specialties.slice(0, 3).map((specialty, idx) => (
                          <span key={idx} className="badge badge-outline">{specialty}</span>
                        ))}
                        {doctor.specialties.length > 3 && (
                          <span className="badge badge-outline">+{doctor.specialties.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">None specified</span>
                    )}
                  </td>
                  <td>
                    {doctor.certificate_file ? (
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => setViewingDoctor(doctor)}
                      >
                        <FileText size={16} />
                        View Certificate
                      </button>
                    ) : (
                      <span className="text-error">No certificate</span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleVerify(doctor.doctor_id, 'approved')}
                        disabled={processingId === doctor.doctor_id}
                      >
                        {processingId === doctor.doctor_id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                      
                      <button 
                        className="btn btn-sm btn-error"
                        onClick={() => handleVerify(doctor.doctor_id, 'rejected')}
                        disabled={processingId === doctor.doctor_id}
                      >
                        {processingId === doctor.doctor_id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <XCircle size={16} />
                        )}
                        Reject
                      </button>
                      
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => setViewingDoctor(doctor)}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Doctor Details Modal */}
      {viewingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Doctor Verification Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-md flex items-center gap-2">
                    <User size={18} /> Personal Information
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {viewingDoctor.user_name}</p>
                    <p><strong>Email:</strong> {viewingDoctor.user_email}</p>
                    <p><strong>Doctor ID:</strong> {viewingDoctor.doctor_id}</p>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-md flex items-center gap-2">
                    <Award size={18} /> Professional Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <strong>Specialties:</strong>
                      {viewingDoctor.specialties && viewingDoctor.specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewingDoctor.specialties.map((specialty, idx) => (
                            <span key={idx} className="badge badge-outline">{specialty}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 block mt-1">None specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Certificate Details */}
            <div className="card bg-base-200 mt-4">
              <div className="card-body">
                <h3 className="card-title text-md flex items-center gap-2">
                  <FileText size={18} /> Certificate Information
                </h3>
                
                {viewingDoctor.certificate_file ? (
                  <div className="space-y-2">
                    <p>
                      <strong>Certificate File:</strong>
                      <a 
                        href={viewingDoctor.certificate_file} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="link link-primary ml-2"
                      >
                        View Certificate
                      </a>
                    </p>
                    
                    {viewingDoctor.certificate_details && Object.keys(viewingDoctor.certificate_details).length > 0 && (
                      <div>
                        <strong>Certificate Details:</strong>
                        <ul className="list-disc pl-5 mt-1">
                          {Object.entries(viewingDoctor.certificate_details).map(([key, value]) => (
                            <li key={key}><strong>{key}:</strong> {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <span>No certificate file provided.</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button 
                className="btn btn-ghost" 
                onClick={() => setViewingDoctor(null)}
              >
                Close
              </button>
              
              <div className="flex gap-2">
                <button 
                  className="btn btn-error"
                  onClick={() => handleVerify(viewingDoctor.doctor_id, 'rejected')}
                  disabled={processingId === viewingDoctor.doctor_id}
                >
                  {processingId === viewingDoctor.doctor_id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <XCircle size={18} />
                  )}
                  Reject
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={() => handleVerify(viewingDoctor.doctor_id, 'approved')}
                  disabled={processingId === viewingDoctor.doctor_id}
                >
                  {processingId === viewingDoctor.doctor_id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorVerification;
