import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface AirportInput {
  iata: string;
  lat: number;
  lng: number;
}

// Same tension zones as the globe so status is coherent
const TENSION_ZONES = [
  { lat: 31.5,  lng:  34.5, severity: 'CRITICAL', name: 'Gaza/Israel' },
  { lat: 33.5,  lng:  36.0, severity: 'CRITICAL', name: 'Lebanon' },
  { lat: 48.5,  lng:  38.0, severity: 'CRITICAL', name: 'Ukraine–Russia' },
  { lat: 15.5,  lng:  32.5, severity: 'CRITICAL', name: 'Sudan' },
  { lat: 26.5,  lng:  56.5, severity: 'HIGH',     name: 'Strait of Hormuz' },
  { lat: 24.0,  lng: 120.0, severity: 'HIGH',     name: 'Taiwan Strait' },
  { lat: 19.7,  lng:  96.1, severity: 'HIGH',     name: 'Myanmar' },
  { lat: 12.5,  lng:  43.5, severity: 'HIGH',     name: 'Red Sea/Houthi' },
  { lat: 17.0,  lng:  -2.0, severity: 'ELEVATED', name: 'Sahel/Mali–Niger' },
  { lat: 18.5,  lng: -72.3, severity: 'ELEVATED', name: 'Haiti' },
  { lat: 40.0,  lng:  46.5, severity: 'ELEVATED', name: 'Armenia–Azerbaijan' },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Pseudo-random seeded by iata+date so status is stable within a day
function seededJitter(iata: string, range: number): number {
  const seed = iata.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const day  = Math.floor(Date.now() / 86_400_000);
  return ((seed * 2654435761 + day) >>> 0) % range;
}

export async function POST(req: NextRequest) {
  const { airports }: { airports: AirportInput[] } = await req.json();

  const statuses: Record<string, {
    status: 'OPEN' | 'DELAYS' | 'DISRUPTED' | 'CLOSED';
    delayMin: number;
    reason: string;
    updated: string;
  }> = {};

  const now = new Date().toISOString();

  for (const ap of airports) {
    let worstStatus: 'OPEN' | 'DELAYS' | 'DISRUPTED' | 'CLOSED' = 'OPEN';
    let delayMin = 0;
    let reason = 'Normal operations';

    for (const zone of TENSION_ZONES) {
      const km = haversineKm(ap.lat, ap.lng, zone.lat, zone.lng);

      if (zone.severity === 'CRITICAL') {
        if (km < 120) {
          worstStatus = 'DISRUPTED';
          reason = `Airspace closed — ${zone.name} conflict`;
          break;
        } else if (km < 280 && worstStatus !== 'DISRUPTED') {
          worstStatus = 'DISRUPTED';
          delayMin = 90 + seededJitter(ap.iata, 120);
          reason = `Airspace restrictions — ${zone.name}`;
        } else if (km < 500 && worstStatus === 'OPEN') {
          worstStatus = 'DELAYS';
          delayMin = 25 + seededJitter(ap.iata, 60);
          reason = `Security screening delays — ${zone.name} proximity`;
        }
      } else if (zone.severity === 'HIGH') {
        if (km < 100 && worstStatus === 'OPEN') {
          worstStatus = 'DISRUPTED';
          delayMin = 60 + seededJitter(ap.iata, 60);
          reason = `Operational disruption — ${zone.name}`;
        } else if (km < 300 && worstStatus === 'OPEN') {
          worstStatus = 'DELAYS';
          delayMin = 20 + seededJitter(ap.iata, 40);
          reason = `Enhanced security checks — ${zone.name}`;
        }
      } else if (zone.severity === 'ELEVATED') {
        if (km < 150 && worstStatus === 'OPEN') {
          worstStatus = 'DELAYS';
          delayMin = 15 + seededJitter(ap.iata, 30);
          reason = `Elevated security measures — ${zone.name}`;
        }
      }
    }

    statuses[ap.iata] = { status: worstStatus, delayMin, reason, updated: now };
  }

  return NextResponse.json({ statuses });
}
