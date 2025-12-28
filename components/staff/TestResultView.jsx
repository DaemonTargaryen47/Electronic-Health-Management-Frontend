"use client";

import React from 'react';
import { Calendar, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const TestResultView = ({ testResult, loading = false, error = null }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }
  
  if (!testResult) {
    return (
      <div className="alert alert-warning">
        <span>Test result not found</span>
      </div>
    );
  }
  
  // Extract values and reference ranges
  const values = testResult.result_details?.values || {};
  const referenceRanges = testResult.result_details?.reference_ranges || {};
  
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl flex items-center gap-2">
            <FileText className="text-primary" />
            Test Result
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-gray-600">Test:</p>
              <p className="font-medium text-lg">{testResult.service_name}</p>
              {testResult.description && (
                <p className="text-sm text-gray-500">{testResult.description}</p>
              )}
            </div>
            
            <div>
              <p className="text-gray-600">Date:</p>
              <p className="font-medium">
                <Calendar size={14} className="inline mr-2" />
                {formatDate(testResult.result_date)}
              </p>
            </div>
            
            <div>
              <p className="text-gray-600">Patient:</p>
              <p className="font-medium">{testResult.patient_name}</p>
              <p className="text-sm">Patient ID: {testResult.patient_id}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Pathologist:</p>
              <p className="font-medium">{testResult.pathologist_name}</p>
            </div>
          </div>
          
          {testResult.result_file && (
            <div className="mt-4">
              <a 
                href={testResult.result_file} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
              >
                <FileText size={16} className="mr-2" />
                View Full Report
                <ExternalLink size={16} className="ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Results Summary */}
      {testResult.result_details?.summary && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-lg font-semibold">Summary</h3>
            <p>{testResult.result_details.summary}</p>
          </div>
        </div>
      )}
      
      {/* Test Parameters */}
      {Object.keys(values).length > 0 && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-lg font-semibold">Test Parameters</h3>
            
            <div className="overflow-x-auto mt-4">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(values).map(([key, value]) => {
                    const range = referenceRanges[key] || {};
                    const numValue = parseFloat(value);
                    const min = range.min !== undefined ? parseFloat(range.min) : null;
                    const max = range.max !== undefined ? parseFloat(range.max) : null;
                    
                    let status = 'normal';
                    if (min !== null && max !== null && !isNaN(numValue)) {
                      if (numValue < min) status = 'low';
                      if (numValue > max) status = 'high';
                    }
                    
                    const badgeClass = status === 'normal' ? 'badge-success' : 
                                      status === 'low' ? 'badge-warning' :
                                      'badge-error';
                    
                    return (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value} {range.unit}</td>
                        <td>
                          {min !== null && max !== null
                            ? `${min} - ${max} ${range.unit || ''}`
                            : 'Not specified'
                          }
                        </td>
                        <td>
                          {min !== null && max !== null && !isNaN(numValue) ? (
                            <span className={`badge ${badgeClass}`}>
                              {status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="badge">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Observations */}
      {testResult.result_details?.observations && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-lg font-semibold">Observations</h3>
            <p style={{whiteSpace: 'pre-line'}}>{testResult.result_details.observations}</p>
          </div>
        </div>
      )}
      
      {/* Conclusion */}
      {testResult.result_details?.conclusion && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-lg font-semibold">Conclusion</h3>
            <p>{testResult.result_details.conclusion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultView;
