'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { 
  getPatientDetails, 
  getPatientHealthInfo 
} from '@/services/doctorDashboardService';
import {
  User,
  Calendar,
  FileText,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Activity,
  Clock,
  Pill,
  ChevronRight,
  BookOpen
} from 'lucide-react';

// Helper functions for date formatting
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

function formatTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Invalid Time';
  }
}

export default function PatientDetailPage({ params }) {
  const router = useRouter();
  const patientId = params.id;
  
  const [patient, setPatient] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthInfoLoading, setHealthInfoLoading] = useState(false);
  const [healthInfoError, setHealthInfoError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchPatientDetails();
  }, [router, patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPatientDetails(patientId);
      
      if (response.success) {
        setPatient(response.patient);
        // Fetch health information after basic details are loaded
        fetchPatientHealthInfo(patientId);
      } else {
        setError('Failed to load patient details');
      }
    } catch (err) {
      setError('An error occurred while fetching patient details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHealthInfo = async (patientId) => {
    try {
      setHealthInfoLoading(true);
      setHealthInfoError(null);
      
      const response = await getPatientHealthInfo(patientId);
      
      if (response.success) {
        setHealthInfo(response.health_info);
      } else {
        setHealthInfoError('Failed to load patient health information');
      }
    } catch (err) {
      setHealthInfoError('An error occurred while fetching health information');
      console.error('Error:', err);
    } finally {
      setHealthInfoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.push('/doctor/patients')}
          className="btn btn-ghost mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={18} />
          Back to Patients
        </button>
        
        <div className="flex justify-center items-center min-h-[60vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.push('/doctor/patients')}
          className="btn btn-ghost mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={18} />
          Back to Patients
        </button>
        
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.push('/doctor/patients')}
          className="btn btn-ghost mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={18} />
          Back to Patients
        </button>
        
        <div className="alert alert-warning">
          <span>Patient not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/doctor/patients')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Patients
      </button>
      
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="avatar placeholder mr-4">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-20">
              <span className="text-2xl">
                {patient.patient_name?.charAt(0) || 'P'}
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{patient.patient_name}</h1>
            <p className="text-lg opacity-70">
              Patient ID: {patient.patient_number}
            </p>
          </div>
        </div>
        
        <div className="flex mt-4 md:mt-0 gap-2 flex-wrap">
          <button 
            onClick={() => router.push(`/appointments/new?patient=${patient.patient_id}`)}
            className="btn btn-primary"
          >
            <Calendar size={16} className="mr-1" /> Schedule Appointment
          </button>
          
          {patient?.history_link && (
            <a 
              href={patient.history_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <FileText size={16} className="mr-1" /> Full Medical History
            </a>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-6">
        <button 
          className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <User size={16} className="mr-1" /> Basic Info
        </button>
        <button 
          className={`tab ${activeTab === 'health' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <Heart size={16} className="mr-1" /> Health Info
        </button>
        <button 
          className={`tab ${activeTab === 'appointments' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={16} className="mr-1" /> Appointments
        </button>
        <button 
          className={`tab ${activeTab === 'prescriptions' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('prescriptions')}
        >
          <Pill size={16} className="mr-1" /> Prescriptions
        </button>
        <button 
          className={`tab ${activeTab === 'records' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <BookOpen size={16} className="mr-1" /> Medical Records
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-sm opacity-70">Full Name</p>
                  <p className="font-medium text-lg">{patient.patient_name}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm opacity-70">Email</p>
                  <div className="flex items-center">
                    <Mail size={16} className="text-primary mr-2" />
                    <p>{patient.patient_email}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm opacity-70">Phone</p>
                  <div className="flex items-center">
                    <Phone size={16} className="text-primary mr-2" />
                    <p>{patient.patient_phone || 'Not provided'}</p>
                  </div>
                </div>
                
                {patient.patient_address && (
                  <div className="mb-4">
                    <p className="text-sm opacity-70">Address</p>
                    <div className="flex items-start">
                      <MapPin size={16} className="text-primary mr-2 mt-1" />
                      <p>{patient.patient_address}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="mb-4">
                  <p className="text-sm opacity-70">Registration Date</p>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-primary mr-2" />
                    <p>{formatDate(patient.registration_date)}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm opacity-70">Primary Hospital</p>
                  <p className="font-medium">{patient.hospital_name || 'No primary hospital'}</p>
                </div>
                
                {patient.emergency_contact && (
                  <div className="mb-4">
                    <p className="text-sm opacity-70">Emergency Contact</p>
                    <p>{patient.emergency_contact}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'health' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Health Information</h2>
            
            {healthInfoLoading ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : healthInfoError ? (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{healthInfoError}</span>
              </div>
            ) : !healthInfo ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No health information available for this patient</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary">Personal Health</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-base-content/70">Blood Group</span>
                        <span className="text-lg">{healthInfo.blood_group || "Not specified"}</span>
                      </div>
                      
                      {healthInfo.details?.height && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-base-content/70">Height</span>
                          <span className="text-lg">{healthInfo.details.height}</span>
                        </div>
                      )}
                      
                      {healthInfo.details?.weight && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-base-content/70">Weight</span>
                          <span className="text-lg">{healthInfo.details.weight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {healthInfo.details?.emergency_contact && (
                    <div>
                      <h3 className="font-semibold text-primary">Emergency Contact</h3>
                      <div className="mt-2">
                        <span className="text-lg">{healthInfo.details.emergency_contact}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary">Medical Information</h3>
                    <div className="mt-2 space-y-2">
                      {healthInfo.allergies && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-base-content/70">Allergies</span>
                          <span className="text-lg">{healthInfo.allergies}</span>
                        </div>
                      )}
                      
                      {healthInfo.drug_reactions && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-base-content/70">Drug Reactions</span>
                          <span className="text-lg">{healthInfo.drug_reactions}</span>
                        </div>
                      )}
                      
                      {healthInfo.complexities && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-base-content/70">Medical Complexities</span>
                          <span className="text-lg">{healthInfo.complexities}</span>
                        </div>
                      )}
                      
                      {healthInfo.details?.chronic_conditions && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-base-content/70">Chronic Conditions</span>
                          <span className="text-lg">{healthInfo.details.chronic_conditions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'appointments' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-xl">Appointment History</h2>
              <button 
                onClick={() => router.push(`/appointments/new?patient=${patient.patient_id}`)}
                className="btn btn-primary btn-sm"
              >
                <Calendar size={14} className="mr-1" /> New Appointment
              </button>
            </div>
            
            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Hospital</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.appointments.map((appointment) => (
                      <tr key={appointment.appointment_id}>
                        <td>
                          <div className="flex flex-col">
                            <span>{formatDate(appointment.appointment_time)}</span>
                            <span className="text-xs opacity-70">{formatTime(appointment.appointment_time)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline">
                            {appointment.type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            appointment.status === 'completed' ? 'badge-success' :
                            appointment.status === 'canceled' ? 'badge-error' :
                            appointment.status === 'no_show' ? 'badge-warning' :
                            'badge-primary'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>{appointment.hospital_name}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => router.push(`/doctor/appointments/${appointment.appointment_id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No appointment history</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'prescriptions' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Prescriptions</h2>
            
            {patient.prescriptions && patient.prescriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Medications</th>
                      <th>Doctor</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.prescriptions.map((prescription) => (
                      <tr key={prescription.prescription_id}>
                        <td>{formatDate(prescription.prescribed_date)}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {prescription.medication_details && prescription.medication_details.map((med, idx) => (
                              <div key={idx} className="badge badge-outline">
                                {med.name} {med.dosage}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>Dr. {prescription.doctor_name || 'Unknown'}</td>
                        <td>
                          <div className="flex gap-2">
                            {prescription.prescription_file && (
                              <a 
                                href={prescription.prescription_file} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline"
                              >
                                View File
                              </a>
                            )}
                            {prescription.appointment_id && (
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => router.push(`/doctor/appointments/${prescription.appointment_id}`)}
                              >
                                View Appointment
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No prescription history</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'records' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Medical Records</h2>
            
            {patient.medical_records && patient.medical_records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.medical_records.map((record) => (
                      <tr key={record.record_id}>
                        <td>{formatDate(record.record_date)}</td>
                        <td>
                          <span className="badge">
                            {record.record_type}
                          </span>
                        </td>
                        <td>
                          <div className="truncate max-w-xs">
                            {record.details ? JSON.stringify(record.details).substring(0, 50) + '...' : 'No details'}
                          </div>
                        </td>
                        <td>
                          {record.record_file ? (
                            <a 
                              href={record.record_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline"
                            >
                              View File
                            </a>
                          ) : (
                            <span className="text-sm opacity-70">No file</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No medical records</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
