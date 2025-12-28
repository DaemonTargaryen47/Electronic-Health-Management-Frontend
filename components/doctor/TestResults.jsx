"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getDoctorTestResults } from '@/services/doctorDashboardService';
import { FileText, Filter, Search, ArrowLeft, Clock, FilePlus2 } from 'lucide-react';

const TestResults = () => {
  const router = useRouter();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchTestResults();
  }, [router, page]);
  
  const fetchTestResults = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await getDoctorTestResults(limit, offset);
      
      if (response.success) {
        if (page === 1) {
          setTestResults(response.test_results || []);
        } else {
          setTestResults(prev => [...prev, ...(response.test_results || [])]);
        }
        
        // Check if there might be more results to load
        setHasMore(response.test_results && response.test_results.length === limit);
      } else {
        setError('Failed to load test results');
      }
    } catch (err) {
      setError('An error occurred while fetching test results');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const filteredResults = searchQuery 
    ? testResults.filter(result => 
        result.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : testResults;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.push('/doctor')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Test Results</h1>
        
        <div className="w-full md:w-auto">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search results..."
              className="input input-bordered"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="btn btn-square">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}
      
      {loading && page === 1 ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <FilePlus2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium">No test results found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery 
              ? 'No test results match your search query' 
              : 'There are no test results available yet'}
          </p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-md overflow-x-auto">
          <div className="card-body p-0">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Test Type</th>
                  <th>Results</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result.result_id}>
                    <td>
                      <div className="flex flex-col">
                        <span>{formatDate(result.result_date)}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {new Date(result.result_date).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{result.patient_name}</div>
                      <div className="text-xs">ID: {result.patient_id}</div>
                    </td>
                    <td>
                      <span className="badge badge-outline">{result.service_name}</span>
                    </td>
                    <td>
                      {result.result_details ? (
                        <div className="max-w-xs">
                          <details>
                            <summary className="cursor-pointer">View Results</summary>
                            <pre className="text-xs mt-2 whitespace-pre-wrap">
                              {JSON.stringify(result.result_details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <span className="text-gray-500">No details available</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => router.push(`/doctor/patients/${result.patient_id}`)}
                        >
                          View Patient
                        </button>
                        {result.result_file && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => window.open(result.result_file, '_blank')}
                          >
                            <FileText size={16} />
                            View File
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {loading && page > 1 && (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}
            
            {hasMore && !loading && (
              <div className="flex justify-center py-4">
                <button 
                  className="btn btn-outline"
                  onClick={() => setPage(page + 1)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;
