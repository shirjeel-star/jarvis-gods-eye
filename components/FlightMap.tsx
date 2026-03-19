'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
  Line,
  Marker,
} from 'react-simple-maps';
import { Flight } from '@/types';
import { getFlights } from '@/lib/storage';
import { formatDuration, formatDistance, getStatusColor } from '@/lib/utils';

// Natural Earth TopoJSON from public CDN
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface RouteInfo {
  flight: Flight;
}

interface AptInfo {
  code: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
}

// Great-circle intermediate points for curved arcs
function greatCirclePoints(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  n = 50
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1), λ1 = toRad(lng1);
  const φ2 = toRad(lat2), λ2 = toRad(lng2);
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
  ));
  if (d === 0) return [[lng1, lat1]];
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    pts.push([lng, lat]);
  }
  return pts;
}

export default function FlightMap() {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [airports, setAirports] = useState<AptInfo[]>([]);
  const [hovered, setHovered] = useState<Flight | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const flights = getFlights();
    const aptMap = new Map<string, AptInfo>();
    flights.forEach((f) => {
      setRoutes((prev) => [...prev.filter((r) => r.flight.id !== f.id), { flight: f }]);
      [
        { code: f.origin.code, city: f.origin.city, lat: f.origin.lat, lng: f.origin.lng },
        { code: f.destination.code, city: f.destination.city, lat: f.destination.lat, lng: f.destination.lng },
      ].forEach(({ code, city, lat, lng }) => {
        if (!aptMap.has(code)) aptMap.set(code, { code, city, lat, lng, count: 0 });
        aptMap.get(code)!.count++;
      });
    });
    setRoutes(flights.map((f) => ({ flight: f })));
    setAirports(Array.from(aptMap.values()));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#04060e] border border-[#1a1e30] rounded-sm overflow-hidden"
      style={{ aspectRatio: '2 / 1' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setHovered(null); setTooltipPos(null); }}
    >
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 185, center: [10, 10] }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        {/* Ocean fill */}
        <Sphere id="ocean-sphere" fill="#04080f" stroke="none" strokeWidth={0} />

        {/* Graticule grid lines */}
        <Graticule stroke="rgba(20,35,55,0.6)" strokeWidth={0.4} />

        {/* Equator highlight */}
        <Line
          from={[-180, 0]}
          to={[180, 0]}
          stroke="rgba(0,212,255,0.08)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />

        {/* Country fills */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0d1525"
                stroke="#1a2840"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill: '#111e30' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Great-circle flight routes */}
        {routes.map(({ flight }) => {
          const pts = greatCirclePoints(
            flight.origin.lat, flight.origin.lng,
            flight.destination.lat, flight.destination.lng,
          );
          const isHov = hovered?.id === flight.id;
          return (
            <g key={flight.id}>
              {/* Glow layer */}
              <Line
                from={[flight.origin.lng, flight.origin.lat]}
                to={[flight.destination.lng, flight.destination.lat]}
                coordinates={pts}
                stroke={isHov ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.06)'}
                strokeWidth={isHov ? 5 : 3}
                strokeLinecap="round"
                style={{ filter: isHov ? 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' : undefined }}
              />
              {/* Main visible arc */}
              <Line
                from={[flight.origin.lng, flight.origin.lat]}
                to={[flight.destination.lng, flight.destination.lat]}
                coordinates={pts}
                stroke={isHov ? '#00d4ff' : 'rgba(0,180,220,0.45)'}
                strokeWidth={isHov ? 1.5 : 0.9}
                strokeDasharray={isHov ? '0' : '5 4'}
                strokeLinecap="round"
                style={{ cursor: 'pointer' }}
              />
              {/* Invisible wide hit-area */}
              <Line
                from={[flight.origin.lng, flight.origin.lat]}
                to={[flight.destination.lng, flight.destination.lat]}
                coordinates={pts}
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHovered(flight)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        {/* Airport markers */}
        {airports.map((apt) => {
          const r = Math.min(3 + apt.count * 0.8, 6);
          return (
            <Marker key={apt.code} coordinates={[apt.lng, apt.lat]}>
              {/* pulse ring */}
              <circle r={r + 4} fill="rgba(0,212,255,0.06)" />
              <circle
                r={r}
                fill="#00d4ff"
                fillOpacity={0.85}
                style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.7))' }}
              />
              {apt.count >= 2 && (
                <text
                  textAnchor="start"
                  x={r + 3}
                  y={-r}
                  fontSize={8}
                  fill="rgba(0,212,255,0.9)"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {apt.code}
                </text>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Tooltip */}
      {hovered && tooltipPos && (
        <div
          className="absolute pointer-events-none z-20 bg-[#0a0d18]/95 border border-[#252a40] rounded p-3 shadow-2xl"
          style={{
            left: Math.min(tooltipPos.x + 14, (containerRef.current?.clientWidth ?? 800) - 210),
            top: Math.max(tooltipPos.y - 90, 8),
            minWidth: 190,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="font-mono text-[10px] text-cyan-400 mb-2 tracking-wider">
            {hovered.flightNumber} · {hovered.airline}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-base font-bold text-white">{hovered.origin.code}</span>
            <span className="text-slate-600 text-xs">──✈──</span>
            <span className="font-mono text-base font-bold text-white">{hovered.destination.code}</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500 mb-2">
            {hovered.origin.city} → {hovered.destination.city}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <div className="font-mono text-[10px] text-slate-600">Duration</div>
            <div className="font-mono text-[10px] text-slate-400">{formatDuration(hovered.duration)}</div>
            <div className="font-mono text-[10px] text-slate-600">Distance</div>
            <div className="font-mono text-[10px] text-slate-400">{formatDistance(hovered.distance)}</div>
            <div className="font-mono text-[10px] text-slate-600">Aircraft</div>
            <div className="font-mono text-[10px] text-slate-400 truncate">{hovered.aircraft || '—'}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#1a1e30]">
            <span className={`tag border text-[9px] ${getStatusColor(hovered.status)}`}>
              {hovered.status}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="rgba(0,180,220,0.5)" strokeWidth="1" strokeDasharray="5 4" /></svg>
          <span className="font-mono text-[9px] text-slate-600">Logged route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 6px rgba(0,212,255,0.6)' }} />
          <span className="font-mono text-[9px] text-slate-600">Airport</span>
        </div>
      </div>

      {/* Counter */}
      <div className="absolute top-3 right-3 bg-[#04060e]/90 border border-[#1a1e30] rounded px-3 py-1.5 font-mono">
        <div className="text-[9px] text-slate-600 uppercase tracking-wider">Route Map</div>
        <div className="text-xs text-slate-400 mt-0.5">
          <span className="text-cyan-400 font-bold">{routes.length}</span> routes ·{' '}
          <span className="text-cyan-400 font-bold">{airports.length}</span> airports
        </div>
      </div>
    </div>
  );
}
