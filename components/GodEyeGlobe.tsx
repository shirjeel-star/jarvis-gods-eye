'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import Globe from 'react-globe.gl';
import type { NearestAirport } from '@/lib/god-eye-airports';

// ── helpers ──────────────────────────────────────────────────────────────────
function urgencyColor(km: number): string {
  if (km < 100) return '#22c55e';
  if (km < 300) return '#f59e0b';
  return '#ef4444';
}

/** Generate a great-circle polygon ring at `radiusKm` from a centre point */
function geoCircle(lat: number, lng: number, radiusKm: number, pts = 72) {
  const R = 6371;
  const d = radiusKm / R;
  const φ = (lat * Math.PI) / 180;
  const λ = (lng * Math.PI) / 180;
  const coords: [number, number][] = [];
  for (let i = 0; i <= pts; i++) {
    const θ = (i / pts) * 2 * Math.PI;
    const φ2 = Math.asin(Math.sin(φ) * Math.cos(d) + Math.cos(φ) * Math.sin(d) * Math.cos(θ));
    const λ2 = λ + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ), Math.cos(d) - Math.sin(φ) * Math.sin(φ2));
    coords.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI]);
  }
  return coords;
}

// ── Tension Zones (March 2026) ───────────────────────────────────────────────
interface TensionZone {
  lat: number; lng: number;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
}

const TENSION_ZONES: TensionZone[] = [
  { lat: 31.5,  lng:  34.5,  name: 'GAZA / ISRAEL',          severity: 'CRITICAL' },
  { lat: 33.5,  lng:  36.0,  name: 'LEBANON / HEZBOLLAH',     severity: 'CRITICAL' },
  { lat: 48.5,  lng:  38.0,  name: 'UKRAINE\u2013RUSSIA FRONT',    severity: 'CRITICAL' },
  { lat: 15.5,  lng:  32.5,  name: 'SUDAN / KHARTOUM',        severity: 'CRITICAL' },
  { lat: 26.5,  lng:  56.5,  name: 'STRAIT OF HORMUZ',        severity: 'HIGH'     },
  { lat: 24.0,  lng: 120.0,  name: 'TAIWAN STRAIT',           severity: 'HIGH'     },
  { lat: 19.7,  lng:  96.1,  name: 'MYANMAR CONFLICT',        severity: 'HIGH'     },
  { lat: 12.5,  lng:  43.5,  name: 'RED SEA / HOUTHI',        severity: 'HIGH'     },
  { lat: 17.0,  lng:  -2.0,  name: 'SAHEL / MALI\u2013NIGER',      severity: 'ELEVATED' },
  { lat: 18.5,  lng: -72.3,  name: 'HAITI / PORT-AU-PRINCE',  severity: 'ELEVATED' },
  { lat: 40.0,  lng:  46.5,  name: 'ARMENIA\u2013AZERBAIJAN',      severity: 'ELEVATED' },
];

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  ELEVATED: '#eab308',
};

export interface EvacLegArc {
  startLat: number; startLng: number;
  endLat:   number; endLng:   number;
  mode:     string;
  safety:   string;
}

interface Props {
  userLocation: { lat: number; lng: number } | null;
  airports:     NearestAirport[];
  evacArcs?:    EvacLegArc[];
}

export default function GodEyeGlobe({ userLocation, airports, evacArcs = [] }: Props) {
  const globeRef = useRef<any>(null);

  // Self-contained sizing — this component is always ssr:false so window is
  // guaranteed to be available on first (client-only) render.
  // Right panel = 380px on desktop; top bar + ticker = 76px; intel brief = 240px → 316px total vertical offset.
  // On mobile (< 768px) the right panel is hidden, so globe uses full window width.
  const containerRef = useRef<HTMLDivElement>(null);
  const getDims = () => {
    const mobile = window.innerWidth < 768;
    return {
      w: mobile ? window.innerWidth : Math.max(window.innerWidth - 380, 300),
      h: Math.max(window.innerHeight - 316, 300),
    };
  };
  const [dims, setDims] = useState(getDims);
  useEffect(() => {
    const update = () => setDims(getDims());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Fly-in when location becomes available
  useEffect(() => {
    if (!globeRef.current || !userLocation || dims.w === 0) return;
    globeRef.current.pointOfView(
      { lat: userLocation.lat, lng: userLocation.lng, altitude: 1.4 },
      1800,
    );
  }, [userLocation, dims.w]);

  // ── points: user pos + airports + tension zone markers ──────────────────
  const points = useMemo(() => {
    const pts: object[] = [];

    if (userLocation) {
      pts.push({
        lat: userLocation.lat, lng: userLocation.lng,
        alt: 0.02, color: '#ffffff', size: 1.1, label: '\u25b2 YOUR POSITION',
      });
    }

    airports.forEach(a => pts.push({ lat: a.lat, lng: a.lng, alt: 0.01, color: urgencyColor(a.distanceKm), size: 0.65, label: `[${a.iata}] ${a.city} · ${a.distanceKm} km` }));
    TENSION_ZONES.forEach(z => pts.push({ lat: z.lat, lng: z.lng, alt: 0.015, color: SEV_COLOR[z.severity], size: z.severity === 'CRITICAL' ? 0.55 : z.severity === 'HIGH' ? 0.40 : 0.28, label: `⚠ ${z.name}` }));
    return pts;
  }, [userLocation, airports]);

  // ── arcs: airport routes + evac legs ─────────────────────────────────────
  const arcs = useMemo(() => {
    const a: object[] = [];
    if (userLocation) {
      airports.forEach((ap, i) => {
        const c = urgencyColor(ap.distanceKm);
        a.push({ startLat: userLocation.lat, startLng: userLocation.lng, endLat: ap.lat, endLng: ap.lng, color: [c, c + '44'], dashLen: 0.06, dashGap: 0.02, animateTime: 2200 + i * 250, stroke: 0.45 });
      });
    }
    evacArcs.forEach(e => {
      const c = e.safety === 'SAFE' ? '#22c55e' : e.safety === 'MODERATE' ? '#f59e0b' : '#ef4444';
      a.push({ startLat: e.startLat, startLng: e.startLng, endLat: e.endLat, endLng: e.endLng, color: [c + 'ff', c + '55'], dashLen: 0.15, dashGap: 0.05, animateTime: 1400, stroke: 1.3 });
    });
    return a;
  }, [userLocation, airports, evacArcs]);

  // ── polygons: tension zone fills + user range rings ─────────────────────
  const polygons = useMemo(() => {
    const tensionPolys = TENSION_ZONES.map(z => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [geoCircle(
          z.lat, z.lng,
          z.severity === 'CRITICAL' ? 280 : z.severity === 'HIGH' ? 200 : 130,
        )],
      },
      properties: { kind: 'tension', severity: z.severity, name: z.name },
    }));

    const rangeRings = !userLocation ? [] : [100, 250, 500].map((r, i) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [geoCircle(userLocation.lat, userLocation.lng, r)],
      },
      properties: { kind: 'range', idx: i },
    }));

    return [...tensionPolys, ...rangeRings];
  }, [userLocation]);

  // ── animated pulse rings per tension zone ─────────────────────────────────
  const tensionRings = useMemo(() =>
    TENSION_ZONES.map(z => ({
      lat: z.lat, lng: z.lng,
      color:            SEV_COLOR[z.severity],
      maxR:             z.severity === 'CRITICAL' ? 5 : z.severity === 'HIGH' ? 4 : 3,
      propagationSpeed: z.severity === 'CRITICAL' ? 2.8 : z.severity === 'HIGH' ? 2.0 : 1.3,
      repeatPeriod:     z.severity === 'CRITICAL' ? 900  : z.severity === 'HIGH' ? 1300 : 1900,
    })),
  []);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="#0ea5e9"
          atmosphereAltitude={0.18}
          backgroundColor="rgba(0,0,0,0)"

          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointAltitude="alt"
          pointColor="color"
          pointRadius="size"
          pointLabel="label"

          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength="dashLen"
          arcDashGap="dashGap"
          arcDashAnimateTime="animateTime"
          arcStroke="stroke"
          arcAltitudeAutoScale={0.35}

          polygonsData={polygons}
          polygonGeoJsonGeometry="geometry"
          polygonCapColor={(d: any) => {
            if (d.properties.kind === 'tension') return SEV_COLOR[d.properties.severity] + '1e';
            return `rgba(14,165,233,${0.07 - d.properties.idx * 0.02})`;
          }}
          polygonSideColor={() => 'transparent'}
          polygonStrokeColor={(d: any) => {
            if (d.properties.kind === 'tension') return SEV_COLOR[d.properties.severity] + 'aa';
            return 'rgba(14,165,233,0.35)';
          }}
          polygonLabel={(d: any) =>
            d.properties.kind === 'tension' ? `\u26a0 ${d.properties.name}` : ''
          }

          ringsData={tensionRings}
          ringLat="lat"
          ringLng="lng"
          ringColor={(d: any) => (t: number) => {
            const hex = (d.color as string).slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r},${g},${b},${(1 - t).toFixed(2)})`;
          }}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          enablePointerInteraction
        />
    </div>
  );
}
