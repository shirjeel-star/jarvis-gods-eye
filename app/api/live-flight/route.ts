import { NextRequest, NextResponse } from 'next/server';

// AviationStack free tier uses HTTP — must be called server-side
const BASE = 'http://api.aviationstack.com/v1/flights';

// Airport coordinate table for position interpolation when live data is unavailable
const COORDS: Record<string, [number, number]> = {
  ATL: [33.6407, -84.4277], LAX: [33.9425, -118.4081], ORD: [41.9742, -87.9073],
  DFW: [32.8998, -97.0403], DEN: [39.8561, -104.6737], JFK: [40.6413, -73.7781],
  SFO: [37.6213, -122.3790], SEA: [47.4502, -122.3088], MIA: [25.7959, -80.2870],
  BOS: [42.3656, -71.0096], LAS: [36.0840, -115.1537], MCO: [28.4294, -81.3089],
  LHR: [51.4700, -0.4543], CDG: [49.0097, 2.5479], AMS: [52.3086, 4.7639],
  FRA: [50.0379, 8.5622], MAD: [40.4936, -3.5668], FCO: [41.8003, 12.2389],
  NRT: [35.7720, 140.3929], HND: [35.5494, 139.7798], PEK: [40.0799, 116.6031],
  HKG: [22.3080, 113.9185], ICN: [37.4691, 126.4510], SIN: [1.3644, 103.9915],
  DXB: [25.2528, 55.3644], DOH: [25.2731, 51.6081], SYD: [-33.9461, 151.1772],
  YYZ: [43.6777, -79.6248], MEX: [19.4363, -99.0721], GRU: [-23.4356, -46.4731],
  JNB: [-26.1367, 28.2411], CAI: [30.1219, 31.4056], DEL: [28.5565, 77.1000],
  BOM: [19.0896, 72.8656], BKK: [13.6900, 100.7501], KUL: [2.7456, 101.7099],
};

function interpolate(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number,
): [number, number] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1), λ1 = toRad(lng1);
  const φ2 = toRad(lat2), λ2 = toRad(lng2);
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ));
  if (d === 0) return [lat1, lng1];
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  return [toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function heading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2))
    - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export async function GET(req: NextRequest) {
  const flight = req.nextUrl.searchParams.get('flight');
  if (!flight) {
    return NextResponse.json({ error: 'flight param required' }, { status: 400 });
  }

  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let raw: Response;
  try {
    raw = await fetch(
      `${BASE}?access_key=${key}&flight_iata=${encodeURIComponent(flight.toUpperCase())}`,
      { cache: 'no-store' },
    );
  } catch {
    return NextResponse.json({ error: 'Network error reaching AviationStack' }, { status: 502 });
  }

  if (!raw.ok) {
    return NextResponse.json({ error: `AviationStack error ${raw.status}` }, { status: 502 });
  }

  let json: { data?: any[]; error?: { info?: string } };
  try {
    json = await raw.json();
  } catch {
    return NextResponse.json({ error: 'Invalid response from AviationStack' }, { status: 502 });
  }

  if (json.error) {
    return NextResponse.json({ error: json.error.info ?? 'AviationStack API error' }, { status: 422 });
  }

  const flights = json.data ?? [];
  if (flights.length === 0) {
    return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
  }

  // Pick the most recent active flight, or just the first result
  const f = flights.find((x: any) => x.flight_status === 'active') ?? flights[0];

  const originIata: string = f.departure?.iata ?? '';
  const destIata: string = f.arrival?.iata ?? '';
  const originCoords = COORDS[originIata] ?? [0, 0];
  const destCoords = COORDS[destIata] ?? [10, 10];

  // Calculate progress from scheduled times
  const depTime = new Date(f.departure?.actual ?? f.departure?.scheduled ?? Date.now()).getTime();
  const arrTime = new Date(f.arrival?.estimated ?? f.arrival?.scheduled ?? Date.now() + 3600000).getTime();
  const now = Date.now();
  const rawProgress = (now - depTime) / (arrTime - depTime);
  const progress = Math.max(0, Math.min(rawProgress, 0.99));

  // Use live position from API if available, else interpolate
  let liveLat: number, liveLng: number, liveHeading: number;
  let altitude = 35000;
  let speedH = 900;
  let isGround = false;

  if (f.live && typeof f.live.latitude === 'number') {
    liveLat = f.live.latitude;
    liveLng = f.live.longitude;
    altitude = f.live.altitude ?? 35000;
    speedH = f.live.speed_horizontal ?? 900;
    liveHeading = f.live.direction ?? heading(liveLat, liveLng, destCoords[0], destCoords[1]);
    isGround = f.live.is_ground ?? false;
  } else {
    const [iLat, iLng] = interpolate(originCoords[0], originCoords[1], destCoords[0], destCoords[1], progress);
    liveLat = iLat;
    liveLng = iLng;
    liveHeading = heading(liveLat, liveLng, destCoords[0], destCoords[1]);
    isGround = f.flight_status === 'landed';
  }

  return NextResponse.json({
    flightNumber: f.flight?.iata ?? flight.toUpperCase(),
    airline: f.airline?.name ?? 'Unknown Airline',
    aircraft: f.aircraft?.iata ?? f.aircraft?.registration ?? 'Unknown',
    status: f.flight_status ?? 'unknown',
    origin: {
      iata: originIata,
      name: f.departure?.airport ?? originIata,
      city: f.departure?.airport ?? originIata,
      lat: originCoords[0],
      lng: originCoords[1],
    },
    destination: {
      iata: destIata,
      name: f.arrival?.airport ?? destIata,
      city: f.arrival?.airport ?? destIata,
      lat: destCoords[0],
      lng: destCoords[1],
    },
    live: {
      lat: liveLat,
      lng: liveLng,
      altitude,
      speedH,
      heading: liveHeading,
      isGround,
    },
    depScheduled: f.departure?.scheduled ?? new Date().toISOString(),
    arrScheduled: f.arrival?.scheduled ?? new Date().toISOString(),
    depActual: f.departure?.actual ?? undefined,
    arrActual: f.arrival?.actual ?? undefined,
    progress,
    totalDistanceKm: Math.round(haversineKm(originCoords[0], originCoords[1], destCoords[0], destCoords[1])),
    distanceToDestKm: Math.round(haversineKm(liveLat, liveLng, destCoords[0], destCoords[1])),
  });
}
