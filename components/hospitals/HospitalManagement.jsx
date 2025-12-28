"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { updateHospital, deleteHospital, getHospitalAdmins, addHospitalAdmin, removeHospitalAdmin } from '@/services/hospitalService';
import { getUserByEmail } from '@/services/userService';
import { Trash2, Save, AlertTriangle, UserPlus, UserX, Search, Mail, AlertCircle, Users, MapPin, StethoscopeIcon, Clipboard } from 'lucide-react';
import MapboxLocationPicker from '@/components/maps/MapboxLocationPicker';
import HospitalServices from './HospitalServices';

export default function HospitalManagement({ hospital, refreshData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: '',
    contact_info: '',
    specialties: '',
    advertised: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Admin management state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ user_id: '', role: 'admin' });
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        address: hospital.address || '',
        location: hospital.location || '',
        contact_info: hospital.contact_info || '',
        specialties: hospital.specialties || '',
        advertised: hospital.advertised || false
      });
      
      // Load hospital admins
      fetchAdmins();
    }
  }, [hospital]);

  // Helper function to format location for display
  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    
    try {
      // If location is a string but contains JSON
      if (typeof location === 'string' && (location.includes('{') || location.includes('['))) {
        const parsed = JSON.parse(location);
        if (parsed.lat && parsed.lng) {
          return `${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`;
        }
      }
      
      // If location is already an object
      if (typeof location === 'object' && location !== null) {
        if (location.lat && location.lng) {
          return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        }
      }
      
      // If it's just a string
      return location;
    } catch (e) {
      return String(location);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLocationChange = (value) => {
    setFormData({
      ...formData,
      location: value
    });
  };

  // Function to fetch hospital administrators
  const fetchAdmins = async () => {
    if (!hospital || !hospital.hospital_id) return;
    
    setLoadingAdmins(true);
    setAdminError(null);
    
    try {
      const response = await getHospitalAdmins(hospital.hospital_id);
      
      if (response.success) {
        setAdmins(response.admins || []);
      } else {
        setAdminError(response.message || 'Failed to load administrators');
      }
    } catch (error) {
      setAdminError('Error loading administrators: ' + (error.message || 'Unknown error'));
      console.error('Error fetching hospital admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Function to display a message temporarily
  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Prepare data for submission, ensuring location is properly serialized
      const dataToSubmit = {
        ...formData,
        // Ensure location is a string if it's an object
        location: typeof formData.location === 'object' 
          ? JSON.stringify(formData.location) 
          : formData.location
      };
      
      // Use the updateHospital service which handles authentication
      const result = await updateHospital(hospital.hospital_id, dataToSubmit);
      
      if (result.success) {
        showMessage('Hospital details updated successfully');
        setIsEditing(false);
        if (refreshData) refreshData();
      } else {
        showMessage(result.message || 'Failed to update hospital', true);
      }
    } catch (error) {
      showMessage('Error updating hospital: ' + (error.message || 'Unknown error'), true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const result = await deleteHospital(hospital.hospital_id);
      if (result.success) {
        showMessage('Hospital deleted successfully');
        router.push('/hospitals');
      } else {
        showMessage(result.message || 'Failed to delete hospital', true);
      }
    } catch (error) {
      showMessage('Error deleting hospital: ' + (error.message || 'Unknown error'), true);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Admin management functions
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setSearchError('Email is required');
      return;
    }
    
    try {
      setSearchLoading(true);
      setSearchError(null);
      setFoundUser(null);
      
      const response = await getUserByEmail(searchEmail);
      
      if (response.success && response.user) {
        // Check if user is already an admin
        const isAlreadyAdmin = admins.some(admin => admin.user_id === response.user.user_id);
        
        if (isAlreadyAdmin) {
          setSearchError('This user is already an administrator for this hospital');
        } else {
          setFoundUser(response.user);
          // Pre-fill the user_id in the newAdmin state
          setNewAdmin({
            ...newAdmin,
            user_id: response.user.user_id
          });
        }
      }
    } catch (err) {
      setSearchError(err.message || 'User not found');
      console.error('Error searching for user:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdmin.user_id) {
      setSearchError('User ID is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await addHospitalAdmin(
        hospital.hospital_id, 
        newAdmin.user_id, 
        newAdmin.role
      );
      
      if (response.success) {
        // Refresh admin list
        await fetchAdmins();
        
        // Reset form and close modal
        setNewAdmin({ user_id: '', role: 'admin' });
        setFoundUser(null);
        setSearchEmail('');
        setShowAddAdminModal(false);
        showMessage('Administrator added successfully');
      }
    } catch (err) {
      setSearchError(err.message || 'Failed to add administrator');
      console.error('Error adding admin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      setIsSubmitting(true);
      const response = await removeHospitalAdmin(hospital.hospital_id, userId);
      
      if (response.success) {
        // Refresh admin list
        await fetchAdmins();
        setRemoveConfirm(null);
        showMessage('Administrator removed successfully');
      }
    } catch (err) {
      showMessage('Failed to remove administrator: ' + (err.message || 'Unknown error'), true);
      console.error('Error removing admin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hospital) {
    return (
      <div className="text-center py-10">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hospital Management</h1>
        <div className="flex gap-2">
          <Link href={`/hospitals/${hospital.hospital_id}/doctors`} 
                className="btn btn-success">
            <StethoscopeIcon size={18} className="mr-1" />
            Manage Doctors
          </Link>
          <Link href={`/hospitals/${hospital.hospital_id}/staff`} 
                className="btn btn-secondary">
            <Clipboard size={18} className="mr-1" />
            Manage Staff
          </Link>
        </div>
      </div>

      

      {successMessage && (
        <div className="alert alert-success">
          <span>{successMessage}</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="alert alert-error">
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        
        <div className="flex space-x-2">
          <button 
            className="btn btn-error" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={18} className="mr-1" /> Delete Hospital
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="tabs tabs-bordered">
        <button 
          className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Hospital Details
        </button>
        <button 
          className={`tab ${activeTab === 'admins' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          <Users size={16} className="mr-1" /> Administrators
        </button>
      </div>

      {/* Hospital Details Tab */}
      {activeTab === 'details' && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Hospital Information</h3>
            {!isEditing ? (
              <button 
                className="btn btn-primary" 
                onClick={() => setIsEditing(true)}
              >
                Edit Hospital
              </button>
            ) : (
              <button 
                className="btn btn-ghost" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Hospital Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Location</span>
                </label>
                <MapboxLocationPicker
                  value={formData.location}
                  onChange={handleLocationChange}
                />
                <div className="text-sm text-gray-500 mt-1">
                  Current coordinates: {formatLocation(formData.location)}
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact Information</span>
                </label>
                <input
                  type="text"
                  name="contact_info"
                  value={formData.contact_info}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Specialties</span>
                </label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Cardiology, Neurology, etc."
                />
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    name="advertised"
                    checked={formData.advertised}
                    onChange={handleInputChange}
                    className="checkbox"
                  />
                  <span className="label-text">Featured Hospital</span>
                </label>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Save size={18} className="mr-1" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-lg">Basic Information</h3>
                  <p><strong>Name:</strong> {hospital.name}</p>
                  <p><strong>Address:</strong> {hospital.address}</p>
                  <p className="flex items-center">
                    <strong>Location:</strong> 
                    <span className="flex items-center ml-1">
                      <MapPin size={14} className="mr-1" />
                      {formatLocation(hospital.location)}
                    </span>
                  </p>
                  <p><strong>Contact:</strong> {hospital.contact_info}</p>
                </div>
              </div>
              
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-lg">Additional Details</h3>
                  <p><strong>Specialties:</strong> {hospital.specialties || "None specified"}</p>
                  <p><strong>Rating:</strong> {hospital.rating || "Not rated"}</p>
                  <p><strong>Featured:</strong> {hospital.advertised ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hospital Services Section - Add this new section */}
      <div className="divider my-8"></div>
      <HospitalServices hospitalId={hospital.hospital_id} refreshData={refreshData} />

      {/* Administrators Tab */}
      {activeTab === 'admins' && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Hospital Administrators</h3>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddAdminModal(true)}
            >
              <UserPlus size={18} className="mr-1" /> Add Administrator
            </button>
          </div>

          {loadingAdmins ? (
            <div className="flex justify-center items-center min-h-[10vh]">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : adminError ? (
            <div className="alert alert-error">
              <span>{adminError}</span>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No administrators found for this hospital.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.user_id}>
                      <td>{admin.name}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className={`badge ${admin.role === 'owner' ? 'badge-primary' : 'badge-secondary'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td>
                        {admin.role !== 'owner' && (
                          <button 
                            className="btn btn-error btn-sm"
                            onClick={() => setRemoveConfirm(admin)}
                          >
                            <UserX size={16} />
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Hospital Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg max-w-md w-full">
            <div className="flex flex-col items-center mb-4 text-center">
              <AlertTriangle size={40} className="text-error mb-2" />
              <h3 className="text-lg font-bold">Delete Hospital</h3>
              <p className="py-4">
                Are you sure you want to delete "{hospital.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add New Administrator</h3>
            
            <div className="mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Search User by Email</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    className="input input-bordered flex-1" 
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      setSearchError(null);
                    }}
                    placeholder="Enter user's email address"
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSearchUser}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <Search size={18} />
                    )}
                  </button>
                </div>
                {searchError && (
                  <div className="alert alert-error mt-2 text-sm py-2">
                    <AlertCircle size={16} />
                    <span>{searchError}</span>
                  </div>
                )}
              </div>
              
              {foundUser && (
                <div className="mt-4 p-4 border rounded-lg bg-base-200">
                  <h4 className="font-medium">Found User</h4>
                  <div className="mt-2 space-y-1">
                    <p><strong>Name:</strong> {foundUser.name}</p>
                    <p className="flex items-center">
                      <Mail size={16} className="mr-1" />
                      <span>{foundUser.email}</span>
                    </p>
                    {foundUser.phone && <p><strong>Phone:</strong> {foundUser.phone}</p>}
                  </div>
                </div>
              )}
              
              {foundUser && (
                <form onSubmit={handleAddAdmin} className="mt-4">
                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Role</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  
                  <div className="modal-action">
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => {
                        setShowAddAdminModal(false);
                        setFoundUser(null);
                        setSearchEmail('');
                        setSearchError(null);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        "Add Administrator"
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {!foundUser && (
                <div className="modal-action">
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => {
                      setShowAddAdminModal(false);
                      setSearchEmail('');
                      setSearchError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Admin Confirmation Modal */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Remove Administrator</h3>
            
            <p className="py-4">
              Are you sure you want to remove {removeConfirm.name} as an administrator? 
              This action cannot be undone.
            </p>
            
            <div className="modal-action">
              <button 
                type="button" 
                className="btn" 
                onClick={() => setRemoveConfirm(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={() => handleRemoveAdmin(removeConfirm.user_id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Remove Administrator"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
