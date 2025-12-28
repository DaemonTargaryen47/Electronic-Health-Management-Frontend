import HospitalForm from '@/components/hospitals/HospitalForm';

export const metadata = {
  title: 'Edit Hospital | SynapAI',
  description: 'Edit hospital information'
};

export default function EditHospitalPage({ params }) {
  return <HospitalForm hospitalId={params.id} />;
}
