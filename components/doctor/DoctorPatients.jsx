"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getDoctorPatients, getPatientDetails, getPatientHealthInfo } from '@/services/doctorDashboardService';
import { Users, Search, User, Calendar, FileText, ArrowLeft, Filter, ChevronRight, ChevronLeft, Heart, AlertCircle } from 'lucide-react';

const DoctorPatients = () => {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [healthInfo, setHealthInfo] = useState(null);
  const [healthInfoLoading, setHealthInfoLoading] = useState(false);
  const [healthInfoError, setHealthInfoError] = useState(null);
  const limit = 20;

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchPatients();
  }, [router, page]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await getDoctorPatients(limit, offset);
      
      if (response.success) {
        if (page === 1) {
          setPatients(response.patients || []);
        } else {
          setPatients(prev => [...prev, ...(response.patients || [])]);
        }
        
        // Check if there might be more patients to load
        setHasMore(response.patients && response.patients.length === limit);
      } else {
        setError('Failed to load patients');
      }
    } catch (err) {
      setError('An error occurred while fetching patients');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      setDetailLoading(true);
      setHealthInfo(null);
      setHealthInfoError(null);
      
      const response = await getPatientDetails(patientId);
      
      if (response.success) {
        setPatientDetail(response.patient);
        // Fetch health information after basic details are loaded
        fetchPatientHealthInfo(patientId);
      } else {
        setError('Failed to load patient details');
      }
    } catch (err) {
      setError('An error occurred while fetching patient details');
      console.error('Error:', err);
    } finally {
      setDetailLoading(false);
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

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientDetail(null); // Clear previous details
    fetchPatientDetails(patient.patient_id);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredPatients = searchQuery 
    ? patients.filter(patient => 
        patient.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patient_number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : patients;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/doctor')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Patient Management</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Users size={20} />
                My Patients
              </h2>
              
              <div className="form-control w-full max-w-xs mt-2 mb-4">
                <div className="input-group w-full">
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="input input-bordered w-full"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <button className="btn btn-square">
                    <Search size={18} />
                  </button>
                </div>
              </div>
              
              <div className="h-[60vh] overflow-y-auto">
                {loading && page === 1 ? (
                  <div className="flex justify-center items-center h-40">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      {searchQuery ? 'No patients match your search' : 'No patients found'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.patient_id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPatient && selectedPatient.patient_id === patient.patient_id
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-200 hover:bg-base-300'
                        }`}
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-medium">{patient.patient_name}</div>
                        <div className="text-sm">{patient.patient_email}</div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs mr-2">ID: {patient.patient_number}</span>
                          <span className="text-xs">
                            {formatDate(patient.registration_date)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {loading && page > 1 && (
                      <div className="flex justify-center py-4">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    )}
                    
                    {hasMore && !loading && (
                      <button 
                        className="btn btn-outline btn-sm mt-2"
                        onClick={() => setPage(page + 1)}
                      >
                        Load More Patients
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Patient Details */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <div className="card bg-base-100 shadow-md h-full">
              <div className="card-body flex flex-col items-center justify-center">
                <User size={48} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-medium">No Patient Selected</h3>
                <p className="text-gray-500 mt-2">
                  Select a patient from the list to view their details
                </p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body flex justify-center items-center min-h-[40vh]">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            </div>
          ) : patientDetail ? (
            <div>
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h2 className="card-title text-xl">Patient Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="font-semibold">Name:</span>
                      <p>{patientDetail.patient_name}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Patient ID:</span>
                      <p>{patientDetail.patient_number}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Email:</span>
                      <p>{patientDetail.patient_email}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Phone:</span>
                      <p>{patientDetail.patient_phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Registration Date:</span>
                      <p>{formatDate(patientDetail.registration_date)}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold">Hospital:</span>
                      <p>{patientDetail.hospital_name}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Health Information Card */}
              <div className="card bg-base-100 shadow-md mt-6">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <Heart size={18} className="text-primary" />
                    Health Information
                  </h3>
                  
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
                          <h4 className="font-semibold text-primary">Personal Health</h4>
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
                            <h4 className="font-semibold text-primary">Emergency Contact</h4>
                            <div className="mt-2">
                              <span className="text-lg">{healthInfo.details.emergency_contact}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-primary">Medical Information</h4>
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
              
              {/* Appointment History */}
              <div className="card bg-base-100 shadow-md mt-6">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <Calendar size={18} />
                    Appointment History
                  </h3>
                  
                  {patientDetail.appointments && patientDetail.appointments.length > 0 ? (
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
                          {patientDetail.appointments.map((appointment) => (
                            <tr key={appointment.appointment_id}>
                              <td>{formatDate(appointment.appointment_time)}</td>
                              <td>
                                <span className="badge badge-outline">
                                  {appointment.type}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  appointment.status === 'completed' ? 'badge-success' :
                                  appointment.status === 'canceled' ? 'badge-error' :
                                  'badge-warning'
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
              
              {/* Medical Records */}
              <div className="card bg-base-100 shadow-md mt-6">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <FileText size={18} />
                    Medical Records
                  </h3>
                  
                  {patientDetail.medical_records && patientDetail.medical_records.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Details</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientDetail.medical_records.map((record) => (
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
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => record.record_file && window.open(record.record_file, '_blank')}
                                  disabled={!record.record_file}
                                >
                                  View File
                                </button>
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
              
              {/* Prescriptions */}
              <div className="card bg-base-100 shadow-md mt-6">
                <div className="card-body">
                  <h3 className="card-title text-lg flex items-center gap-2">
                    <FileText size={18} />
                    Prescriptions
                  </h3>
                  
                  {patientDetail.prescriptions && patientDetail.prescriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Prescribed Date</th>
                            <th>Medications</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientDetail.prescriptions.map((prescription) => (
                            <tr key={prescription.prescription_id}>
                              <td>{formatDate(prescription.prescribed_date)}</td>
                              <td>
                                <div className="truncate max-w-xs">
                                  {prescription.medication_details 
                                    ? Object.keys(prescription.medication_details).join(', ')
                                    : 'No details'}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => prescription.prescription_file && window.open(prescription.prescription_file, '_blank')}
                                  disabled={!prescription.prescription_file}
                                >
                                  View Prescription
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No prescriptions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="alert alert-warning">
                  <span>Failed to load patient details. Please try selecting the patient again.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
