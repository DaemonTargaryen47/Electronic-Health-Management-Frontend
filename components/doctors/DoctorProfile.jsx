"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDoctorProfile, updateDoctorProfile } from '@/services/doctorService';
import { isAuthenticated } from '@/services/authService';
import { AlertTriangle, Award, FileText, Building, Clock } from 'lucide-react';

const DoctorProfile = () => {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    specialties: [],
    certificate_file: '',
    certificate_details: {},
    specialtiesInput: '' // Add this new state field
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchDoctorProfile();
    };
    
    checkAuthentication();
  }, [router]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDoctorProfile();
      
      if (response.success && response.doctor) {
        setDoctor(response.doctor);
        // Initialize form data for editing
        setFormData({
          specialties: response.doctor.specialties || [],
          specialtiesInput: (response.doctor.specialties || []).join(', '), // Initialize the text input
          certificate_file: response.doctor.certificate_file || '',
          certificate_details: response.doctor.certificate_details || {}
        });
      } else {
        setError('Failed to load doctor profile');
      }
    } catch (err) {
      if (err.status === 404) {
        // Not registered as a doctor yet
        router.push('/doctors/register');
      } else {
        setError(err.message || 'An error occurred while loading your profile');
        console.error('Error fetching doctor profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCertificateDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      certificate_details: {
        ...prev.certificate_details,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Process specialties from the input text before submitting
      const specialties = formData.specialtiesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      
      const dataToSubmit = {
        ...formData,
        specialties
      };
      
      const response = await updateDoctorProfile(dataToSubmit);
      
      if (response.success) {
        setSuccess('Profile updated successfully');
        setDoctor(response.doctor);
        setEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during update');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'text-success';
      case 'rejected': return 'text-error';
      default: return 'text-warning';
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
      <h1 className="text-3xl font-bold mb-6">Doctor Profile</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-6">
          <span>{success}</span>
        </div>
      )}
      
      {doctor && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h2 className="card-title text-xl">Doctor Information</h2>
                  
                  {doctor.verification_status !== 'approved' && (
                    <div className="badge badge-lg badge-warning">Pending Verification</div>
                  )}
                  
                  {doctor.verification_status === 'rejected' && (
                    <div className="badge badge-lg badge-error">Verification Rejected</div>
                  )}
                </div>
                
                <div className="mt-4">
                  <p><strong>Doctor ID:</strong> {doctor.doctor_id}</p>
                  <p><strong>Name:</strong> {doctor.user_name}</p>
                  <p><strong>Email:</strong> {doctor.user_email}</p>
                  <p>
                    <strong>Verification Status:</strong>
                    <span className={`ml-2 font-semibold ${getVerificationStatusColor(doctor.verification_status)}`}>
                      {doctor.verification_status.toUpperCase()}
                    </span>
                  </p>
                  {doctor.verification_date && (
                    <p><strong>Verification Date:</strong> {new Date(doctor.verification_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-md mt-6">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h2 className="card-title text-xl flex items-center gap-2">
                    <Award size={20} /> Specialties
                  </h2>
                  {doctor.verification_status !== 'approved' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {doctor.specialties && doctor.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doctor.specialties.map((specialty, index) => (
                      <div key={index} className="badge badge-outline p-3">
                        {specialty}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No specialties added</p>
                )}
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-md mt-6">
              <div className="card-body">
                <h2 className="card-title text-xl flex items-center gap-2">
                  <FileText size={20} /> Certificate Information
                </h2>
                
                {doctor.certificate_file ? (
                  <div className="mt-2">
                    {/* Certificate Card */}
                    <div className="card bg-base-200 shadow-sm my-4">
                      <div className="card-body p-4">
                        <h3 className="card-title text-lg flex items-center gap-2">
                          <FileText size={16} />
                          Certificate Document
                        </h3>
                        <button 
                          onClick={() => window.open(doctor.certificate_file, '_blank')} 
                          className="bg-base-300 hover:bg-violet-200 transition-colors duration-200 rounded-md p-3 flex items-center justify-center h-24 my-2 w-full cursor-pointer hover:shadow-md active:translate-y-0.5"
                        >
                          <FileText size={32} className="text-primary hover:text-violet-600" />
                          <span className="ml-2 text-sm opacity-75">View Medical Certificate</span>
                        </button>
                        
                      </div>
                    </div>
                    
                    {doctor.certificate_details && Object.keys(doctor.certificate_details).length > 0 && (
                      <div className="mt-4">
                        <strong>Certificate Details:</strong>
                        <ul className="list-disc pl-5 mt-1">
                          {Object.entries(doctor.certificate_details).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:</strong> {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-warning mt-2">
                    <span>No certificate file provided.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-md h-fit">
            <div className="card-body">
              <h2 className="card-title text-xl flex items-center gap-2">
                <Building size={20} /> Hospital Affiliations
              </h2>
              
              {doctor.hospitals && doctor.hospitals.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {doctor.hospitals.map((hospital, index) => (
                    <div key={index} className="card bg-base-200">
                      <div className="card-body p-4">
                        <h3 className="font-semibold">{hospital.hospital_name}</h3>
                        <p className="text-sm">{hospital.address}</p>
                        
                        {hospital.specialties && hospital.specialties.length > 0 && (
                          <div className="mt-2">
                            <strong>Specialties:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {hospital.specialties.map((specialty, idx) => (
                                <span key={idx} className="badge badge-sm">{specialty}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {hospital.working_hours && Object.keys(hospital.working_hours).length > 0 && (
                          <div className="mt-2">
                            <strong className="flex items-center gap-1">
                              <Clock size={14} /> Working Hours:
                            </strong>
                            <div className="grid grid-cols-2 gap-1 text-sm mt-1">
                              {Object.entries(hospital.working_hours).map(([day, hours]) => (
                                <div key={day}>
                                  <span className="font-medium">{day}:</span> {hours}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info mt-2">
                  <span>You are not affiliated with any hospitals yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Update Doctor Profile</h3>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Specialties (comma-separated)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  name="specialtiesInput"
                  value={formData.specialtiesInput}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      specialtiesInput: e.target.value
                    }));
                  }}
                />
              </div>
              
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Certificate File URL</span>
                </label>
                <input
                  type="text"
                  name="certificate_file"
                  className="input input-bordered w-full"
                  value={formData.certificate_file}
                  onChange={handleInputChange}
                />
                <span className="text-xs text-gray-500 mt-1">
                  Enter URL to your certificate file. Updating this will reset your verification status.
                </span>
              </div>
              
              <div className="divider">Certificate Details</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Institution</span>
                  </label>
                  <input
                    type="text"
                    name="institution"
                    className="input input-bordered w-full"
                    value={formData.certificate_details.institution || ''}
                    onChange={handleCertificateDetailsChange}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Year</span>
                  </label>
                  <input
                    type="number"
                    name="year"
                    className="input input-bordered w-full"
                    value={formData.certificate_details.year || ''}
                    onChange={handleCertificateDetailsChange}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">License Number</span>
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    className="input input-bordered w-full"
                    value={formData.certificate_details.license_number || ''}
                    onChange={handleCertificateDetailsChange}
                  />
                </div>
              </div>
              
              <div className="alert alert-warning mt-4">
                <AlertTriangle size={16} />
                <span>Updating certificate information will reset your verification status to pending.</span>
              </div>
              
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
