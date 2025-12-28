import AdminList from '@/components/admin/AdminList';

export const metadata = {
  title: 'System Administrators',
  description: 'Manage system administrators',
};

export default function AdminsPage() {
  return (
    <main>
      <AdminList />
    </main>
  );
}
