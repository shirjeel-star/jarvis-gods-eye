'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Search, X, ChevronDown } from 'lucide-react';
import { searchAirports, calculateDistance } from '@/lib/airports';
import { saveFlight, updateFlight } from '@/lib/storage';
import { Airport, Flight, FlightStatus, CrewPosition } from '@/types';
import { cn } from '@/lib/utils';

const AIRLINES = [
  'American Airlines', 'Delta Air Lines', 'United Airlines', 'Southwest Airlines',
  'British Airways', 'Emirates', 'Qatar Airways', 'Lufthansa', 'Air France',
  'KLM', 'Singapore Airlines', 'Cathay Pacific', 'Japan Airlines', 'ANA',
  'Turkish Airlines', 'Etihad Airways', 'Air Canada', 'Qantas', 'Virgin Atlantic',
  'Alaska Airlines', 'JetBlue', 'Spirit Airlines', 'Frontier Airlines',
  'Air Asia', 'IndiGo', 'Ryanair', 'easyJet', 'WestJet', 'Iberia', 'TAP Air Portugal',
  'Finnair', 'SAS', 'Swiss International', 'Austrian Airlines', 'Brussels Airlines',
  'El Al', 'Thai Airways', 'Malaysian Airlines', 'Philippine Airlines', 'Vietnam Airlines',
  'Korean Air', 'Asiana Airlines', 'China Southern', 'China Eastern', 'Air China',
  'Ethiopian Airlines', 'South African Airways', 'Kenya Airways', 'Royal Air Maroc',
];

const AIRCRAFT_TYPES = [
  'Airbus A220-100', 'Airbus A220-300',
  'Airbus A319', 'Airbus A320', 'Airbus A321', 'Airbus A321neo', 'Airbus A321XLR',
  'Airbus A330-200', 'Airbus A330-300', 'Airbus A330-900neo',
  'Airbus A340-300', 'Airbus A340-600',
  'Airbus A350-900', 'Airbus A350-1000',
  'Airbus A380',
  'Boeing 737-700', 'Boeing 737-800', 'Boeing 737-900', 'Boeing 737 MAX 8', 'Boeing 737 MAX 9', 'Boeing 737 MAX 10',
  'Boeing 757-200', 'Boeing 757-300',
  'Boeing 767-300ER', 'Boeing 767-400ER',
  'Boeing 777-200', 'Boeing 777-200ER', 'Boeing 777-200LR', 'Boeing 777-300ER',
  'Boeing 777X',
  'Boeing 787-8', 'Boeing 787-9', 'Boeing 787-10',
  'Embraer E175', 'Embraer E190', 'Embraer E195',
  'Bombardier CRJ-700', 'Bombardier CRJ-900', 'Bombardier Q400',
  'ATR 72',
];

const CREW_POSITIONS: CrewPosition[] = [
  'Flight Attendant',
  'Lead Flight Attendant',
  'Purser',
  'In-Flight Service Manager',
  'Inflight Director',
  'Cabin Manager',
];

const STATUS_OPTIONS: { value: FlightStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'departed', label: 'Departed' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'diverted', label: 'Diverted' },
  { value: 'delayed', label: 'Delayed' },
];

function AirportPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length >= 1) {
      setResults(searchAirports(query));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query]);

  function select(airport: Airport) {
    onChange(airport);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 bg-[#0d0f1a] border border-cyan-500/30 rounded p-3">
          <div className="flex-1">
            <div className="font-mono text-xl font-bold text-cyan-400">{value.code}</div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">{value.name}</div>
            <div className="font-mono text-[10px] text-slate-600">{value.city}, {value.country}</div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null as unknown as Airport)}
            className="text-slate-600 hover:text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search IATA code or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#111320] border border-[#1a1e30] rounded pl-9 pr-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500/40"
          />
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#0d0f1a] border border-[#252a40] rounded shadow-xl overflow-hidden">
          {results.map((a) => (
            <button
              key={a.code}
              type="button"
              onClick={() => select(a)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111320] transition-all text-left border-b border-[#1a1e30] last:border-0"
            >
              <div className="font-mono text-sm font-bold text-cyan-400 w-10">{a.code}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-300 truncate">{a.name}</div>
                <div className="font-mono text-[10px] text-slate-600">{a.city}, {a.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FlightFormProps {
  initial?: Flight;
  onSave?: (flight: Flight) => void;
}

export default function FlightForm({ initial, onSave }: FlightFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    flightNumber: initial?.flightNumber || '',
    airline: initial?.airline || '',
    aircraft: initial?.aircraft || '',
    origin: initial?.origin || null as Airport | null,
    destination: initial?.destination || null as Airport | null,
    scheduledDep: initial?.scheduledDep ? initial.scheduledDep.slice(0, 16) : '',
    scheduledArr: initial?.scheduledArr ? initial.scheduledArr.slice(0, 16) : '',
    actualDep: initial?.actualDep ? initial.actualDep.slice(0, 16) : '',
    actualArr: initial?.actualArr ? initial.actualArr.slice(0, 16) : '',
    status: initial?.status || 'scheduled' as FlightStatus,
    crewPosition: initial?.crewPosition || 'Flight Attendant' as string,
    notes: initial?.notes || '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-calculate duration
  const duration =
    form.scheduledDep && form.scheduledArr
      ? Math.max(
          0,
          Math.round(
            (new Date(form.scheduledArr).getTime() - new Date(form.scheduledDep).getTime()) / 60000
          )
        )
      : 0;

  const distance =
    form.origin && form.destination
      ? calculateDistance(form.origin.lat, form.origin.lng, form.destination.lat, form.destination.lng)
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.flightNumber.trim()) return setError('Flight number is required');
    if (!form.airline) return setError('Airline is required');
    if (!form.origin) return setError('Origin airport is required');
    if (!form.destination) return setError('Destination airport is required');
    if (!form.scheduledDep) return setError('Departure time is required');
    if (!form.scheduledArr) return setError('Arrival time is required');
    if (duration <= 0) return setError('Arrival must be after departure');

    setSaving(true);
    try {
      const payload = {
        flightNumber: form.flightNumber.toUpperCase().trim(),
        airline: form.airline,
        aircraft: form.aircraft,
        origin: form.origin!,
        destination: form.destination!,
        scheduledDep: new Date(form.scheduledDep).toISOString(),
        scheduledArr: new Date(form.scheduledArr).toISOString(),
        actualDep: form.actualDep ? new Date(form.actualDep).toISOString() : undefined,
        actualArr: form.actualArr ? new Date(form.actualArr).toISOString() : undefined,
        status: form.status,
        crewPosition: form.crewPosition,
        duration,
        distance,
        notes: form.notes,
      };

      let saved: Flight;
      if (initial?.id) {
        saved = updateFlight(initial.id, payload)!;
      } else {
        saved = saveFlight(payload);
      }

      onSave?.(saved);
      router.push(`/flights/${saved.id}`);
    } finally {
      setSaving(false);
    }
  }

  const InputClass = 'w-full bg-[#111320] border border-[#1a1e30] rounded px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500/40';
  const LabelClass = 'block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Flight Identification */}
      <section className="panel p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1a1e30]">
          <Plane className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Flight Identification</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LabelClass}>Flight Number *</label>
            <input
              type="text"
              value={form.flightNumber}
              onChange={(e) => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. AA101"
              className={InputClass}
            />
          </div>
          <div>
            <label className={LabelClass}>Airline *</label>
            <input
              type="text"
              list="airline-options"
              value={form.airline}
              onChange={(e) => setForm({ ...form, airline: e.target.value })}
              placeholder="Search airline..."
              className={InputClass}
            />
            <datalist id="airline-options">
              {AIRLINES.map((a) => <option key={a} value={a} />)}
            </datalist>
          </div>
          <div>
            <label className={LabelClass}>Aircraft Type</label>
            <input
              type="text"
              list="aircraft-options"
              value={form.aircraft}
              onChange={(e) => setForm({ ...form, aircraft: e.target.value })}
              placeholder="e.g. Boeing 737-800"
              className={InputClass}
            />
            <datalist id="aircraft-options">
              {AIRCRAFT_TYPES.map((a) => <option key={a} value={a} />)}
            </datalist>
          </div>
        </div>
      </section>

      {/* Route */}
      <section className="panel p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1a1e30]">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Route</span>
          {distance > 0 && (
            <div className="ml-auto font-mono text-xs text-cyan-400">
              {distance.toLocaleString()} km great circle
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <AirportPicker label="Origin Airport *" value={form.origin} onChange={(a) => setForm({ ...form, origin: a })} />
          <AirportPicker label="Destination Airport *" value={form.destination} onChange={(a) => setForm({ ...form, destination: a })} />
        </div>
      </section>

      {/* Schedule */}
      <section className="panel p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1a1e30]">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Schedule</span>
          {duration > 0 && (
            <div className="font-mono text-xs text-cyan-400">
              Duration: {Math.floor(duration / 60)}h {duration % 60}m
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
          <div>
            <label className={LabelClass}>Scheduled Departure *</label>
            <input
              type="datetime-local"
              value={form.scheduledDep}
              onChange={(e) => setForm({ ...form, scheduledDep: e.target.value })}
              className={InputClass}
            />
          </div>
          <div>
            <label className={LabelClass}>Scheduled Arrival *</label>
            <input
              type="datetime-local"
              value={form.scheduledArr}
              onChange={(e) => setForm({ ...form, scheduledArr: e.target.value })}
              className={InputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className={LabelClass}>Actual Departure</label>
            <input
              type="datetime-local"
              value={form.actualDep}
              onChange={(e) => setForm({ ...form, actualDep: e.target.value })}
              className={InputClass}
            />
          </div>
          <div>
            <label className={LabelClass}>Actual Arrival</label>
            <input
              type="datetime-local"
              value={form.actualArr}
              onChange={(e) => setForm({ ...form, actualArr: e.target.value })}
              className={InputClass}
            />
          </div>
        </div>
      </section>

      {/* Crew & Status */}
      <section className="panel p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1a1e30]">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Crew & Status</span>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LabelClass}>Crew Position</label>
            <select
              value={form.crewPosition}
              onChange={(e) => setForm({ ...form, crewPosition: e.target.value })}
              className={InputClass}
            >
              {CREW_POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LabelClass}>Flight Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as FlightStatus })}
              className={InputClass}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="panel p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#1a1e30]">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Notes</span>
        </div>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Add any notes about this flight..."
          rows={3}
          className={cn(InputClass, 'resize-y min-h-[80px]')}
        />
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all text-sm font-medium disabled:opacity-50"
        >
          <Plane className="w-4 h-4" />
          {saving ? 'Saving...' : (initial ? 'Update Flight' : 'Log Flight')}
        </button>
      </div>
    </form>
  );
}
