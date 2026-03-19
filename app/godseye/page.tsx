'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Crosshair, MapPin, AlertTriangle, ShieldAlert, Shield,
  Target, Radio, Plane, Clock, Navigation, Newspaper, Globe2,
  Train, Bus, Ship, Car, Users, ChevronDown, ChevronUp, ExternalLink, TrendingUp,
} from 'lucide-react';
import type { NearestAirport, GEAirport } from '@/lib/god-eye-airports';
import { GE_AIRPORTS } from '@/lib/god-eye-airports';
import type { EvacLegArc } from '@/components/GodEyeGlobe';

const GodEyeGlobe = dynamic(() => import('@/components/GodEyeGlobe'), { ssr: false });

// ── types ─────────────────────────────────────────────────────────────────────
type ThreatLevel = 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'WARTIME';

interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
}

interface WorldEvent {
  headline: string;
  region:   string;
  severity: string;
  source?:  string;
  ts?:      string;
}

interface WorldIntel {
  baseline: WorldEvent[];
  live:     WorldEvent[];
  fetchedAt: string;
}

interface EvacLeg {
  mode: string; from: string; to: string;
  fromLat: number; fromLng: number; toLat: number; toLng: number;
  durationH: number; distanceKm: number;
  safety: 'SAFE' | 'MODERATE' | 'RISKY';
  notes: string; operator?: string; bookingUrl?: string;
  flightPriceUSD?: number;
  priceTier?: 'LOW' | 'AVERAGE' | 'HIGH' | 'SURGE';
}

interface EvacRoute {
  id: string; rank: number; title: string;
  totalHours: number; totalKm: number;
  overallSafety: 'SAFE' | 'MODERATE' | 'RISKY';
  summary: string; legs: EvacLeg[];
  destinationLat: number; destinationLng: number; destinationCity: string;
}

interface AirportStatus {
  status: 'OPEN' | 'DELAYS' | 'DISRUPTED' | 'CLOSED';
  delayMin: number;
  reason: string;
}

const STATUS_BADGE: Record<string, string> = {
  OPEN:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DELAYS:    'bg-amber-500/15   text-amber-400   border-amber-500/30',
  DISRUPTED: 'bg-orange-500/15  text-orange-400  border-orange-500/30',
  CLOSED:    'bg-red-500/15     text-red-400     border-red-500/30',
};

const STATUS_ICON: Record<string, string> = {
  OPEN:      '✈',
  DELAYS:    '⏱',
  DISRUPTED: '⚠',
  CLOSED:    '🚫',
};

function gFlightsUrl(origin: string, dest: string) {
  return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(dest)}`;
}

const THREAT_CONFIG: Record<ThreatLevel, { color: string; bg: string; label: string }> = {
  NORMAL:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'NORMAL'   },
  ELEVATED: { color: 'text-amber-400',   bg: 'bg-amber-500/10  border-amber-500/30',   label: 'ELEVATED' },
  CRITICAL: { color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30',  label: 'CRITICAL' },
  WARTIME:  { color: 'text-red-400',     bg: 'bg-red-500/10    border-red-500/30',     label: 'WARTIME'  },
};

function urgencyColor(km: number) {
  if (km < 100) return 'text-emerald-400';
  if (km < 300) return 'text-amber-400';
  return 'text-red-400';
}

function urgencyBg(km: number) {
  if (km < 100) return 'bg-emerald-500/10 border-emerald-500/25';
  if (km < 300) return 'bg-amber-500/10  border-amber-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

function filterAirports(text: string): GEAirport[] {
  if (text.length < 2) return [];
  const q = text.toLowerCase();
  return GE_AIRPORTS.filter(a =>
    a.city.toLowerCase().includes(q) ||
    a.iata.toLowerCase() === q ||
    a.name.toLowerCase().includes(q)
  ).slice(0, 7);
}

const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
function randomMatrixLine(): string {
  return Array.from({ length: 38 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join('');
}

const MODE_ICON: Record<string, React.ReactNode> = {
  FLIGHT: <Plane className="w-3 h-3" />,
  TRAIN:  <Train className="w-3 h-3" />,
  BUS:    <Bus className="w-3 h-3" />,
  BOAT:   <Ship className="w-3 h-3" />,
  DRIVE:  <Car className="w-3 h-3" />,
  TAXI:   <Car className="w-3 h-3 text-amber-400" />,
};

const SAFETY_COLOR: Record<string, string> = {
  SAFE:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  MODERATE: 'text-amber-400   border-amber-500/30   bg-amber-500/10',
  RISKY:    'text-red-400     border-red-500/30     bg-red-500/10',
};

// ── component ─────────────────────────────────────────────────────────────────
export default function GodsEyePage() {
  const [userLocation, setUserLocation]   = useState<UserLocation | null>(null);
  const [airports,     setAirports]       = useState<NearestAirport[]>([]);
  const [aiText,       setAiText]         = useState('');
  const [threatLevel,  setThreatLevel]    = useState<ThreatLevel>('ELEVATED');
  const [scenario,     setScenario]       = useState('');
  const [cityInput,       setCityInput]      = useState('');
  const [airportSuggestions, setAirportSuggestions] = useState<GEAirport[]>([]);
  const [pendingDeparture, setPendingDeparture] = useState<UserLocation | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [destSuggestions,  setDestSuggestions]  = useState<GEAirport[]>([]);
  const [isLocating,   setIsLocating]     = useState(false);
  const [isSearching,  setIsSearching]    = useState(false);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [clock,        setClock]          = useState('');
  const [worldIntel,   setWorldIntel]     = useState<WorldIntel | null>(null);
  const [tickerPaused, setTickerPaused]   = useState(false);
  const [apStatuses,   setApStatuses]     = useState<Record<string, AirportStatus>>({});
  const tickerRef = useRef<HTMLDivElement>(null);

  // ── Evacuation state ──────────────────────────────────────────────────────
  const [passengers,    setPassengers]    = useState(1);
  const [evacRoutes,    setEvacRoutes]    = useState<EvacRoute[]>([]);
  const [evacLoading,   setEvacLoading]   = useState(false);
  const [evacExpanded,  setEvacExpanded]  = useState<string | null>(null);
  const [evacArcs,      setEvacArcs]      = useState<EvacLegArc[]>([]);
  const [showEvac,      setShowEvac]      = useState(false);

  // ── breaking news ────────────────────────────────────────────────────────────────
  const [breakingNews, setBreakingNews] = useState<{ headline: string; region: string; lat: number; lng: number } | null>(null);
  const prevIntelRef = useRef<string>('');
  const breakingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── location modal ──────────────────────────────────────────────────────
  const [showLocateModal, setShowLocateModal] = useState(true);
  const [confirmedLocation, setConfirmedLocation] = useState<UserLocation | null>(null);

  // ── Matrix init state ─────────────────────────────────────────────────────
  const [matrixLines,   setMatrixLines]   = useState<string[]>([]);
  const [matrixActive,  setMatrixActive]  = useState(false);
  const matrixTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const globeWrapRef = useRef<HTMLDivElement>(null);
  const briefRef     = useRef<HTMLDivElement>(null);

  // ── detect new intel → breaking news ───────────────────────────────────────
  useEffect(() => {
    if (!worldIntel) return;
    const allHeadlines = [...worldIntel.baseline, ...worldIntel.live].map(e => e.headline).join('|');
    if (prevIntelRef.current && prevIntelRef.current !== allHeadlines) {
      // Find newest live event
      const newest = worldIntel.live[0] ?? worldIntel.baseline[0];
      if (newest) {
        // Rough lat/lng lookup by region name
        const REGION_COORDS: Record<string, [number, number]> = {
          'Ukraine': [48.5, 38.0], 'Gaza': [31.5, 34.5], 'Israel': [31.5, 34.5],
          'Lebanon': [33.5, 36.0], 'Sudan': [15.5, 32.5], 'Red Sea': [12.5, 43.5],
          'Taiwan': [24.0, 120.0], 'Myanmar': [19.7, 96.1], 'Sahel': [17.0, -2.0],
          'Haiti': [18.5, -72.3], 'Armenia': [40.0, 46.5],
        };
        const regionKey = Object.keys(REGION_COORDS).find(k =>
          newest.region?.includes(k) || newest.headline?.includes(k)
        );
        const [lat, lng] = regionKey ? REGION_COORDS[regionKey] : [20, 20];
        setBreakingNews({ headline: newest.headline, region: newest.region, lat, lng });
        if (breakingTimer.current) clearTimeout(breakingTimer.current);
        breakingTimer.current = setTimeout(() => setBreakingNews(null), 12000);
      }
    }
    prevIntelRef.current = allHeadlines;
  }, [worldIntel]);

  // ── fetch world intel ──────────────────────────────────────────────────────
  const fetchWorldIntel = useCallback(async () => {
    try {
      const res  = await fetch('/api/world-intel');
      const data = await res.json();
      setWorldIntel(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchWorldIntel();
    const id = setInterval(fetchWorldIntel, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, [fetchWorldIntel]);

  // ── clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Matrix boot sequence ───────────────────────────────────────────────────
  const runMatrixSequence = useCallback((onDone: () => void) => {
    setMatrixActive(true);
    setMatrixLines([]);
    matrixTimers.current.forEach(clearTimeout);
    matrixTimers.current = [];
    const STEPS = 14;
    for (let i = 0; i < STEPS; i++) {
      const t = setTimeout(() => {
        setMatrixLines(prev => [...prev, randomMatrixLine()]);
      }, i * 90);
      matrixTimers.current.push(t);
    }
    const final = setTimeout(() => {
      setMatrixActive(false);
      setMatrixLines([]);
      onDone();
    }, STEPS * 90 + 400);
    matrixTimers.current.push(final);
  }, []);

  // ── fetch nearest airports ─────────────────────────────────────────────────
  const fetchAirports = useCallback(async (lat: number, lng: number) => {
    try {
      const res  = await fetch(`/api/nearest-airports?lat=${lat}&lng=${lng}&n=8`);
      const data = await res.json();
      const aps: NearestAirport[] = data.airports ?? [];
      setAirports(aps);
      // Fetch disruption status for the loaded airports
      if (aps.length > 0) {
        try {
          const sr = await fetch('/api/airport-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ airports: aps.map(a => ({ iata: a.iata, lat: a.lat, lng: a.lng })) }),
          });
          const sd = await sr.json();
          setApStatuses(sd.statuses ?? {});
        } catch { /* silent */ }
      }
    } catch { /* silently ignore */ }
  }, []);

  // ── fetch evacuation routes ────────────────────────────────────────────────
  const fetchEvacRoutes = useCallback(async (lat: number, lng: number, city: string, pax: number) => {
    setEvacLoading(true);
    setEvacRoutes([]);
    setEvacArcs([]);
    try {
      const res  = await fetch('/api/evacuation-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, passengers: pax, city }),
      });
      const data = await res.json();
      const routes: EvacRoute[] = data.routes ?? [];
      setEvacRoutes(routes);
      // Build arcs for ALL route legs
      const arcs: EvacLegArc[] = [];
      routes.forEach(r => r.legs.forEach(l => arcs.push({
        startLat: l.fromLat, startLng: l.fromLng,
        endLat:   l.toLat,   endLng:   l.toLng,
        mode:     l.mode,    safety:   l.safety,
      })));
      setEvacArcs(arcs);
      setShowEvac(true);
    } finally {
      setEvacLoading(false);
    }
  }, []);

  // ── locate me via browser geolocation ─────────────────────────────────────
  const locate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    runMatrixSequence(async () => {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let city: string | undefined;
          try {
            const r  = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { 'User-Agent': 'JarvisIntelSystem/2.0' } },
            );
            const d  = await r.json();
            city = d.address?.city ?? d.address?.town ?? d.address?.county ?? undefined;
          } catch { /* no city name */ }
          setConfirmedLocation({ lat, lng, city });
          // don't close modal — show confirmation step
          setIsLocating(false);
          await fetchAirports(lat, lng);
        },
        () => setIsLocating(false),
        { timeout: 10000 },
      );
    });
  };

  // ── search by city ─────────────────────────────────────────────────────────
  // Selecting from departure autocomplete: fill field + store coords, but DON'T advance modal.
  // The user still needs to fill destination before confirming.
  const selectAirport = useCallback(async (ap: GEAirport) => {
    setAirportSuggestions([]);
    setCityInput(`${ap.city} (${ap.iata})`);
    setPendingDeparture({ lat: ap.lat, lng: ap.lng, city: `${ap.city} (${ap.iata})` });
    // Pre-fetch nearest airports in background while user enters destination
    fetchAirports(ap.lat, ap.lng);
  }, [fetchAirports]);

  const selectDestAirport = useCallback((ap: GEAirport) => {
    setDestSuggestions([]);
    setDestinationInput(`${ap.city} (${ap.iata})`);
  }, []);

  // Confirm departure from SET button or Enter key: use pendingDeparture (from autocomplete)
  // or geocode the typed text if no autocomplete was used.
  const confirmDeparture = () => {
    if (pendingDeparture) {
      setConfirmedLocation(pendingDeparture);
    } else {
      searchCity();
    }
  };

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    runMatrixSequence(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'JarvisIntelSystem/2.0' } },
        );
        const data = await res.json();
        if (data[0]) {
          const lat  = parseFloat(data[0].lat);
          const lng  = parseFloat(data[0].lon);
          const city = data[0].display_name.split(',')[0];
          setConfirmedLocation({ lat, lng, city });
          // don't close modal — show confirmation step
          await fetchAirports(lat, lng);
        }
      } finally {
        setIsSearching(false);
      }
    });
  };

  // ── generate AI brief ─────────────────────────────────────────────────────
  const generateBrief = useCallback(async (loc: UserLocation, currentAirports: typeof airports) => {
    setAiText('');
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: loc,
          scenario,
          airports: currentAirports,
          worldEvents: worldIntel ?? { baseline: [], live: [] },
        }),
      });
      if (!res.body) { setAiText('[JARVIS ERROR] No stream returned.'); return; }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAiText(text);
        if (briefRef.current) briefRef.current.scrollTop = briefRef.current.scrollHeight;
      }
    } catch {
      setAiText('[JARVIS ERROR] Brief generation failed. Check server.');
    } finally {
      setIsGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, worldIntel]);

  // ── Load everything once a location is confirmed ──────────────────────
  // Called directly from the confirm button — no useEffect needed since
  // GodsEyePage never unmounts; async ops continue after the modal closes.
  const loadLocationData = useCallback(async (loc: UserLocation, currentPax: number, destination?: string) => {
    // Show sections immediately so loading states are visible
    setShowEvac(true);
    setEvacLoading(true);
    setEvacRoutes([]);
    setEvacArcs([]);

    // Ensure airports are loaded
    let aps: NearestAirport[] = airports;
    if (aps.length === 0) {
      try {
        const r  = await fetch(`/api/nearest-airports?lat=${loc.lat}&lng=${loc.lng}&n=8`);
        const d  = await r.json();
        aps = d.airports ?? [];
        setAirports(aps);
        if (aps.length > 0) {
          const sr = await fetch('/api/airport-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ airports: aps.map((a: NearestAirport) => ({ iata: a.iata, lat: a.lat, lng: a.lng })) }),
          });
          const sd = await sr.json();
          setApStatuses(sd.statuses ?? {});
        }
      } catch { /* silent */ }
    }

    // Brief + evac in parallel (brief is fire-and-forget, evac is awaited)
    generateBrief(loc, aps);

    try {
      const res  = await fetch('/api/evacuation-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: loc.lat, lng: loc.lng, passengers: currentPax, city: loc.city ?? 'Unknown', destination }),
      });
      const data = await res.json();
      const routes: EvacRoute[] = data.routes ?? [];
      setEvacRoutes(routes);
      const arcs: EvacLegArc[] = [];
      routes.forEach(r => r.legs.forEach(l => arcs.push({
        startLat: l.fromLat, startLng: l.fromLng,
        endLat:   l.toLat,   endLng:   l.toLng,
        mode:     l.mode,    safety:   l.safety,
      })));
      setEvacArcs(arcs);
    } catch { /* silent */ } finally {
      setEvacLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airports, generateBrief]);

  const tc = THREAT_CONFIG[threatLevel];

  return (
    <div className="flex flex-col h-screen bg-[#030608] overflow-hidden select-none">

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="flex-none h-12 border-b border-sky-500/15 bg-[#050d14] flex items-center justify-between px-5 z-30">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7">
            <div className="absolute inset-0 rounded-full border border-sky-500/40 animate-ping opacity-20" />
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-mono text-sm text-sky-300 tracking-[0.2em] uppercase">JARVIS</span>
          <span className="font-mono text-sm text-slate-500 tracking-[0.15em]">// GOD&apos;S EYE</span>
        </div>

        {/* Centre — threat + location */}
        <div className="flex items-center gap-3">
          {/* Threat selector */}
          {(['NORMAL', 'ELEVATED', 'CRITICAL', 'WARTIME'] as ThreatLevel[]).map(t => (
            <button
              key={t}
              onClick={() => setThreatLevel(t)}
              className={`px-2.5 py-0.5 rounded border font-mono text-[10px] tracking-widest transition-all ${
                threatLevel === t ? tc.bg + ' ' + tc.color : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}

          {/* Separator */}
          <div className="w-px h-5 bg-sky-500/20" />

          {/* Location badge */}
          {userLocation ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 border border-sky-500/25 rounded">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span className="font-mono text-[11px] text-sky-300">
                {userLocation.city ?? `${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowLocateModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded font-mono text-[10px] text-red-400 animate-pulse hover:bg-red-500/20 transition-all"
            >
              <Crosshair className="w-3 h-3" />NO POSITION FIX — SET LOCATION
            </button>
          )}
        </div>

        {/* Clock + controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-slate-500">{clock} UTC</span>
          </div>

          <div className="w-px h-5 bg-sky-500/20" />

          {/* City search */}
          <input
            type="text"
            value={cityInput}
            onChange={e => setCityInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchCity()}
            placeholder="Search city..."
            className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-[11px] text-slate-300 placeholder-slate-700 focus:outline-none focus:border-sky-500/50"
          />
          <button
            onClick={searchCity}
            disabled={isSearching || !cityInput.trim()}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-[11px] text-slate-400 hover:border-sky-500/30 hover:text-sky-400 transition-all disabled:opacity-40"
          >
            {isSearching ? <Radio className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            SET
          </button>

          <div className="w-px h-5 bg-sky-500/20" />

          {/* Passengers */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded">
            <Users className="w-3 h-3 text-slate-500" />
            <button onClick={() => setPassengers(p => Math.max(1, p - 1))} className="text-slate-500 hover:text-white font-mono text-xs w-3.5 text-center">-</button>
            <span className="font-mono text-[11px] text-slate-300 w-4 text-center">{passengers}</span>
            <button onClick={() => setPassengers(p => Math.min(50, p + 1))} className="text-slate-500 hover:text-white font-mono text-xs w-3.5 text-center">+</button>
            <span className="font-mono text-[9px] text-slate-600">PAX</span>
          </div>

          {/* Escape route */}
          <button
            onClick={() => {
              if (userLocation) { setShowEvac(true); fetchEvacRoutes(userLocation.lat, userLocation.lng, userLocation.city ?? '', passengers); }
              else setShowLocateModal(true);
            }}
            disabled={evacLoading}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded font-mono text-[11px] text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all disabled:opacity-40 tracking-wider"
          >
            {evacLoading ? <><Radio className="w-3 h-3 animate-spin" />COMPUTING...</> : <><Navigation className="w-3 h-3" />ESCAPE ROUTE</>}
          </button>

          {/* Locate me */}
          <button
            onClick={locate}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/25 rounded text-sky-400 hover:bg-sky-500/20 transition-all font-mono text-[11px] tracking-wider disabled:opacity-50"
          >
            {isLocating
              ? <><Radio className="w-3 h-3 animate-spin" />ACQUIRING...</>
              : <><Crosshair className="w-3 h-3" />LOCATE ME</>
            }
          </button>
        </div>
      </div>

      {/* ── LOCATION MODAL ──────────────────────────────────────────────────── */}
      {showLocateModal && !userLocation && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center">
          <div className="w-[420px] bg-[#050d14] border border-sky-500/30 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-sky-500/40 animate-ping opacity-30" />
                <Target className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="font-mono text-sm text-sky-300 tracking-widest">POSITION ACQUISITION</div>
                <div className="font-mono text-[10px] text-slate-500">JARVIS // GOD&apos;S EYE — Set your location to begin threat analysis</div>
              </div>
            </div>

            {/* Step 1: Locate or city */}
            {!confirmedLocation ? (
              <>
                <button
                  onClick={() => { locate(); }}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500/15 border border-sky-500/40 rounded-lg font-mono text-sm text-sky-400 hover:bg-sky-500/25 hover:border-sky-500/70 transition-all mb-3 disabled:opacity-50"
                >
                  {isLocating
                    ? <><Radio className="w-4 h-4 animate-spin" />ACQUIRING GPS SIGNAL...</>
                    : <><Crosshair className="w-4 h-4" />USE MY CURRENT LOCATION</>
                  }
                </button>

                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="font-mono text-[10px] text-slate-600">OR ENTER CITY / COUNTRY</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={e => { setCityInput(e.target.value); setAirportSuggestions(filterAirports(e.target.value)); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (airportSuggestions.length > 0) selectAirport(airportSuggestions[0]);
                          else confirmDeparture();
                        }
                        if (e.key === 'Escape') setAirportSuggestions([]);
                      }}
                      autoFocus
                      placeholder="e.g. Kyiv, Dubai, Khartoum..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                    />
                    {airportSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#060f17] border border-sky-500/30 rounded-lg overflow-hidden shadow-2xl">
                        {airportSuggestions.map(ap => (
                          <button
                            key={ap.iata}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); selectAirport(ap); }}
                            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-sky-500/10 transition-all border-b border-slate-800/60 last:border-0"
                          >
                            <span className="font-mono text-xs text-sky-400 font-bold w-10 flex-none">{ap.iata}</span>
                            <span className="font-mono text-xs text-slate-200 flex-1 truncate">{ap.city}</span>
                            <span className="font-mono text-[9px] text-slate-600 flex-none">{ap.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={confirmDeparture}
                    disabled={isSearching || !cityInput.trim()}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-sm text-slate-400 hover:border-sky-500/40 hover:text-sky-400 transition-all disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isSearching ? <Radio className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    SET
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="font-mono text-[10px] text-slate-600">DESTINATION (OPTIONAL)</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={destinationInput}
                      onChange={e => { setDestinationInput(e.target.value); setDestSuggestions(filterAirports(e.target.value)); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && destSuggestions.length > 0) selectDestAirport(destSuggestions[0]);
                        if (e.key === 'Escape') setDestSuggestions([]);
                      }}
                      placeholder="Where to? e.g. London, DXB, Toronto…"
                      className="w-full bg-slate-900 border border-emerald-500/25 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    {destSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#060f17] border border-emerald-500/30 rounded-lg overflow-hidden shadow-2xl">
                        {destSuggestions.map(ap => (
                          <button key={ap.iata} type="button"
                            onMouseDown={e => { e.preventDefault(); selectDestAirport(ap); }}
                            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-emerald-500/10 transition-all border-b border-slate-800/60 last:border-0"
                          >
                            <span className="font-mono text-xs text-emerald-400 font-bold w-10 flex-none">{ap.iata}</span>
                            <span className="font-mono text-xs text-slate-200 flex-1 truncate">{ap.city}</span>
                            <span className="font-mono text-[9px] text-slate-600 flex-none">{ap.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="font-mono text-[9px] text-slate-600">Leave blank → auto-find nearest safe region &amp; earliest exit · Includes flight prices</p>
                </div>
              </>
            ) : (
              /* Step 2: Confirm departure + choose mode */
              <div className="space-y-3">
                {/* Confirmed departure */}
                <div className="px-4 py-3 bg-sky-500/10 border border-sky-500/25 rounded-lg">
                  <div className="font-mono text-[9px] text-slate-500 mb-1 tracking-widest">DEPARTURE CONFIRMED</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    <span className="font-mono text-sm text-sky-300">{confirmedLocation.city ?? 'Unknown Location'}</span>
                  </div>
                  <div className="font-mono text-[9px] text-slate-600 mt-0.5">
                    {confirmedLocation.lat.toFixed(4)}°, {confirmedLocation.lng.toFixed(4)}° · {airports.length > 0 ? `${airports.length} airports loaded` : 'loading airports…'}
                  </div>
                </div>

                {/* Destination (editable here too) */}
                <div className="relative">
                  <div className="font-mono text-[9px] text-slate-500 mb-1 tracking-widest">DESTINATION (OPTIONAL)</div>
                  <input
                    type="text"
                    value={destinationInput}
                    autoFocus
                    onChange={e => { setDestinationInput(e.target.value); setDestSuggestions(filterAirports(e.target.value)); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && destSuggestions.length > 0) selectDestAirport(destSuggestions[0]);
                      if (e.key === 'Escape') setDestSuggestions([]);
                    }}
                    placeholder="e.g. London, DXB, New York… (blank = auto safest exit)"
                    className="w-full bg-slate-900 border border-emerald-500/25 rounded-lg px-3 py-2 font-mono text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                  {destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#060f17] border border-emerald-500/30 rounded-lg overflow-hidden shadow-2xl">
                      {destSuggestions.map(ap => (
                        <button key={ap.iata} type="button"
                          onMouseDown={e => { e.preventDefault(); selectDestAirport(ap); }}
                          className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-emerald-500/10 transition-all border-b border-slate-800/60 last:border-0"
                        >
                          <span className="font-mono text-xs text-emerald-400 font-bold w-10 flex-none">{ap.iata}</span>
                          <span className="font-mono text-xs text-slate-200 flex-1 truncate">{ap.city}</span>
                          <span className="font-mono text-[9px] text-slate-600 flex-none">{ap.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* LEAVE NOW — auto safest exit */}
                <button
                  onClick={() => {
                    if (!confirmedLocation) return;
                    const loc = confirmedLocation;
                    setUserLocation(loc); setShowLocateModal(false); setPendingDeparture(null);
                    loadLocationData(loc, passengers, undefined);
                  }}
                  className="w-full py-3 bg-orange-500/15 border border-orange-500/40 rounded-lg font-mono text-sm text-orange-400 hover:bg-orange-500/25 hover:border-orange-500/70 transition-all flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  ⚡ LEAVE NOW — AUTO-FIND SAFEST EXIT
                </button>

                {/* FIND FLIGHTS TO DESTINATION (only if dest filled) */}
                {destinationInput.trim() ? (
                  <button
                    onClick={() => {
                      if (!confirmedLocation) return;
                      const loc = confirmedLocation;
                      setUserLocation(loc); setShowLocateModal(false); setPendingDeparture(null);
                      loadLocationData(loc, passengers, destinationInput.trim());
                    }}
                    className="w-full py-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg font-mono text-sm text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/70 transition-all flex items-center justify-center gap-2"
                  >
                    <Plane className="w-4 h-4" />
                    ✈ FIND FLIGHTS TO {destinationInput.trim().toUpperCase()}
                  </button>
                ) : (
                  <p className="font-mono text-[9px] text-slate-600 text-center">Enter a destination above to search specific flights, or Leave Now for auto safest exit.</p>
                )}

                <button
                  onClick={() => { setConfirmedLocation(null); setUserLocation(null); setCityInput(''); setPendingDeparture(null); }}
                  className="w-full py-1.5 bg-transparent font-mono text-[10px] text-slate-600 hover:text-red-400 transition-all"
                >
                  ✗ WRONG LOCATION — RETRY
                </button>
              </div>
            )}

            <button
              onClick={() => setShowLocateModal(false)}
              className="mt-4 w-full font-mono text-[10px] text-slate-700 hover:text-slate-500 transition-all"
            >
              dismiss — enter location later
            </button>
          </div>
        </div>
      )}

      {/* ── BREAKING NEWS FLASH ──────────────────────────────────────────────── */}
      {breakingNews && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[580px] bg-red-950/95 border border-red-500/70 rounded-xl shadow-2xl overflow-hidden animate-pulse-once">
          <div className="flex items-center gap-3 px-4 py-2 bg-red-500/20 border-b border-red-500/30">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-xs text-red-400 tracking-[0.3em] font-bold">⚡ BREAKING NEWS</span>
            <span className="ml-auto font-mono text-[9px] text-red-500">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
            <button onClick={() => setBreakingNews(null)} className="text-red-600 hover:text-red-400 font-mono text-sm ml-1">&times;</button>
          </div>
          <div className="px-4 py-3">
            <div className="font-mono text-sm text-red-200 leading-snug mb-1">{breakingNews.headline}</div>
            <div className="font-mono text-[10px] text-red-500/70">{breakingNews.region} · JARVIS INTEL FEED</div>
          </div>
        </div>
      )}

      {/* ── WORLD INTEL TICKER ──────────────────────────────────────────────── */}
      <div
        className="flex-none h-7 border-b border-red-500/20 bg-[#0a0507] flex items-center overflow-hidden relative z-20"
        onMouseEnter={() => setTickerPaused(true)}
        onMouseLeave={() => setTickerPaused(false)}
      >
        {/* Label */}
        <div className="flex-none flex items-center gap-1.5 px-3 border-r border-red-500/20 h-full bg-red-500/10 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <Globe2 className="w-3 h-3 text-red-400" />
          <span className="font-mono text-[10px] text-red-400 tracking-widest">LIVE INTEL</span>
        </div>
        {/* Scrolling events */}
        <div className="flex-1 overflow-hidden">
          {worldIntel ? (
            <div
              ref={tickerRef}
              className="inline-flex items-center whitespace-nowrap"
              style={{
                animation: tickerPaused ? 'none' : 'ticker-scroll 90s linear infinite',
              }}
            >
              {/* Duplicate the items so scroll loops seamlessly */}
              {[...Array(2)].flatMap((_, pass) =>
                [...worldIntel.baseline, ...worldIntel.live].map((e, i) => (
                  <span key={`${pass}-${i}`} className="inline-flex items-center gap-2 px-5">
                    <span className={`font-mono text-[9px] px-1 rounded ${
                      e.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      e.severity === 'HIGH'     ? 'bg-orange-500/20 text-orange-400' :
                      e.severity === 'LIVE'     ? 'bg-sky-500/20 text-sky-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{e.severity}</span>
                    <span className="font-mono text-[10px] text-slate-400">{e.headline}</span>
                    <span className="text-slate-700 font-mono text-[10px]">◆</span>
                  </span>
                ))
              )}
            </div>
          ) : (
            <span className="font-mono text-[10px] text-slate-600 px-4">Fetching global intelligence feed...</span>
          )}
        </div>
        {/* Refresh badge */}
        {worldIntel && (
          <div className="flex-none px-3 flex items-center gap-1.5 border-l border-red-500/20 h-full">
            <Newspaper className="w-2.5 h-2.5 text-slate-700" />
            <span className="font-mono text-[9px] text-slate-700">
              {new Date(worldIntel.fetchedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* ── MAIN AREA ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left column: Globe + Intel Brief */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-[#020507]">

        {/* Globe */}
        <div ref={globeWrapRef} className="relative flex-1 min-h-0 overflow-hidden">
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(14,165,233,0.06) 1px, transparent 0)', backgroundSize: '40px 40px' }}
          />

          {/* Globe — self-sizing, fills container via absolute inset-0 internally */}
          <GodEyeGlobe
            userLocation={userLocation}
            airports={airports}
            evacArcs={evacArcs}
          />

          {/* Matrix init overlay */}
          {matrixActive && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center pointer-events-none">
              <div className="font-mono text-emerald-400 text-[11px] leading-5 text-center space-y-0.5 px-8">
                <div className="text-emerald-300 text-xs tracking-[0.3em] mb-3 animate-pulse">INITIALIZING ROUTE ACQUISITION SYSTEM...</div>
                {matrixLines.map((line, i) => (
                  <div key={i} className="opacity-80" style={{ color: `hsl(${120 + i * 4}, 80%, ${40 + i * 3}%)` }}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* No-location overlay */}
          {!userLocation && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full border border-sky-500/25 flex items-center justify-center">
                  <Target className="w-7 h-7 text-sky-500/50" />
                </div>
                <p className="font-mono text-sm text-sky-500/60 tracking-widest">AWAITING POSITION FIX</p>
                <p className="font-mono text-xs text-slate-600">Press LOCATE ME or enter a city below</p>
              </div>
            </div>
          )}

          {/* Legend — always visible */}
          <div className="absolute bottom-4 left-4 z-20 space-y-1.5 bg-black/50 backdrop-blur-sm border border-white/5 rounded px-2.5 py-2">
            <div className="font-mono text-[9px] text-slate-600 tracking-widest mb-1">TENSION ZONES</div>
            {[
              { label: 'CRITICAL', color: '#ef4444' },
              { label: 'HIGH',     color: '#f97316' },
              { label: 'ELEVATED', color: '#eab308' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full opacity-80" style={{ background: color }} />
                <span className="font-mono text-[9px]" style={{ color }}>{label}</span>
              </div>
            ))}
            {userLocation && (
              <>
                <div className="font-mono text-[9px] text-slate-600 tracking-widest mt-1.5 mb-1">RANGE RINGS</div>
                {[['100 km', 'bg-emerald-500'], ['250 km', 'bg-amber-500'], ['500 km', 'bg-red-500']].map(([lbl, cls]) => (
                  <div key={lbl} className="flex items-center gap-2">
                    <div className={`w-3 h-[1px] ${cls} opacity-60`} />
                    <span className="font-mono text-[9px] text-slate-500">{lbl}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── INTEL BRIEF (below globe) ─────────────────────────────────── */}
        <div className="flex-none border-t border-sky-500/15 bg-[#040b12] flex flex-col overflow-hidden" style={{ height: '240px' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-sky-500/10 flex-none">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono text-[11px] text-sky-400 tracking-[0.2em] uppercase">Intel Brief</span>
              <span className="font-mono text-[9px] text-slate-600">// JARVIS-7 // CLASSIFIED</span>
            </div>
            <div className="flex items-center gap-2">
              {userLocation && !isGenerating && (
                <button
                  onClick={() => generateBrief(userLocation, airports)}
                  className="font-mono text-[9px] text-slate-600 hover:text-sky-400 transition-all tracking-wider"
                >
                  [GENERATE]
                </button>
              )}
              <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] border ${tc.bg} ${tc.color}`}>
                {tc.label}
              </span>
              {isGenerating && <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />}
            </div>
          </div>
          <div
            ref={briefRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 font-mono text-[11px]"
          >
            {/* AI text */}
            <div className="leading-relaxed text-slate-300" style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
              {aiText || (
                <span className="text-slate-600 italic">
                  {userLocation ? 'Generating brief...' : 'Acquire position first to enable intelligence analysis.'}
                </span>
              )}
              {isGenerating && <span className="animate-pulse text-sky-400">&#9611;</span>}
            </div>

            {/* ── LIVE AIRPORT STATUS ─────────────────────────────── */}
            {airports.length > 0 && (
              <div className="mt-3 pt-2 border-t border-sky-500/20">
                <div className="font-mono text-[9px] text-sky-400/80 tracking-widest mb-1.5">// LIVE AIRPORT STATUS</div>
                {airports.map(a => {
                  const st = apStatuses[a.iata];
                  return (
                    <div key={a.iata} className="flex items-center gap-1.5 mb-1 text-[9px] font-mono">
                      <span className={`font-bold ${
                        a.distanceKm < 100 ? 'text-emerald-400' : a.distanceKm < 300 ? 'text-amber-400' : 'text-red-400'
                      }`}>{a.iata}</span>
                      <span className="text-slate-500 truncate flex-1">{a.city}</span>
                      {st ? (
                        <span className={`flex-none font-bold ${
                          st.status === 'OPEN'      ? 'text-emerald-400' :
                          st.status === 'DELAYS'    ? 'text-amber-400'   :
                          st.status === 'DISRUPTED' ? 'text-orange-400'  : 'text-red-400'
                        }`}>
                          {STATUS_ICON[st.status]} {st.status}{st.delayMin > 0 ? ` +${st.delayMin}m` : ''}
                        </span>
                      ) : (
                        <span className="flex-none text-slate-700">CHECKING…</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── FLIGHT OPTIONS (from evac routes) ──────────────── */}
            {evacRoutes.length > 0 && (() => {
              const flightLegs = evacRoutes.flatMap(r =>
                r.legs.filter(l => l.mode === 'FLIGHT').map(l => ({ ...l, routeTitle: r.title }))
              );
              if (flightLegs.length === 0) return null;
              return (
                <div className="mt-3 pt-2 border-t border-emerald-500/20">
                  <div className="font-mono text-[9px] text-emerald-400/80 tracking-widest mb-1.5">// FLIGHT OPTIONS</div>
                  {flightLegs.map((leg, i) => (
                    <div key={i} className="mb-1.5 text-[9px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Plane className="w-2.5 h-2.5 text-sky-400 flex-none" />
                        <span className="text-slate-200 font-bold">{leg.from} → {leg.to}</span>
                        <span className="text-slate-500">{leg.durationH.toFixed(1)}h · {leg.distanceKm} km</span>
                        {leg.priceTier && (
                          <span className={`ml-auto font-bold ${
                            leg.priceTier === 'LOW'     ? 'text-emerald-400' :
                            leg.priceTier === 'AVERAGE' ? 'text-amber-400'   :
                            leg.priceTier === 'HIGH'    ? 'text-orange-400'  : 'text-red-500'
                          }`}>
                            {leg.flightPriceUSD != null ? `~$${leg.flightPriceUSD.toLocaleString()}` : leg.priceTier}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pl-4 text-slate-600">
                        <span>{leg.safety}</span>
                        <span>·</span>
                        <span className="truncate">{leg.routeTitle}</span>
                        {leg.bookingUrl && (
                          <a href={leg.bookingUrl} target="_blank" rel="noopener noreferrer"
                            className="ml-auto text-sky-400 hover:text-sky-300 flex-none">
                            BOOK →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Loading state for evac routes */}
            {evacLoading && (
              <div className="mt-3 pt-2 border-t border-emerald-500/15 font-mono text-[9px] text-emerald-400/60 animate-pulse">
                // COMPUTING FLIGHT OPTIONS...
              </div>
            )}
          </div>
        </div>

        </div>{/* end left column */}

        {/* Right panel — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex w-[380px] flex-none flex-col border-l border-sky-500/15 bg-[#040b12]">

          {/* ── EVACUATION ROUTES ───────────────────────────────────────────── */}
          {(evacRoutes.length > 0 || evacLoading) && showEvac && (
            <div className="flex-none border-b border-sky-500/15 max-h-[55%] flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-sky-500/10">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px] text-emerald-400 tracking-[0.18em] uppercase">Evacuation Routes</span>
                <span className="ml-auto font-mono text-[9px] text-slate-600">{passengers} PAX</span>
                <button onClick={() => setShowEvac(false)} className="text-slate-600 hover:text-slate-400 ml-1">
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
              {evacLoading ? (
                <div className="p-4 font-mono text-[10px] text-emerald-400 animate-pulse text-center">
                  COMPUTING ESCAPE VECTORS...<br/>
                  <span className="text-slate-600">Analyzing routes for {passengers} passenger{passengers > 1 ? 's' : ''}</span>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  {evacRoutes.map(route => (
                    <div key={route.id} className="mx-2 my-1.5">
                      <button
                        className={`w-full text-left px-3 py-2 rounded border transition-all ${
                          SAFETY_COLOR[route.overallSafety]
                        }`}
                        onClick={() => setEvacExpanded(evacExpanded === route.id ? null : route.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold">{route.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] opacity-70">{route.totalHours.toFixed(1)}h · {route.totalKm} km</span>
                            {evacExpanded === route.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </div>
                        </div>
                        <p className="font-mono text-[9px] opacity-70 mt-0.5 leading-tight break-words overflow-hidden">{route.summary}</p>
                      </button>

                      {evacExpanded === route.id && (
                        <div className="mt-1 space-y-1 pl-1">
                          {route.legs.map((leg, li) => (
                            <div key={li} className={`px-2.5 py-1.5 rounded border text-[9px] font-mono ${
                              SAFETY_COLOR[leg.safety]
                            }`}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {MODE_ICON[leg.mode]}
                                <span className="font-bold">{leg.mode}</span>
                                <span className="opacity-60">{leg.from} → {leg.to}</span>
                              </div>
                              <div className="opacity-60">{leg.durationH.toFixed(1)}h · {leg.distanceKm} km · {leg.safety}</div>
                              {leg.flightPriceUSD != null && leg.priceTier && (
                                <div className={`mt-0.5 font-mono text-[9px] font-bold ${
                                  leg.priceTier === 'LOW'     ? 'text-emerald-400' :
                                  leg.priceTier === 'AVERAGE' ? 'text-amber-400'   :
                                  leg.priceTier === 'HIGH'    ? 'text-orange-400'  : 'text-red-500'
                                }`}>
                                  💰 ~${leg.flightPriceUSD.toLocaleString()} total · {leg.priceTier} PRICE
                                </div>
                              )}
                              <div className="opacity-50 mt-0.5 leading-tight break-words overflow-hidden">{leg.notes}</div>
                              {leg.bookingUrl && (
                                <a
                                  href={leg.bookingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-sky-400 hover:text-sky-300"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  {leg.operator ?? 'Book Now'}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── AIRPORT DISRUPTIONS ──────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col border-t border-sky-500/15">
            <div className="flex-none px-4 py-2 flex items-center gap-2 border-b border-sky-500/10">
              <Plane className="w-3 h-3 text-sky-400" />
              <span className="font-mono text-[11px] text-sky-400 tracking-[0.18em] uppercase">
                Airport Disruptions
              </span>
              <span className="ml-auto font-mono text-[9px] text-slate-600">
                {airports.length > 0 ? `${airports.length} nearby` : 'no fix'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pb-1">
              {airports.length === 0 ? (
                <div className="px-4 py-6 text-center font-mono text-[11px] text-slate-600">
                  No airports loaded
                </div>
              ) : (
                airports.map((a, i) => {
                  const st = apStatuses[a.iata];
                  const flightsUrl = gFlightsUrl(
                    userLocation?.city ?? `${userLocation?.lat.toFixed(2)},${userLocation?.lng.toFixed(2)}`,
                    a.city,
                  );
                  return (
                  <div
                    key={a.iata}
                    className={`mx-3 mb-1.5 px-3 py-2 rounded border ${urgencyBg(a.distanceKm)} flex flex-col gap-0.5 transition-all hover:brightness-125 cursor-default`}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-slate-600">{i + 1}.</span>
                        <span className={`font-mono text-sm font-bold ${urgencyColor(a.distanceKm)}`}>{a.iata}</span>
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">{a.city}</span>
                      </div>
                      <span className={`font-mono text-xs font-semibold ${urgencyColor(a.distanceKm)}`}>
                        {a.distanceKm} km
                      </span>
                    </div>

                    {/* Status banner — always visible */}
                    {st ? (
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono font-bold border ${
                        st.status === 'OPEN'      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        st.status === 'DELAYS'    ? 'bg-amber-500/10   border-amber-500/30   text-amber-400'   :
                        st.status === 'DISRUPTED' ? 'bg-orange-500/10  border-orange-500/30  text-orange-400'  :
                                                    'bg-red-500/10     border-red-500/30     text-red-400'
                      }`}>
                        <span>{STATUS_ICON[st.status]}</span>
                        <span className="tracking-widest">{st.status}</span>
                        {st.delayMin > 0 && <span className="opacity-70">+{st.delayMin} min delay</span>}
                        {st.status === 'DISRUPTED' && st.reason.toLowerCase().includes('airspace') && (
                          <span className="ml-auto text-[8px] bg-red-500/20 px-1 rounded border border-red-500/40">AIRSPACE ⛔</span>
                        )}
                        {st.status === 'CLOSED' && (
                          <span className="ml-auto text-[8px] bg-red-500/30 px-1 rounded border border-red-500/50 animate-pulse">AIRPORT CLOSED</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono text-slate-600 border border-slate-800">
                        ✈ Status loading...
                      </div>
                    )}

                    {/* Reason (if not normal ops) */}
                    {st && st.status !== 'OPEN' && (
                      <div className="font-mono text-[9px] text-slate-400 leading-tight px-1 break-words overflow-hidden">{st.reason}</div>
                    )}

                    {/* ETAs + flight search */}
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5 text-slate-600" />
                          <span className="font-mono text-[9px] text-slate-500">Road {a.etaCar}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Plane className="w-2.5 h-2.5 text-slate-600" />
                          <span className="font-mono text-[9px] text-slate-500">Air {a.etaAir}</span>
                        </div>
                      </div>
                      {userLocation && (
                        <a
                          href={flightsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                            st?.status === 'CLOSED' || st?.status === 'DISRUPTED'
                              ? 'border-red-500/30 text-red-500/70 line-through cursor-not-allowed'
                              : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/60'
                          }`}
                        >
                          <TrendingUp className="w-2.5 h-2.5" />
                          SEARCH FLIGHTS
                        </a>
                      )}
                    </div>

                    {/* Distance bar */}
                    <div className="mt-0.5">
                      <div className="h-px bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            a.distanceKm < 100 ? 'bg-emerald-500' : a.distanceKm < 300 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (a.distanceKm / (airports[airports.length - 1]?.distanceKm || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
