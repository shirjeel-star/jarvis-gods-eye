export interface GEAirport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface NearestAirport extends GEAirport {
  distanceKm: number;
  etaCar: string;
  etaAir: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(hours: number): string {
  if (hours < 1 / 60) return '<1 min';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function findNearestAirports(lat: number, lng: number, n = 8): NearestAirport[] {
  return GE_AIRPORTS
    .map(a => ({
      ...a,
      distanceKm: Math.round(haversineKm(lat, lng, a.lat, a.lng)),
      etaCar: formatDuration((haversineKm(lat, lng, a.lat, a.lng) * 1.3) / 75),
      etaAir: formatDuration(haversineKm(lat, lng, a.lat, a.lng) / 750),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, n);
}

export const GE_AIRPORTS: GEAirport[] = [
  // ── North America ──────────────────────────────────────────────────────────
  { iata: 'JFK', name: 'John F. Kennedy Intl',             city: 'New York',        country: 'US', lat: 40.6413,  lng: -73.7781  },
  { iata: 'LGA', name: 'LaGuardia Airport',                city: 'New York',        country: 'US', lat: 40.7773,  lng: -73.8726  },
  { iata: 'EWR', name: 'Newark Liberty Intl',              city: 'Newark',          country: 'US', lat: 40.6895,  lng: -74.1745  },
  { iata: 'LAX', name: 'Los Angeles Intl',                 city: 'Los Angeles',     country: 'US', lat: 33.9425,  lng: -118.4081 },
  { iata: 'BUR', name: 'Hollywood Burbank Airport',        city: 'Burbank',         country: 'US', lat: 34.2007,  lng: -118.3585 },
  { iata: 'SNA', name: 'John Wayne Airport',               city: 'Orange County',   country: 'US', lat: 33.6757,  lng: -117.8682 },
  { iata: 'ORD', name: "O'Hare Intl",                      city: 'Chicago',         country: 'US', lat: 41.9742,  lng: -87.9073  },
  { iata: 'MDW', name: 'Chicago Midway Intl',              city: 'Chicago',         country: 'US', lat: 41.7868,  lng: -87.7522  },
  { iata: 'ATL', name: 'Hartsfield-Jackson Intl',          city: 'Atlanta',         country: 'US', lat: 33.6407,  lng: -84.4277  },
  { iata: 'DFW', name: 'Dallas/Fort Worth Intl',           city: 'Dallas',          country: 'US', lat: 32.8998,  lng: -97.0403  },
  { iata: 'DAL', name: 'Dallas Love Field',                city: 'Dallas',          country: 'US', lat: 32.8471,  lng: -96.8517  },
  { iata: 'SFO', name: 'San Francisco Intl',               city: 'San Francisco',   country: 'US', lat: 37.6213,  lng: -122.3790 },
  { iata: 'OAK', name: 'Oakland Intl',                     city: 'Oakland',         country: 'US', lat: 37.7213,  lng: -122.2208 },
  { iata: 'SJC', name: 'Mineta San Jose Intl',             city: 'San Jose',        country: 'US', lat: 37.3626,  lng: -121.9290 },
  { iata: 'MIA', name: 'Miami Intl',                       city: 'Miami',           country: 'US', lat: 25.7959,  lng: -80.2870  },
  { iata: 'FLL', name: 'Ft Lauderdale Hollywood Intl',     city: 'Fort Lauderdale', country: 'US', lat: 26.0726,  lng: -80.1527  },
  { iata: 'SEA', name: 'Seattle-Tacoma Intl',              city: 'Seattle',         country: 'US', lat: 47.4502,  lng: -122.3088 },
  { iata: 'BOS', name: 'Logan Intl',                       city: 'Boston',          country: 'US', lat: 42.3656,  lng: -71.0096  },
  { iata: 'IAD', name: 'Washington Dulles Intl',           city: 'Washington D.C.', country: 'US', lat: 38.9531,  lng: -77.4565  },
  { iata: 'DCA', name: 'Reagan National Airport',          city: 'Washington D.C.', country: 'US', lat: 38.8521,  lng: -77.0370  },
  { iata: 'BWI', name: 'Baltimore/Washington Intl',        city: 'Baltimore',       country: 'US', lat: 39.1754,  lng: -76.6683  },
  { iata: 'DEN', name: 'Denver Intl',                      city: 'Denver',          country: 'US', lat: 39.8561,  lng: -104.6737 },
  { iata: 'LAS', name: 'Harry Reid Intl',                  city: 'Las Vegas',       country: 'US', lat: 36.0840,  lng: -115.1537 },
  { iata: 'PHX', name: 'Phoenix Sky Harbor Intl',          city: 'Phoenix',         country: 'US', lat: 33.4373,  lng: -112.0078 },
  { iata: 'MSP', name: 'Minneapolis-St Paul Intl',         city: 'Minneapolis',     country: 'US', lat: 44.8848,  lng: -93.2223  },
  { iata: 'DTW', name: 'Detroit Metropolitan',             city: 'Detroit',         country: 'US', lat: 42.2162,  lng: -83.3554  },
  { iata: 'PHL', name: 'Philadelphia Intl',                city: 'Philadelphia',    country: 'US', lat: 39.8721,  lng: -75.2411  },
  { iata: 'CLT', name: 'Charlotte Douglas Intl',           city: 'Charlotte',       country: 'US', lat: 35.2141,  lng: -80.9431  },
  { iata: 'IAH', name: 'George Bush Intercontinental',     city: 'Houston',         country: 'US', lat: 29.9902,  lng: -95.3368  },
  { iata: 'HOU', name: 'William P. Hobby Airport',         city: 'Houston',         country: 'US', lat: 29.6454,  lng: -95.2789  },
  { iata: 'SLC', name: 'Salt Lake City Intl',              city: 'Salt Lake City',  country: 'US', lat: 40.7884,  lng: -111.9778 },
  { iata: 'PDX', name: 'Portland Intl',                    city: 'Portland',        country: 'US', lat: 45.5898,  lng: -122.5951 },
  { iata: 'MSY', name: 'Louis Armstrong New Orleans Intl', city: 'New Orleans',     country: 'US', lat: 29.9934,  lng: -90.2580  },
  { iata: 'ANC', name: 'Ted Stevens Anchorage Intl',       city: 'Anchorage',       country: 'US', lat: 61.1743,  lng: -149.9963 },
  { iata: 'HNL', name: 'Daniel K. Inouye Intl',            city: 'Honolulu',        country: 'US', lat: 21.3187,  lng: -157.9225 },
  // ── Canada ─────────────────────────────────────────────────────────────────
  { iata: 'YYZ', name: 'Toronto Pearson Intl',             city: 'Toronto',         country: 'CA', lat: 43.6777,  lng: -79.6248  },
  { iata: 'YTZ', name: 'Billy Bishop Toronto City',        city: 'Toronto',         country: 'CA', lat: 43.6275,  lng: -79.3962  },
  { iata: 'YHM', name: 'John C. Munro Hamilton Intl',      city: 'Hamilton',        country: 'CA', lat: 43.1736,  lng: -79.9350  },
  { iata: 'YVR', name: 'Vancouver Intl',                   city: 'Vancouver',       country: 'CA', lat: 49.1947,  lng: -123.1792 },
  { iata: 'YUL', name: 'Montréal-Trudeau Intl',            city: 'Montreal',        country: 'CA', lat: 45.4706,  lng: -73.7408  },
  { iata: 'YOW', name: 'Ottawa Macdonald-Cartier Intl',    city: 'Ottawa',          country: 'CA', lat: 45.3225,  lng: -75.6692  },
  { iata: 'YEG', name: 'Edmonton Intl',                    city: 'Edmonton',        country: 'CA', lat: 53.3097,  lng: -113.5800 },
  { iata: 'YYC', name: 'Calgary Intl',                     city: 'Calgary',         country: 'CA', lat: 51.1315,  lng: -114.0106 },
  { iata: 'YWG', name: 'Winnipeg Richardson Intl',         city: 'Winnipeg',        country: 'CA', lat: 49.9100,  lng: -97.2398  },
  { iata: 'YHZ', name: 'Halifax Stanfield Intl',           city: 'Halifax',         country: 'CA', lat: 44.8808,  lng: -63.5086  },
  // ── Mexico / Central America ───────────────────────────────────────────────
  { iata: 'MEX', name: 'Benito Juárez Intl',               city: 'Mexico City',     country: 'MX', lat: 19.4360,  lng: -99.0719  },
  { iata: 'CUN', name: 'Cancún Intl',                      city: 'Cancún',          country: 'MX', lat: 21.0365,  lng: -86.8771  },
  { iata: 'GDL', name: 'Miguel Hidalgo Intl',              city: 'Guadalajara',     country: 'MX', lat: 20.5218,  lng: -103.3111 },
  { iata: 'PTY', name: 'Tocumen Intl',                     city: 'Panama City',     country: 'PA', lat: 9.0714,   lng: -79.3835  },
  { iata: 'GUA', name: 'La Aurora Intl',                   city: 'Guatemala City',  country: 'GT', lat: 14.5833,  lng: -90.5275  },
  // ── South America ──────────────────────────────────────────────────────────
  { iata: 'BOG', name: 'El Dorado Intl',                   city: 'Bogotá',          country: 'CO', lat: 4.7016,   lng: -74.1469  },
  { iata: 'LIM', name: 'Jorge Chávez Intl',                city: 'Lima',            country: 'PE', lat: -12.0219, lng: -77.1143  },
  { iata: 'GRU', name: 'São Paulo-Guarulhos Intl',         city: 'São Paulo',       country: 'BR', lat: -23.4356, lng: -46.4731  },
  { iata: 'GIG', name: 'Rio de Janeiro-Galeão Intl',       city: 'Rio de Janeiro',  country: 'BR', lat: -22.8099, lng: -43.2505  },
  { iata: 'SCL', name: 'Arturo Merino Benítez Intl',       city: 'Santiago',        country: 'CL', lat: -33.3930, lng: -70.7858  },
  { iata: 'EZE', name: 'Ministro Pistarini Intl',          city: 'Buenos Aires',    country: 'AR', lat: -34.8222, lng: -58.5358  },
  { iata: 'MVD', name: 'Carrasco Intl',                    city: 'Montevideo',      country: 'UY', lat: -34.8383, lng: -56.0308  },
  { iata: 'BSB', name: 'Presidente Kubitschek Intl',       city: 'Brasília',        country: 'BR', lat: -15.8711, lng: -47.9186  },
  { iata: 'UIO', name: 'Mariscal Sucre Intl',              city: 'Quito',           country: 'EC', lat: -0.1292,  lng: -78.3575  },
  { iata: 'CCS', name: 'Simón Bolívar Intl',               city: 'Caracas',         country: 'VE', lat: 10.6031,  lng: -66.9913  },
  // ── UK & Ireland ───────────────────────────────────────────────────────────
  { iata: 'LHR', name: 'London Heathrow',                  city: 'London',          country: 'GB', lat: 51.4700,  lng: -0.4543   },
  { iata: 'LGW', name: 'London Gatwick',                   city: 'London',          country: 'GB', lat: 51.1481,  lng: -0.1903   },
  { iata: 'STN', name: 'London Stansted',                  city: 'London',          country: 'GB', lat: 51.8850,  lng: 0.2350    },
  { iata: 'MAN', name: 'Manchester Airport',               city: 'Manchester',      country: 'GB', lat: 53.3537,  lng: -2.2750   },
  { iata: 'BHX', name: 'Birmingham Airport',               city: 'Birmingham',      country: 'GB', lat: 52.4530,  lng: -1.7480   },
  { iata: 'EDI', name: 'Edinburgh Airport',                city: 'Edinburgh',       country: 'GB', lat: 55.9500,  lng: -3.3725   },
  { iata: 'DUB', name: 'Dublin Airport',                   city: 'Dublin',          country: 'IE', lat: 53.4213,  lng: -6.2701   },
  // ── Europe ─────────────────────────────────────────────────────────────────
  { iata: 'CDG', name: 'Charles de Gaulle Airport',        city: 'Paris',           country: 'FR', lat: 49.0097,  lng: 2.5478    },
  { iata: 'ORY', name: 'Paris Orly Airport',               city: 'Paris',           country: 'FR', lat: 48.7233,  lng: 2.3794    },
  { iata: 'FRA', name: 'Frankfurt Airport',                city: 'Frankfurt',       country: 'DE', lat: 50.0379,  lng: 8.5622    },
  { iata: 'MUC', name: 'Munich Airport',                   city: 'Munich',          country: 'DE', lat: 48.3538,  lng: 11.7861   },
  { iata: 'BER', name: 'Berlin Brandenburg Airport',       city: 'Berlin',          country: 'DE', lat: 52.3667,  lng: 13.5033   },
  { iata: 'AMS', name: 'Amsterdam Schiphol',               city: 'Amsterdam',       country: 'NL', lat: 52.3086,  lng: 4.7639    },
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas',     city: 'Madrid',          country: 'ES', lat: 40.4936,  lng: -3.5668   },
  { iata: 'BCN', name: 'Barcelona El Prat',                city: 'Barcelona',       country: 'ES', lat: 41.2974,  lng: 2.0833    },
  { iata: 'FCO', name: 'Rome Fiumicino',                   city: 'Rome',            country: 'IT', lat: 41.8003,  lng: 12.2389   },
  { iata: 'MXP', name: 'Milan Malpensa',                   city: 'Milan',           country: 'IT', lat: 45.6306,  lng: 8.7281    },
  { iata: 'ZRH', name: 'Zürich Airport',                   city: 'Zürich',          country: 'CH', lat: 47.4647,  lng: 8.5492    },
  { iata: 'GVA', name: 'Geneva Airport',                   city: 'Geneva',          country: 'CH', lat: 46.2381,  lng: 6.1089    },
  { iata: 'VIE', name: 'Vienna Intl Airport',              city: 'Vienna',          country: 'AT', lat: 48.1103,  lng: 16.5697   },
  { iata: 'BRU', name: 'Brussels Airport',                 city: 'Brussels',        country: 'BE', lat: 50.9014,  lng: 4.4844    },
  { iata: 'CPH', name: 'Copenhagen Airport',               city: 'Copenhagen',      country: 'DK', lat: 55.6181,  lng: 12.6561   },
  { iata: 'ARN', name: 'Stockholm Arlanda Airport',        city: 'Stockholm',       country: 'SE', lat: 59.6498,  lng: 17.9237   },
  { iata: 'HEL', name: 'Helsinki-Vantaa Airport',          city: 'Helsinki',        country: 'FI', lat: 60.3183,  lng: 24.9630   },
  { iata: 'OSL', name: 'Oslo Gardermoen Airport',          city: 'Oslo',            country: 'NO', lat: 60.1939,  lng: 11.1004   },
  { iata: 'WAW', name: 'Warsaw Chopin Airport',            city: 'Warsaw',          country: 'PL', lat: 52.1657,  lng: 20.9671   },
  { iata: 'PRG', name: 'Prague Václav Havel Airport',      city: 'Prague',          country: 'CZ', lat: 50.1008,  lng: 14.2600   },
  { iata: 'BUD', name: 'Budapest Ferenc Liszt',            city: 'Budapest',        country: 'HU', lat: 47.4369,  lng: 19.2556   },
  { iata: 'LIS', name: 'Lisbon Airport',                   city: 'Lisbon',          country: 'PT', lat: 38.7756,  lng: -9.1354   },
  { iata: 'ATH', name: 'Athens Eleftherios Venizelos',     city: 'Athens',          country: 'GR', lat: 37.9364,  lng: 23.9445   },
  { iata: 'IST', name: 'Istanbul Airport',                 city: 'Istanbul',        country: 'TR', lat: 41.2753,  lng: 28.7519   },
  { iata: 'SAW', name: 'Istanbul Sabiha Gökçen',           city: 'Istanbul',        country: 'TR', lat: 40.8986,  lng: 29.3092   },
  { iata: 'OTP', name: 'Henri Coandă Intl',                city: 'Bucharest',       country: 'RO', lat: 44.5711,  lng: 26.0850   },
  { iata: 'SOF', name: 'Sofia Airport',                    city: 'Sofia',           country: 'BG', lat: 42.6952,  lng: 23.4114   },
  { iata: 'BEG', name: 'Belgrade Nikola Tesla',            city: 'Belgrade',        country: 'RS', lat: 44.8184,  lng: 20.3091   },
  // ── Eastern Europe / Russia ────────────────────────────────────────────────
  { iata: 'SVO', name: 'Sheremetyevo Intl',                city: 'Moscow',          country: 'RU', lat: 55.9736,  lng: 37.4125   },
  { iata: 'DME', name: 'Domodedovo Intl',                  city: 'Moscow',          country: 'RU', lat: 55.4088,  lng: 37.9063   },
  { iata: 'LED', name: 'Pulkovo Airport',                  city: 'St. Petersburg',  country: 'RU', lat: 59.8003,  lng: 30.2625   },
  { iata: 'KBP', name: 'Kyiv Boryspil Intl',               city: 'Kyiv',            country: 'UA', lat: 50.3450,  lng: 30.8947   },
  // ── Middle East ────────────────────────────────────────────────────────────
  { iata: 'DXB', name: 'Dubai Intl',                       city: 'Dubai',           country: 'AE', lat: 25.2532,  lng: 55.3657   },
  { iata: 'DWC', name: 'Al Maktoum Intl',                  city: 'Dubai',           country: 'AE', lat: 24.8963,  lng: 55.1614   },
  { iata: 'AUH', name: 'Abu Dhabi Intl',                   city: 'Abu Dhabi',       country: 'AE', lat: 24.4330,  lng: 54.6511   },
  { iata: 'DOH', name: 'Hamad Intl',                       city: 'Doha',            country: 'QA', lat: 25.2731,  lng: 51.6081   },
  { iata: 'KWI', name: 'Kuwait Intl',                      city: 'Kuwait City',     country: 'KW', lat: 29.2267,  lng: 47.9689   },
  { iata: 'BAH', name: 'Bahrain Intl',                     city: 'Manama',          country: 'BH', lat: 26.2708,  lng: 50.6336   },
  { iata: 'MCT', name: 'Muscat Intl',                      city: 'Muscat',          country: 'OM', lat: 23.5933,  lng: 58.2844   },
  { iata: 'RUH', name: 'King Khalid Intl',                 city: 'Riyadh',          country: 'SA', lat: 24.9576,  lng: 46.6988   },
  { iata: 'JED', name: 'King Abdulaziz Intl',              city: 'Jeddah',          country: 'SA', lat: 21.6796,  lng: 39.1565   },
  { iata: 'AMM', name: 'Queen Alia Intl',                  city: 'Amman',           country: 'JO', lat: 31.7226,  lng: 35.9932   },
  { iata: 'BEY', name: 'Rafic Hariri Intl',                city: 'Beirut',          country: 'LB', lat: 33.8209,  lng: 35.4883   },
  { iata: 'TLV', name: 'Ben Gurion Intl',                  city: 'Tel Aviv',        country: 'IL', lat: 32.0055,  lng: 34.8854   },
  { iata: 'BGW', name: 'Baghdad Intl',                     city: 'Baghdad',         country: 'IQ', lat: 33.2625,  lng: 44.2346   },
  { iata: 'THR', name: 'Imam Khomeini Intl',               city: 'Tehran',          country: 'IR', lat: 35.4161,  lng: 51.1522   },
  // ── South Asia ─────────────────────────────────────────────────────────────
  { iata: 'DEL', name: 'Indira Gandhi Intl',               city: 'New Delhi',       country: 'IN', lat: 28.5665,  lng: 77.1031   },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Intl',         city: 'Mumbai',          country: 'IN', lat: 19.0896,  lng: 72.8656   },
  { iata: 'MAA', name: 'Chennai Intl',                     city: 'Chennai',         country: 'IN', lat: 12.9941,  lng: 80.1808   },
  { iata: 'BLR', name: 'Kempegowda Intl',                  city: 'Bengaluru',       country: 'IN', lat: 13.1986,  lng: 77.7066   },
  { iata: 'HYD', name: 'Rajiv Gandhi Intl',                city: 'Hyderabad',       country: 'IN', lat: 17.2313,  lng: 78.4298   },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose Intl',  city: 'Kolkata',         country: 'IN', lat: 22.6549,  lng: 88.4467   },
  { iata: 'CMB', name: 'Bandaranaike Intl',                city: 'Colombo',         country: 'LK', lat: 7.1808,   lng: 79.8841   },
  { iata: 'DAC', name: 'Hazrat Shahjalal Intl',            city: 'Dhaka',           country: 'BD', lat: 23.8433,  lng: 90.3978   },
  { iata: 'KTM', name: 'Tribhuvan Intl',                   city: 'Kathmandu',       country: 'NP', lat: 27.6966,  lng: 85.3591   },
  { iata: 'KHI', name: 'Jinnah Intl',                      city: 'Karachi',         country: 'PK', lat: 24.9065,  lng: 67.1608   },
  { iata: 'LHE', name: 'Allama Iqbal Intl',                city: 'Lahore',          country: 'PK', lat: 31.5216,  lng: 74.4036   },
  { iata: 'ISB', name: 'New Islamabad Intl',               city: 'Islamabad',       country: 'PK', lat: 33.5607,  lng: 72.8558   },
  { iata: 'KBL', name: 'Hamid Karzai Intl',                city: 'Kabul',           country: 'AF', lat: 34.5659,  lng: 69.2122   },
  // ── Central Asia ───────────────────────────────────────────────────────────
  { iata: 'TAS', name: 'Tashkent Intl',                    city: 'Tashkent',        country: 'UZ', lat: 41.2579,  lng: 69.2813   },
  { iata: 'ALA', name: 'Almaty Intl',                      city: 'Almaty',          country: 'KZ', lat: 43.3521,  lng: 77.0404   },
  { iata: 'NQZ', name: 'Astana Intl',                      city: 'Astana',          country: 'KZ', lat: 51.0222,  lng: 71.4669   },
  // ── East Asia ──────────────────────────────────────────────────────────────
  { iata: 'PEK', name: 'Beijing Capital Intl',             city: 'Beijing',         country: 'CN', lat: 40.0799,  lng: 116.6031  },
  { iata: 'PKX', name: 'Beijing Daxing Intl',              city: 'Beijing',         country: 'CN', lat: 39.5098,  lng: 116.4105  },
  { iata: 'PVG', name: 'Shanghai Pudong Intl',             city: 'Shanghai',        country: 'CN', lat: 31.1443,  lng: 121.8083  },
  { iata: 'SHA', name: 'Shanghai Hongqiao Intl',           city: 'Shanghai',        country: 'CN', lat: 31.1979,  lng: 121.3363  },
  { iata: 'CAN', name: 'Guangzhou Baiyun Intl',            city: 'Guangzhou',       country: 'CN', lat: 23.3924,  lng: 113.2990  },
  { iata: 'CTU', name: 'Chengdu Tianfu Intl',              city: 'Chengdu',         country: 'CN', lat: 30.3122,  lng: 104.4440  },
  { iata: 'HKG', name: 'Hong Kong Intl',                   city: 'Hong Kong',       country: 'HK', lat: 22.3080,  lng: 113.9185  },
  { iata: 'TPE', name: 'Taiwan Taoyuan Intl',              city: 'Taipei',          country: 'TW', lat: 25.0777,  lng: 121.2327  },
  { iata: 'KIX', name: 'Kansai Intl',                      city: 'Osaka',           country: 'JP', lat: 34.4347,  lng: 135.2440  },
  { iata: 'NRT', name: 'Narita Intl',                      city: 'Tokyo',           country: 'JP', lat: 35.7647,  lng: 140.3864  },
  { iata: 'HND', name: 'Tokyo Haneda Airport',             city: 'Tokyo',           country: 'JP', lat: 35.5494,  lng: 139.7798  },
  { iata: 'ICN', name: 'Incheon Intl',                     city: 'Seoul',           country: 'KR', lat: 37.4602,  lng: 126.4407  },
  { iata: 'GMP', name: 'Seoul Gimpo Intl',                 city: 'Seoul',           country: 'KR', lat: 37.5583,  lng: 126.7942  },
  // ── Southeast Asia ─────────────────────────────────────────────────────────
  { iata: 'BKK', name: 'Suvarnabhumi Airport',             city: 'Bangkok',         country: 'TH', lat: 13.6811,  lng: 100.7470  },
  { iata: 'DMK', name: 'Don Mueang Intl',                  city: 'Bangkok',         country: 'TH', lat: 13.9126,  lng: 100.6067  },
  { iata: 'DPS', name: 'Ngurah Rai Intl',                  city: 'Bali',            country: 'ID', lat: -8.7468,  lng: 115.1670  },
  { iata: 'KUL', name: 'Kuala Lumpur Intl',                city: 'Kuala Lumpur',    country: 'MY', lat: 2.7456,   lng: 101.7099  },
  { iata: 'SIN', name: 'Singapore Changi Airport',         city: 'Singapore',       country: 'SG', lat: 1.3644,   lng: 103.9915  },
  { iata: 'MNL', name: 'Ninoy Aquino Intl',                city: 'Manila',          country: 'PH', lat: 14.5086,  lng: 121.0194  },
  { iata: 'CGK', name: 'Soekarno-Hatta Intl',              city: 'Jakarta',         country: 'ID', lat: -6.1256,  lng: 106.6559  },
  { iata: 'SGN', name: 'Tan Son Nhat Intl',                city: 'Ho Chi Minh City',country: 'VN', lat: 10.8188,  lng: 106.6520  },
  { iata: 'HAN', name: 'Noi Bai Intl',                     city: 'Hanoi',           country: 'VN', lat: 21.2212,  lng: 105.8072  },
  { iata: 'RGN', name: 'Yangon Intl',                      city: 'Yangon',          country: 'MM', lat: 16.9073,  lng: 96.1332   },
  // ── Oceania ────────────────────────────────────────────────────────────────
  { iata: 'SYD', name: 'Sydney Airport',                   city: 'Sydney',          country: 'AU', lat: -33.9399, lng: 151.1753  },
  { iata: 'MEL', name: 'Melbourne Airport',                city: 'Melbourne',       country: 'AU', lat: -37.6690, lng: 144.8410  },
  { iata: 'BNE', name: 'Brisbane Airport',                 city: 'Brisbane',        country: 'AU', lat: -27.3842, lng: 153.1175  },
  { iata: 'PER', name: 'Perth Airport',                    city: 'Perth',           country: 'AU', lat: -31.9403, lng: 115.9670  },
  { iata: 'ADL', name: 'Adelaide Airport',                 city: 'Adelaide',        country: 'AU', lat: -34.9449, lng: 138.5310  },
  { iata: 'AKL', name: 'Auckland Airport',                 city: 'Auckland',        country: 'NZ', lat: -37.0082, lng: 174.7850  },
  { iata: 'CHC', name: 'Christchurch Airport',             city: 'Christchurch',    country: 'NZ', lat: -43.4894, lng: 172.5322  },
  { iata: 'NAN', name: 'Nadi Intl',                        city: 'Nadi',            country: 'FJ', lat: -17.7554, lng: 177.4430  },
  { iata: 'GUM', name: 'Antonio B. Won Pat Intl',          city: 'Guam',            country: 'GU', lat: 13.4834,  lng: 144.7959  },
  // ── Africa ─────────────────────────────────────────────────────────────────
  { iata: 'JNB', name: "O.R. Tambo Intl",                  city: 'Johannesburg',    country: 'ZA', lat: -26.1392, lng: 28.2460   },
  { iata: 'CPT', name: 'Cape Town Intl',                   city: 'Cape Town',       country: 'ZA', lat: -33.9715, lng: 18.6021   },
  { iata: 'CAI', name: 'Cairo Intl',                       city: 'Cairo',           country: 'EG', lat: 30.1219,  lng: 31.4056   },
  { iata: 'CMN', name: 'Mohammed V Intl',                  city: 'Casablanca',      country: 'MA', lat: 33.3675,  lng: -7.5897   },
  { iata: 'ALG', name: 'Houari Boumediene Airport',        city: 'Algiers',         country: 'DZ', lat: 36.6910,  lng: 3.2154    },
  { iata: 'TUN', name: 'Tunis-Carthage Intl',              city: 'Tunis',           country: 'TN', lat: 36.8510,  lng: 10.2272   },
  { iata: 'LOS', name: 'Murtala Muhammed Intl',            city: 'Lagos',           country: 'NG', lat: 6.5774,   lng: 3.3212    },
  { iata: 'ABV', name: 'Nnamdi Azikiwe Intl',              city: 'Abuja',           country: 'NG', lat: 9.0060,   lng: 7.2632    },
  { iata: 'ACC', name: 'Kotoka Intl',                      city: 'Accra',           country: 'GH', lat: 5.6052,   lng: -0.1668   },
  { iata: 'DKR', name: 'Léopold Sédar Senghor Intl',       city: 'Dakar',           country: 'SN', lat: 14.7397,  lng: -17.4903  },
  { iata: 'NBO', name: 'Jomo Kenyatta Intl',               city: 'Nairobi',         country: 'KE', lat: -1.3192,  lng: 36.9275   },
  { iata: 'ADD', name: 'Addis Ababa Bole Intl',            city: 'Addis Ababa',     country: 'ET', lat: 8.9779,   lng: 38.7993   },
  { iata: 'DAR', name: 'Julius Nyerere Intl',              city: 'Dar es Salaam',   country: 'TZ', lat: -6.8781,  lng: 39.2026   },
  { iata: 'LUN', name: 'Kenneth Kaunda Intl',              city: 'Lusaka',          country: 'ZM', lat: -15.3308, lng: 28.4526   },
  { iata: 'HRE', name: 'Robert Gabriel Mugabe Intl',       city: 'Harare',          country: 'ZW', lat: -17.9318, lng: 31.0928   },
  { iata: 'TNR', name: 'Ivato Intl',                       city: 'Antananarivo',    country: 'MG', lat: -18.7969, lng: 47.4788   },
];
