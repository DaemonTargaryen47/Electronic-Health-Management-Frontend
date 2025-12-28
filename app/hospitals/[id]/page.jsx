import HospitalDetail from '@/components/hospitals/HospitalDetail';

export const metadata = {
  title: 'Hospital Details | SynapAI',
  description: 'View detailed information about this hospital'
};

export default function HospitalDetailPage({ params }) {
  return <HospitalDetail hospitalId={params.id} />;
}
