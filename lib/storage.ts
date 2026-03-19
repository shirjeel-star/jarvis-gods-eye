import { Flight, FlightStats } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'crew_tracker_flights';

export function getFlights(): Flight[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSeedFlights();
    const parsed = JSON.parse(raw) as Flight[];
    return parsed.sort(
      (a, b) => new Date(b.scheduledDep).getTime() - new Date(a.scheduledDep).getTime()
    );
  } catch {
    return [];
  }
}

export function saveFlight(flight: Omit<Flight, 'id' | 'createdAt'>): Flight {
  const flights = getFlights();
  const newFlight: Flight = {
    ...flight,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  const updated = [newFlight, ...flights];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newFlight;
}

export function updateFlight(id: string, updates: Partial<Flight>): Flight | null {
  const flights = getFlights();
  const idx = flights.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const updated = { ...flights[idx], ...updates };
  flights[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
  return updated;
}

export function deleteFlight(id: string): void {
  const flights = getFlights().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
}

export function getFlightById(id: string): Flight | undefined {
  return getFlights().find((f) => f.id === id);
}

export function computeStats(flights: Flight[]): FlightStats {
  if (flights.length === 0) {
    return {
      totalFlights: 0,
      totalHours: 0,
      totalDistance: 0,
      uniqueAirports: 0,
      uniqueCountries: 0,
      uniqueAirlines: 0,
      mostVisitedAirport: '-',
      longestFlight: null,
      avgFlightDuration: 0,
      flightsByMonth: [],
      flightsByAirline: [],
      topRoutes: [],
    };
  }

  const totalHours = flights.reduce((sum, f) => sum + f.duration / 60, 0);
  const totalDistance = flights.reduce((sum, f) => sum + f.distance, 0);

  const allAirports = flights.flatMap((f) => [f.origin.code, f.destination.code]);
  const uniqueAirports = new Set(allAirports).size;

  const allCountries = flights.flatMap((f) => [f.origin.country, f.destination.country]);
  const uniqueCountries = new Set(allCountries).size;

  const uniqueAirlines = new Set(flights.map((f) => f.airline)).size;

  const airportFreq: Record<string, number> = {};
  allAirports.forEach((a) => (airportFreq[a] = (airportFreq[a] || 0) + 1));
  const mostVisitedAirport = Object.entries(airportFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  const longestFlight = flights.reduce((max, f) => (f.duration > (max?.duration || 0) ? f : max), flights[0]);

  const avgFlightDuration = totalHours / flights.length;

  // By month
  const monthMap: Record<string, number> = {};
  flights.forEach((f) => {
    const d = new Date(f.scheduledDep);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const flightsByMonth = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  // By airline
  const airlineMap: Record<string, number> = {};
  flights.forEach((f) => (airlineMap[f.airline] = (airlineMap[f.airline] || 0) + 1));
  const flightsByAirline = Object.entries(airlineMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([airline, count]) => ({ airline, count }));

  // Top routes
  const routeMap: Record<string, number> = {};
  flights.forEach((f) => {
    const route = `${f.origin.code} → ${f.destination.code}`;
    routeMap[route] = (routeMap[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  return {
    totalFlights: flights.length,
    totalHours: Math.round(totalHours * 10) / 10,
    totalDistance,
    uniqueAirports,
    uniqueCountries,
    uniqueAirlines,
    mostVisitedAirport,
    longestFlight,
    avgFlightDuration: Math.round(avgFlightDuration * 10) / 10,
    flightsByMonth,
    flightsByAirline,
    topRoutes,
  };
}

function getSeedFlights(): Flight[] {
  const seeds: Flight[] = [
    {
      id: uuidv4(),
      flightNumber: 'AA101',
      airline: 'American Airlines',
      aircraft: 'Boeing 737-800',
      origin: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781, timezone: 'America/New_York' },
      destination: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', lat: 33.9425, lng: -118.4081, timezone: 'America/Los_Angeles' },
      scheduledDep: '2026-03-15T09:00:00',
      scheduledArr: '2026-03-15T14:15:00',
      status: 'arrived',
      crewPosition: 'Flight Attendant',
      duration: 315,
      distance: 3977,
      notes: 'Smooth flight, full cabin.',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      flightNumber: 'UA890',
      airline: 'United Airlines',
      aircraft: 'Boeing 777-200',
      origin: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', lat: 33.9425, lng: -118.4081, timezone: 'America/Los_Angeles' },
      destination: { code: 'NRT', name: 'Tokyo Narita International', city: 'Tokyo', country: 'Japan', lat: 35.7720, lng: 140.3929, timezone: 'Asia/Tokyo' },
      scheduledDep: '2026-03-10T13:30:00',
      scheduledArr: '2026-03-11T18:45:00',
      status: 'arrived',
      crewPosition: 'Lead Flight Attendant',
      duration: 615,
      distance: 8822,
      notes: 'Long haul. All service rounds completed.',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      flightNumber: 'BA178',
      airline: 'British Airways',
      aircraft: 'Airbus A380',
      origin: { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lng: -0.4543, timezone: 'Europe/London' },
      destination: { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', lat: 25.2528, lng: 55.3644, timezone: 'Asia/Dubai' },
      scheduledDep: '2026-03-05T14:00:00',
      scheduledArr: '2026-03-06T00:15:00',
      status: 'arrived',
      crewPosition: 'Purser',
      duration: 375,
      distance: 5491,
      notes: 'Business class full. Excellent team.',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      flightNumber: 'DL456',
      airline: 'Delta Air Lines',
      aircraft: 'Airbus A321',
      origin: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'USA', lat: 33.6407, lng: -84.4277, timezone: 'America/New_York' },
      destination: { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'USA', lat: 25.7959, lng: -80.2870, timezone: 'America/New_York' },
      scheduledDep: '2026-03-20T11:00:00',
      scheduledArr: '2026-03-20T12:30:00',
      status: 'scheduled',
      crewPosition: 'Flight Attendant',
      duration: 90,
      distance: 950,
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  return seeds;
}
