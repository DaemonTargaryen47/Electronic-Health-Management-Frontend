"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/services/authService';
import { getPendingTests } from '@/services/hospitalStaffService';
import { AlertCircle, CheckCircle, ArrowLeft, Search, Calendar, Filter } from 'lucide-react';

const PendingTestsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTests, setFilteredTests] = useState([]);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      await fetchPendingTests();
    };
    
    checkAuth();
  }, [router]);
  
  const fetchPendingTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPendingTests(100, 0); // Get up to 100 pending tests
      
      if (response.success) {
        setPendingTests(response.tests || []);
        setFilteredTests(response.tests || []);
      } else {
        setError('Failed to load pending tests');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading tests');
      console.error('Error loading pending tests:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredTests(pendingTests);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = pendingTests.filter(test => {
      return (
        test.patient_name.toLowerCase().includes(query) ||
        test.service_name.toLowerCase().includes(query) ||
        (test.patient_number && test.patient_number.toLowerCase().includes(query))
      );
    });
    
    setFilteredTests(filtered);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <div className="flex items-center mb-6 gap-4">
        <Link href="/staff/pathologist/dashboard" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Pending Tests</h1>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 mb-6 justify-between">
        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search by patient name or test..."
              className="input input-bordered"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-square btn-primary" onClick={handleSearch}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Test List */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-8 bg-base-200 rounded-lg">
          <CheckCircle className="mx-auto h-12 w-12 text-success opacity-50" />
          <h3 className="mt-2 text-xl font-medium">No pending tests found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? 'Try a different search term or clear filters.' : 'You don\'t have any pending tests at the moment.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test</th>
                <th>Date</th>
                <th>Hospital</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr key={test.appointment_service_id}>
                  <td>
                    <div className="font-medium">{test.patient_name}</div>
                    <div className="text-sm text-base-content/70">
                      ID: {test.patient_id}
                      {test.patient_number && ` (${test.patient_number})`}
                    </div>
                  </td>
                  <td>{test.service_name}</td>
                  <td>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      {formatDate(test.appointment_time)}
                    </div>
                  </td>
                  <td>{test.hospital_name || '-'}</td>
                  <td>
                    <Link 
                      href={`/staff/pathologist/tests/${test.appointment_service_id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      Submit Result
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingTestsPage;
