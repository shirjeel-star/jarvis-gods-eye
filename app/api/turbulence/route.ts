import { NextRequest, NextResponse } from 'next/server';

// Uses the free Aviation Weather Center PIREP dataset (NOAA/FAA)
// https://aviationweather.gov/api/data/pirep
// No API key required. Returns pilot turbulence reports within 200 nm of the aircraft.

const AWC = 'https://aviationweather.gov/api/data/pirep';

// AWC PIREP turbulence intensity strings → numeric severity 0–6
const TB_STRING_MAP: Record<string, number> = {
  NEG: 0, NEGLIGIBLE: 0,
  LGT: 1, LIGHT: 1,
  LGTMOD: 2, 'LGT-MOD': 2,
  MOD: 3, MODERATE: 3,
  MODSEV: 4, 'MOD-SEV': 4,
  SEV: 5, SEVERE: 5,
  EXTRM: 6, EXTREME: 6, EXTM: 6,
};

const TB_LABELS: Record<number, string> = {
  0: 'NONE', 1: 'LIGHT', 2: 'LIGHT-MOD',
  3: 'MODERATE', 4: 'MOD-SEV', 5: 'SEVERE', 6: 'EXTREME',
};

function parseTbInt(v: unknown): number {
  if (typeof v === 'number') return Math.round(v);
  if (typeof v === 'string') {
    const key = v.trim().toUpperCase().replace(/\s+/g, '');
    return TB_STRING_MAP[key] ?? -1;
  }
  return -1;
}

function maxTbLevel(reports: any[]): { level: string; intensity: number; count: number } {
  let maxInt = 0;
  let relevant = 0;
  for (const r of reports) {
    // AWC JSON: turbulence is an array of objects with 'intensity' string
    const tbArr: any[] = Array.isArray(r.turbulence) ? r.turbulence
      : r.turb != null ? [{ intensity: r.turb }]
      : r.tbInt != null ? [{ intensity: r.tbInt }]
      : [];
    for (const t of tbArr) {
      const ti = parseTbInt(t.intensity ?? t.tbInt ?? t.turb);
      if (ti > 0) { relevant++; if (ti > maxInt) maxInt = ti; }
    }
  }
  return { level: TB_LABELS[maxInt] ?? 'NONE', intensity: maxInt, count: relevant };
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const alt = req.nextUrl.searchParams.get('alt'); // feet

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const altFt = parseFloat(alt ?? '35000');
  // Flight level in hundreds of feet (e.g. 35000 ft → FL350 → level=350)
  const level = Math.round(altFt / 100);

  let raw: Response;
  try {
    const url = new URL(AWC);
    url.searchParams.set('format', 'json');
    url.searchParams.set('distance', '200');   // 200 nm radius
    url.searchParams.set('age', '3');          // last 3 hours
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lng);          // AWC uses 'lon', not 'lng'
    url.searchParams.set('level', String(level));
    raw = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  } catch {
    // Network failure — return UNKNOWN rather than erroring
    return NextResponse.json({ level: 'UNKNOWN', intensity: -1, count: 0, source: 'timeout' });
  }

  if (!raw.ok) {
    return NextResponse.json({ level: 'UNKNOWN', intensity: -1, count: 0, source: `awc-${raw.status}` });
  }

  let data: any;
  try {
    data = await raw.json();
  } catch {
    return NextResponse.json({ level: 'UNKNOWN', intensity: -1, count: 0, source: 'parse-error' });
  }

  const reports: any[] = Array.isArray(data) ? data : (data?.data ?? data?.pireps ?? []);
  const result = maxTbLevel(reports);
  return NextResponse.json({ ...result, source: 'awc-pirep', totalReports: reports.length });
}
