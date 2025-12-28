"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllHospitals, searchHospitals, checkHospitalAdminStatus } from '@/services/hospitalService';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { Search, Settings } from 'lucide-react';

const HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userAdminStatus, setUserAdminStatus] = useState({});
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const limit = 10;

  useEffect(() => {
    // Check if user is logged in
    setUserIsLoggedIn(isAuthenticated());
  }, []);

  const fetchHospitals = async (reset = false) => {
    try {
      setLoading(true);
      const newOffset = reset ? 0 : offset;
      
      const response = await getAllHospitals(limit, newOffset);
      
      if (reset) {
        setHospitals(response.hospitals);
      } else {
        setHospitals(prev => [...prev, ...response.hospitals]);
      }
      
      setHasMore(response.hospitals.length === limit);
      setOffset(newOffset + limit);
      setError(null);
      
      // If user is logged in, check admin status for each hospital
      if (isAuthenticated()) {
        checkAdminStatusForHospitals(response.hospitals);
      }
    } catch (err) {
      setError(err.message || 'Failed to load hospitals');
      console.error('Error loading hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatusForHospitals = async (hospitalsList) => {
    try {
      if (!isAuthenticated()) return;
      
      const user = getCurrentUser();
      if (!user) return;
      
      const adminStatuses = {};
      
      for (const hospital of hospitalsList) {
        try {
          // Use hospitalService method instead of direct fetch call
          const isAdmin = await checkHospitalAdminStatus(hospital.hospital_id);
          adminStatuses[hospital.hospital_id] = isAdmin;
        } catch (error) {
          console.error(`Error checking admin status for hospital ${hospital.hospital_id}:`, error);
          adminStatuses[hospital.hospital_id] = false;
        }
      }
      
      setUserAdminStatus(adminStatuses);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchHospitals(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await searchHospitals(searchQuery, limit, 0);
      
      setHospitals(response.hospitals);
      setHasMore(response.hospitals.length === limit);
      setOffset(limit);
      
      // Check admin status for search results if user is authenticated
      if (isAuthenticated()) {
        checkAdminStatusForHospitals(response.hospitals);
      }
    } catch (err) {
      setError(err.message || 'Failed to search hospitals');
      console.error('Error searching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hospitals</h1>
        <Link href="/hospitals/new" className="btn btn-primary">
          Register Your Hospital
        </Link>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Search hospitals by name, address, or specialty"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={20} />
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((hospital) => (
          <div key={hospital.hospital_id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body">
              <h2 className="card-title">
                {hospital.name}
                {hospital.advertised && (
                  <span className="badge badge-secondary">Featured</span>
                )}
              </h2>
              <p className="text-sm">{hospital.address}</p>
              
              {hospital.specialties && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {hospital.specialties.split(',').map((specialty, index) => (
                    <span key={index} className="badge badge-outline">{specialty.trim()}</span>
                  ))}
                </div>
              )}
              
              <div className="card-actions justify-end mt-4">
                <Link href={`/hospitals/${hospital.hospital_id}`} className="btn btn-primary btn-sm">
                  View Details
                </Link>
                
                {userIsLoggedIn && userAdminStatus[hospital.hospital_id] && (
                  <Link href={`/hospitals/${hospital.hospital_id}/manage`} className="btn btn-outline btn-sm">
                    <Settings size={16} className="mr-1" /> Manage
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hospitals.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No hospitals found. 
            {searchQuery && !isAuthenticated() && ' For personalized search results, consider logging in.'}
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {hasMore && hospitals.length > 0 && (
        <div className="text-center mt-8">
          <button 
            className="btn btn-outline"
            onClick={() => fetchHospitals()}
            disabled={loading}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default HospitalList;
