'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, Plane, RefreshCw, Wifi, Navigation, Gauge, ArrowUp, AlertCircle, Radio, X, Wind, Ruler, Target } from 'lucide-react';

const GlobeMap = dynamic(() => import('./GlobeMap'), { ssr: false });

interface LiveFlight {
  flightNumber: string;
  airline: string;
  aircraft: string;
  status: string;
  origin:      { iata: string; name: string; city: string; lat: number; lng: number };
  destination: { iata: string; name: string; city: string; lat: number; lng: number };
  live: { lat: number; lng: number; altitude: number; speedH: number; heading: number; isGround: boolean } | null;
  depScheduled: string;
  arrScheduled: string;
  depActual?:   string;
  arrActual?:   string;
  progress: number;
  totalDistanceKm: number;
  distanceToDestKm: number;
}

interface TurbArea {
  geometry: { coordinates: [number, number][][] };
  properties: {
    severity: string;
    sevInt: number;
    capColor: string;
    altLow: number;
    altHigh: number;
    centroidLat: number;
    centroidLng: number;
  };
}

interface TurbulenceData {
  level: string;
  intensity: number;
  count: number;
}

const TB_LABELS: Record<number, string> = {
  0: 'NONE', 1: 'LIGHT', 2: 'LIGHT-MOD', 3: 'MODERATE', 4: 'MOD-SEV', 5: 'SEVERE', 6: 'EXTREME',
};

const TB_COLORS: Record<string, string> = {
  NONE:        'text-emerald-400',
  LIGHT:       'text-emerald-300',
  'LIGHT-MOD': 'text-yellow-400',
  MODERATE:    'text-amber-400',
  'MOD-SEV':   'text-orange-400',
  SEVERE:      'text-red-400',
  EXTREME:     'text-red-500',
  UNKNOWN:     'text-slate-400',
};

const TB_BG: Record<string, string> = {
  NONE:        'bg-emerald-500/10 border-emerald-500/25',
  LIGHT:       'bg-emerald-500/10 border-emerald-500/30',
  'LIGHT-MOD': 'bg-yellow-500/10 border-yellow-500/30',
  MODERATE:    'bg-amber-500/15 border-amber-500/40',
  'MOD-SEV':   'bg-orange-500/15 border-orange-500/40',
  SEVERE:      'bg-red-500/20 border-red-500/50',
  EXTREME:     'bg-red-600/25 border-red-600/60',
  UNKNOWN:     'bg-white/5 border-white/10',
};

// Ray-cast point-in-polygon (GeoJSON ring = [lng, lat] pairs)
function pointInPolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i]; // xi = lng, yi = lat
    const [xj, yj] = ring[j];
    const cross = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (cross) inside = !inside;
  }
  return inside;
}

function computeTurbulenceLevel(lat: number, lng: number, altFt: number, areas: TurbArea[]): TurbulenceData {
  let maxSev = 0, count = 0;
  for (const feat of areas) {
    const { altLow, altHigh, sevInt } = feat.properties;
    if (altFt < altLow - 8000 || altFt > altHigh + 8000) continue; // outside altitude band
    const ring = feat.geometry.coordinates[0];
    if (pointInPolygon(lat, lng, ring)) { count++; if (sevInt > maxSev) maxSev = sevInt; }
  }
  // Fallback: centroid proximity within 250 km if not inside any polygon
  if (maxSev === 0) {
    for (const feat of areas) {
      const { altLow, altHigh, sevInt, centroidLat, centroidLng } = feat.properties;
      if (altFt < altLow - 8000 || altFt > altHigh + 8000) continue;
      const dlat = (centroidLat - lat) * Math.PI / 180;
      const dlng = (centroidLng - lng) * Math.PI / 180;
      const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(centroidLat * Math.PI / 180) * Math.sin(dlng / 2) ** 2;
      if (6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) < 250) {
        count++; if (sevInt > maxSev) maxSev = sevInt;
      }
    }
  }
  return { level: TB_LABELS[maxSev] ?? 'NONE', intensity: maxSev, count };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Slow interpolation to animate AviationStack snapshot forward
function interpolateGreatCircle(lat1: number, lng1: number, lat2: number, lng2: number, t: number): [number, number] {
  const r = (d: number) => d * Math.PI / 180;
  const d2 = (x: number) => x * 180 / Math.PI;
  const p1 = r(lat1), l1 = r(lng1), p2 = r(lat2), l2 = r(lng2);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2-p1)/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin((l2-l1)/2)**2));
  if (d === 0) return [lat1, lng1];
  const A = Math.sin((1-t)*d)/Math.sin(d), B = Math.sin(t*d)/Math.sin(d);
  const x = A*Math.cos(p1)*Math.cos(l1)+B*Math.cos(p2)*Math.cos(l2);
  const y = A*Math.cos(p1)*Math.sin(l1)+B*Math.cos(p2)*Math.sin(l2);
  const z = A*Math.sin(p1)+B*Math.sin(p2);
  return [d2(Math.atan2(z,Math.sqrt(x*x+y*y))), d2(Math.atan2(y,x))];
}

function headingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = (d: number) => d * Math.PI / 180;
  const dLng = r(lng2-lng1);
  const y = Math.sin(dLng)*Math.cos(r(lat2));
  const x = Math.cos(r(lat1))*Math.sin(r(lat2))-Math.sin(r(lat1))*Math.cos(r(lat2))*Math.cos(dLng);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}

const QUICK = ['AA101', 'EK201', 'SQ317', 'UA890', 'QR007', 'BA178', 'LH400'];

export default function LiveTracker() {
  const [query,       setQuery]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [flight,      setFlight]      = useState<LiveFlight | null>(null);
  const [error,       setError]       = useState('');
  const [turbAreas,   setTurbAreas]   = useState<TurbArea[]>([]);
  const [turbulence,  setTurbulence]  = useState<TurbulenceData | null>(null);
  const [tbLoading,   setTbLoading]   = useState(true); // true until first fetch
  const flightRef = useRef<LiveFlight | null>(null);
  useEffect(() => { flightRef.current = flight; }, [flight]);

  // Gradually animate the plane forward from its last known position
  useEffect(() => {
    if (!flight?.live || flight.live.isGround) return;
    const id = setInterval(() => {
      const f = flightRef.current;
      if (!f?.live) return;
      const next = Math.min(f.progress + 0.0002, 0.99);
      const [lat, lng] = interpolateGreatCircle(f.live.lat, f.live.lng, f.destination.lat, f.destination.lng, 0.0002);
      const newDistToDestKm = Math.round(haversineKm(lat, lng, f.destination.lat, f.destination.lng));
      setFlight({ ...f, progress: next, distanceToDestKm: newDistToDestKm, live: { ...f.live, lat, lng, heading: headingBetween(lat, lng, f.destination.lat, f.destination.lng) } });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.flightNumber]);

  // Fetch turbulence SIGMET areas globally on mount, refresh every 30 min
  useEffect(() => {
    async function fetchAreas() {
      setTbLoading(true);
      try {
        const res = await fetch('/api/turb-areas');
        if (res.ok) {
          const json = await res.json();
          setTurbAreas(json.features ?? []);
        }
      } catch { /* silent */ } finally { setTbLoading(false); }
    }
    fetchAreas();
    const id = setInterval(fetchAreas, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Derive tile turbulence level from aircraft position vs SIGMET polygons
  useEffect(() => {
    if (!flight?.live || flight.live.isGround) { setTurbulence(null); return; }
    setTurbulence(computeTurbulenceLevel(flight.live.lat, flight.live.lng, flight.live.altitude, turbAreas));
  }, [flight?.live?.lat, flight?.live?.lng, turbAreas]);

  async function doSearch(num: string) {
    const q = num.trim().toUpperCase();
    if (!q) return;
    setLoading(true); setError(''); setFlight(null);
    try {
      const res = await fetch(`/api/live-flight?flight=${encodeURIComponent(q)}`);
      if (res.ok) {
        setFlight(await res.json());
      } else {
        const err = await res.json().catch(() => ({ error: 'Flight not found' }));
        setError(err.error ?? 'Flight not found. Try a flight like AA101 or EK201.');
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally { setLoading(false); }
  }

  // Derived delay values (computed once per render, safe when flight is null)
  const depDelayMin = flight?.depActual
    ? Math.round((new Date(flight.depActual).getTime() - new Date(flight.depScheduled).getTime()) / 60000)
    : null;
  const isDelayed = depDelayMin !== null && depDelayMin > 5;
  const isEarly   = depDelayMin !== null && depDelayMin < -2;
  const estArr    = isDelayed && depDelayMin && flight
    ? new Date(new Date(flight.arrScheduled).getTime() + depDelayMin * 60_000).toISOString()
    : (flight?.arrScheduled ?? '');

  return (
    <div className="absolute inset-0">
      {/* Globe — full viewport, no overlays of its own */}
      <GlobeMap
        origin={flight?.origin ?? null}
        destination={flight?.destination ?? null}
        livePos={flight?.live ?? null}
        turbAreas={turbAreas}
      />

      {/* ── Search bar — top strip ─────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <form
          onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
          className="flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-xl"
        >
          <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Flight number — AA101, EK201, BA178…"
            className="flex-1 bg-transparent text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none min-w-0"
          />
          {flight && (
            <button type="button" onClick={() => { setFlight(null); setQuery(''); }} className="text-slate-600 hover:text-slate-300 p-1" title="Clear">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="submit" disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg text-xs font-mono hover:bg-cyan-500/30 transition-colors disabled:opacity-40 shrink-0">
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            {loading ? 'Searching…' : 'Track'}
          </button>
        </form>

        <div className="flex items-center gap-1.5 mt-1.5 px-1">
          <span className="font-mono text-[9px] text-slate-700 uppercase tracking-wider">Try:</span>
          {QUICK.map((f) => (
            <button key={f} type="button" onClick={() => { setQuery(f); doSearch(f); }}
              className="font-mono text-[9px] text-slate-600 hover:text-cyan-400 bg-black/50 border border-white/5 hover:border-cyan-500/30 rounded px-2 py-0.5 transition-colors">
              {f}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-red-400 font-mono">{error}</span>
            </div>
            <button type="button" onClick={() => setError('')} className="text-red-600 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Flight info — bottom panel ──────────────────────────────── */}
      {flight && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-xl space-y-2.5">

            {/* ── Row 1: header ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="shrink-0">
                <span className="font-mono text-base font-bold text-cyan-400">{flight.flightNumber}</span>
                <span className="font-mono text-[10px] text-slate-500 ml-2">{flight.airline}</span>
                {flight.aircraft && flight.aircraft !== 'Unknown' && (
                  <span className="font-mono text-[9px] text-slate-600 ml-2">· {flight.aircraft}</span>
                )}
              </div>

              {/* Route + progress bar */}
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                {/* Origin */}
                <div className="text-center shrink-0 min-w-[52px]">
                  <div className="font-mono text-sm font-bold text-white leading-none">{flight.origin.iata}</div>
                  <div className="font-mono text-[9px] text-slate-400 leading-tight">
                    {fmt(flight.depActual ?? flight.depScheduled)}
                  </div>
                  {isDelayed && (
                    <div className="font-mono text-[8px] text-amber-400 leading-tight">+{depDelayMin}m</div>
                  )}
                  {isEarly && (
                    <div className="font-mono text-[8px] text-emerald-400 leading-tight">early</div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(flight.progress * 100)}%` }} />
                  </div>
                  <div className="font-mono text-[8px] text-slate-600">{Math.round(flight.progress * 100)}% complete</div>
                </div>

                {/* Destination */}
                <div className="text-center shrink-0 min-w-[52px]">
                  <div className="font-mono text-sm font-bold text-white leading-none">{flight.destination.iata}</div>
                  <div className={`font-mono text-[9px] leading-tight ${isDelayed ? 'text-amber-400' : 'text-slate-400'}`}>
                    {fmt(estArr || flight.arrScheduled)}
                  </div>
                  {isDelayed && (
                    <div className="font-mono text-[8px] text-amber-500 leading-tight">ETA est.</div>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="ml-auto flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {isDelayed && (
                  <span className="font-mono text-[9px] text-amber-400 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                    DELAYED +{depDelayMin}m
                  </span>
                )}
                {isEarly && (
                  <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                    EARLY
                  </span>
                )}
                {!isDelayed && !isEarly && flight.depActual && (
                  <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                    ON TIME
                  </span>
                )}
                {flight.live?.isGround && (
                  <span className="font-mono text-[9px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg">ON GROUND</span>
                )}
                <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5" /> LIVE
                </span>
              </div>
            </div>

            {/* ── Row 2: telemetry tiles ── */}
            {flight.live && !flight.live.isGround && (
              <div className="flex items-stretch gap-2 flex-wrap">

                {/* Speed */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 min-w-[90px]">
                  <Gauge className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <div>
                    <div className="font-mono text-[8px] text-slate-600 uppercase tracking-wider">Speed</div>
                    <div className="font-mono text-xs font-bold text-white">{flight.live.speedH.toLocaleString()} <span className="text-slate-600 font-normal">km/h</span></div>
                  </div>
                </div>

                {/* Altitude */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 min-w-[90px]">
                  <ArrowUp className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <div>
                    <div className="font-mono text-[8px] text-slate-600 uppercase tracking-wider">Altitude</div>
                    <div className="font-mono text-xs font-bold text-white">{flight.live.altitude.toLocaleString()} <span className="text-slate-600 font-normal">ft</span></div>
                  </div>
                </div>

                {/* Heading */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 min-w-[80px]">
                  <Navigation className="w-3.5 h-3.5 text-cyan-500 shrink-0" style={{ transform: `rotate(${flight.live.heading}deg)` }} />
                  <div>
                    <div className="font-mono text-[8px] text-slate-600 uppercase tracking-wider">Heading</div>
                    <div className="font-mono text-xs font-bold text-white">{Math.round(flight.live.heading)}°</div>
                  </div>
                </div>

                {/* Distance to dest */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 min-w-[100px]">
                  <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-mono text-[8px] text-slate-600 uppercase tracking-wider">To Dest</div>
                    <div className="font-mono text-xs font-bold text-white">{flight.distanceToDestKm.toLocaleString()} <span className="text-slate-600 font-normal">km</span></div>
                  </div>
                </div>

                {/* Total distance */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 min-w-[100px]">
                  <Ruler className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <div className="font-mono text-[8px] text-slate-600 uppercase tracking-wider">Route</div>
                    <div className="font-mono text-xs font-bold text-white">{flight.totalDistanceKm.toLocaleString()} <span className="text-slate-600 font-normal">km</span></div>
                  </div>
                </div>

                {/* % flown */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 min-w-[70px]">
                  <Plane className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-mono text-[8px] text-slate-600 uppercase tracking-wider">Flown</div>
                    <div className="font-mono text-xs font-bold text-white">{Math.round(flight.progress * 100)}<span className="text-slate-600 font-normal">%</span></div>
                  </div>
                </div>

                {/* Turbulence */}
                {(() => {
                  const tb = turbulence;
                  const lvl = tb?.level ?? 'UNKNOWN';
                  const displayVal = tbLoading && !tb ? 'Checking…'
                    : lvl === 'NONE' ? 'Clear'
                    : lvl === 'UNKNOWN' ? 'No data'
                    : lvl;
                  return (
                    <div className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 min-w-[120px] ${TB_BG[lvl] ?? TB_BG.UNKNOWN}`}>
                      <Wind className={`w-3.5 h-3.5 shrink-0 ${tbLoading && !tb ? 'text-slate-500 animate-pulse' : (TB_COLORS[lvl] ?? 'text-slate-400')}`} />
                      <div>
                        <div className="font-mono text-[8px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          Turbulence
                          {tbLoading && tb && <RefreshCw className="w-2 h-2 animate-spin" />}
                        </div>
                        <div className={`font-mono text-xs font-bold ${tbLoading && !tb ? 'text-slate-500' : (TB_COLORS[lvl] ?? 'text-slate-400')}`}>
                          {displayVal}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        </div>
      )}

      {/* Idle hint */}
      {!flight && !loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Plane className="w-7 h-7 text-slate-800 mx-auto mb-2" />
            <p className="font-mono text-xs text-slate-700 tracking-widest uppercase">Enter a flight number above</p>
          </div>
        </div>
      )}
    </div>
  );
}
