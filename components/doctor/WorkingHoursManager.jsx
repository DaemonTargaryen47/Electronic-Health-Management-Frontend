"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/authService';
import { getDoctorWorkingHours, updateWorkingHours } from '@/services/doctorDashboardService';
import { Clock, Save, ArrowLeft } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const WorkingHoursManager = () => {
  const router = useRouter();
  const [workingHours, setWorkingHours] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editedHours, setEditedHours] = useState({});

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    fetchWorkingHours();
  }, [router]);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await getDoctorWorkingHours();
      
      if (response.success) {
        setWorkingHours(response.working_hours || []);
        
        // Set the first hospital as selected by default if available
        if (response.working_hours && response.working_hours.length > 0) {
          const firstHospital = response.working_hours[0];
          setSelectedHospital(firstHospital);
          
          // Initialize edited hours with current hours
          setEditedHours(firstHospital.working_hours || {});
        }
      } else {
        setError('Failed to load working hours');
      }
    } catch (err) {
      setError('An error occurred while fetching working hours');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalChange = (hospital) => {
    setSelectedHospital(hospital);
    // Reset edited hours with selected hospital's hours
    setEditedHours(hospital.working_hours || {});
  };

  const handleTimeChange = (day, type, value) => {
    // Make sure the day has an entry in editedHours
    const dayHours = editedHours[day] || "Not available";
    
    // If not available, and we're setting a time, initialize with a range
    if (dayHours === "Not available" && (value !== "" || type === 'off')) {
      if (type === 'off') {
        // Mark the day as off
        setEditedHours({
          ...editedHours,
          [day]: "Off"
        });
        return;
      }
      
      // Initialize with default hours
      setEditedHours({
        ...editedHours,
        [day]: type === 'start' ? `${value} - 17:00` : `09:00 - ${value}`
      });
      return;
    }
    
    // If day is marked as "Off", and we're changing a time, convert to a range
    if (dayHours === "Off" && type !== 'off') {
      setEditedHours({
        ...editedHours,
        [day]: type === 'start' ? `${value} - 17:00` : `09:00 - ${value}`
      });
      return;
    }
    
    // For normal range, update start or end time
    if (dayHours !== "Not available" && dayHours !== "Off") {
      const [start, end] = dayHours.split(' - ');
      
      if (type === 'start') {
        setEditedHours({
          ...editedHours,
          [day]: `${value} - ${end}`
        });
      } else if (type === 'end') {
        setEditedHours({
          ...editedHours,
          [day]: `${start} - ${value}`
        });
      } else if (type === 'off') {
        setEditedHours({
          ...editedHours,
          [day]: "Off"
        });
      }
    }
  };

  const handleSave = async () => {
    if (!selectedHospital) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await updateWorkingHours(
        selectedHospital.hospital_doctor_id, 
        editedHours
      );
      
      if (response.success) {
        setSuccess('Working hours updated successfully');
        
        // Update local state to reflect the changes
        setWorkingHours(workingHours.map(hospital => 
          hospital.hospital_doctor_id === selectedHospital.hospital_doctor_id
            ? { ...hospital, working_hours: editedHours }
            : hospital
        ));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Failed to update working hours');
      }
    } catch (err) {
      setError('An error occurred while updating working hours');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Extract the display value for a day's working hours
  const getHoursDisplay = (day) => {
    const hours = editedHours[day];
    
    if (!hours || hours === "Not available") {
      return "Not available";
    }
    
    return hours;
  };

  // Extract start time from hours range string
  const getStartTime = (hoursString) => {
    if (!hoursString || hoursString === "Not available" || hoursString === "Off") {
      return "";
    }
    
    return hoursString.split(' - ')[0];
  };

  // Extract end time from hours range string
  const getEndTime = (hoursString) => {
    if (!hoursString || hoursString === "Not available" || hoursString === "Off") {
      return "";
    }
    
    return hoursString.split(' - ')[1];
  };

  // Check if a day is marked as "Off"
  const isDayOff = (day) => {
    return editedHours[day] === "Off";
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
        onClick={() => router.push('/doctor')}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Manage Working Hours</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-6">
          <span>{success}</span>
        </div>
      )}
      
      {workingHours.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-medium">No hospital affiliations</h3>
          <p className="mt-1 text-gray-500">
            You are not affiliated with any hospitals yet.
          </p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">Select Hospital</h2>
            
            <div className="tabs tabs-boxed">
              {workingHours.map((hospital) => (
                <a
                  key={hospital.hospital_doctor_id}
                  className={`tab ${selectedHospital && selectedHospital.hospital_doctor_id === hospital.hospital_doctor_id ? 'tab-active' : ''}`}
                  onClick={() => handleHospitalChange(hospital)}
                >
                  {hospital.hospital_name}
                </a>
              ))}
            </div>
            
            {selectedHospital && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Working Hours for {selectedHospital.hospital_name}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Day Off</th>
                        <th>Working Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS_OF_WEEK.map((day) => (
                        <tr key={day}>
                          <td>{day}</td>
                          <td>
                            <select
                              className="select select-bordered select-sm w-full"
                              value={getStartTime(editedHours[day])}
                              onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                              disabled={isDayOff(day)}
                            >
                              <option value="">Select</option>
                              {TIME_SLOTS.slice(0, -1).map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="select select-bordered select-sm w-full"
                              value={getEndTime(editedHours[day])}
                              onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                              disabled={isDayOff(day)}
                            >
                              <option value="">Select</option>
                              {TIME_SLOTS.slice(1).map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <label className="cursor-pointer label">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={isDayOff(day)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleTimeChange(day, 'off', null);
                                  } else {
                                    handleTimeChange(day, 'start', '09:00');
                                  }
                                }}
                              />
                              <span className="label-text ml-2">Off</span>
                            </label>
                          </td>
                          <td>
                            <div className="badge badge-lg">
                              {getHoursDisplay(day)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    className="btn btn-primary flex items-center gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <Save size={18} />
                    )}
                    Save Working Hours
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingHoursManager;
