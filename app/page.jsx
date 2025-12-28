import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-[85vh] flex-col items-center justify-between px-4 py-12">
      <div>Homepage</div>
      
      <section className="w-full max-w-6xl mx-auto mt-12">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4 flex items-center">
              <Building2 className="mr-2" />
              Hospitals Network
            </h2>
            <p className="mb-4">
              SynapAI connects with hospitals around the country to provide the best healthcare services.
              Browse our network of partner hospitals, view their specialties, and book appointments directly.
            </p>
            <div className="card-actions justify-end">
              <Link href="/hospitals" className="btn btn-primary">
                Explore Hospitals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
