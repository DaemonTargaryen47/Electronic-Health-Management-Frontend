import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'System administration dashboard',
};

export default function AdminPage() {
  return (
    <main>
      <AdminDashboard />
    </main>
  );
}
