import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isAuthenticated, getAuthHeader } from '@/services/authService';
import { API_URL } from '@/config/index';
import { StethoscopeIcon } from 'lucide-react';

const HospitalDetails = ({ hospitalId }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is an admin for this hospital
    const checkAdminStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/hospitals/${hospitalId}/is_admin`, {
          headers: getAuthHeader()
        });
        const data = await response.json();
        setIsAdmin(data.is_admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    if (isAuthenticated()) {
      checkAdminStatus();
    }
  }, [hospitalId]);

  return (
    <div>
      {/* ...existing code... */}

      {isAdmin && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Administrator Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link href={`/hospitals/${hospitalId}/manage`} className="btn btn-primary">
              Manage Hospital
            </Link>
            <Link href={`/hospitals/${hospitalId}/doctors`} className="btn btn-success">
              <StethoscopeIcon size={16} className="mr-1" />
              Manage Doctors
            </Link>
            <Link href={`/hospitals/${hospitalId}/admins`} className="btn btn-outline">
              Manage Administrators
            </Link>
          </div>
        </div>
      )}

      {/* ...existing code... */}
    </div>
  );
};

export default HospitalDetails;