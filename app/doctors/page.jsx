import DoctorList from '@/components/doctors/DoctorList';

export const metadata = {
  title: 'Doctors | SynapAI',
  description: 'View and search for doctors in our network'
};

export default function DoctorsPage() {
  return <DoctorList />;
}
