'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  ChevronLeft,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Globe,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { getFlightById, deleteFlight } from '@/lib/storage';
import { formatDateTime, formatDuration, formatDistance, getStatusColor, getStatusDot } from '@/lib/utils';
import { Flight } from '@/types';

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);

  useEffect(() => {
    const f = getFlightById(params.id);
    if (!f) router.push('/flights');
    else setFlight(f);
  }, [params.id, router]);

  function handleDelete() {
    if (!flight) return;
    if (confirm('Delete this flight from your log?')) {
      deleteFlight(flight.id);
      router.push('/flights');
    }
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="font-mono text-slate-600 text-sm">Loading...</div>
      </div>
    );
  }

  const depDate = new Date(flight.scheduledDep);
  const arrDate = new Date(flight.scheduledArr);

  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Header */}
      <div className="border-b border-[#1a1e30] bg-[#080c14] px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 ml-10 md:ml-0">
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
                <div className={`w-2 h-2 rounded-full pulse-dot ${getStatusDot(flight.status)}`} />
                <span className={`tag border ${getStatusColor(flight.status)}`}>
                  {flight.status}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold text-white font-mono">{flight.flightNumber}</h1>
              <div className="text-sm text-slate-500">{flight.airline} · {flight.aircraft}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/flights/${flight.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-[#1a1e30] hover:border-[#252a40] rounded transition-all"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900/60 rounded transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 max-w-5xl">
        {/* Main route card */}
        <div className="panel p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500/40" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Origin */}
            <div className="flex-1 text-center sm:text-left">
              <div className="font-mono text-4xl sm:text-6xl font-bold text-white mb-2">{flight.origin.code}</div>
              <div className="text-lg text-slate-400">{flight.origin.name}</div>
              <div className="font-mono text-sm text-slate-500 mt-1">{flight.origin.city}, {flight.origin.country}</div>
              <div className="mt-4 space-y-1">
                <div>
                  <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">Scheduled</span>
                  <div className="font-mono text-xl text-cyan-400">
                    {depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    {depDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                {flight.actualDep && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">Actual</span>
                    <div className="font-mono text-sm text-emerald-400">{formatDateTime(flight.actualDep)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <div className="font-mono text-xs text-slate-600">{formatDuration(flight.duration)}</div>
              <div className="w-48 flex items-center gap-2">
                <div className="h-px flex-1 bg-cyan-500/30" />
                <Plane className="w-5 h-5 text-cyan-400 rotate-90" />
                <div className="h-px flex-1 bg-cyan-500/30" />
              </div>
              <div className="font-mono text-xs text-slate-600">{formatDistance(flight.distance)}</div>
            </div>

            {/* Destination */}
            <div className="flex-1 text-center sm:text-right">
              <div className="font-mono text-4xl sm:text-6xl font-bold text-white mb-2">{flight.destination.code}</div>
              <div className="text-lg text-slate-400">{flight.destination.name}</div>
              <div className="font-mono text-sm text-slate-500 mt-1">{flight.destination.city}, {flight.destination.country}</div>
              <div className="mt-4 space-y-1">
                <div>
                  <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">Scheduled</span>
                  <div className="font-mono text-xl text-cyan-400">
                    {arrDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    {arrDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                {flight.actualArr && (
                  <div>
                    <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">Actual</span>
                    <div className="font-mono text-sm text-emerald-400">{formatDateTime(flight.actualArr)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Duration', value: formatDuration(flight.duration), icon: Clock },
            { label: 'Distance', value: formatDistance(flight.distance), icon: Globe },
            { label: 'Crew Position', value: flight.crewPosition, icon: Plane },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="panel p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-slate-600" />
                <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">{label}</span>
              </div>
              <div className="font-mono text-lg font-medium text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">Origin Coordinates</span>
            </div>
            <div className="font-mono text-sm text-slate-400">
              {flight.origin.lat.toFixed(4)}°N, {Math.abs(flight.origin.lng).toFixed(4)}°{flight.origin.lng >= 0 ? 'E' : 'W'}
            </div>
            <div className="font-mono text-xs text-slate-600 mt-1">{flight.origin.timezone}</div>
          </div>
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">Destination Coordinates</span>
            </div>
            <div className="font-mono text-sm text-slate-400">
              {flight.destination.lat.toFixed(4)}°{flight.destination.lat >= 0 ? 'N' : 'S'}, {Math.abs(flight.destination.lng).toFixed(4)}°{flight.destination.lng >= 0 ? 'E' : 'W'}
            </div>
            <div className="font-mono text-xs text-slate-600 mt-1">{flight.destination.timezone}</div>
          </div>
        </div>

        {/* Notes */}
        {flight.notes && (
          <div className="panel p-5">
            <div className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mb-3">Notes</div>
            <p className="text-sm text-slate-400 leading-relaxed">{flight.notes}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 font-mono text-[10px] text-slate-700 pt-2">
          <span>ID: {flight.id}</span>
          <span>·</span>
          <span>Logged: {formatDateTime(flight.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
