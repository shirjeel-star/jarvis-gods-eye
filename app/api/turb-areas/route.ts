import { NextResponse } from 'next/server';

// Free Aviation Weather Center SIGMET/AIRMET API — turbulence hazard polygons
// https://aviationweather.gov/api/data/airsigmet
// No API key required. Returns active SIGMET/AIRMET turbulence areas globally.

const AWC = 'https://aviationweather.gov/api/data/airsigmet';

function sevInt(sev: string): number {
  const s = (sev ?? '').toUpperCase().replace(/[-\s]/g, '');
  if (s.includes('EXTR') || s.includes('EXTM')) return 6;
  if (s.includes('MODSEV'))  return 4;
  if (s.includes('SEV'))     return 5;
  if (s.includes('LGTMOD'))  return 2;
  if (s.includes('MOD'))     return 3;
  return 1; // LGT / unknown
}

function sevCapColor(sev: string): string {
  const i = sevInt(sev);
  if (i >= 6) return 'rgba(220,30,30,0.50)';
  if (i >= 5) return 'rgba(255,70,20,0.45)';
  if (i >= 4) return 'rgba(255,115,20,0.42)';
  if (i >= 3) return 'rgba(255,165,0,0.38)';
  if (i >= 2) return 'rgba(255,210,30,0.28)';
  return 'rgba(255,240,100,0.22)';
}

function sevStrokeColor(sev: string): string {
  const i = sevInt(sev);
  if (i >= 6) return 'rgba(255,60,60,1)';
  if (i >= 5) return 'rgba(255,100,40,1)';
  if (i >= 4) return 'rgba(255,140,40,1)';
  if (i >= 3) return 'rgba(255,180,30,1)';
  if (i >= 2) return 'rgba(255,220,60,0.9)';
  return 'rgba(255,245,120,0.7)';
}

export async function GET() {
  try {
    const url = new URL(AWC);
    url.searchParams.set('format', 'json');
    url.searchParams.set('hazard', 'turb');

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'CrewTracker/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ features: [], count: 0, source: `awc-${res.status}` });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json().catch(() => []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = Array.isArray(data) ? data : (data?.data ?? []);

    const features = items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => Array.isArray(item.coords) && item.coords.length >= 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        // GeoJSON rings use [lng, lat] pairs
        const ring: [number, number][] = item.coords.map(
          (c: { lat: number; lon: number }) => [c.lon, c.lat] as [number, number],
        );
        // Close ring if open
        const first = ring[0], last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);

        // Centroid for proximity check on client
        const sumLng = ring.reduce((s, p) => s + p[0], 0);
        const sumLat = ring.reduce((s, p) => s + p[1], 0);
        const n = ring.length;

        const sev: string = item.severity ?? 'MOD';

        return {
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: {
            severity:    sev,
            sevInt:      sevInt(sev),
            capColor:    sevCapColor(sev),
            strokeColor: sevStrokeColor(sev),
            altLow:  (item.altitudeLow1 ?? 0) * 100,   // FL → ft
            altHigh: (item.altitudeHi1  ?? 600) * 100,
            sigmetType: item.airsigmetType ?? 'SIGMET',
            centroidLng: sumLng / n,
            centroidLat: sumLat / n,
          },
        };
      });

    return NextResponse.json({ features, count: features.length, source: 'awc-airsigmet' });
  } catch {
    return NextResponse.json({ features: [], count: 0, source: 'error' });
  }
}
