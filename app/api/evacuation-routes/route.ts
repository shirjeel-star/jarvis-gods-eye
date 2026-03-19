import { NextRequest } from 'next/server';

export const runtime = 'edge';

// ── types ──────────────────────────────────────────────────────────────────
interface EvacLeg {
  mode: 'FLIGHT' | 'TRAIN' | 'BUS' | 'BOAT' | 'DRIVE' | 'TAXI';
  from: string;
  to: string;
  fromLat: number; fromLng: number;
  toLat: number;   toLng: number;
  durationH: number;
  distanceKm: number;
  safety: 'SAFE' | 'MODERATE' | 'RISKY';
  notes: string;
  operator?: string;
  bookingUrl?: string;
  flightPriceUSD?: number;
  priceTier?: 'LOW' | 'AVERAGE' | 'HIGH' | 'SURGE';
}

interface EvacRoute {
  id: string;
  rank: number;
  title: string;
  totalHours: number;
  totalKm: number;
  overallSafety: 'SAFE' | 'MODERATE' | 'RISKY';
  summary: string;
  legs: EvacLeg[];
  destinationLat: number;
  destinationLng: number;
  destinationCity: string;
}

// ── tension zone lookup by proximity ──────────────────────────────────────
function isNearTensionZone(lat: number, lng: number): boolean {
  const ZONES = [
    { lat: 31.5, lng: 34.5 }, { lat: 33.5, lng: 36.0 },
    { lat: 48.5, lng: 38.0 }, { lat: 15.5, lng: 32.5 },
    { lat: 26.5, lng: 56.5 }, { lat: 24.0, lng: 120.0 },
    { lat: 19.7, lng: 96.1 }, { lat: 12.5, lng: 43.5 },
  ];
  return ZONES.some(z => Math.hypot(z.lat - lat, z.lng - lng) < 8);
}

// ── haversine ──────────────────────────────────────────────────────────────
function haversineKm(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371;
  const dLat = (la2 - la1) * Math.PI / 180;
  const dLon = (lo2 - lo1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── regional exit airport hubs ─────────────────────────────────────────────
const SAFE_HUBS = [
  // Middle East / Near East
  { city: 'Amman',       country: 'Jordan',      lat: 31.72,  lng: 35.99,   iata: 'AMM' },
  { city: 'Beirut',      country: 'Lebanon',     lat: 33.82,  lng: 35.49,   iata: 'BEY' },
  { city: 'Cairo',       country: 'Egypt',       lat: 30.11,  lng: 31.40,   iata: 'CAI' },
  { city: 'Istanbul',    country: 'Turkey',       lat: 41.27,  lng: 28.74,   iata: 'IST' },
  { city: 'Dubai',       country: 'UAE',          lat: 25.25,  lng: 55.36,   iata: 'DXB' },
  { city: 'Muscat',      country: 'Oman',         lat: 23.59,  lng: 58.29,   iata: 'MCT' },
  { city: 'Doha',        country: 'Qatar',        lat: 25.27,  lng: 51.61,   iata: 'DOH' },
  { city: 'Riyadh',      country: 'Saudi Arabia', lat: 24.96,  lng: 46.70,   iata: 'RUH' },
  // Europe
  { city: 'Athens',      country: 'Greece',       lat: 37.94,  lng: 23.94,   iata: 'ATH' },
  { city: 'Warsaw',      country: 'Poland',       lat: 52.17,  lng: 20.97,   iata: 'WAW' },
  { city: 'Bucharest',   country: 'Romania',      lat: 44.57,  lng: 26.10,   iata: 'OTP' },
  { city: 'London',      country: 'UK',           lat: 51.48,  lng: -0.46,   iata: 'LHR' },
  { city: 'Frankfurt',   country: 'Germany',      lat: 50.04,  lng: 8.56,    iata: 'FRA' },
  { city: 'Paris',       country: 'France',       lat: 49.01,  lng: 2.55,    iata: 'CDG' },
  { city: 'Amsterdam',   country: 'Netherlands',  lat: 52.31,  lng: 4.76,    iata: 'AMS' },
  { city: 'Madrid',      country: 'Spain',        lat: 40.47,  lng: -3.57,   iata: 'MAD' },
  { city: 'Zurich',      country: 'Switzerland',  lat: 47.46,  lng: 8.55,    iata: 'ZRH' },
  // Africa
  { city: 'Nairobi',     country: 'Kenya',        lat: -1.32,  lng: 36.93,   iata: 'NBO' },
  { city: 'Djibouti',    country: 'Djibouti',     lat: 11.55,  lng: 43.16,   iata: 'JIB' },
  { city: 'Addis Ababa', country: 'Ethiopia',     lat: 8.98,   lng: 38.80,   iata: 'ADD' },
  { city: 'Johannesburg',country: 'South Africa', lat: -26.13, lng: 28.24,   iata: 'JNB' },
  { city: 'Casablanca',  country: 'Morocco',      lat: 33.37,  lng: -7.59,   iata: 'CMN' },
  // Asia / Pacific
  { city: 'Bangkok',     country: 'Thailand',     lat: 13.69,  lng: 100.74,  iata: 'BKK' },
  { city: 'Singapore',   country: 'Singapore',    lat: 1.35,   lng: 103.99,  iata: 'SIN' },
  { city: 'Kuala Lumpur',country: 'Malaysia',     lat: 2.74,   lng: 101.71,  iata: 'KUL' },
  { city: 'Tokyo',       country: 'Japan',        lat: 35.55,  lng: 139.78,  iata: 'NRT' },
  { city: 'Seoul',       country: 'South Korea',  lat: 37.46,  lng: 126.44,  iata: 'ICN' },
  { city: 'New Delhi',   country: 'India',        lat: 28.55,  lng: 77.10,   iata: 'DEL' },
  { city: 'Mumbai',      country: 'India',        lat: 19.09,  lng: 72.87,   iata: 'BOM' },
  { city: 'Sydney',      country: 'Australia',    lat: -33.95, lng: 151.18,  iata: 'SYD' },
  // Americas
  { city: 'Toronto',     country: 'Canada',       lat: 43.68,  lng: -79.63,  iata: 'YYZ' },
  { city: 'New York',    country: 'USA',          lat: 40.64,  lng: -73.78,  iata: 'JFK' },
  { city: 'Miami',       country: 'USA',          lat: 25.80,  lng: -80.29,  iata: 'MIA' },
  { city: 'Los Angeles', country: 'USA',          lat: 33.94,  lng: -118.41, iata: 'LAX' },
  { city: 'Mexico City', country: 'Mexico',       lat: 19.44,  lng: -99.07,  iata: 'MEX' },
  { city: 'Bogota',      country: 'Colombia',     lat: 4.70,   lng: -74.15,  iata: 'BOG' },
  { city: 'Lima',        country: 'Peru',         lat: -12.02, lng: -77.11,  iata: 'LIM' },
];

// ── inland border crossing points ─────────────────────────────────────────
const BORDER_CROSSINGS: Record<string, { name: string; lat: number; lng: number; toCountry: string }[]> = {
  // Ukraine
  'UA': [
    { name: 'Krakovets',    lat: 49.98, lng: 23.17, toCountry: 'Poland'  },
    { name: 'Uzhhorod',     lat: 48.62, lng: 22.30, toCountry: 'Slovakia'},
    { name: 'Porubne',      lat: 48.27, lng: 25.51, toCountry: 'Romania' },
  ],
  // Israel/Gaza
  'IL': [
    { name: 'Taba/Eilat',   lat: 29.51, lng: 34.94, toCountry: 'Egypt'  },
    { name: 'Allenby Bridge',lat: 31.88, lng: 35.55, toCountry: 'Jordan' },
  ],
  // Sudan
  'SD': [
    { name: 'Wadi Halfa',   lat: 21.80, lng: 31.35, toCountry: 'Egypt'  },
    { name: 'Metema',       lat: 12.94, lng: 36.20, toCountry: 'Ethiopia'},
  ],
  // Myanmar
  'MM': [
    { name: 'Mae Sot',      lat: 16.71, lng: 98.57, toCountry: 'Thailand' },
    { name: 'Moreh',        lat: 24.25, lng: 94.28, toCountry: 'India'   },
  ],
};

// ── sea ports for boat escape ──────────────────────────────────────────────
const SEA_PORTS = [
  { city: 'Haifa',      lat: 32.82, lng: 34.99, routes: ['Cyprus','Greece'] },
  { city: 'Aqaba',      lat: 29.52, lng: 35.01, routes: ['Egypt','Saudi Arabia'] },
  { city: 'Odessa',     lat: 46.48, lng: 30.73, routes: ['Romania','Turkey'] },
  { city: 'Port Sudan', lat: 19.61, lng: 37.22, routes: ['Saudi Arabia','Djibouti'] },
  { city: 'Myawaddy',   lat: 16.70, lng: 98.52, routes: ['Thailand'] },
];

// ── flight price estimation ──────────────────────────────────────────────
function estimateFlightPrice(distKm: number, inCrisis: boolean) {
  const base = Math.max(90, 90 + distKm * 0.12);
  const pricePerPax = Math.round(base * (inCrisis ? 1.9 : 1.0) / 10) * 10;
  const priceTier: 'LOW' | 'AVERAGE' | 'HIGH' | 'SURGE' =
    pricePerPax < 200 ? 'LOW' : pricePerPax < 500 ? 'AVERAGE' : pricePerPax < 900 ? 'HIGH' : 'SURGE';
  return { pricePerPax, priceTier };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lat, lng, passengers = 1, city = 'Your Location', destination } = body as {
    lat: number; lng: number; passengers: number; city: string; destination?: string;
  };

  const inTensionZone = isNearTensionZone(lat, lng);

  // Find nearest safe hubs — EXCLUDING the hub the user is already at/in
  // (same city name or within 60 km) so we never suggest "Dubai → Dubai".
  // Also de-duplicate by keeping at most one hub per country for diversity.
  const usedCountries = new Set<string>();
  const sortedHubs = [...SAFE_HUBS]
    .map(h => ({ ...h, distKm: haversineKm(lat, lng, h.lat, h.lng) }))
    .filter(h => {
      // Skip if user is already there (within 60 km or city name substring match)
      if (h.distKm < 60) return false;
      const cityLower = city.toLowerCase();
      if (cityLower.includes(h.city.toLowerCase()) || h.city.toLowerCase().includes(cityLower.split(' ')[0])) return false;
      return true;
    })
    .sort((a, b) => a.distKm - b.distKm)
    // Take up to 4 hubs, but enforce one-per-country diversity after the first 2
    .filter((h, idx) => {
      if (idx < 2) { usedCountries.add(h.country); return true; }
      if (usedCountries.has(h.country)) return false;
      usedCountries.add(h.country);
      return true;
    })
    .slice(0, 4);

  // Safety net: if all hubs were filtered out (user is at every hub somehow), fall back to full sorted list
  if (sortedHubs.length === 0) {
    const fallback = [...SAFE_HUBS]
      .map(h => ({ ...h, distKm: haversineKm(lat, lng, h.lat, h.lng) }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(1, 5); // skip index 0 (nearest = user's own city) take next 4
    sortedHubs.push(...fallback);
  }

  const routes: EvacRoute[] = [];

  // ── ROUTE: Custom destination flight (if user specified one) ─────
  if (destination) {
    const nd = destination.toLowerCase().trim();
    const destHub = SAFE_HUBS.find(h =>
      h.city.toLowerCase().includes(nd) ||
      nd.includes(h.city.toLowerCase()) ||
      h.country.toLowerCase().includes(nd)
    );
    if (destHub) {
      const destKm = haversineKm(lat, lng, destHub.lat, destHub.lng);
      const dp = estimateFlightPrice(destKm, inTensionZone);
      routes.push({
        id: 'dest-1',
        rank: 0,
        title: `\uD83C\uDFAF DIRECT \u2014 ${destHub.city.toUpperCase()}`,
        totalHours: Math.round(destKm / 750 * 10) / 10 + 0.5,
        totalKm: Math.round(destKm),
        overallSafety: inTensionZone ? 'MODERATE' : 'SAFE',
        summary: `Your chosen destination: ${destHub.city}, ${destHub.country}. Est. $${dp.pricePerPax}/person \u00b7 ${dp.priceTier} price. Book ${passengers} seat${passengers > 1 ? 's' : ''} now.`,
        legs: [{
          mode:       'FLIGHT',
          from:       city,
          to:         `${destHub.city} (${destHub.iata}) \u2014 ${destHub.country}`,
          fromLat:    lat,          fromLng:    lng,
          toLat:      destHub.lat,  toLng:      destHub.lng,
          distanceKm: Math.round(destKm),
          durationH:  Math.round(destKm / 750 * 10) / 10 + 0.5,
          safety:     inTensionZone ? 'MODERATE' : 'SAFE',
          notes:      `Flight to your requested destination. Search Skyscanner / Google Flights for ${destHub.iata}.`,
          bookingUrl: `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(destHub.city)}`,
          operator:   `Multiple carriers \u2014 ${destHub.iata}`,
          flightPriceUSD: dp.pricePerPax * passengers,
          priceTier:  dp.priceTier,
        }],
        destinationLat:  destHub.lat,
        destinationLng:  destHub.lng,
        destinationCity: destHub.city,
      });
    }
  }

  // ── ROUTE 0: Taxi/Rideshare to nearest airport (only if user is NOT already at an airport hub)
  const nearestHub = sortedHubs[0];
  if (nearestHub && nearestHub.distKm < 120) {
    routes.push({
      id: 'taxi-1',
      rank: 0,
      title: `🚕 TAXI — Direct to ${nearestHub.iata} Airport`,
      totalHours: Math.round(nearestHub.distKm / 45 * 10) / 10,
      totalKm: Math.round(nearestHub.distKm),
      overallSafety: inTensionZone ? 'MODERATE' : 'SAFE',
      summary: `Fastest option: taxi or rideshare directly to ${nearestHub.city} international airport (${Math.round(nearestHub.distKm)} km). Cash preferred. Depart immediately.`,
      legs: [{
        mode: 'TAXI',
        from: city,
        to:   `${nearestHub.city} Airport (${nearestHub.iata})`,
        fromLat: lat,          fromLng: lng,
        toLat:   nearestHub.lat, toLng: nearestHub.lng,
        distanceKm: Math.round(nearestHub.distKm),
        durationH:  Math.round(nearestHub.distKm / 45 * 10) / 10,
        safety:  inTensionZone ? 'MODERATE' : 'SAFE',
        notes:   'Book Uber / Careem / local taxi. Carry cash. Avoid apps if networks are disrupted. Keep doors unlocked at checkpoints.',
        bookingUrl: 'https://m.uber.com/ul/?action=setPickup&pickup=my_location',
        operator: 'Uber / Careem / Local Taxi',
      }],
      destinationLat: nearestHub.lat,
      destinationLng: nearestHub.lng,
      destinationCity: nearestHub.city,
    });
  }

  // ── ROUTE 1: Fastest air exit to nearest hub ──────────────────────────
  const hub1 = sortedHubs[0];
  const legs1: EvacLeg[] = [];

  // If in tension zone, first leg is drive/bus to nearest border
  if (inTensionZone && hub1.distKm > 80) {
    legs1.push({
      mode:      'DRIVE',
      from:      city,
      to:        'Nearest Checkpoint / Border',
      fromLat:   lat, fromLng: lng,
      toLat:     lat + (hub1.lat - lat) * 0.2,
      toLng:     lng + (hub1.lng - lng) * 0.2,
      distanceKm: Math.round(hub1.distKm * 0.2),
      durationH:  Math.round(hub1.distKm * 0.2 / 60 * 10) / 10,
      safety:    'RISKY',
      notes:     'Use civilian vehicles, avoid military checkpoints. Travel before dawn.',
    });
  }

  const fp1 = estimateFlightPrice(hub1.distKm, inTensionZone);
  legs1.push({
    mode:      'FLIGHT',
    from:      city,
    to:        `${hub1.city} (${hub1.iata}) — ${hub1.country}`,
    fromLat:   lat, fromLng: lng,
    toLat:     hub1.lat, toLng: hub1.lng,
    distanceKm: Math.round(hub1.distKm),
    durationH:  Math.round(hub1.distKm / 750 * 10) / 10 + 0.5,
    safety:    inTensionZone ? 'MODERATE' : 'SAFE',
    notes:     `Direct flight from nearest airport. Search Google Flights / Skyscanner for ${hub1.iata}.`,
    bookingUrl: `https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(hub1.city)}`,
    operator:   `Multiple carriers via ${hub1.iata}`,
        flightPriceUSD: fp1.pricePerPax * passengers,
        priceTier: fp1.priceTier,
      });

  routes.push({
    id: 'air-1',
    rank: 1,
    title: `✈ AIR — Direct to ${hub1.city}`,
    totalHours: legs1.reduce((s, l) => s + l.durationH, 0),
    totalKm: legs1.reduce((s, l) => s + l.distanceKm, 0),
    overallSafety: inTensionZone ? 'MODERATE' : 'SAFE',
    summary: `Fastest exit: fly direct to ${hub1.city}, ${hub1.country}. Book ${passengers} seat${passengers > 1 ? 's' : ''} immediately — prices surge in crises.`,
    legs: legs1,
    destinationLat: hub1.lat,
    destinationLng: hub1.lng,
    destinationCity: hub1.city,
  });

  // ── ROUTE 2: Overland (bus + train) ──────────────────────────────────
  const hub2 = sortedHubs[1] ?? sortedHubs[0];
  const overKm = haversineKm(lat, lng, hub2.lat, hub2.lng);
  const legs2: EvacLeg[] = [
    {
      mode:      'BUS',
      from:      city,
      to:        'Border Town / Waypoint',
      fromLat:   lat, fromLng: lng,
      toLat:     lat + (hub2.lat - lat) * 0.4,
      toLng:     lng + (hub2.lng - lng) * 0.4,
      distanceKm: Math.round(overKm * 0.4),
      durationH:  Math.round(overKm * 0.4 / 55 * 10) / 10,
      safety:    inTensionZone ? 'RISKY' : 'MODERATE',
      notes:     'Public/private bus toward border. Pack water, ID, cash in USD/EUR. Avoid announced routes.',
    },
    {
      mode:      'TRAIN',
      from:      'Border Town / Waypoint',
      to:        `${hub2.city} — ${hub2.country}`,
      fromLat:   lat + (hub2.lat - lat) * 0.4,
      fromLng:   lng + (hub2.lng - lng) * 0.4,
      toLat:     hub2.lat, toLng: hub2.lng,
      distanceKm: Math.round(overKm * 0.6),
      durationH:  Math.round(overKm * 0.6 / 80 * 10) / 10,
      safety:    'MODERATE',
      notes:     `Rail network once across border. Book via Trainline or local rail operator.`,
      bookingUrl: 'https://www.thetrainline.com',
      operator:  'Regional rail',
    },
  ];

  routes.push({
    id: 'overland-1',
    rank: 2,
    title: `🚌 OVERLAND — Bus + Train to ${hub2.city}`,
    totalHours: legs2.reduce((s, l) => s + l.durationH, 0),
    totalKm: legs2.reduce((s, l) => s + l.distanceKm, 0),
    overallSafety: inTensionZone ? 'RISKY' : 'MODERATE',
    summary: `Ground evacuation via public transport. Slower but no flight dependency. ${passengers > 6 ? 'Charter a bus for your group size.' : 'Suitable for small groups.'}`,
    legs: legs2,
    destinationLat: hub2.lat,
    destinationLng: hub2.lng,
    destinationCity: hub2.city,
  });

  // ── ROUTE 3: Sea route if near coast ─────────────────────────────────
  const nearestPort = [...SEA_PORTS]
    .map(p => ({ ...p, distKm: haversineKm(lat, lng, p.lat, p.lng) }))
    .sort((a, b) => a.distKm - b.distKm)[0];

  const hub3 = sortedHubs[2] ?? sortedHubs[0];
  if (nearestPort.distKm < 400) {
    const ferryDest = nearestPort.routes[0];
    const legs3: EvacLeg[] = [
      {
        mode:      'DRIVE',
        from:      city,
        to:        `${nearestPort.city} Port`,
        fromLat:   lat, fromLng: lng,
        toLat:     nearestPort.lat, toLng: nearestPort.lng,
        distanceKm: Math.round(nearestPort.distKm),
        durationH:  Math.round(nearestPort.distKm / 65 * 10) / 10,
        safety:    inTensionZone ? 'RISKY' : 'MODERATE',
        notes:     'Drive or taxi to port. Check for road closures.',
      },
      {
        mode:      'BOAT',
        from:      `${nearestPort.city} Port`,
        to:        ferryDest,
        fromLat:   nearestPort.lat, fromLng: nearestPort.lng,
        toLat:     hub3.lat, toLng: hub3.lng,
        distanceKm: Math.round(haversineKm(nearestPort.lat, nearestPort.lng, hub3.lat, hub3.lng)),
        durationH:  Math.round(haversineKm(nearestPort.lat, nearestPort.lng, hub3.lat, hub3.lng) / 35 * 10) / 10,
        safety:    'MODERATE',
        notes:     `Ferry or charter vessel to ${ferryDest}. Confirm operator at port. Monitor Houthi/naval advisories.`,
        bookingUrl: 'https://www.directferries.com',
      },
    ];

    routes.push({
      id: 'sea-1',
      rank: 3,
      title: `⛵ SEA — Ferry via ${nearestPort.city}`,
      totalHours: legs3.reduce((s, l) => s + l.durationH, 0),
      totalKm: legs3.reduce((s, l) => s + l.distanceKm, 0),
      overallSafety: 'MODERATE',
      summary: `Maritime evacuation through ${nearestPort.city}. Avoids road/air congestion. Verify vessel availability.`,
      legs: legs3,
      destinationLat: hub3.lat,
      destinationLng: hub3.lng,
      destinationCity: ferryDest,
    });
  }

  // ── ROUTE 4: Drive-only to farthest safe hub ─────────────────────────
  const hub4 = sortedHubs.find(h => h.distKm > 200) ?? sortedHubs[sortedHubs.length - 1];
  routes.push({
    id: 'drive-1',
    rank: routes.length + 1,
    title: `🚗 DRIVE — Overland to ${hub4.city}`,
    totalHours: Math.round(hub4.distKm / 70 * 10) / 10,
    totalKm: Math.round(hub4.distKm),
    overallSafety: inTensionZone ? 'RISKY' : 'MODERATE',
    summary: `Full drive route to ${hub4.city}. Only viable if roads are open. Carry fuel, water, and family documents.`,
    legs: [{
      mode:      'DRIVE',
      from:      city,
      to:        `${hub4.city} — ${hub4.country}`,
      fromLat:   lat, fromLng: lng,
      toLat:     hub4.lat, toLng: hub4.lng,
      distanceKm: Math.round(hub4.distKm),
      durationH:  Math.round(hub4.distKm / 70 * 10) / 10,
      safety:    inTensionZone ? 'RISKY' : 'MODERATE',
      notes:     `Drive convoy if possible. Fill up fuel before 60% gauge. Avoid checkpoints after dark.`,
    }],
    destinationLat: hub4.lat,
    destinationLng: hub4.lng,
    destinationCity: hub4.city,
  });

  return Response.json({ routes, passengers, fromCity: city, inTensionZone });
}
