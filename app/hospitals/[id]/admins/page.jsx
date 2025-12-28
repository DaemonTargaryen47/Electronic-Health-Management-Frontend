import HospitalAdmins from '@/components/hospitals/HospitalAdmins';

export const metadata = {
  title: 'Hospital Administrators | SynapAI',
  description: 'Manage administrators for this hospital'
};

export default function HospitalAdminsPage({ params }) {
  return <HospitalAdmins hospitalId={params.id} />;
}
