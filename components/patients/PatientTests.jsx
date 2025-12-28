"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getMyPendingTests, getMyTestResults } from '@/services/patientTestService';
import { 
  AlertCircle, FilePlus, FileText, ChevronRight, FlaskConical, 
  Clock, Calendar, Building2, ArrowLeft, Search 
} from 'lucide-react';
import Link from 'next/link';

const PatientTests = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchData();
    
    // Store the current timestamp when viewing results to track new notifications
    if (activeTab === 'results') {
      localStorage.setItem('lastTestResultsCheckedAt', new Date().toISOString());
    }
  }, [router, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get pending tests
      const pendingResponse = await getMyPendingTests();
      if (pendingResponse.success) {
        setPendingTests(pendingResponse.pending_tests || []);
      } else {
        throw new Error(pendingResponse.message || 'Failed to fetch pending tests');
      }
      
      // Get test results
      const resultsResponse = await getMyTestResults();
      if (resultsResponse.success) {
        setTestResults(resultsResponse.test_results || []);
      } else {
        throw new Error(resultsResponse.message || 'Failed to fetch test results');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      console.error('Error fetching patient tests data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // New function to format result details for better display
  const formatResultDetails = (details) => {
    if (!details) return null;
    
    // Parse the details if it's a string
    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
    
    // Helper function to render any value, including nested objects
    const renderValue = (value) => {
      if (value === null || value === undefined) return 'N/A';
      
      if (typeof value === 'object') {
        return (
          <div className="pl-2 border-l-2 border-gray-300">
            {Object.entries(value).map(([subKey, subValue]) => (
              <div key={subKey} className="grid grid-cols-2 gap-1 text-xs py-1">
                <span className="font-medium capitalize">{subKey.replace(/_/g, ' ')}:</span>
                <span>{renderValue(subValue)}</span>
              </div>
            ))}
          </div>
        );
      }
      
      return String(value); // Convert to string to ensure safe rendering
    };
    
    return (
      <div className="space-y-2">
        {Object.entries(parsedDetails).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-2 py-1">
            <div className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</div>
            <div>{renderValue(value)}</div>
          </div>
        ))}
      </div>
    );
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter results based on search query
  const filteredPendingTests = searchQuery 
    ? pendingTests.filter(test => 
        test.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pendingTests;
  
  const filteredTestResults = searchQuery 
    ? testResults.filter(result => 
        result.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : testResults;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <h1 className="text-3xl font-bold mb-6">My Medical Tests</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="tabs tabs-boxed mb-6">
        <a 
          className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} className="mr-2" />
          Pending Tests {pendingTests.length > 0 && `(${pendingTests.length})`}
        </a>
        <a 
          className={`tab ${activeTab === 'results' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <FileText size={16} className="mr-2" />
          Test Results {testResults.length > 0 && `(${testResults.length})`}
        </a>
      </div>
      
      <div className="mb-6">
        <div className="input-group w-full max-w-xs">
          <input
            type="text"
            placeholder="Search tests..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className="btn btn-square">
            <Search size={18} />
          </button>
        </div>
      </div>
      
      {/* Pending Tests Tab */}
      {activeTab === 'pending' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl flex items-center gap-2 mb-4">
              <FlaskConical className="text-primary" />
              Pending Tests
            </h2>
            
            {filteredPendingTests.length === 0 ? (
              <div className="text-center py-10">
                <FlaskConical size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium">No pending tests</p>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? 'No tests match your search criteria' : 'You have no tests waiting for results'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Hospital</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingTests.map((test) => (
                      <tr key={test.appointment_service_id}>
                        <td>
                          <div className="font-medium">{test.service_name}</div>
                          {test.description && (
                            <div className="text-xs text-gray-500">{test.description}</div>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Building2 size={14} className="mr-1 text-gray-500" />
                            {test.hospital_name}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span>{formatDate(test.appointment_time)}</span>
                            <span className="text-xs text-gray-500">{formatTime(test.appointment_time)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline">Pending</span>
                        </td>
                        <td>
                          <Link 
                            href={`/appointments/${test.appointment_id}`}
                            className="btn btn-sm btn-outline"
                          >
                            View Appointment
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Test Results Tab */}
      {activeTab === 'results' && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-xl flex items-center gap-2 mb-4">
              <FileText className="text-primary" />
              Test Results
            </h2>
            
            {filteredTestResults.length === 0 ? (
              <div className="text-center py-10">
                <FilePlus size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium">No test results found</p>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? 'No results match your search criteria' : 'You do not have any test results yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Hospital</th>
                      <th>Result Date</th>
                      <th>Results</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestResults.map((result) => (
                      <tr key={result.result_id}>
                        <td>
                          <div className="font-medium">{result.service_name}</div>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Building2 size={14} className="mr-1 text-gray-500" />
                            {result.hospital_name}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span>{formatDate(result.result_date)}</span>
                            <span className="text-xs text-gray-500">{formatTime(result.result_date)}</span>
                          </div>
                        </td>
                        <td>
                          {result.result_details ? (
                            <div className="max-w-xs">
                              <details className="cursor-pointer">
                                <summary className="font-medium text-primary">View Details</summary>
                                <div className="mt-2 p-3 bg-base-200 rounded text-sm">
                                  {formatResultDetails(result.result_details)}
                                </div>
                              </details>
                            </div>
                          ) : (
                            <span className="text-gray-500">No details</span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col gap-2">
                            {result.result_file && (
                              <a 
                                href={result.result_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline"
                              >
                                <FileText size={14} className="mr-1" />
                                View File
                              </a>
                            )}
                            <Link 
                              href={`/appointments/${result.appointment_id}`}
                              className="btn btn-sm btn-outline"
                            >
                              View Appointment
                            </Link>
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
      )}
    </div>
  );
};

export default PatientTests;
