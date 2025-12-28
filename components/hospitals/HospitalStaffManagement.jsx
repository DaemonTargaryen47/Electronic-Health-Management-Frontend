"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHospitalById } from '@/services/hospitalService';
import { 
  getHospitalStaff, addHospitalStaff, removeHospitalStaff, updateStaffRole 
} from '@/services/hospitalStaffService';
import { isAuthenticated } from '@/services/authService';
import { 
  UserX, UserPlus, Search, Mail, AlertCircle, ArrowLeft, 
  Clipboard, Stethoscope, Heart
} from 'lucide-react';
import BACKEND_SERVER from '@/config';
import { authFetch } from '@/utils/authUtils';

// Function to get user by email using the correct endpoint
const getUserByEmail = async (email) => {
  try {
    const response = await authFetch(`${BACKEND_SERVER}/api/auth/user-by-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        message: data.message || `User with email ${email} not found`,
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

const HospitalStaffManagement = ({ hospitalId }) => {
  const router = useRouter();
  const [hospital, setHospital] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaffRole, setNewStaffRole] = useState('nurse');
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [filteredRole, setFilteredRole] = useState('');

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

  // Add useEffect to fetch staff members when filteredRole changes
  useEffect(() => {
    if (hospital) {
      fetchStaffMembers();
    }
  }, [filteredRole]);

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
      
      // Fetch hospital staff
      await fetchStaffMembers();
    } catch (err) {
      setError(err.message || 'An error occurred while loading data');
      console.error('Error loading hospital data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await getHospitalStaff(hospitalId, filteredRole || null);
      
      if (response.success) {
        setStaffMembers(response.staff || []);
      } else {
        setError('Failed to load hospital staff');
      }
    } catch (err) {
      setError(err.message || 'Failed to load hospital staff');
      console.error('Error loading staff:', err);
    }
  };

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
        // Check if user is already a staff member
        const isAlreadyStaff = staffMembers.some(staff => staff.user_id === response.user.user_id);
        
        if (isAlreadyStaff) {
          setSearchError('This user is already a staff member at this hospital');
        } else {
          setFoundUser(response.user);
        }
      }
    } catch (err) {
      setSearchError(err.message || 'User not found');
      console.error('Error searching for user:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!foundUser) return;
    
    try {
      setSearchLoading(true);
      setSearchError(null);
      
      const response = await addHospitalStaff(hospitalId, foundUser.user_id, newStaffRole);
      
      if (response.success) {
        setShowAddModal(false);
        setFoundUser(null);
        setSearchEmail('');
        setNewStaffRole('nurse');
        
        // Refresh staff list
        await fetchStaffMembers();
        showSuccessMessage('Staff member added successfully');
      } else {
        setSearchError(response.message || 'Failed to add staff member');
      }
    } catch (err) {
      setSearchError(err.message || 'An error occurred while adding staff member');
      console.error('Error adding staff member:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdateRole = async (staffId, newRole) => {
    try {
      setLoading(true);
      
      const response = await updateStaffRole(staffId, newRole);
      
      if (response.success) {
        setEditingStaff(null);
        await fetchStaffMembers();
        showSuccessMessage('Staff role updated successfully');
      } else {
        setError('Failed to update staff role');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating staff role');
      console.error('Error updating staff role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    try {
      setLoading(true);
      
      const response = await removeHospitalStaff(staffId);
      
      if (response.success) {
        setRemoveConfirm(null);
        await fetchStaffMembers();
        showSuccessMessage('Staff member removed successfully');
      } else {
        setError('Failed to remove staff member');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while removing staff member');
      console.error('Error removing staff member:', err);
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'nurse':
        return <Heart size={16} className="mr-1 text-pink-500" />;
      case 'pathologist':
        return <Clipboard size={16} className="mr-1 text-indigo-500" />;
      default:
        return <UserPlus size={16} className="mr-1" />;
    }
  };
  
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'nurse':
        return 'badge-pink';
      case 'pathologist':
        return 'badge-indigo';
      default:
        return 'badge-primary';
    }
  };

  const handleFilterChange = (role) => {
    setFilteredRole(role);
    // No need to call fetchStaffMembers here as the useEffect will handle it
  };

  if (loading && !staffMembers.length) {
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
          <h1 className="text-2xl font-bold">Hospital Staff</h1>
          {hospital && <h2 className="text-lg">{hospital.name}</h2>}
        </div>
        
        <div className="flex gap-2">
          <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-outline">
            <ArrowLeft size={18} />
            Back to Hospital Management
          </Link>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} />
            Add Staff Member
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
      
      {/* Role filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="btn-group">
          <button 
            className={`btn ${filteredRole === '' ? 'btn-active' : ''}`}
            onClick={() => handleFilterChange('')}
          >
            All
          </button>
          <button 
            className={`btn ${filteredRole === 'nurse' ? 'btn-active' : ''}`}
            onClick={() => handleFilterChange('nurse')}
          >
            <Heart size={16} className="mr-1" />
            Nurses
          </button>
          <button 
            className={`btn ${filteredRole === 'pathologist' ? 'btn-active' : ''}`}
            onClick={() => handleFilterChange('pathologist')}
          >
            <Clipboard size={16} className="mr-1" />
            Pathologists
          </button>
          <button 
            className={`btn ${filteredRole === 'other' ? 'btn-active' : ''}`}
            onClick={() => handleFilterChange('other')}
          >
            Other Staff
          </button>
        </div>
      </div>
      
      {/* Staff list */}
      {staffMembers.length === 0 ? (
        <div className="text-center py-8 bg-base-200 rounded-lg">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No staff members found</h3>
          <p className="mt-1 text-gray-500">
            {filteredRole ? `No ${filteredRole} staff members were found.` : 'This hospital has no staff members yet.'}
          </p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={16} className="mr-1" />
            Add Staff Member
          </button>
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
              {staffMembers.map((staff) => (
                <tr key={staff.hospital_staff_id}>
                  <td>{staff.user_name}</td>
                  <td>{staff.user_email}</td>
                  <td>
                    {editingStaff && editingStaff.hospital_staff_id === staff.hospital_staff_id ? (
                      <select 
                        className="select select-bordered select-sm"
                        value={editingStaff.role}
                        onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                      >
                        <option value="nurse">Nurse</option>
                        <option value="pathologist">Pathologist</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="flex items-center">
                        {getRoleIcon(staff.role)}
                        <span className={`badge ${getRoleBadgeClass(staff.role)}`}>
                          {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingStaff && editingStaff.hospital_staff_id === staff.hospital_staff_id ? (
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleUpdateRole(staff.hospital_staff_id, editingStaff.role)}
                        >
                          Save
                        </button>
                        <button 
                          className="btn btn-sm btn-ghost"
                          onClick={() => setEditingStaff(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => setEditingStaff(staff)}
                        >
                          Edit Role
                        </button>
                        <button 
                          className="btn btn-sm btn-error"
                          onClick={() => setRemoveConfirm(staff)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">Add New Staff Member</h3>
            
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
                
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Staff Role</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                  >
                    <option value="nurse">Nurse</option>
                    <option value="pathologist">Pathologist</option>
                    <option value="other">Other Staff</option>
                  </select>
                  <div className="mt-2 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      <li><strong>Nurses:</strong> can view patient information and appointments</li>
                      <li><strong>Pathologists:</strong> can submit test results for appointments</li>
                      <li><strong>Other Staff:</strong> general access to hospital information</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 gap-2">
                  <button 
                    type="button" 
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowAddModal(false);
                      setFoundUser(null);
                      setSearchEmail('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleAddStaff}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>Add as Staff</>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {!foundUser && (
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    setShowAddModal(false);
                    setSearchEmail('');
                    setSearchError(null);
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Remove Staff Confirmation Modal */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Remove Staff Member</h3>
            <p className="py-4">
              Are you sure you want to remove {removeConfirm.user_name} as a {removeConfirm.role} from this hospital? 
              This action cannot be undone.
            </p>
            
            <div className="modal-action">
              <button 
                type="button" 
                className="btn" 
                onClick={() => setRemoveConfirm(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={() => handleRemoveStaff(removeConfirm.hospital_staff_id)}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Remove Staff"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalStaffManagement;
