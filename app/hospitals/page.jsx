import HospitalList from '@/components/hospitals/HospitalList';

export const metadata = {
  title: 'Hospitals | SynapAI',
  description: 'View and search for hospitals in our network'
};

export default function HospitalsPage() {
  return <HospitalList />;
}
