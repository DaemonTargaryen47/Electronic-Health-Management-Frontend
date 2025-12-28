"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/services/authService';
import { getHospitalTestResults, getMyHospitals } from '@/services/hospitalStaffService';
import { markdownToHtml } from '@/utils/markdownFormatter';
import { 
  AlertCircle, FileText, Search, ArrowLeft, Calendar, 
  Building2, ExternalLink, Eye, Clock, Filter, ChevronDown
} from 'lucide-react';

const PathologistResultsList = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchData();
  }, [router]);

  // Effect to filter results when search query changes
  useEffect(() => {
    handleSearch();
  }, [searchQuery, testResults]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's hospitals first
      const hospitalsResponse = await getMyHospitals();
      if (hospitalsResponse.success) {
        setHospitals(hospitalsResponse.hospitals || []);
        
        // If user has hospitals, default to the first one and fetch its results
        if (hospitalsResponse.hospitals && hospitalsResponse.hospitals.length > 0) {
          const firstHospital = hospitalsResponse.hospitals[0];
          setSelectedHospital(firstHospital);
          
          const resultsResponse = await getHospitalTestResults(firstHospital.hospital_id);
          if (resultsResponse.success) {
            setTestResults(resultsResponse.test_results || []);
            setFilteredResults(resultsResponse.test_results || []);
          } else {
            throw new Error(resultsResponse.message || 'Failed to fetch test results');
          }
        }
      } else {
        throw new Error(hospitalsResponse.message || 'Failed to fetch hospitals');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      console.error('Error fetching pathologist results data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleHospitalChange = async (hospital) => {
    try {
      setLoading(true);
      setSelectedHospital(hospital);
      
      const resultsResponse = await getHospitalTestResults(hospital.hospital_id);
      if (resultsResponse.success) {
        setTestResults(resultsResponse.test_results || []);
        setFilteredResults(resultsResponse.test_results || []);
      } else {
        throw new Error(resultsResponse.message || 'Failed to fetch test results');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching test results');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredResults(testResults);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = testResults.filter(result => 
      result.patient_name?.toLowerCase().includes(query) ||
      result.service_name?.toLowerCase().includes(query)
    );
    
    setFilteredResults(filtered);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  const formatResultDetails = (details) => {
    if (!details) return 'No details available';
    
    if (typeof details === 'object') {
      // Convert object to markdown-like format
      let markdownText = '';
      
      if (details.summary) markdownText += `**Summary:** ${details.summary}\n\n`;
      if (details.observations) markdownText += `**Observations:** ${details.observations}\n\n`;
      if (details.diagnosis) markdownText += `**Diagnosis:** ${details.diagnosis}\n\n`;
      if (details.recommendations) markdownText += `**Recommendations:** ${details.recommendations}\n\n`;
      if (details.additional_notes) markdownText += `**Additional Notes:** ${details.additional_notes}\n\n`;
      
      // If there are test parameters, format them as a list
      if (details.parameters && Array.isArray(details.parameters)) {
        markdownText += `**Parameters:**\n`;
        details.parameters.forEach(param => {
          const status = param.status || (param.value_in_range ? 'Normal' : 'Abnormal');
          markdownText += `* **${param.name}**: ${param.value} ${param.unit || ''} (${status})\n`;
        });
      }
      
      // Convert to HTML
      return <div dangerouslySetInnerHTML={{ __html: markdownToHtml(markdownText) }} />;
    } else if (typeof details === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: markdownToHtml(details) }} />;
    }
    
    return JSON.stringify(details);
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
      <button 
        onClick={() => router.push('/staff/pathologist/dashboard')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <h1 className="text-3xl font-bold mb-6">Test Results</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Hospital selector */}
      {hospitals.length > 1 && (
        <div className="dropdown mb-6">
          <label tabIndex={0} className="btn btn-outline m-1 flex justify-between gap-2">
            <Building2 size={16} />
            {selectedHospital ? selectedHospital.hospital_name : 'Select Hospital'}
            <ChevronDown size={16} />
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72">
            {hospitals.map((hospital) => (
              <li key={hospital.hospital_id}>
                <a onClick={() => handleHospitalChange(hospital)}>
                  {hospital.hospital_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Search */}
      <div className="mb-6">
        <div className="input-group w-full max-w-xs">
          <input
            type="text"
            placeholder="Search results..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-square">
            <Search size={18} />
          </button>
        </div>
      </div>
      
      {/* Results list */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl flex items-center gap-2 mb-4">
            <FileText className="text-primary" />
            Test Results
          </h2>
          
          {filteredResults.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium">No test results found</p>
              <p className="text-gray-500 mt-1">
                {searchQuery ? 'No results match your search criteria' : 'There are no test results for this hospital yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Patient</th>
                    <th>Result Date</th>
                    <th>Pathologist</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.result_id}>
                      <td>
                        <div className="font-medium">{result.service_name}</div>
                      </td>
                      <td>
                        <div className="font-medium">{result.patient_name}</div>
                        <div className="text-xs text-gray-500">ID: {result.patient_id}</div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span>{formatDate(result.result_date)}</span>
                          <span className="text-xs text-gray-500">{formatTime(result.result_date)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{result.pathologist_name}</div>
                      </td>
                      <td>
                        <div className="flex gap-2">
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
                            href={`/test-results/${result.result_id}`}
                            className="btn btn-sm btn-primary"
                          >
                            <Eye size={14} className="mr-1" />
                            View
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
    </div>
  );
};

export default PathologistResultsList;
