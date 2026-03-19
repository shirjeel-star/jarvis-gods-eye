'use client';

import FlightForm from '@/components/FlightForm';
import { Plane, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewFlightPage() {
  return (
    <div className="min-h-screen bg-[#080a0f]">
      <div className="border-b border-[#1a1e30] bg-[#080c14] px-8 py-5">
        <div className="flex items-center gap-4">
          <Link
            href="/flights"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-5 bg-[#1a1e30]" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Plane className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase">New Entry</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Log New Flight</h1>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl">
        <FlightForm />
      </div>
    </div>
  );
}
