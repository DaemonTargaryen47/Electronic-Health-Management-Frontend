"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHospitalById, getHospitalAdmins, addHospitalAdmin, removeHospitalAdmin } from '@/services/hospitalService';
import { getUserByEmail } from '@/services/userService';
import { UserX, UserPlus, Search, Mail, AlertCircle } from 'lucide-react';

const HospitalAdmins = ({ hospitalId }) => {
  const router = useRouter();
  const [hospital, setHospital] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ user_id: '', role: 'admin' });
  const [addError, setAddError] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  
  // New state for email search
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get hospital details
        const hospitalResponse = await getHospitalById(hospitalId);
        if (hospitalResponse.success) {
          setHospital(hospitalResponse.hospital);
        }
        
        // Get hospital admins
        const adminsResponse = await getHospitalAdmins(hospitalId);
        if (adminsResponse.success) {
          setAdmins(adminsResponse.admins);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load hospital information');
        console.error('Error loading hospital data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (hospitalId) {
      fetchData();
    }
  }, [hospitalId]);

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
      setAddError('User ID is required');
      return;
    }
    
    try {
      const response = await addHospitalAdmin(
        hospitalId, 
        newAdmin.user_id, 
        newAdmin.role
      );
      
      if (response.success) {
        // Refresh admin list
        const adminsResponse = await getHospitalAdmins(hospitalId);
        if (adminsResponse.success) {
          setAdmins(adminsResponse.admins);
        }
        
        // Reset form and close modal
        setNewAdmin({ user_id: '', role: 'admin' });
        setFoundUser(null);
        setSearchEmail('');
        setShowAddModal(false);
        setAddError(null);
      }
    } catch (err) {
      setAddError(err.message || 'Failed to add administrator');
      console.error('Error adding admin:', err);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      const response = await removeHospitalAdmin(hospitalId, userId);
      
      if (response.success) {
        // Refresh admin list
        const adminsResponse = await getHospitalAdmins(hospitalId);
        if (adminsResponse.success) {
          setAdmins(adminsResponse.admins);
        }
        setRemoveConfirm(null);
        setRemoveError(null);
      }
    } catch (err) {
      setRemoveError(err.message || 'Failed to remove administrator');
      console.error('Error removing admin:', err);
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
          <Link href={`/hospitals/${hospitalId}`} className="btn btn-primary">
            Return to Hospital
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hospital Administrators</h1>
          <h2 className="text-lg">{hospital?.name}</h2>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/hospitals/${hospitalId}`} className="btn btn-outline">
            Back to Hospital
          </Link>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} />
            Add Admin
          </button>
        </div>
      </div>

      {admins.length === 0 ? (
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

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add New Administrator</h3>
            
            {addError && (
              <div className="alert alert-error mt-2 mb-2">
                <span>{addError}</span>
              </div>
            )}
            
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
                        setShowAddModal(false);
                        setAddError(null);
                        setFoundUser(null);
                        setSearchEmail('');
                        setSearchError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Administrator
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
                      setShowAddModal(false);
                      setAddError(null);
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
            
            {removeError && (
              <div className="alert alert-error mt-2 mb-2">
                <span>{removeError}</span>
              </div>
            )}
            
            <p className="py-4">
              Are you sure you want to remove {removeConfirm.name} as an administrator? 
              This action cannot be undone.
            </p>
            
            <div className="modal-action">
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setRemoveConfirm(null);
                  setRemoveError(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={() => handleRemoveAdmin(removeConfirm.user_id)}
              >
                Remove Administrator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalAdmins;
