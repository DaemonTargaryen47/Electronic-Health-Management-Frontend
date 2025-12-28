"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerAsDoctor, getDoctorProfile } from '@/services/doctorService';
import { isAuthenticated } from '@/services/authService';
import { FileUp, Save, AlertTriangle } from 'lucide-react';

const DoctorRegistration = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    specialties: [],
    certificate_file: null,
    certificate_details: {
      institution: '',
      year: '',
      license_number: ''
    }
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingDoctor, setExistingDoctor] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Common medical specialties for suggestions
  const specialtySuggestions = [
    "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", 
    "Hematology", "Immunology", "Neurology", "Obstetrics", "Oncology", 
    "Ophthalmology", "Orthopedics", "Pediatrics", "Psychiatry", "Radiology", 
    "Surgery", "Urology"
  ];

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      // Check if user is already registered as a doctor
      try {
        const response = await getDoctorProfile();
        
        if (response.success && response.doctor) {
          setExistingDoctor(response.doctor);
        }
      } catch (err) {
        // If error is 404, user is not a doctor yet, which is expected
        if (err.status !== 404) {
          console.error('Error checking doctor status:', err);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    
    checkAuthentication();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCertificateDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      certificate_details: {
        ...prev.certificate_details,
        [name]: value
      }
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleSpecialtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpecialty();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await registerAsDoctor(formData);
      
      if (response.success) {
        setSuccess(true);
        // Redirect to doctor profile page after short delay
        setTimeout(() => {
          router.push('/profile/doctor');
        }, 2000);
      } else {
        setError(response.message || 'Failed to register as doctor');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store the actual file object, not just the name
      setFormData(prev => ({
        ...prev,
        certificate_file: file
      }));
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (existingDoctor) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="alert alert-info">
          <div>
            <h3 className="font-bold text-lg">You are already registered as a doctor</h3>
            <p className="py-2">Your current verification status: 
              <span className={`ml-2 font-semibold ${
                existingDoctor.verification_status === 'approved' ? 'text-success' :
                existingDoctor.verification_status === 'rejected' ? 'text-error' :
                'text-warning'
              }`}>
                {existingDoctor.verification_status.toUpperCase()}
              </span>
            </p>
            <div className="mt-2">
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/profile/doctor')}
              >
                View Doctor Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Register as a Doctor</h1>
      
      {error && (
        <div className="alert alert-error mb-4">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-4">
          <span>Registration successful! Your application will be reviewed by an administrator.</span>
        </div>
      )}
      
      <div className="alert alert-info mb-6">
        <div>
          <h3 className="font-bold">Important Information</h3>
          <p>To register as a doctor, you need to provide your medical specialties and upload a certificate. Your application will be reviewed by administrators before approval.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Medical Specialties</span>
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Add a specialty"
              value={newSpecialty}
              onChange={e => setNewSpecialty(e.target.value)}
              onKeyDown={handleSpecialtyKeyDown}
            />
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={addSpecialty}
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.specialties.map((specialty, index) => (
              <div key={index} className="badge badge-outline p-3">
                {specialty}
                <button 
                  type="button" 
                  className="ml-2 text-error"
                  onClick={() => removeSpecialty(specialty)}
                >
                  ✕
                </button>
              </div>
            ))}
            {formData.specialties.length === 0 && (
              <span className="text-gray-500">No specialties added</span>
            )}
          </div>
          
          <div className="mt-2">
            <span className="text-sm text-gray-500">Suggestions:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {specialtySuggestions.map((specialty, index) => (
                <button
                  key={index}
                  type="button"
                  className="badge badge-sm badge-ghost"
                  onClick={() => {
                    if (!formData.specialties.includes(specialty)) {
                      setFormData(prev => ({
                        ...prev,
                        specialties: [...prev.specialties, specialty]
                      }));
                    }
                  }}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="divider">Certificate Information</div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Certificate File</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="certificate-file"
              className="file-input file-input-bordered w-full"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <button
              type="button"
              className="btn btn-square btn-outline"
              onClick={() => document.getElementById('certificate-file').click()}
            >
              <FileUp />
            </button>
          </div>
          <span className="text-sm text-gray-500 mt-1">
            Upload your medical certificate or license (PDF, JPG, PNG)
          </span>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Institution Name</span>
          </label>
          <input
            type="text"
            name="institution"
            className="input input-bordered w-full"
            value={formData.certificate_details.institution}
            onChange={handleCertificateDetailsChange}
            placeholder="Medical school or institution name"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Year of Graduation</span>
            </label>
            <input
              type="number"
              name="year"
              className="input input-bordered w-full"
              value={formData.certificate_details.year}
              onChange={handleCertificateDetailsChange}
              placeholder="Year"
              min="1900"
              max={new Date().getFullYear()}
              required
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">License Number</span>
            </label>
            <input
              type="text"
              name="license_number"
              className="input input-bordered w-full"
              value={formData.certificate_details.license_number}
              onChange={handleCertificateDetailsChange}
              placeholder="Medical license number"
              required
            />
          </div>
        </div>
        
        <div className="form-control mt-6">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Submitting...
              </>
            ) : (
              <>
                <Save size={18} />
                Submit Registration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorRegistration;
