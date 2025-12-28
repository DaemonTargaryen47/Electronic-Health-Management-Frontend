"use client";

import React, { useState } from 'react';
import { createTestResult } from '@/services/hospitalStaffService';
import { Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const TestResultForm = ({ appointmentService, onSuccess }) => {
  const [resultDetails, setResultDetails] = useState({
    summary: '',
    observations: '',
    conclusion: '',
    reference_ranges: {},
    values: {}
  });
  
  const [resultFile, setResultFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setResultDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValueChange = (key, value) => {
    setResultDetails(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: value
      }
    }));
  };

  const handleRangeChange = (key, min, max, unit) => {
    setResultDetails(prev => ({
      ...prev,
      reference_ranges: {
        ...prev.reference_ranges,
        [key]: { min, max, unit }
      }
    }));
  };

  const handleAddParameter = () => {
    setResultDetails(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [`parameter_${Object.keys(prev.values).length + 1}`]: ''
      },
      reference_ranges: {
        ...prev.reference_ranges,
        [`parameter_${Object.keys(prev.values).length + 1}`]: { min: '', max: '', unit: '' }
      }
    }));
  };

  const handleRemoveParameter = (key) => {
    setResultDetails(prev => {
      const newValues = { ...prev.values };
      const newRanges = { ...prev.reference_ranges };
      delete newValues[key];
      delete newRanges[key];
      return {
        ...prev,
        values: newValues,
        reference_ranges: newRanges
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResultFile(file);
      setFileName(file.name);
    }
  };

  const handleRemoveFile = () => {
    setResultFile(null);
    setFileName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await createTestResult(
        appointmentService.appointment_service_id,
        resultDetails,
        resultFile
      );
      
      if (response.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        setError(response.message || 'Failed to submit test result');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting the test result');
      console.error('Error submitting test result:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-base-100 shadow-lg rounded-lg p-6">
        <div className="text-center py-6">
          <CheckCircle className="mx-auto h-16 w-16 text-success" />
          <h3 className="mt-4 text-xl font-bold">Test Result Submitted Successfully!</h3>
          <p className="mt-2 text-gray-600">
            The test result has been recorded and is now available to the patient and medical staff.
          </p>
          
          {onSuccess && (
            <button 
              className="btn btn-primary mt-6"
              onClick={() => onSuccess({ success: true })}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Test Information */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold text-lg">Test Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-gray-600">Patient:</p>
              <p className="font-medium">{appointmentService.patient_name}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Test:</p>
              <p className="font-medium">{appointmentService.service_name}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Appointment ID:</p>
              <p className="font-medium">{appointmentService.appointment_id}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Date:</p>
              <p className="font-medium">
                {new Date(appointmentService.appointment_time).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Result Summary */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Result Summary</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Enter a brief summary of the test results"
          value={resultDetails.summary}
          onChange={(e) => handleInputChange('summary', e.target.value)}
          required
        ></textarea>
      </div>
      
      {/* Test Parameters */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="label-text font-medium">Test Parameters</label>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleAddParameter}
          >
            Add Parameter
          </button>
        </div>
        
        {Object.keys(resultDetails.values).length === 0 ? (
          <div className="text-center py-4 border rounded-lg">
            <p className="text-gray-500">No parameters added yet. Click "Add Parameter" to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Reference Range</th>
                  <th>Unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(resultDetails.values).map((key) => {
                  const range = resultDetails.reference_ranges[key] || {};
                  return (
                    <tr key={key}>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-full"
                          placeholder="Parameter name"
                          value={key}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-full"
                          placeholder="Value"
                          value={resultDetails.values[key]}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            className="input input-bordered input-sm w-20"
                            placeholder="Min"
                            value={range.min || ''}
                            onChange={(e) => handleRangeChange(key, e.target.value, range.max, range.unit)}
                          />
                          <span>-</span>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-20"
                            placeholder="Max"
                            value={range.max || ''}
                            onChange={(e) => handleRangeChange(key, range.min, e.target.value, range.unit)}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input input-bordered input-sm w-20"
                          placeholder="Unit"
                          value={range.unit || ''}
                          onChange={(e) => handleRangeChange(key, range.min, range.max, e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost btn-circle"
                          onClick={() => handleRemoveParameter(key)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Observations */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Detailed Observations</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Enter detailed observations about the test results"
          value={resultDetails.observations}
          onChange={(e) => handleInputChange('observations', e.target.value)}
        ></textarea>
      </div>
      
      {/* Conclusion */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Conclusion</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Enter your conclusion based on the test results"
          value={resultDetails.conclusion}
          onChange={(e) => handleInputChange('conclusion', e.target.value)}
          required
        ></textarea>
      </div>
      
      {/* File Upload */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Attach Result File (Optional)</span>
        </label>
        
        {!fileName ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Drag and drop a file, or click to select a file
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Supported formats: PDF, JPEG, PNG, DOC, DOCX (Max 10MB)
            </p>
            <input
              type="file"
              className="hidden"
              id="result-file"
              accept=".pdf,.jpeg,.jpg,.png,.doc,.docx"
              onChange={handleFileChange}
            />
            <label htmlFor="result-file" className="btn btn-outline mt-4">
              <Upload size={16} className="mr-2" />
              Select File
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Upload size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-xs text-gray-500">
                  {resultFile.size < 1024 * 1024
                    ? `${(resultFile.size / 1024).toFixed(2)} KB`
                    : `${(resultFile.size / (1024 * 1024)).toFixed(2)} MB`}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-circle"
              onClick={handleRemoveFile}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            'Submit Test Result'
          )}
        </button>
      </div>
    </form>
  );
};

export default TestResultForm;
