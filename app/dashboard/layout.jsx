import ProtectedRoute from '../../components/ProtectedRoute';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <main>
        {children}
      </main>
    </ProtectedRoute>
  );
}
