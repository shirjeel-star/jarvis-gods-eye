export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export type FlightStatus =
  | 'scheduled'
  | 'boarding'
  | 'departed'
  | 'arrived'
  | 'cancelled'
  | 'diverted'
  | 'delayed';

export type CrewPosition =
  | 'Flight Attendant'
  | 'Lead Flight Attendant'
  | 'Purser'
  | 'In-Flight Service Manager'
  | 'Inflight Director'
  | 'Cabin Manager';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  aircraft: string;
  origin: Airport;
  destination: Airport;
  scheduledDep: string;
  scheduledArr: string;
  actualDep?: string;
  actualArr?: string;
  status: FlightStatus;
  crewPosition: CrewPosition | string;
  duration: number; // minutes
  distance: number; // km
  notes: string;
  layoverDuration?: number; // hours
  createdAt: string;
}

export interface FlightStats {
  totalFlights: number;
  totalHours: number;
  totalDistance: number;
  uniqueAirports: number;
  uniqueCountries: number;
  uniqueAirlines: number;
  mostVisitedAirport: string;
  longestFlight: Flight | null;
  avgFlightDuration: number;
  flightsByMonth: { month: string; count: number }[];
  flightsByAirline: { airline: string; count: number }[];
  topRoutes: { route: string; count: number }[];
}
