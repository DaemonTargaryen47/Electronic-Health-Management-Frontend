"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/appointments/AppointmentForm';

export default function NewAppointmentPage() {
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState({
    hospitalId: null,
    doctorId: null
  });

  useEffect(() => {
    const hospital = searchParams.get('hospital');
    const doctor = searchParams.get('doctor');
    
    if (hospital) {
      setInitialData(prev => ({ ...prev, hospitalId: hospital }));
    }
    
    if (doctor) {
      setInitialData(prev => ({ ...prev, doctorId: doctor }));
    }
  }, [searchParams]);

  return (
    <AppointmentForm 
      initialHospitalId={initialData.hospitalId} 
      initialDoctorId={initialData.doctorId}
    />
  );
}
