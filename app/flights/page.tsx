'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plane,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ArrowRight,
  X,
  SortDesc,
} from 'lucide-react';
import { getFlights, deleteFlight } from '@/lib/storage';
import { formatDate, formatTime, formatDuration, formatDistance, getStatusColor, getStatusDot } from '@/lib/utils';
import { Flight, FlightStatus } from '@/types';

const STATUS_OPTIONS: FlightStatus[] = ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'diverted', 'delayed'];

export default function FlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlightStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'distance'>('date');

  useEffect(() => {
    setFlights(getFlights());
  }, []);

  const filtered = flights
    .filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          f.flightNumber.toLowerCase().includes(q) ||
          f.airline.toLowerCase().includes(q) ||
          f.origin.code.toLowerCase().includes(q) ||
          f.origin.city.toLowerCase().includes(q) ||
          f.destination.code.toLowerCase().includes(q) ||
          f.destination.city.toLowerCase().includes(q) ||
          f.aircraft.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.scheduledDep).getTime() - new Date(a.scheduledDep).getTime();
      if (sortBy === 'duration') return b.duration - a.duration;
      return b.distance - a.distance;
    });

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Remove this flight from your log?')) {
      deleteFlight(id);
      setFlights(getFlights());
    }
  }

  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Header */}
      <div className="border-b border-[#1a1e30] bg-[#080c14] px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase">Flight Logbook</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">All Flights</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-mono text-cyan-400">{filtered.length}</span> of {flights.length} records
            </p>
          </div>
          <Link
            href="/flights/new"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Log Flight
          </Link>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search flights, airports, airlines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#111320] border border-[#1a1e30] rounded pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500/40"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FlightStatus | 'all')}
              className="bg-[#111320] border border-[#1a1e30] rounded px-3 py-2.5 text-sm text-slate-300 focus:border-cyan-500/40"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortDesc className="w-4 h-4 text-slate-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'distance')}
              className="bg-[#111320] border border-[#1a1e30] rounded px-3 py-2.5 text-sm text-slate-300 focus:border-cyan-500/40"
            >
              <option value="date">Sort by Date</option>
              <option value="duration">Sort by Duration</option>
              <option value="distance">Sort by Distance</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="panel overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_1.5fr_1.5fr_1fr_32px] gap-4 px-5 py-3 bg-[#0d0f1a] border-b border-[#1a1e30]">
            {['Flight', 'Route', 'Date', 'Duration', 'Distance', 'Role', 'Status', ''].map((h) => (
              <div key={h} className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Plane className="w-10 h-10 mb-4 opacity-20" />
              <p className="text-sm">No flights found</p>
              {query && (
                <button onClick={() => setQuery('')} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filtered.map((flight) => (
              <Link key={flight.id} href={`/flights/${flight.id}`}>
                <div className="grid grid-cols-[2fr_3fr_1.5fr_1.5fr_1.5fr_1.5fr_1fr_32px] gap-4 px-5 py-4 border-b border-[#1a1e30] table-row-hover cursor-pointer group items-center">
                  {/* Flight number + airline */}
                  <div>
                    <div className="font-mono text-sm font-medium text-white">{flight.flightNumber}</div>
                    <div className="text-xs text-slate-600 mt-0.5 truncate">{flight.airline}</div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold text-white">{flight.origin.code}</div>
                      <div className="text-[10px] text-slate-600 truncate max-w-[80px]">{flight.origin.city}</div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <div className="h-px w-4 bg-slate-700" />
                      <ArrowRight className="w-3 h-3" />
                      <div className="h-px w-4 bg-slate-700" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold text-white">{flight.destination.code}</div>
                      <div className="text-[10px] text-slate-600 truncate max-w-[80px]">{flight.destination.city}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <div className="text-xs text-slate-300">{formatDate(flight.scheduledDep)}</div>
                    <div className="font-mono text-[10px] text-slate-600">{formatTime(flight.scheduledDep)}</div>
                  </div>

                  {/* Duration */}
                  <div className="font-mono text-sm text-slate-400">{formatDuration(flight.duration)}</div>

                  {/* Distance */}
                  <div className="font-mono text-sm text-slate-400">{formatDistance(flight.distance)}</div>

                  {/* Role */}
                  <div className="text-xs text-slate-500 truncate">{flight.crewPosition}</div>

                  {/* Status */}
                  <div>
                    <span className={`tag border ${getStatusColor(flight.status)}`}>
                      {flight.status}
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-6 mt-4 px-1 font-mono text-xs text-slate-600">
            <span>{filtered.length} flights</span>
            <span>·</span>
            <span>{Math.round(filtered.reduce((s, f) => s + f.duration, 0) / 60)}h total</span>
            <span>·</span>
            <span>{formatDistance(filtered.reduce((s, f) => s + f.distance, 0))} total</span>
          </div>
        )}
      </div>
    </div>
  );
}
