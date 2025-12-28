import React, { useState } from 'react';
import Link from 'next/link';
import { 
  StethoscopeIcon, Award, Building, Clock, BookOpen, Calendar, 
  Star, MapPin, MessageSquare, Mail, Phone, ArrowLeft,
  Users, CheckCircle, XCircle, BarChart2, Percent, User, Mail as MailIcon,
  Calendar as CalendarIcon, Clock as ClockIcon, CheckSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import defaultDoctorImage from '@/assets/images/default-doctor.png'; // You'll need to create this file

const DoctorPublicProfile = ({ doctor }) => {
  const router = useRouter();
  const [selectedHospital, setSelectedHospital] = useState(
    doctor.hospitals && doctor.hospitals.length > 0 ? doctor.hospitals[0] : null
  );
  
  // Default profile image if not provided - using local image instead of external placeholder
  const profileImage = doctor.profile_image || defaultDoctorImage;

  // Check if statistics data exists based on API response structure
  const hasStatistics = doctor.statistics && 
    (doctor.statistics.total_patients > 0 || 
     doctor.statistics.appointments?.total > 0 ||
     doctor.statistics.experience_years > 0 ||
     doctor.statistics.rating?.average);

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()}
        className="btn btn-ghost mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Section */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="avatar">
                  <div className="w-48 h-48 rounded-lg shadow-md">
                    <Image 
                      src={profileImage} 
                      alt={`Dr. ${doctor.name}`} 
                      width={192}
                      height={192}
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">Dr. {doctor.name}</h1>
                  
                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-primary" />
                      <span>Doctor ID: {doctor.doctor_id}</span>
                    </div>

                    <div className="flex items-center">
                      <MailIcon size={16} className="mr-2 text-primary" />
                      <a href={`mailto:${doctor.email}`} className="hover:underline">
                        {doctor.email}
                      </a>
                    </div>

                    {doctor.phone && (
                      <div className="flex items-center">
                        <Phone size={16} className="mr-2 text-primary" />
                        <a href={`tel:${doctor.phone}`} className="hover:underline">
                          {doctor.phone}
                        </a>
                      </div>
                    )}

                    {doctor.verification_status && (
                      <div className="flex items-center">
                        <CheckSquare size={16} className="mr-2 text-success" />
                        <span>Verification: <span className="font-medium">{doctor.verification_status.toUpperCase()}</span></span>
                        {doctor.verification_date && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({formatDate(doctor.verification_date)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {doctor.specialties && doctor.specialties.length > 0 && (
                    <div className="flex items-center mt-3">
                      <StethoscopeIcon size={16} className="mr-2 text-primary" />
                      <div className="flex flex-wrap gap-1">
                        {doctor.specialties.map((specialty, idx) => (
                          <span key={idx} className="badge badge-primary">{specialty}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {doctor.statistics?.experience_years > 0 && (
                    <div className="mt-2 flex items-center">
                      <Award size={16} className="mr-2 text-primary" />
                      <span>{doctor.statistics.experience_years} years of experience</span>
                    </div>
                  )}
                  
                  {doctor.statistics?.rating?.average && (
                    <div className="mt-2 flex items-center">
                      <Star size={16} className="mr-2 text-warning" />
                      <div className="rating rating-sm">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <input 
                            key={star}
                            type="radio" 
                            name="rating-2" 
                            className="mask mask-star-2 bg-orange-400"
                            readOnly
                            checked={Math.round(doctor.statistics.rating.average) === star}
                          />
                        ))}
                      </div>
                      <span className="ml-2">
                        {doctor.statistics.rating.average.toFixed(1)}
                        {doctor.statistics.rating.count > 0 && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({doctor.statistics.rating.count} reviews)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* About Section */}
              {doctor.bio && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-2 flex items-center">
                    <BookOpen size={18} className="mr-2" />
                    About
                  </h2>
                  <p className="text-gray-700">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Doctor Statistics Section */}
          {hasStatistics && (
            <div className="card bg-base-100 shadow-md mt-6">
              <div className="card-body">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <BarChart2 size={18} className="mr-2" />
                  Doctor Statistics
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {doctor.statistics.total_patients > 0 && (
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-figure text-primary">
                        <Users size={20} />
                      </div>
                      <div className="stat-title">Total Patients</div>
                      <div className="stat-value text-primary">{doctor.statistics.total_patients}</div>
                    </div>
                  )}
                  
                  {doctor.statistics?.appointments?.total > 0 && (
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-figure text-secondary">
                        <Calendar size={20} />
                      </div>
                      <div className="stat-title">Appointments</div>
                      <div className="stat-value text-secondary">{doctor.statistics.appointments.total}</div>
                      <div className="stat-desc">
                        <div className="flex items-center mt-1">
                          <CheckCircle size={14} className="text-success mr-1" /> 
                          {doctor.statistics.appointments.completed} completed
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {doctor.statistics?.appointments?.completion_rate > 0 && (
                    <div className="stat bg-base-200 rounded-lg p-4">
                      <div className="stat-figure text-info">
                        <Percent size={20} />
                      </div>
                      <div className="stat-title">Completion Rate</div>
                      <div className="stat-value text-info">{doctor.statistics.appointments.completion_rate}%</div>
                      <div className="stat-desc flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle size={12} className="text-success mr-1" />
                          <span>{doctor.statistics.appointments.completed}</span>
                        </div>
                        <div className="flex items-center">
                          <XCircle size={12} className="text-error mr-1" />
                          <span>{doctor.statistics.appointments.canceled}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Education & Certifications */}
          <div className="card bg-base-100 shadow-md mt-6">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Award size={18} className="mr-2" />
                Education & Certifications
              </h2>
              
              {doctor.certificate_details && Object.keys(doctor.certificate_details).length > 0 ? (
                <div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-semibold">Institution</h3>
                      <p>{doctor.certificate_details.institution || 'Not specified'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold">Year of Graduation</h3>
                        <p>{doctor.certificate_details.year || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">License Number</h3>
                        <p>{doctor.certificate_details.license_number || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No certification information available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div>
          {/* Hospitals Section */}
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <Building size={18} className="mr-2" />
                Hospital Affiliations
              </h2>
              
              {doctor.hospitals && doctor.hospitals.length > 0 ? (
                <div className="space-y-4">
                  <div className="tabs tabs-boxed">
                    {doctor.hospitals.map((hospital, idx) => (
                      <a 
                        key={idx}
                        className={`tab ${selectedHospital && selectedHospital.hospital_id === hospital.hospital_id ? 'tab-active' : ''}`}
                        onClick={() => setSelectedHospital(hospital)}
                      >
                        {hospital.hospital_name?.substring(0, 15) || `Hospital ${idx + 1}`}
                        {hospital.hospital_name?.length > 15 ? '...' : ''}
                      </a>
                    ))}
                  </div>
                  
                  {selectedHospital && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg">{selectedHospital.hospital_name}</h3>
                      
                      {selectedHospital.address && (
                        <div className="flex items-start mt-2">
                          <MapPin size={16} className="mr-2 mt-1 text-primary" />
                          <p>{selectedHospital.address}</p>
                        </div>
                      )}
                      
                      {selectedHospital.doctor_fees && Object.keys(selectedHospital.doctor_fees).length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium">Consultation Fees</h4>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                            {Object.entries(selectedHospital.doctor_fees).map(([feeType, amount]) => (
                              <div key={feeType} className="flex justify-between">
                                <span className="capitalize">{feeType}:</span>
                                <span className="font-medium">${amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedHospital.specialties && selectedHospital.specialties.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium">Specialties at this hospital</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedHospital.specialties.map((specialty, idx) => (
                              <span key={idx} className="badge badge-sm badge-outline">{specialty}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedHospital.working_hours && Object.keys(selectedHospital.working_hours).length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium flex items-center">
                            <Clock size={14} className="mr-1" />
                            Working Hours
                          </h4>
                          <div className="text-sm mt-1">
                            {Object.entries(selectedHospital.working_hours).map(([day, hours]) => (
                              <div key={day} className="grid grid-cols-2 gap-2">
                                <span className="font-medium">{day}:</span>
                                <span>{hours}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <Link 
                          href={`/hospitals/${selectedHospital.hospital_id}`}
                          className="btn btn-sm btn-outline w-full"
                        >
                          View Hospital
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No hospital affiliations</p>
              )}
            </div>
          </div>
          
          {/* Appointment Button */}
          <div className="card bg-base-100 shadow-md mt-6">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <Calendar size={18} className="mr-2" />
                Schedule an Appointment
              </h2>
              
              <div className="mt-2">
                <Link href={`/appointments/new?doctor=${doctor.doctor_id}`} className="btn btn-primary w-full">
                  Book Appointment
                </Link>
              </div>
              
              <div className="mt-2">
                <Link href={`/chat/doctor/${doctor.doctor_id}`} className="btn btn-outline w-full">
                  <MessageSquare size={16} className="mr-2" />
                  Send Message
                </Link>
              </div>
            </div>
          </div>
          
          {/* Quick Info */}
          <div className="card bg-base-100 shadow-md mt-6">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <ClockIcon size={18} className="mr-2" />
                Availability Summary
              </h2>
              
              <div className="mt-2">
                {doctor.hospitals && doctor.hospitals.length > 0 ? (
                  <div className="space-y-2">
                    {doctor.hospitals.slice(0, 3).map((hospital, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{hospital.hospital_name?.substring(0, 20)}</span>
                        <div className="badge badge-success badge-sm">Available</div>
                      </div>
                    ))}
                    
                    {doctor.hospitals.length > 3 && (
                      <div className="text-xs text-center text-gray-500 mt-1">
                        +{doctor.hospitals.length - 3} more hospitals
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No availability information</p>
                )}
              </div>
              
              {doctor.statistics?.appointments?.total > 0 && (
                <div className="divider my-2"></div>
              )}
              
              {doctor.statistics?.appointments?.total > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Appointment Success:</span>
                  <div className="radial-progress text-success" style={{"--value": doctor.statistics.appointments.completion_rate, "--size": "2rem", "--thickness": "3px"}}>
                    {doctor.statistics.appointments.completion_rate}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPublicProfile;
