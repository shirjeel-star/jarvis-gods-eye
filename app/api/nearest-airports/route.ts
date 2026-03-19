import { NextRequest } from 'next/server';
import { findNearestAirports } from '@/lib/god-eye-airports';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');
  const n   = parseInt(url.searchParams.get('n')   ?? '8', 10);

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const airports = findNearestAirports(lat, lng, n);
  return Response.json({ airports });
}
