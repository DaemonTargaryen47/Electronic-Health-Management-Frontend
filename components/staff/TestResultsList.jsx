"use client";

import React, { useState } from 'react';
import { Calendar, Download, Eye, ExternalLink, Search, FileText } from 'lucide-react';
import Link from 'next/link';

const TestResultsList = ({ testResults, loading = false, error = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState(testResults || []);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredResults(testResults);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = testResults.filter(result => {
      return (
        result.patient_name?.toLowerCase().includes(query) ||
        result.service_name?.toLowerCase().includes(query) ||
        result.pathologist_name?.toLowerCase().includes(query)
      );
    });
    
    setFilteredResults(filtered);
  };
  
  // Update filtered results when testResults change
  React.useEffect(() => {
    setFilteredResults(testResults || []);
  }, [testResults]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }
  
  if (!testResults || testResults.length === 0) {
    return (
      <div className="text-center py-8 bg-base-200 rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-xl font-medium">No test results found</h3>
        <p className="mt-1 text-gray-500">
          There are no test results available to display
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Search */}
      <div className="form-control mb-4">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search by patient name or test name..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-square btn-primary" onClick={handleSearch}>
            <Search size={18} />
          </button>
        </div>
      </div>
      
      {/* Results list */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Test</th>
              <th>Date</th>
              <th>Pathologist</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <tr key={result.result_id}>
                <td>
                  <div className="font-medium">{result.patient_name}</div>
                </td>
                <td className="font-medium">{result.service_name}</td>
                <td>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2" />
                    {formatDate(result.result_date || result.created_at)}
                  </div>
                </td>
                <td>{result.pathologist_name}</td>
                <td className="flex gap-2">
                  {result.result_file && (
                    <a 
                      href={result.result_file} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-sm btn-ghost"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <Link 
                    href={`/test-results/${result.result_id}`}
                    className="btn btn-sm btn-primary"
                  >
                    <Eye size={16} />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestResultsList;
