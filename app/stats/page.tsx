'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Plane, Clock, Globe, TrendingUp, Award, MapPin } from 'lucide-react';
import { getFlights, computeStats } from '@/lib/storage';
import { formatDuration, formatDistance } from '@/lib/utils';
import { Flight, FlightStats } from '@/types';
import dynamic from 'next/dynamic';

// Dynamic import for Recharts to avoid SSR issues
const Charts = dynamic(() => import('@/components/StatsCharts'), { ssr: false });

export default function StatsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<FlightStats | null>(null);

  useEffect(() => {
    const f = getFlights();
    setFlights(f);
    setStats(computeStats(f));
  }, []);

  if (!stats) return null;

  const totalDays = stats.totalHours / 24;
  const earthCircumference = 40075;
  const earthLaps = stats.totalDistance / earthCircumference;

  return (
    <div className="min-h-screen bg-[#080a0f]">
      <div className="border-b border-[#1a1e30] bg-[#080c14] px-4 sm:px-8 py-4 sm:py-5">
        <div className="ml-10 md:ml-0">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase">Analytics</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Flight Statistics</h1>
          <p className="text-sm text-slate-500 mt-0.5">{stats.totalFlights} flights analyzed</p>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Flights', value: stats.totalFlights, sub: 'all time', icon: Plane, accent: 'cyan' },
            { label: 'Hours in Air', value: stats.totalHours.toFixed(1) + 'h', sub: `${totalDays.toFixed(1)} days`, icon: Clock, accent: 'amber' },
            { label: 'Km Traveled', value: stats.totalDistance.toLocaleString(), sub: `${earthLaps.toFixed(2)}x Earth`, icon: Globe, accent: 'emerald' },
            { label: 'Airports', value: stats.uniqueAirports, sub: `${stats.uniqueCountries} countries`, icon: MapPin, accent: 'blue' },
          ].map(({ label, value, sub, icon: Icon, accent }) => {
            const colors: Record<string, { bar: string; icon: string; bg: string; border: string }> = {
              cyan: { bar: 'bg-cyan-500', icon: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
              amber: { bar: 'bg-amber-500', icon: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
              emerald: { bar: 'bg-emerald-500', icon: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
              blue: { bar: 'bg-blue-500', icon: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
            };
            const c = colors[accent];
            return (
              <div key={label} className="panel relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 ${c.bg} border ${c.border} rounded`}>
                      <Icon className={`w-4 h-4 ${c.icon}`} />
                    </div>
                    <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">{label}</span>
                  </div>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</div>
                  {sub && <div className="font-mono text-xs text-slate-500 mt-1">{sub}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Records */}
        {stats.longestFlight && (
          <div className="panel p-5 border-l-2 border-l-amber-500/40">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Longest Flight</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xl sm:text-2xl font-bold text-white">{stats.longestFlight.origin.code}</span>
                <span className="text-slate-600">→</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-white">{stats.longestFlight.destination.code}</span>
              </div>
              <div className="font-mono text-sm text-amber-400">{formatDuration(stats.longestFlight.duration)}</div>
              <div className="text-xs text-slate-500">{stats.longestFlight.airline} · {stats.longestFlight.flightNumber}</div>
              <div className="font-mono text-xs text-slate-600">{formatDistance(stats.longestFlight.distance)}</div>
            </div>
          </div>
        )}

        {/* Charts */}
        {flights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Charts stats={stats} />
          </div>
        )}

        {/* Top airlines table */}
        {stats.flightsByAirline.length > 0 && (
          <div className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1e30]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-300">Airlines</span>
              </div>
            </div>
            <div className="divide-y divide-[#1a1e30]">
              {stats.flightsByAirline.map(({ airline, count }, i) => (
                <div key={airline} className="flex items-center gap-4 px-5 py-3">
                  <span className="font-mono text-xs text-slate-700 w-5">#{i + 1}</span>
                  <span className="text-sm text-slate-300 flex-1">{airline}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-32 bg-[#1a1e30] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500/60 rounded-full transition-all"
                        style={{ width: `${(count / stats.flightsByAirline[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top routes table */}
        {stats.topRoutes.length > 0 && (
          <div className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1e30]">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-300">Most Flown Routes</span>
              </div>
            </div>
            <div className="divide-y divide-[#1a1e30]">
              {stats.topRoutes.map(({ route, count }, i) => (
                <div key={route} className="flex items-center gap-4 px-5 py-3">
                  <span className="font-mono text-xs text-slate-700 w-5">#{i + 1}</span>
                  <span className="font-mono text-sm text-white flex-1">{route}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-32 bg-[#1a1e30] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500/60 rounded-full"
                        style={{ width: `${(count / stats.topRoutes[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-500 w-8 text-right">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {flights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm">No data to analyze yet</p>
            <p className="text-xs mt-1">Log flights to see your statistics</p>
          </div>
        )}
      </div>
    </div>
  );
}
