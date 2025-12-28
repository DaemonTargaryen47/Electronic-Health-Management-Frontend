"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllDoctors, searchDoctors } from '@/services/doctorService';
import { isAuthenticated } from '@/services/authService';
import { Search, User, Building2 } from 'lucide-react';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);
  const limit = 10;

  useEffect(() => {
    // Check if user is logged in
    setUserIsLoggedIn(isAuthenticated());
  }, []);

  const fetchDoctors = async (reset = false) => {
    try {
      setLoading(true);
      const newOffset = reset ? 0 : offset;
      
      const response = await getAllDoctors({ 
        status: 'approved', 
        limit, 
        offset: newOffset 
      });
      
      if (reset) {
        setDoctors(response.doctors);
      } else {
        setDoctors(prev => [...prev, ...response.doctors]);
      }
      
      setHasMore(response.doctors.length === limit);
      setOffset(newOffset + limit);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load doctors');
      console.error('Error loading doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchDoctors(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await searchDoctors(searchQuery, limit, 0);
      
      setDoctors(response.doctors);
      setHasMore(response.doctors.length === limit);
      setOffset(limit);
    } catch (err) {
      setError(err.message || 'Failed to search doctors');
      console.error('Error searching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(true);
  }, []);

  // Helper function to extract hospital names
  const getHospitalNames = (hospitals) => {
    if (!hospitals || !hospitals.length) return [];
    return hospitals.map(h => h.hospital_name || h.name).filter(Boolean);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doctors</h1>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Search doctors by name, specialty, or hospital"
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
        {doctors.map((doctor) => (
          <div key={doctor.doctor_id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body">
              <h2 className="card-title">
                Dr. {doctor.name || doctor.user_name}
              </h2>
              <p className="text-sm">{doctor.email || doctor.user_email}</p>
              
              {doctor.specialties && doctor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doctor.specialties.map((specialty, index) => (
                    <span key={index} className="badge badge-outline">{specialty}</span>
                  ))}
                </div>
              )}
              
              {doctor.hospitals && doctor.hospitals.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center text-sm mb-2">
                    <Building2 size={16} className="mr-1" />
                    <span>Hospital Affiliations</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getHospitalNames(doctor.hospitals).slice(0, 2).map((name, index) => (
                      <span key={index} className="badge badge-secondary badge-sm">{name}</span>
                    ))}
                    {doctor.hospitals.length > 2 && (
                      <span className="badge badge-secondary badge-sm">+{doctor.hospitals.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="card-actions justify-end mt-4">
                <Link href={`/doctors/${doctor.doctor_id}`} className="btn btn-primary btn-sm">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {doctors.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No doctors found. 
            {searchQuery && !isAuthenticated() && ' For personalized search results, consider logging in.'}
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {hasMore && doctors.length > 0 && (
        <div className="text-center mt-8">
          <button 
            className="btn btn-outline"
            onClick={() => fetchDoctors()}
            disabled={loading}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
