"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllAdmins, addAdmin, removeAdmin } from '@/services/adminService';
import { isAuthenticated, isAdmin } from '@/services/authService';
import { UserPlus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';

const AdminList = () => {
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [processingUser, setProcessingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      // Just use the synchronous check which now uses caching
      if (!isAdmin()) {
        router.push('/unauthorized');
        return;
      }
      
      await fetchAdmins();
    };
    
    checkAccess();
  }, [router]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await getAllAdmins();
      
      if (response.success) {
        setAdmins(response.admins);
      } else {
        setError('Failed to load admins');
      }
    } catch (err) {
      setError('An error occurred while fetching admins');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newUserEmail.trim()) {
      setError('Please enter a user email');
      return;
    }
    
    try {
      setProcessingUser(newUserEmail);
      setError(null);
      
      const response = await addAdmin(newUserEmail);
      
      if (response.success) {
        setNewUserEmail('');
        await fetchAdmins();
      } else {
        setError(response.message || 'Failed to add admin');
      }
    } catch (err) {
      setError('Failed to add admin');
      console.error('Error adding admin:', err);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    try {
      setProcessingUser(adminId);
      setError(null);
      
      const response = await removeAdmin(adminId);
      
      if (response.success) {
        setAdmins(admins.filter(admin => admin.synapai_admin_id !== adminId));
        setConfirmDelete(null);
      } else {
        setError(response.message || 'Failed to remove admin');
      }
    } catch (err) {
      setError('Failed to remove admin');
      console.error('Error removing admin:', err);
    } finally {
      setProcessingUser(null);
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
        <h1 className="text-3xl font-bold">System Administrators</h1>
        <button 
          onClick={() => router.push('/admin')}
          className="btn btn-outline mt-2 md:mt-0 flex items-center gap-2"
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
      
      <div className="card bg-base-100 shadow-md mb-8">
        <div className="card-body">
          <h2 className="card-title text-xl">Add New Admin</h2>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <input 
              type="email" 
              placeholder="User email address" 
              className="input input-bordered w-full md:flex-1" 
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleAddAdmin}
              disabled={processingUser === newUserEmail}
            >
              {processingUser === newUserEmail ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <UserPlus size={18} />
                  Add Admin
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Current Administrators</h2>
          
          {admins.length === 0 ? (
            <div className="alert alert-info">
              <span>No administrators found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.synapai_admin_id}>
                      <td>{admin.synapai_admin_id}</td>
                      <td>{`${admin.name}`}</td>
                      <td>{admin.email}</td>
                      <td>
                        {admins.length > 1 ? (
                          <button 
                            className="btn btn-error btn-sm" 
                            onClick={() => setConfirmDelete(admin.synapai_admin_id)}
                            disabled={processingUser === admin.synapai_admin_id}
                          >
                            {processingUser === admin.synapai_admin_id ? (
                              <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                              <>
                                <Trash2 size={16} />
                                Remove
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="tooltip" data-tip="Cannot remove the last admin">
                            <button className="btn btn-error btn-sm" disabled>
                              <Trash2 size={16} />
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
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center">
              <AlertTriangle className="text-warning mr-2" size={24} />
              Confirm Admin Removal
            </h3>
            <p className="py-4">
              Are you sure you want to remove this administrator? 
              This will revoke their system-wide administrative privileges.
            </p>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={() => handleRemoveAdmin(confirmDelete)}
              >
                Remove Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;
