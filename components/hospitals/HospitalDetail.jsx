"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHospitalById, deleteHospital, getHospitalAdmins, checkHospitalAdminStatus } from '@/services/hospitalService';
import { getHospitalDoctors } from '@/services/doctorService';
import { isAuthenticated, getCurrentUser, isAdmin as is_sys_Admin } from '@/services/authService';
import { Edit, Trash2, Users, MapPin, Phone, Mail, Globe, StethoscopeIcon, Settings, Calendar, Clock, UserPlus, ChevronLeft } from 'lucide-react';
import HospitalDetailActions from './HospitalDetailActions';

const HospitalDetail = ({ hospitalId }) => {
  const router = useRouter();
  const [hospital, setHospital] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isHospitalAdmin, setIsHospitalAdmin] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorsError, setDoctorsError] = useState(null);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true);
        const response = await getHospitalById(hospitalId);
        
        if (response.success && response.hospital) {
          setHospital(response.hospital);
        } else {
          setError('Hospital not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load hospital details');
        console.error('Error loading hospital:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, [hospitalId]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated() || !hospital) return;
      
      try {
        setLoadingAdmins(true);
        
        // Check if current user is admin for this hospital
        const adminStatus = await checkHospitalAdminStatus(hospitalId);
        setIsHospitalAdmin(adminStatus);
        
        const user = getCurrentUser();
        const response = await getHospitalAdmins(hospitalId);
        
        if (response.success && response.admins) {
          setAdmins(response.admins);
          // Check if current user is in admins list
          const isUserAdmin = response.admins.some(admin => admin.user_id === user.id);
          setIsAdmin(isUserAdmin);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        // Don't show error to user, just log it
      } finally {
        setLoadingAdmins(false);
      }
    };

    checkAdminStatus();
  }, [hospitalId, hospital]);

  // Fetch doctors when hospital data is loaded
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!hospital) return;
      
      try {
        setLoadingDoctors(true);
        setDoctorsError(null);
        
        const response = await getHospitalDoctors(hospitalId);
        
        if (response.success) {
          setDoctors(response.doctors || []);
        } else {
          setDoctorsError('Failed to load doctors for this hospital');
        }
      } catch (err) {
        setDoctorsError('Error loading doctors');
        console.error('Error fetching doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    
    fetchDoctors();
  }, [hospitalId, hospital]);

  const handleDelete = async () => {
    try {
      const response = await deleteHospital(hospitalId);
      
      if (response.success) {
        router.push('/hospitals');
      } else {
        setError('Failed to delete hospital');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete hospital');
      console.error('Error deleting hospital:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
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
        <div className="mt-4">
          <Link href="/hospitals" className="btn btn-primary">
            Return to Hospitals
          </Link>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-warning">
          <span>Hospital not found</span>
        </div>
        <div className="mt-4">
          <Link href="/hospitals" className="btn btn-primary">
            Return to Hospitals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Hospitals button */}
      <div className="mb-4">
        <Link href="/hospitals" className="btn btn-outline btn-sm inline-flex items-center">
          <ChevronLeft size={18} />
          Back to Hospitals
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{hospital.name}</h1>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Link href={`/hospitals/${hospitalId}/doctors`} className="btn btn-success">
              <StethoscopeIcon size={18} className="mr-2" />
              Manage Doctors
            </Link>
            <Link href={`/hospitals/${hospitalId}/admins`} className="btn btn-outline">
              <Users size={18} />
              Manage Admins
            </Link>
            <Link href={`/hospitals/${hospitalId}/edit`} className="btn btn-primary">
              <Edit size={18} />
              Edit
            </Link>
            <button 
              className="btn btn-error" 
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        )}
      </div>

      {hospital.advertised && (
        <div className="badge badge-secondary mb-4">Featured Hospital</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl">About</h2>
            
            <div className="flex items-start gap-2 mt-2">
              <MapPin size={18} className="text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="whitespace-pre-line">{hospital.address}</p>
              </div>
            </div>
            
            {hospital.contact_info && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p>{hospital.contact_info}</p>
              </div>
            )}
            
            {hospital.specialties && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties.split(',').map((specialty, index) => (
                    <div key={index} className="badge badge-outline">{specialty.trim()}</div>
                  ))}
                </div>
              </div>
            )}
            
            {hospital.location && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Location</h3>
                {typeof hospital.location === 'object' ? (
                  <div>
                    <p>Latitude: {hospital.location.lat}</p>
                    <p>Longitude: {hospital.location.lng}</p>
                    {/* Map integration could be added here */}
                    <div className="mt-3">
                      <a 
                        href={`https://maps.google.com/?q=${hospital.location.lat},${hospital.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <MapPin size={16} />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <p>{hospital.location}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div>
          {/* Add the appointment actions widget */}
          <HospitalDetailActions hospital={hospital} doctors={doctors} />
          
          <div className="card bg-base-100 shadow-md h-fit">
            <div className="card-body">
              <h2 className="card-title text-xl">Hospital Information</h2>
              
              <div className="mt-2">
                <h3 className="font-semibold">Rating</h3>
                <div className="flex items-center mt-1">
                  <div className="rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <input 
                        key={star}
                        type="radio" 
                        name="rating" 
                        className="mask mask-star-2 bg-orange-400" 
                        readOnly
                        checked={Math.round(hospital.rating) === star}
                      />
                    ))}
                  </div>
                  <span className="ml-2">{hospital.rating ? hospital.rating.toFixed(1) : 'No ratings yet'}</span>
                </div>
              </div>
              
              <Link href={`/appointments/new?hospital=${hospitalId}`} className="btn btn-primary mt-4">
                Book Appointment
              </Link>
              
              {isHospitalAdmin && (
                <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-success mt-2">
                  <Settings size={18} className="mr-1" />
                  Manage Hospital
                </Link>
              )}
              
              {is_sys_Admin() && (
                <Link href="/admin" className="btn btn-secondary mt-2">
                  <Users size={18} className="mr-1" />
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Doctors at this Hospital Section */}
      <div className="card bg-base-100 shadow-md mt-6">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title text-xl">
              <StethoscopeIcon className="mr-2" />
              Doctors at this Hospital
            </h2>
            {isAdmin && (
              <Link href={`/hospitals/${hospitalId}/doctors`} className="btn btn-primary btn-sm">
                <UserPlus size={16} className="mr-1" />
                Manage Doctors
              </Link>
            )}
          </div>
          
          {loadingDoctors ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : doctorsError ? (
            <div className="alert alert-error">
              <span>{doctorsError}</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="alert alert-info mt-4">
              <span>No doctors are currently associated with this hospital.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {doctors.map(doctor => (
                <div key={doctor.doctor_id} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Dr. {doctor.name}</h3>
                    
                    {doctor.specialties && doctor.specialties.length > 0 && (
                      <div className="mt-1">
                        <div className="flex flex-wrap gap-1">
                          {doctor.specialties.map((specialty, idx) => (
                            <span key={idx} className="badge badge-sm">{specialty}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {doctor.doctor_fees && Object.keys(doctor.doctor_fees).length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium mb-1">Consultation Fees:</div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          {Object.entries(doctor.doctor_fees).map(([feeType, amount]) => (
                            <div key={feeType} className="flex justify-between">
                              <span className="capitalize">{feeType}:</span>
                              <span className="font-medium">${amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {doctor.working_hours && Object.keys(doctor.working_hours).length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock size={14} /> Available:
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                          {Object.entries(doctor.working_hours)
                            .slice(0, 4) // Show first 4 days only to save space
                            .map(([day, hours]) => (
                              <div key={day} className="flex justify-between">
                                <span className="font-medium">{day}:</span>
                                <span>{hours}</span>
                              </div>
                            ))}
                        </div>
                        {Object.keys(doctor.working_hours).length > 4 && (
                          <div className="text-center mt-1">
                            <button className="text-xs link-primary">View all hours</button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="card-actions justify-end mt-3">
                      <Link href={`/doctors/${doctor.doctor_id}`} className="btn btn-sm btn-outline">
                        View Profile
                      </Link>
                      <Link href={`/appointments/new?hospital=${hospitalId}&doctor=${doctor.doctor_id}`} className="btn btn-sm btn-primary">
                        <Calendar size={16} className="mr-1" />
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete {hospital.name}? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDetail;
