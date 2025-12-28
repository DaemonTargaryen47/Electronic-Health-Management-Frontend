"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, Info, AlertCircle, CreditCard, StethoscopeIcon, Building2 } from 'lucide-react';
import { createAppointment, getHospitalServices } from '@/services/appointmentService';
import { getDoctorById, getHospitalDoctors } from '@/services/doctorService';
import { getHospitalById, getAllHospitals } from '@/services/hospitalService';
import { isAuthenticated } from '@/services/authService';

const AppointmentForm = ({ initialHospitalId = null, initialDoctorId = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const doctorIdFromUrl = searchParams.get('doctor');
  const hospitalIdFromUrl = searchParams.get('hospital');
  const effectiveDoctorId = initialDoctorId || doctorIdFromUrl;
  const effectiveHospitalId = initialHospitalId || hospitalIdFromUrl;

  const [navigationSource, setNavigationSource] = useState('general');

  const [formData, setFormData] = useState({
    hospital_id: effectiveHospitalId || '',
    hospital_doctor_id: '',
    type: 'in-person',
    appointment_date: '',
    appointment_time: '',
    reason_for_visit: '',
    service_type: '',
  });

  const [userTimezone, setUserTimezone] = useState({
    offset: null,
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [hospital, setHospital] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [availableHospitals, setAvailableHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalDoctors, setHospitalDoctors] = useState([]);
  const [hospitalDoctorsLoading, setHospitalDoctorsLoading] = useState(false);

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  const generateTimeSlots = (selectedDate) => {
    const slots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];

    if (selectedDate === formattedToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      return slots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);

        if (slotHour > currentHour) {
          return true;
        } else if (slotHour === currentHour) {
          return slotMinute > currentMinute + 30;
        }
        return false;
      });
    }

    return slots;
  };

  const [availableTimeSlots, setAvailableTimeSlots] = useState(generateTimeSlots(formData.appointment_date));

  useEffect(() => {
    if (formData.appointment_date) {
      setAvailableTimeSlots(generateTimeSlots(formData.appointment_date));

      if (formData.appointment_time &&
        !generateTimeSlots(formData.appointment_date).includes(formData.appointment_time)) {
        setFormData(prev => ({ ...prev, appointment_time: '' }));
      }
    }
  }, [formData.appointment_date]);

  useEffect(() => {
    if (effectiveDoctorId && effectiveHospitalId) {
      // When both doctor and hospital are specified in the URL
      setNavigationSource('combined');
      setCurrentStep(2);
      
      // Optimize the loading sequence for combined mode
      const loadCombinedData = async () => {
        try {
          setHospitalLoading(true);
          
          // First, get hospital doctors which contains doctor fees information
          const hospitalDoctorsResponse = await getHospitalDoctors(effectiveHospitalId);
          
          if (hospitalDoctorsResponse.success) {
            // Find our doctor in the response
            const doctorInHospital = hospitalDoctorsResponse.doctors.find(
              d => d.doctor_id.toString() === effectiveDoctorId.toString()
            );
            
            // Set hospital doctors data
            setHospitalDoctors(hospitalDoctorsResponse.doctors);
            
            if (doctorInHospital) {
              // Set doctor data from hospital doctors response, avoiding a separate API call
              setDoctor(doctorInHospital);
              
              // Set form data with the selected doctor's hospital_doctor_id
              setFormData(prev => ({
                ...prev, 
                hospital_id: effectiveHospitalId,
                hospital_doctor_id: doctorInHospital.hospital_doctor_id.toString()
              }));
            } else {
              // Fallback to separate doctor API call if not found in hospital doctors
              const doctorResponse = await getDoctorById(effectiveDoctorId);
              if (doctorResponse.success) {
                setDoctor(doctorResponse.profile);
              }
            }
          }
          
          // Get hospital details (can't avoid this call as we need hospital address etc.)
          const hospitalResponse = await getHospitalById(effectiveHospitalId);
          if (hospitalResponse.success) {
            setHospital(hospitalResponse.hospital);
          }
          
          // Load hospital services (needed for additional services selection)
          await loadHospitalServices(effectiveHospitalId);
          
        } catch (err) {
          console.error("Error loading combined data:", err);
          setError("Failed to load appointment data");
        } finally {
          setHospitalLoading(false);
        }
      };
      
      loadCombinedData();
    } else if (effectiveDoctorId) {
      setNavigationSource('doctor');
      setCurrentStep(1);
      loadDoctorData(effectiveDoctorId);
    } else if (effectiveHospitalId) {
      setNavigationSource('hospital');
      setCurrentStep(2);
      loadHospitalData(effectiveHospitalId);
    } else {
      setNavigationSource('general');
      setCurrentStep(1);
      fetchHospitals();
    }
  }, [effectiveDoctorId, effectiveHospitalId]);

  const fetchHospitals = async () => {
    try {
      setHospitalsLoading(true);
      const response = await getAllHospitals(100, 0);

      if (response.success && response.hospitals) {
        setAvailableHospitals(response.hospitals);
      } else {
        console.error('Failed to get hospitals list:', response);
      }
    } catch (err) {
      console.error('Error loading hospitals:', err);
    } finally {
      setHospitalsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    const timezoneOffset = new Date().getTimezoneOffset();
    const timezoneOffsetHours = -timezoneOffset / 60;
    const formattedOffset = `GMT${timezoneOffsetHours >= 0 ? '+' : ''}${timezoneOffsetHours}`;

    let timezoneName = '';
    try {
      timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      console.error("Couldn't get timezone name:", e);
    }

    setUserTimezone({
      offset: timezoneOffset,
      offsetHours: timezoneOffsetHours,
      formatted: formattedOffset,
      name: timezoneName
    });
  }, []);

  const loadHospitalData = async (hospitalId) => {
    try {
      setHospitalLoading(true);

      const hospitalResponse = await getHospitalById(hospitalId);

      if (hospitalResponse.success) {
        setHospital(hospitalResponse.hospital);
        setFormData(prev => ({ ...prev, hospital_id: hospitalId }));

        await loadHospitalServices(hospitalId);
        await loadHospitalDoctors(hospitalId);
        
        // Only update the step if we're not in combined mode
        if (navigationSource !== 'combined') {
          setCurrentStep(2);
        }
        
        return hospitalResponse.hospital;
      } else {
        setError('Could not load hospital information');
      }
    } catch (err) {
      console.error('Error loading hospital data:', err);
      setError('Failed to load hospital information');
    } finally {
      setHospitalLoading(false);
    }
  };

  const loadHospitalDoctors = async (hospitalId) => {
    try {
      setHospitalDoctorsLoading(true);
      const response = await getHospitalDoctors(hospitalId);

      if (response.success && response.doctors) {
        setHospitalDoctors(response.doctors);

        // If we're in combined mode and have an effectiveDoctorId, find and select the doctor
        if (navigationSource === 'combined' && effectiveDoctorId) {
          const doctorInHospital = response.doctors.find(
            d => d.doctor_id.toString() === effectiveDoctorId.toString()
          );
          
          if (doctorInHospital) {
            setFormData(prev => ({
              ...prev,
              hospital_doctor_id: doctorInHospital.hospital_doctor_id.toString()
            }));
          }
        }

        if (doctor) {
          const matchedDoctor = response.doctors.find(d => d.doctor_id === doctor.doctor_id);
          if (matchedDoctor && matchedDoctor.doctor_fees) {
            console.log('Doctor fees:', matchedDoctor.doctor_fees);
          }
        }
      } else {
        console.error('Failed to get hospital doctors:', response);
      }
    } catch (err) {
      console.error('Error loading hospital doctors:', err);
    } finally {
      setHospitalDoctorsLoading(false);
    }
  };

  const loadDoctorData = async (doctorId) => {
    try {
      setDoctorLoading(true);

      const doctorResponse = await getDoctorById(doctorId);

      if (doctorResponse.success && doctorResponse.profile) {
        const selectedDoctor = doctorResponse.profile;

        setDoctor(selectedDoctor);

        // If we're in combined mode, just set the doctor and update hospital_doctor_id if needed
        if (navigationSource === 'combined' && hospital) {
          if (selectedDoctor.hospitals) {
            // Find the matching hospital and hospital_doctor_id
            const matchingHospital = selectedDoctor.hospitals.find(
              h => h.hospital_id.toString() === formData.hospital_id.toString()
            );
            
            if (matchingHospital && matchingHospital.hospital_doctor_id) {
              // When coming from the URL with both doctor and hospital, find the doctor in the hospitalDoctors array
              const doctorInHospital = hospitalDoctors.find(
                d => d.doctor_id.toString() === doctorId.toString()
              );
              
              setFormData(prev => ({
                ...prev,
                hospital_doctor_id: matchingHospital.hospital_doctor_id.toString()
              }));
            }
          }
          return;
        }

// Regular doctor navigation logic
        if (selectedDoctor.hospitals && selectedDoctor.hospitals.length > 0) {
          const doctorHospitals = selectedDoctor.hospitals.map(hospital => ({
            hospital_id: hospital.hospital_id,
            name: hospital.hospital_name || 'Unknown Hospital',
            hospital_doctor_id: hospital.hospital_doctor_id
          }));

          setAvailableHospitals(doctorHospitals);

          if (selectedDoctor.hospitals.length === 1) {
            const hospitalId = selectedDoctor.hospitals[0].hospital_id;
            await loadHospitalData(hospitalId);

            const hospitalDoctor = selectedDoctor.hospitals[0];
            if (hospitalDoctor && hospitalDoctor.hospital_doctor_id) {
              setFormData(prev => ({
                ...prev,
                hospital_id: hospitalId.toString(),
                hospital_doctor_id: hospitalDoctor.hospital_doctor_id.toString()
              }));
              setCurrentStep(2);
            }
          }
        } else {
          setError("This doctor isn't associated with any hospitals.");
        }
      } else {
        setError('Could not load doctor information');
      }
    } catch (err) {
      console.error('Error loading doctor data:', err);
      setError('Failed to load doctor information');
    } finally {
      setDoctorLoading(false);
    }
  };

  const loadHospitalServices = async (hospitalId) => {
    try {
      const servicesResponse = await getHospitalServices(hospitalId);

      if (servicesResponse.success) {
        setAvailableServices(servicesResponse.services);
      }
    } catch (err) {
      console.error('Error loading hospital services:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'hospital_id' && value) {
      setFormData(prev => ({ ...prev, hospital_doctor_id: '' }));
      loadHospitalData(value);

      if (doctor && doctor.hospitals) {
        const hospitalId = parseInt(value);
        const matchedHospital = doctor.hospitals.find(h => h.hospital_id === hospitalId);

        if (matchedHospital && matchedHospital.hospital_doctor_id) {
          setTimeout(() => {
            setFormData(prev => ({
              ...prev,
              hospital_doctor_id: matchedHospital.hospital_doctor_id.toString()
            }));
          }, 100);
        }
      }
    }
  };

  const handleServiceChange = (serviceId, checked, servicePrice = 0, serviceName = '') => {
    if (checked) {
      const newService = {
        service_id: serviceId,
        quantity: 1,
        price: servicePrice,
        service_name: serviceName
      };
      setSelectedServices([...selectedServices, newService]);
    } else {
      setSelectedServices(selectedServices.filter(service => service.service_id !== serviceId));
    }
  };

  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity <= 0) return;

    setSelectedServices(selectedServices.map(service =>
      service.service_id === serviceId ? { ...service, quantity } : service
    ));
  };

  const getSelectedDoctorFees = () => {
    // For combined mode, prioritize the fees from the doctor in hospitalDoctors array
    if (navigationSource === 'combined' && formData.hospital_doctor_id && hospitalDoctors.length > 0) {
      const selectedHospitalDoctor = hospitalDoctors.find(
        doc => doc.hospital_doctor_id.toString() === formData.hospital_doctor_id.toString()
      );
      
      if (selectedHospitalDoctor?.doctor_fees) {
        return selectedHospitalDoctor.doctor_fees;
      }
    }

    // For doctor navigation mode with selected doctor
    if (navigationSource === 'doctor' && doctor && doctor.doctor_fees) {
      return doctor.doctor_fees;
    }
    
    // Otherwise check hospital doctors
    if (!formData.hospital_doctor_id || !hospitalDoctors.length) return null;

    const selectedDoctor = hospitalDoctors.find(
      doc => doc.hospital_doctor_id.toString() === formData.hospital_doctor_id
    );

    return selectedDoctor?.doctor_fees || null;
  };

  const getFeeAmount = () => {
    const fees = getSelectedDoctorFees();
    if (!fees || !formData.service_type || !fees[formData.service_type]) return 0;
    return fees[formData.service_type];
  };

  useEffect(() => {
    let total = 0;

    const consultationFee = getFeeAmount();
    if (consultationFee) {
      total += parseFloat(consultationFee);
    }

    selectedServices.forEach(service => {
      total += service.price * service.quantity;
    });

    setTotalCost(total);
  }, [selectedServices, formData.service_type, formData.hospital_doctor_id]);

  const getISODateTime = () => {
    const { appointment_date, appointment_time } = formData;
    if (!appointment_date || !appointment_time) return '';
    return `${appointment_date}T${appointment_time}:00`;
  };

  const convertToUTC = (dateTimeString) => {
    const localDate = new Date(dateTimeString);

    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!formData.hospital_id) {
        setError('Please select a hospital');
        setLoading(false);
        return;
      }

      if (!formData.appointment_date || !formData.appointment_time) {
        setError('Please select appointment date and time');
        setLoading(false);
        return;
      }

      const localDateTime = getISODateTime();
      const utcDateTime = convertToUTC(localDateTime);

      const appointmentData = {
        hospital_id: parseInt(formData.hospital_id),
        type: formData.type,
        appointment_time: utcDateTime,
        timezone_offset: userTimezone.offset,
        timezone_name: userTimezone.name
      };

      if (formData.hospital_doctor_id) {
        appointmentData.hospital_doctor_id = parseInt(formData.hospital_doctor_id);

        if (formData.service_type) {
          const feeAmount = getFeeAmount();
          appointmentData.fee_details = {
            service_type: formData.service_type,
            amount: feeAmount,
            payment_status: 'unpaid'
          };
        }
      }

      if (selectedServices.length > 0) {
        appointmentData.services = selectedServices.map(service => ({
          service_id: service.service_id,
          quantity: service.quantity
        }));
      }

      const response = await createAppointment(appointmentData);

      if (response.success) {
        setSuccess(true);
        setAppointmentId(response.appointment_id);
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const viewAppointment = () => {
    router.push(`/appointments/${appointmentId}`);
  };

  const viewAllAppointments = () => {
    router.push('/appointments');
  };

  if (doctorLoading || hospitalLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (success && appointmentId) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-base-100 shadow-lg rounded-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Appointment Booked Successfully</h2>
          <p className="text-gray-600">Your appointment has been scheduled. Confirmation details have been sent to your email.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={viewAppointment} className="btn btn-primary">
            View Appointment Details
          </button>
          <button onClick={viewAllAppointments} className="btn btn-outline">
            View All Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {navigationSource === 'doctor' ?
            `Book an Appointment with Dr. ${doctor?.name || doctor?.first_name || "Selected Doctor"}` :
            navigationSource === 'hospital' ?
              `Book an Appointment at ${hospital?.name || "Selected Hospital"}` :
            navigationSource === 'combined' && doctor ?
              `Book an Appointment with Dr. ${doctor?.name || doctor?.first_name || "Selected Doctor"} at ${hospital?.name || "Selected Hospital"}` :
              "Book an Appointment"
          }
        </h1>

        {navigationSource === 'general' && (
          <div className="text-sm breadcrumbs">
            <ul>
              <li className={currentStep >= 1 ? "text-primary font-medium" : ""}>Select Hospital</li>
              <li className={currentStep >= 2 ? "text-primary font-medium" : ""}>Choose Doctor & Services</li>
              <li className={currentStep >= 3 ? "text-primary font-medium" : ""}>Schedule Time</li>
            </ul>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {(navigationSource === 'doctor' || navigationSource === 'general') && currentStep === 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} />
              <h2 className="text-xl font-semibold">Select Hospital</h2>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Hospital</span>
              </label>
              <select
                className="select select-bordered w-full"
                name="hospital_id"
                value={formData.hospital_id}
                onChange={handleChange}
                disabled={hospitalsLoading}
                required
              >
                <option value="">Select a hospital</option>
                {navigationSource === 'doctor' ? (
                  availableHospitals.map(hospital => (
                    <option key={hospital.hospital_id} value={hospital.hospital_id}>
                      {hospital.name}
                    </option>
                  ))
                ) : (
                  hospitalsLoading ? (
                    <option value="" disabled>Loading hospitals...</option>
                  ) : (
                    availableHospitals.map(hospital => (
                      <option key={hospital.hospital_id} value={hospital.hospital_id}>
                        {hospital.name}
                      </option>
                    ))
                  )
                )}
              </select>
              {hospitalsLoading && (
                <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Loading available hospitals...</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => formData.hospital_id && setCurrentStep(2)}
                disabled={!formData.hospital_id}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && hospital && (
          <div className="mb-6">
            {(navigationSource === 'doctor' || navigationSource === 'general') && (
              <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                  <h3 className="card-title text-lg">Selected Hospital</h3>
                  <div className="flex items-start gap-2">
                    <Building2 size={16} className="mt-1" />
                    <div>
                      <p className="font-medium">{hospital.name}</p>
                      <p className="text-sm text-gray-500">{hospital.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <StethoscopeIcon size={18} />
              <h2 className="text-xl font-semibold">Choose Doctor & Services</h2>
            </div>

            {navigationSource !== 'doctor' && navigationSource !== 'combined' && (
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Select Doctor (Optional)</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  name="hospital_doctor_id"
                  value={formData.hospital_doctor_id}
                  onChange={handleChange}
                  disabled={hospitalDoctorsLoading}
                >
                  <option value="">No specific doctor</option>
                  {hospitalDoctorsLoading ? (
                    <option value="" disabled>Loading doctors...</option>
                  ) : hospitalDoctors.length > 0 ? (
                    hospitalDoctors.map(doctor => (
                      <option key={doctor.hospital_doctor_id} value={doctor.hospital_doctor_id}>
                        {doctor.doctor_name || `Dr. ${doctor.name}`}
                        {doctor.doctor_fees?.regular ? ` (Fee: $${doctor.doctor_fees.regular})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No doctors available</option>
                  )}
                </select>
                {hospitalDoctorsLoading && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    <span>Loading doctors for this hospital...</span>
                  </div>
                )}
              </div>
            )}

            {(navigationSource === 'doctor' || navigationSource === 'combined') && doctor && (
              <div className="card bg-base-100 shadow-sm mb-4">
                <div className="card-body">
                  <h3 className="card-title text-lg">Selected Doctor</h3>
                  <div className="flex items-start gap-2">
                    <StethoscopeIcon size={16} className="mt-1" />
                    <div>
                      <p className="font-medium">
                        {doctor.name || `Dr. ${doctor.first_name} ${doctor.last_name || ''}`}
                      </p>
                      {doctor.specialties && (
                        <p className="text-sm text-gray-500">{doctor.specialties.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {((formData.hospital_doctor_id && navigationSource !== 'doctor') || 
              (navigationSource === 'doctor' && doctor && formData.hospital_id) || 
              (navigationSource === 'combined' && doctor && formData.hospital_id)) && (
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Consultation Type</span>
                </label>
                
                <select 
                  className="select select-bordered w-full" 
                  name="service_type" 
                  value={formData.service_type} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Select consultation type</option>
                  {getSelectedDoctorFees() && Object.entries(getSelectedDoctorFees()).map(([type, fee]) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} (${fee})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Appointment Type</span>
              </label>
              <div className="flex gap-4">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="in-person"
                    className="radio radio-primary"
                    checked={formData.type === 'in-person'}
                    onChange={handleChange}
                  />
                  <span className="label-text">In-Person</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="virtual"
                    className="radio radio-primary"
                    checked={formData.type === 'virtual'}
                    onChange={handleChange}
                  />
                  <span className="label-text">Virtual</span>
                </label>
              </div>
            </div>

            {availableServices.length > 0 && (
              <div className="mb-4">
                <label className="label">
                  <span className="label-text">Select Services (Optional)</span>
                </label>
                <div className="bg-base-200 p-3 rounded-lg">
                  {availableServices.map(service => (
                    <div key={service.service_id} className="flex justify-between items-center py-2 border-b border-base-300 last:border-b-0">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          onChange={(e) => handleServiceChange(
                            service.service_id,
                            e.target.checked,
                            service.price,
                            service.service_name
                          )}
                        />
                        <span className="font-medium">{service.service_name}</span>
                      </label>
                      <span className="text-primary font-medium">${parseFloat(service.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedServices.length > 0 || formData.service_type) && (
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard size={16} />
                  Cost Summary
                </h4>
                <div className="space-y-3">
                  {formData.service_type && formData.hospital_doctor_id && (
                    <div className="flex justify-between items-center border-b pb-2 border-base-300">
                      <div className="flex-1">
                        <p className="font-medium">
                          {formData.service_type.charAt(0).toUpperCase() + formData.service_type.slice(1)} Consultation
                        </p>
                        <p className="text-sm text-gray-500">Doctor's consultation fee</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${getFeeAmount().toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {selectedServices.map(service => (
                    <div key={service.service_id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{service.service_name}</p>
                        <p className="text-sm text-gray-500">${parseFloat(service.price).toFixed(2)} per unit</p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          className="btn btn-xs btn-circle"
                          onClick={() => updateServiceQuantity(service.service_id, service.quantity - 1)}
                          disabled={service.quantity <= 1}
                        >-</button>
                        <span className="font-medium w-6 text-center">{service.quantity}</span>
                        <button
                          type="button"
                          className="btn btn-xs btn-circle"
                          onClick={() => updateServiceQuantity(service.service_id, service.quantity + 1)}
                        >+</button>
                      </div>

                      <div className="ml-4 text-right">
                        <p className="font-medium">${(service.price * service.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="divider my-2"></div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-between">
              {navigationSource === 'general' && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary ml-auto"
                onClick={() => setCurrentStep(3)}
              >
                Continue to Scheduling
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} />
              <h2 className="text-xl font-semibold">Schedule Your Appointment</h2>
            </div>

            <div className="alert alert-info mb-4 text-sm">
              <Clock size={16} />
              <span>
                Your local time zone is {userTimezone.formatted}
                {userTimezone.name && ` (${userTimezone.name})`}.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  name="appointment_date"
                  className="input input-bordered"
                  value={formData.appointment_date || ''}
                  onChange={handleChange}
                  min={formattedToday}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Time</span>
                </label>
                {!formData.appointment_date ? (
                  <select className="select select-bordered" disabled>
                    <option>Select a date first</option>
                  </select>
                ) : availableTimeSlots.length === 0 ? (
                  <div>
                    <select className="select select-bordered" disabled>
                      <option>No available times</option>
                    </select>
                    <p className="text-xs text-error mt-1">No available time slots for selected date</p>
                  </div>
                ) : (
                  <select
                    name="appointment_time"
                    className="select select-bordered"
                    value={formData.appointment_time || ''}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  >
                    <option value="">Select a time</option>
                    {availableTimeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                )}
                {formData.appointment_date && availableTimeSlots.length > 0 && !formData.appointment_time && (
                  <p className="text-xs text-info mt-1">Please select an available time slot</p>
                )}
              </div>
            </div>

            <div className="alert alert-info mb-6">
              <Info size={16} />
              <span>
                Please arrive 15 minutes before your scheduled appointment time.
                {formData.type === 'virtual' && ' A link to join the virtual appointment will be sent to your email.'}
              </span>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(2)}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.appointment_date || !formData.appointment_time}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Book Appointment'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AppointmentForm;
