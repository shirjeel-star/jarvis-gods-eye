'use client';

import { useEffect, useState } from 'react';
import { Map, Globe } from 'lucide-react';
import { getFlights } from '@/lib/storage';
import { computeStats } from '@/lib/storage';
import { formatDuration, formatDistance } from '@/lib/utils';
import { Flight, FlightStats } from '@/types';
import dynamic from 'next/dynamic';

const FlightMap = dynamic(() => import('@/components/FlightMap'), { ssr: false });

export default function MapPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<FlightStats | null>(null);

  useEffect(() => {
    const f = getFlights();
    setFlights(f);
    setStats(computeStats(f));
  }, []);

  return (
    <div className="min-h-screen bg-[#080a0f]">
      <div className="border-b border-[#1a1e30] bg-[#080c14] px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="ml-10 md:ml-0">
            <div className="flex items-center gap-2 mb-1">
              <Map className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase">Route Visualization</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">World Route Map</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              All {flights.length} flights plotted on global map
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {[
              { label: 'Total Routes', value: flights.length.toString() },
              { label: 'Airports Visited', value: stats.uniqueAirports.toString() },
              { label: 'Countries', value: stats.uniqueCountries.toString() },
              { label: 'Total Distance', value: formatDistance(stats.totalDistance) },
              { label: 'Flight Hours', value: stats.totalHours.toFixed(0) + 'h' },
            ].map(({ label, value }) => (
              <div key={label} className="panel p-4 text-center">
                <div className="font-mono text-lg sm:text-xl font-bold text-cyan-400">{value}</div>
                <div className="font-mono text-[10px] text-slate-600 uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        {flights.length === 0 ? (
          <div className="panel flex flex-col items-center justify-center py-32 text-slate-600">
            <Globe className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm">No flights to display</p>
            <p className="text-xs mt-1">Log flights to see your routes on the map</p>
          </div>
        ) : (
          <FlightMap />
        )}

        {/* Airport list */}
        {flights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="panel overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1a1e30]">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Visited Airports</span>
              </div>
              <div className="divide-y divide-[#1a1e30] max-h-64 overflow-y-auto">
                {Array.from(
                  new Set(flights.flatMap((f) => [f.origin, f.destination]).map((a) => a.code))
                )
                  .map((code) => {
                    const airport = flights.flatMap((f) => [f.origin, f.destination]).find((a) => a.code === code)!;
                    const count = flights.flatMap((f) => [f.origin.code, f.destination.code]).filter((c) => c === code).length;
                    return { airport, count };
                  })
                  .sort((a, b) => b.count - a.count)
                  .map(({ airport, count }) => (
                    <div key={airport.code} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="font-mono text-sm font-bold text-cyan-400 w-12">{airport.code}</span>
                      <div className="flex-1">
                        <div className="text-xs text-slate-300 truncate">{airport.city}, {airport.country}</div>
                      </div>
                      <span className="font-mono text-xs text-slate-600">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1a1e30]">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Countries Visited</span>
              </div>
              <div className="divide-y divide-[#1a1e30] max-h-64 overflow-y-auto">
                {Array.from(
                  new Set(flights.flatMap((f) => [f.origin.country, f.destination.country]))
                )
                  .sort()
                  .map((country) => {
                    const count = flights.flatMap((f) => [f.origin.country, f.destination.country]).filter((c) => c === country).length;
                    return { country, count };
                  })
                  .sort((a, b) => b.count - a.count)
                  .map(({ country, count }) => (
                    <div key={country} className="flex items-center justify-between px-5 py-2.5">
                      <span className="text-sm text-slate-300">{country}</span>
                      <span className="font-mono text-xs text-slate-600">{count} flights</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
