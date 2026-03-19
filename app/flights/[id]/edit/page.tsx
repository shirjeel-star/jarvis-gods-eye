'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plane } from 'lucide-react';
import { getFlightById } from '@/lib/storage';
import { Flight } from '@/types';
import FlightForm from '@/components/FlightForm';

export default function EditFlightPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);

  useEffect(() => {
    const f = getFlightById(params.id);
    if (!f) router.push('/flights');
    else setFlight(f);
  }, [params.id, router]);

  if (!flight) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="font-mono text-slate-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f]">
      <div className="border-b border-[#1a1e30] bg-[#080c14] px-8 py-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/flights/${flight.id}`}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-5 bg-[#1a1e30]" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Plane className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-xs text-amber-400 tracking-widest uppercase">Editing</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Edit Flight {flight.flightNumber}</h1>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl">
        <FlightForm initial={flight} />
      </div>
    </div>
  );
}
