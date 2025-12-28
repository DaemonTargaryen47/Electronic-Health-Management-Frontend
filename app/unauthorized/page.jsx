import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Unauthorized Access',
  description: 'You do not have permission to view this page',
};

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <div className="text-center max-w-md">
        <ShieldAlert className="mx-auto text-error w-24 h-24 mb-6" />
        <h1 className="text-4xl font-bold text-error mb-4">Access Denied</h1>
        <p className="text-xl mb-8">
          You don't have permission to access this page. 
          Please contact an administrator if you believe this is an error.
        </p>
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
