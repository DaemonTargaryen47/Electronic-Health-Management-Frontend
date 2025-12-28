"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHospitalById } from '@/services/hospitalService';
import { 
  getHospitalDoctors, getAllDoctors, 
  addDoctorToHospital, removeDoctorFromHospital,
  updateHospitalDoctor 
} from '@/services/doctorService';
import { isAuthenticated } from '@/services/authService';
import { Search, UserPlus, X, AlertCircle, Clock, Settings, ArrowLeft } from 'lucide-react';

const HospitalDoctors = ({ hospitalId }) => {
  const router = useRouter();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    specialties: [],
    working_hours: {},
    specialtiesInput: '',
    formattedWorkingHours: {},
    doctor_fees: {} // Add doctor_fees to the form data
  });
  
  // Day names for working hours form
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchData();
    };
    
    checkAuth();
  }, [hospitalId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch hospital details
      const hospitalResponse = await getHospitalById(hospitalId);
      if (hospitalResponse.success && hospitalResponse.hospital) {
        setHospital(hospitalResponse.hospital);
      } else {
        setError('Failed to load hospital information');
        return;
      }
      
      // Fetch hospital doctors
      const doctorsResponse = await getHospitalDoctors(hospitalId);
      if (doctorsResponse.success) {
        setDoctors(doctorsResponse.doctors || []);
      } else {
        setError('Failed to load hospital doctors');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading data');
      console.error('Error loading hospital data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setError(null);
      
      // Get all approved doctors
      const response = await getAllDoctors({ status: 'approved' });
      
      if (response.success) {
        // Filter out doctors already working at this hospital
        const hospitalDoctorIds = doctors.map(doc => doc.doctor_id);
        const available = response.doctors.filter(doc => 
          !hospitalDoctorIds.includes(doc.doctor_id)
        );
        
        setAvailableDoctors(available);
        setFilteredDoctors(available);
      } else {
        setError('Failed to load available doctors');
      }
    } catch (err) {
      setError(err.message || 'Failed to load available doctors');
      console.error('Error loading available doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(availableDoctors);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = availableDoctors.filter(doctor => 
      doctor.user_name.toLowerCase().includes(query) ||
      doctor.user_email.toLowerCase().includes(query) ||
      (doctor.specialties && doctor.specialties.some(s => 
        s.toLowerCase().includes(query)
      ))
    );
    
    setFilteredDoctors(filtered);
  };

  const handleAddDoctor = async () => {
    if (!selectedDoctor) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await addDoctorToHospital(hospitalId, {
        doctor_id: selectedDoctor.doctor_id,
        specialties: selectedDoctor.specialties || [],
        working_hours: {},
        doctor_fees: {} // Initialize with empty fees object
      });
      
      if (response.success) {
        setShowAddModal(false);
        setSelectedDoctor(null);
        await fetchData();
        showSuccessMessage('Doctor added to hospital successfully');
      } else {
        setError(response.message || 'Failed to add doctor to hospital');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding doctor');
      console.error('Error adding doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await removeDoctorFromHospital(hospitalId, doctorId);
      
      if (response.success) {
        setDoctors(doctors.filter(doc => doc.doctor_id !== doctorId));
        setConfirmRemove(null);
        showSuccessMessage('Doctor removed from hospital successfully');
      } else {
        setError(response.message || 'Failed to remove doctor from hospital');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while removing doctor');
      console.error('Error removing doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseTimeRange = (timeRange) => {
    if (!timeRange) return { startTime: '', endTime: '' };
    
    const parts = timeRange.split('-').map(part => part.trim());
    return {
      startTime: parts[0] || '',
      endTime: parts[1] || ''
    };
  };
  
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime && !endTime) return '';
    return `${startTime || ''}${startTime && endTime ? ' - ' : ''}${endTime || ''}`;
  };

  const handleEditDoctor = (doctor) => {
    const formattedWorkingHours = {};
    
    if (doctor.working_hours) {
      Object.entries(doctor.working_hours).forEach(([day, timeRange]) => {
        const { startTime, endTime } = parseTimeRange(timeRange);
        formattedWorkingHours[day] = { startTime, endTime };
      });
    }
    
    setEditingDoctor(doctor);
    setFormData({
      specialties: doctor.specialties || [],
      working_hours: doctor.working_hours || {},
      formattedWorkingHours: formattedWorkingHours,
      specialtiesInput: (doctor.specialties || []).join(', '),
      doctor_fees: doctor.doctor_fees || {} // Initialize with existing fees or empty object
    });
    setShowEditModal(true);
  };

  // Handle doctor fee changes
  const handleFeeChange = (feeType, value) => {
    setFormData(prevData => ({
      ...prevData,
      doctor_fees: {
        ...prevData.doctor_fees,
        [feeType]: parseFloat(value) || 0
      }
    }));
  };

  // Add a new fee type
  const addFeeType = (feeType, amount) => {
    if (feeType.trim() === '') return;
    
    setFormData(prevData => ({
      ...prevData,
      doctor_fees: {
        ...prevData.doctor_fees,
        [feeType.trim()]: parseFloat(amount) || 0
      }
    }));
  };

  // Remove a fee type
  const removeFeeType = (feeType) => {
    setFormData(prevData => {
      const updatedFees = { ...prevData.doctor_fees };
      delete updatedFees[feeType];
      return {
        ...prevData,
        doctor_fees: updatedFees
      };
    });
  };

  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateHospitalDoctor(
        hospitalId,
        editingDoctor.hospital_doctor_id,
        formData
      );
      
      if (response.success) {
        setShowEditModal(false);
        await fetchData();
        showSuccessMessage('Doctor information updated successfully');
      } else {
        setError(response.message || 'Failed to update doctor information');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating doctor');
      console.error('Error updating doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleSpecialtiesChange = (e) => {
    const input = e.target.value;
    
    const specialties = input
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    
    setFormData({
      ...formData,
      specialties: specialties,
      specialtiesInput: input
    });
  };

  const handleWorkingHoursChange = (day, field, value) => {
    const updatedFormattedHours = {
      ...formData.formattedWorkingHours,
      [day]: {
        ...(formData.formattedWorkingHours[day] || { startTime: '', endTime: '' }),
        [field]: value
      }
    };
    
    const updatedWorkingHours = { ...formData.working_hours };
    
    const { startTime, endTime } = updatedFormattedHours[day];
    if (startTime || endTime) {
      updatedWorkingHours[day] = formatTimeRange(startTime, endTime);
    } else {
      delete updatedWorkingHours[day];
    }
    
    setFormData({
      ...formData,
      formattedWorkingHours: updatedFormattedHours,
      working_hours: updatedWorkingHours
    });
  };

  if (loading && !doctors.length) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hospital Doctors</h1>
          {hospital && <h2 className="text-lg">{hospital.name}</h2>}
        </div>
        
        <div className="flex gap-2">
          <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-outline">
          <ArrowLeft size={18} />
            Back to Hospital Management
          </Link>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setShowAddModal(true);
              fetchAvailableDoctors();
            }}
          >
            <UserPlus size={18} />
            Add Doctor
          </button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
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
          <span>No doctors found for this hospital.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div key={doctor.doctor_id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="card-title justify-between">
                  <h2>{doctor.name}</h2>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                      <Settings size={16} />
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <button onClick={() => handleEditDoctor(doctor)}>
                          Edit Details
                        </button>
                      </li>
                      <li>
                        <button 
                          className="text-error" 
                          onClick={() => setConfirmRemove(doctor)}
                        >
                          Remove from Hospital
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <p>{doctor.email}</p>
                
                {doctor.specialties && doctor.specialties.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-semibold mb-1">Specialties</div>
                    <div className="flex flex-wrap gap-1">
                      {doctor.specialties.map((specialty, idx) => (
                        <span key={idx} className="badge badge-outline">{specialty}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {doctor.working_hours && Object.keys(doctor.working_hours).length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-1 flex items-center">
                      <Clock size={14} className="mr-1" /> Working Hours
                    </div>
                    <div className="text-sm">
                      {Object.entries(doctor.working_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="font-medium">{day}:</span>
                          <span>{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEditDoctor(doctor)}
                  >
                    Edit Details
                  </button>
                  <button 
                    className="btn btn-sm btn-error"
                    onClick={() => setConfirmRemove(doctor)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Add Doctor to Hospital</h3>
            
            <div className="mt-4">
              <div className="form-control">
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    placeholder="Search doctors by name or specialty"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={handleSearch}
                  >
                    <Search size={18} />
                  </button>
                </div>
                
                {loadingDoctors ? (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="alert alert-info">
                    <span>No available doctors found.</span>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-96">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Specialties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map(doctor => (
                          <tr key={doctor.doctor_id} 
                            className={`cursor-pointer hover:bg-base-200 ${
                              selectedDoctor && selectedDoctor.doctor_id === doctor.doctor_id ? 
                              'bg-base-200' : ''
                            }`}
                            onClick={() => setSelectedDoctor(doctor)}
                          >
                            <td>
                              <input 
                                type="radio" 
                                name="selected_doctor" 
                                className="radio radio-primary"
                                checked={selectedDoctor && selectedDoctor.doctor_id === doctor.doctor_id}
                                onChange={() => setSelectedDoctor(doctor)}
                              />
                            </td>
                            <td>{doctor.user_name}</td>
                            <td>{doctor.user_email}</td>
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {doctor.specialties && doctor.specialties.length > 0 ? 
                                  doctor.specialties.slice(0, 2).map((s, i) => (
                                    <span className="badge badge-sm" key={i}>{s}</span>
                                  ))
                                : 
                                  <span className="text-gray-400">None</span>
                                }
                                {doctor.specialties && doctor.specialties.length > 2 && (
                                  <span className="badge badge-sm">+{doctor.specialties.length - 2}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDoctor(null);
                  setSearchQuery('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={handleAddDoctor}
                disabled={!selectedDoctor || loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Add Doctor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Doctor Modal */}
      {showEditModal && editingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg">Edit Doctor Details</h3>
            <p className="text-sm text-gray-500 mt-1">Doctor: {editingDoctor.name}</p>
            
            <div className="divider">Hospital-specific Information</div>
            
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Specialties (comma separated)</span>
              </label>
              <input 
                type="text" 
                className="input input-bordered w-full"
                value={formData.specialtiesInput || formData.specialties.join(', ')}
                onChange={handleSpecialtiesChange}
                placeholder="Cardiology, Pediatrics, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                These specialties are specific to this hospital and may differ from the doctor's general specialties.
              </p>
            </div>
            
            <div className="form-control mt-6">
              <label className="label">
                <span className="label-text font-semibold">Working Hours</span>
              </label>
              
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayNames.map(day => {
                      const dayData = formData.formattedWorkingHours?.[day] || { startTime: '', endTime: '' };
                      const isWorkingDay = dayData.startTime || dayData.endTime;
                      
                      return (
                        <tr key={day} className={isWorkingDay ? '' : 'text-gray-400'}>
                          <td className="font-medium">{day}</td>
                          <td>
                            <input
                              type="time"
                              className="input input-bordered input-sm w-full max-w-xs"
                              value={dayData.startTime}
                              onChange={(e) => handleWorkingHoursChange(day, 'startTime', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className="input input-bordered input-sm w-full max-w-xs"
                              value={dayData.endTime}
                              onChange={(e) => handleWorkingHoursChange(day, 'endTime', e.target.value)}
                            />
                          </td>
                          <td>
                            {isWorkingDay ? (
                              <button 
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => {
                                  handleWorkingHoursChange(day, 'startTime', '');
                                  handleWorkingHoursChange(day, 'endTime', '');
                                }}
                              >
                                <X size={14} />
                                Clear
                              </button>
                            ) : (
                              <span className="text-sm">Off</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Set working hours for each day or leave blank for days off.
              </p>
            </div>

            <div className="form-control mt-6">
              <label className="label">
                <span className="label-text font-semibold">Doctor Fees</span>
              </label>
              
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Fee Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(formData.doctor_fees).map(([feeType, amount]) => (
                      <tr key={feeType}>
                        <td>{feeType}</td>
                        <td>
                          <input
                            type="number"
                            className="input input-bordered input-sm w-full max-w-xs"
                            value={amount}
                            onChange={(e) => handleFeeChange(feeType, e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline btn-error"
                            onClick={() => removeFeeType(feeType)}
                          >
                            <X size={14} />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-full max-w-xs"
                          id="newFeeType"
                          placeholder="Regular Visit, Emergency, etc."
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full max-w-xs"
                          id="newFeeAmount"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline btn-success"
                          onClick={() => {
                            const feeType = document.getElementById('newFeeType').value;
                            const amount = document.getElementById('newFeeAmount').value;
                            if (feeType) {
                              addFeeType(feeType, amount);
                              document.getElementById('newFeeType').value = '';
                              document.getElementById('newFeeAmount').value = '';
                            }
                          }}
                        >
                          Add Fee
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Set different fee amounts for various service types (e.g., Regular Visit, Emergency, Surgery).
              </p>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowEditModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateDoctor}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove Doctor Confirmation Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Remove Doctor</h3>
            <p className="py-4">
              Are you sure you want to remove Dr. {confirmRemove.name} from this hospital?
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setConfirmRemove(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={() => handleRemoveDoctor(confirmRemove.doctor_id)}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Remove Doctor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDoctors;
