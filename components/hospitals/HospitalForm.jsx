"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createHospital, getHospitalById, updateHospital } from '@/services/hospitalService';
import MapboxLocationPicker from '@/components/maps/MapboxLocationPicker';

const HospitalForm = ({ hospitalId }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: '',
    contact_info: '',
    specialties: '',
    advertised: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(!!hospitalId);

  useEffect(() => {
    if (hospitalId) {
      // Fetch hospital data if in edit mode
      const fetchHospital = async () => {
        try {
          setLoading(true);
          const response = await getHospitalById(hospitalId);
          if (response.success && response.hospital) {
            setFormData({
              name: response.hospital.name || '',
              address: response.hospital.address || '',
              location: response.hospital.location || '',
              contact_info: response.hospital.contact_info || '',
              specialties: response.hospital.specialties || '',
              advertised: response.hospital.advertised || false
            });
          }
        } catch (err) {
          setSaveError('Failed to load hospital data');
          console.error('Error loading hospital:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchHospital();
    }
  }, [hospitalId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLocationChange = (value) => {
    setFormData(prev => ({
      ...prev,
      location: value
    }));
    
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Hospital name is required and must be at least 3 characters';
    }
    
    if (!formData.address) {
      newErrors.address = 'Hospital address is required';
    }
    
    if (!formData.location) {
      newErrors.location = 'Please select a location on the map';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setSaveError(null);
      
      if (isEditMode) {
        // Update existing hospital
        const response = await updateHospital(hospitalId, formData);
        if (response.success) {
          router.push(`/hospitals/${hospitalId}`);
        }
      } else {
        // Create new hospital
        const response = await createHospital(formData);
        if (response.success) {
          router.push(`/hospitals/${response.hospital_id}`);
        }
      }
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setSaveError(err.message || 'An error occurred while saving the hospital');
      }
      console.error('Error saving hospital:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format location for display
  const formatLocation = (location) => {
    if (!location) return 'Not set';
    
    // If location is already a string, return it
    if (typeof location === 'string') {
      return location;
    }
    
    // If location is an object with lng and lat properties
    if (location.lng !== undefined && location.lat !== undefined) {
      return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    
    // Fallback for any other format
    return JSON.stringify(location);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Hospital' : 'Add New Hospital'}
      </h1>
      
      {saveError && (
        <div className="alert alert-error mb-4">
          <span>{saveError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Hospital Name*</span>
          </label>
          <input
            type="text"
            name="name"
            className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter hospital name"
          />
          {errors.name && <span className="text-error text-sm mt-1">{errors.name}</span>}
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Address*</span>
          </label>
          <textarea
            name="address"
            className={`textarea textarea-bordered w-full ${errors.address ? 'textarea-error' : ''}`}
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter hospital address"
            rows={3}
          />
          {errors.address && <span className="text-error text-sm mt-1">{errors.address}</span>}
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Location (Map)*</span>
          </label>
          <MapboxLocationPicker 
            value={formData.location}
            onChange={handleLocationChange}
            error={errors.location}
          />
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-500">
              Current coordinates: {formatLocation(formData.location)}
            </span>
            {errors.location && <span className="text-error text-sm">{errors.location}</span>}
          </div>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Contact Information</span>
          </label>
          <input
            type="text"
            name="contact_info"
            className="input input-bordered w-full"
            value={formData.contact_info}
            onChange={handleChange}
            placeholder="Phone, Email, Website"
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Specialties</span>
          </label>
          <input
            type="text"
            name="specialties"
            className="input input-bordered w-full"
            value={formData.specialties}
            onChange={handleChange}
            placeholder="Cardiology, Neurology, Pediatrics (comma separated)"
          />
          <span className="text-sm text-gray-500 mt-1">
            Enter specialties separated by commas
          </span>
        </div>
        
        {isEditMode && (
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                name="advertised"
                className="checkbox"
                checked={formData.advertised}
                onChange={handleChange}
              />
              <span className="label-text">Feature this hospital (Advertised)</span>
            </label>
          </div>
        )}
        
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              isEditMode ? 'Update Hospital' : 'Create Hospital'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HospitalForm;
