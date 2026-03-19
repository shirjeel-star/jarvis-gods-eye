import { Airport } from '@/types';

export const AIRPORTS: Airport[] = [
  // North America - USA
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'USA', lat: 33.6407, lng: -84.4277, timezone: 'America/New_York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', lat: 33.9425, lng: -118.4081, timezone: 'America/Los_Angeles' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073, timezone: 'America/Chicago' },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'USA', lat: 32.8998, lng: -97.0403, timezone: 'America/Chicago' },
  { code: 'DEN', name: 'Denver International', city: 'Denver', country: 'USA', lat: 39.8561, lng: -104.6737, timezone: 'America/Denver' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781, timezone: 'America/New_York' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA', lat: 37.6213, lng: -122.3790, timezone: 'America/Los_Angeles' },
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'USA', lat: 47.4502, lng: -122.3088, timezone: 'America/Los_Angeles' },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'USA', lat: 36.0840, lng: -115.1537, timezone: 'America/Los_Angeles' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'USA', lat: 25.7959, lng: -80.2870, timezone: 'America/New_York' },
  { code: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'USA', lat: 28.4294, lng: -81.3089, timezone: 'America/New_York' },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'USA', lat: 40.6895, lng: -74.1745, timezone: 'America/New_York' },
  { code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', country: 'USA', lat: 35.2140, lng: -80.9431, timezone: 'America/New_York' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'USA', lat: 33.4373, lng: -112.0078, timezone: 'America/Phoenix' },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'USA', lat: 29.9902, lng: -95.3368, timezone: 'America/Chicago' },
  { code: 'BOS', name: 'Logan International', city: 'Boston', country: 'USA', lat: 42.3656, lng: -71.0096, timezone: 'America/New_York' },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'USA', lat: 44.8820, lng: -93.2218, timezone: 'America/Chicago' },
  { code: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', country: 'USA', lat: 42.2124, lng: -83.3534, timezone: 'America/Detroit' },
  { code: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', country: 'USA', lat: 26.0726, lng: -80.1527, timezone: 'America/New_York' },
  { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'USA', lat: 39.8729, lng: -75.2437, timezone: 'America/New_York' },
  { code: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore', country: 'USA', lat: 39.1754, lng: -76.6683, timezone: 'America/New_York' },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'USA', lat: 40.7769, lng: -73.8740, timezone: 'America/New_York' },
  { code: 'IAD', name: 'Washington Dulles International', city: 'Washington DC', country: 'USA', lat: 38.9531, lng: -77.4565, timezone: 'America/New_York' },
  { code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington DC', country: 'USA', lat: 38.8521, lng: -77.0377, timezone: 'America/New_York' },
  { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'USA', lat: 40.7884, lng: -111.9778, timezone: 'America/Denver' },
  { code: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'USA', lat: 21.3245, lng: -157.9251, timezone: 'Pacific/Honolulu' },
  { code: 'PDX', name: 'Portland International', city: 'Portland', country: 'USA', lat: 45.5898, lng: -122.5951, timezone: 'America/Los_Angeles' },
  { code: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'USA', lat: 32.7338, lng: -117.1933, timezone: 'America/Los_Angeles' },
  { code: 'TPA', name: 'Tampa International', city: 'Tampa', country: 'USA', lat: 27.9755, lng: -82.5332, timezone: 'America/New_York' },
  { code: 'STL', name: 'St. Louis Lambert International', city: 'St. Louis', country: 'USA', lat: 38.7487, lng: -90.3700, timezone: 'America/Chicago' },
  { code: 'BNA', name: 'Nashville International', city: 'Nashville', country: 'USA', lat: 36.1245, lng: -86.6782, timezone: 'America/Chicago' },
  { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', country: 'USA', lat: 30.1975, lng: -97.6664, timezone: 'America/Chicago' },
  { code: 'MDW', name: 'Chicago Midway International', city: 'Chicago', country: 'USA', lat: 41.7868, lng: -87.7522, timezone: 'America/Chicago' },
  { code: 'OAK', name: 'Oakland Metropolitan International', city: 'Oakland', country: 'USA', lat: 37.7213, lng: -122.2208, timezone: 'America/Los_Angeles' },
  { code: 'MCI', name: 'Kansas City International', city: 'Kansas City', country: 'USA', lat: 39.2976, lng: -94.7139, timezone: 'America/Chicago' },
  { code: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', country: 'USA', lat: 35.8776, lng: -78.7875, timezone: 'America/New_York' },
  { code: 'CLE', name: 'Cleveland Hopkins International', city: 'Cleveland', country: 'USA', lat: 41.4117, lng: -81.8498, timezone: 'America/New_York' },
  { code: 'IND', name: 'Indianapolis International', city: 'Indianapolis', country: 'USA', lat: 39.7173, lng: -86.2944, timezone: 'America/Indiana/Indianapolis' },
  { code: 'CMH', name: 'John Glenn Columbus International', city: 'Columbus', country: 'USA', lat: 39.9980, lng: -82.8919, timezone: 'America/New_York' },
  { code: 'MEM', name: 'Memphis International', city: 'Memphis', country: 'USA', lat: 35.0421, lng: -89.9768, timezone: 'America/Chicago' },
  // Canada
  { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248, timezone: 'America/Toronto' },
  { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', lat: 49.1967, lng: -123.1815, timezone: 'America/Vancouver' },
  { code: 'YUL', name: 'Montréal-Trudeau International', city: 'Montreal', country: 'Canada', lat: 45.4706, lng: -73.7408, timezone: 'America/Toronto' },
  { code: 'YYC', name: 'Calgary International', city: 'Calgary', country: 'Canada', lat: 51.1225, lng: -114.0133, timezone: 'America/Edmonton' },
  { code: 'YEG', name: 'Edmonton International', city: 'Edmonton', country: 'Canada', lat: 53.3097, lng: -113.5797, timezone: 'America/Edmonton' },
  { code: 'YOW', name: 'Ottawa Macdonald-Cartier International', city: 'Ottawa', country: 'Canada', lat: 45.3225, lng: -75.6692, timezone: 'America/Toronto' },
  // Mexico
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', lat: 19.4363, lng: -99.0721, timezone: 'America/Mexico_City' },
  { code: 'CUN', name: 'Cancún International', city: 'Cancún', country: 'Mexico', lat: 21.0365, lng: -86.8771, timezone: 'America/Cancun' },
  { code: 'GDL', name: 'Miguel Hidalgo y Costilla International', city: 'Guadalajara', country: 'Mexico', lat: 20.5218, lng: -103.3111, timezone: 'America/Mexico_City' },
  // Europe
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lng: -0.4543, timezone: 'Europe/London' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, timezone: 'Europe/Paris' },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3086, lng: 4.7639, timezone: 'Europe/Amsterdam' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622, timezone: 'Europe/Berlin' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', lat: 40.4936, lng: -3.5668, timezone: 'Europe/Madrid' },
  { code: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833, timezone: 'Europe/Madrid' },
  { code: 'FCO', name: 'Leonardo da Vinci (Fiumicino)', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389, timezone: 'Europe/Rome' },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.6306, lng: 8.7281, timezone: 'Europe/Rome' },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3538, lng: 11.7861, timezone: 'Europe/Berlin' },
  { code: 'ZUR', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4647, lng: 8.5492, timezone: 'Europe/Zurich' },
  { code: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697, timezone: 'Europe/Vienna' },
  { code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9014, lng: 4.4844, timezone: 'Europe/Brussels' },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.6180, lng: 12.6561, timezone: 'Europe/Copenhagen' },
  { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1939, lng: 11.1004, timezone: 'Europe/Oslo' },
  { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', lat: 59.6519, lng: 17.9186, timezone: 'Europe/Stockholm' },
  { code: 'HEL', name: 'Helsinki Airport', city: 'Helsinki', country: 'Finland', lat: 60.3172, lng: 24.9633, timezone: 'Europe/Helsinki' },
  { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', lat: 38.7756, lng: -9.1354, timezone: 'Europe/Lisbon' },
  { code: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece', lat: 37.9364, lng: 23.9445, timezone: 'Europe/Athens' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2610, lng: 28.7422, timezone: 'Europe/Istanbul' },
  { code: 'DME', name: 'Moscow Domodedovo', city: 'Moscow', country: 'Russia', lat: 55.4103, lng: 37.9026, timezone: 'Europe/Moscow' },
  { code: 'SVO', name: 'Sheremetyevo International', city: 'Moscow', country: 'Russia', lat: 55.9726, lng: 37.4146, timezone: 'Europe/Moscow' },
  { code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', lat: 52.1657, lng: 20.9671, timezone: 'Europe/Warsaw' },
  { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', lat: 50.1008, lng: 14.2600, timezone: 'Europe/Prague' },
  { code: 'BUD', name: 'Budapest Ferenc Liszt International', city: 'Budapest', country: 'Hungary', lat: 47.4298, lng: 19.2611, timezone: 'Europe/Budapest' },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4213, lng: -6.2700, timezone: 'Europe/Dublin' },
  { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'UK', lat: 53.3537, lng: -2.2750, timezone: 'Europe/London' },
  { code: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', lat: 46.2370, lng: 6.1089, timezone: 'Europe/Zurich' },
  // Middle East
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', lat: 25.2528, lng: 55.3644, timezone: 'Asia/Dubai' },
  { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE', lat: 24.4330, lng: 54.6511, timezone: 'Asia/Dubai' },
  { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081, timezone: 'Asia/Qatar' },
  { code: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9578, lng: 46.6989, timezone: 'Asia/Riyadh' },
  { code: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lng: 39.1565, timezone: 'Asia/Riyadh' },
  { code: 'KWI', name: 'Kuwait International', city: 'Kuwait City', country: 'Kuwait', lat: 29.2267, lng: 47.9689, timezone: 'Asia/Kuwait' },
  { code: 'BAH', name: 'Bahrain International', city: 'Manama', country: 'Bahrain', lat: 26.2708, lng: 50.6336, timezone: 'Asia/Bahrain' },
  { code: 'MCT', name: 'Muscat International', city: 'Muscat', country: 'Oman', lat: 23.5933, lng: 58.2844, timezone: 'Asia/Muscat' },
  { code: 'TLV', name: 'Ben Gurion International', city: 'Tel Aviv', country: 'Israel', lat: 32.0114, lng: 34.8867, timezone: 'Asia/Jerusalem' },
  { code: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordan', lat: 31.7226, lng: 35.9932, timezone: 'Asia/Amman' },
  { code: 'BEY', name: 'Beirut Rafic Hariri International', city: 'Beirut', country: 'Lebanon', lat: 33.8209, lng: 35.4884, timezone: 'Asia/Beirut' },
  // Asia - East
  { code: 'NRT', name: 'Tokyo Narita International', city: 'Tokyo', country: 'Japan', lat: 35.7720, lng: 140.3929, timezone: 'Asia/Tokyo' },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798, timezone: 'Asia/Tokyo' },
  { code: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'China', lat: 40.0799, lng: 116.6031, timezone: 'Asia/Shanghai' },
  { code: 'PKX', name: 'Beijing Daxing International', city: 'Beijing', country: 'China', lat: 39.5098, lng: 116.4105, timezone: 'Asia/Shanghai' },
  { code: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China', lat: 31.1443, lng: 121.8083, timezone: 'Asia/Shanghai' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China', lat: 22.3080, lng: 113.9185, timezone: 'Asia/Hong_Kong' },
  { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', lat: 37.4691, lng: 126.4510, timezone: 'Asia/Seoul' },
  { code: 'GMP', name: 'Gimpo International', city: 'Seoul', country: 'South Korea', lat: 37.5589, lng: 126.7945, timezone: 'Asia/Seoul' },
  { code: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan', lat: 25.0777, lng: 121.2327, timezone: 'Asia/Taipei' },
  { code: 'CAN', name: 'Guangzhou Baiyun International', city: 'Guangzhou', country: 'China', lat: 23.3924, lng: 113.2988, timezone: 'Asia/Shanghai' },
  { code: 'CTU', name: 'Chengdu Tianfu International', city: 'Chengdu', country: 'China', lat: 30.3121, lng: 104.4406, timezone: 'Asia/Shanghai' },
  { code: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan', lat: 34.4320, lng: 135.2304, timezone: 'Asia/Tokyo' },
  { code: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', country: 'Japan', lat: 42.7752, lng: 141.6922, timezone: 'Asia/Tokyo' },
  // Asia - Southeast
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915, timezone: 'Asia/Singapore' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lng: 100.7501, timezone: 'Asia/Bangkok' },
  { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lng: 101.7099, timezone: 'Asia/Kuala_Lumpur' },
  { code: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lng: 106.6559, timezone: 'Asia/Jakarta' },
  { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', lat: 14.5086, lng: 121.0197, timezone: 'Asia/Manila' },
  { code: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lng: 106.6520, timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam', lat: 21.2187, lng: 105.8037, timezone: 'Asia/Bangkok' },
  { code: 'CEB', name: 'Mactan-Cebu International', city: 'Cebu', country: 'Philippines', lat: 10.3075, lng: 123.9789, timezone: 'Asia/Manila' },
  { code: 'DPS', name: 'Ngurah Rai International', city: 'Bali', country: 'Indonesia', lat: -8.7482, lng: 115.1670, timezone: 'Asia/Makassar' },
  { code: 'RGN', name: 'Yangon International', city: 'Yangon', country: 'Myanmar', lat: 16.9073, lng: 96.1332, timezone: 'Asia/Rangoon' },
  // Asia - South
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', lat: 28.5565, lng: 77.1000, timezone: 'Asia/Kolkata' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656, timezone: 'Asia/Kolkata' },
  { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India', lat: 13.1986, lng: 77.7066, timezone: 'Asia/Kolkata' },
  { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', lat: 12.9900, lng: 80.1693, timezone: 'Asia/Kolkata' },
  { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India', lat: 17.2403, lng: 78.4294, timezone: 'Asia/Kolkata' },
  { code: 'COK', name: 'Cochin International', city: 'Kochi', country: 'India', lat: 10.1520, lng: 76.3919, timezone: 'Asia/Kolkata' },
  { code: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'Sri Lanka', lat: 7.1808, lng: 79.8841, timezone: 'Asia/Colombo' },
  { code: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', country: 'Bangladesh', lat: 23.8433, lng: 90.3978, timezone: 'Asia/Dhaka' },
  { code: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', country: 'Nepal', lat: 27.6966, lng: 85.3591, timezone: 'Asia/Kathmandu' },
  { code: 'KHI', name: 'Jinnah International', city: 'Karachi', country: 'Pakistan', lat: 24.9065, lng: 67.1608, timezone: 'Asia/Karachi' },
  { code: 'LHE', name: 'Allama Iqbal International', city: 'Lahore', country: 'Pakistan', lat: 31.5216, lng: 74.4036, timezone: 'Asia/Karachi' },
  { code: 'ISB', name: 'New Islamabad International', city: 'Islamabad', country: 'Pakistan', lat: 33.5607, lng: 72.8516, timezone: 'Asia/Karachi' },
  // Africa
  { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', lat: -26.1367, lng: 28.2411, timezone: 'Africa/Johannesburg' },
  { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', lat: 30.1219, lng: 31.4056, timezone: 'Africa/Cairo' },
  { code: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco', lat: 33.3675, lng: -7.5898, timezone: 'Africa/Casablanca' },
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lng: 36.9275, timezone: 'Africa/Nairobi' },
  { code: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lng: 38.7993, timezone: 'Africa/Addis_Ababa' },
  { code: 'ACC', name: 'Kotoka International', city: 'Accra', country: 'Ghana', lat: 5.6052, lng: -0.1668, timezone: 'Africa/Accra' },
  { code: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lng: 3.3214, timezone: 'Africa/Lagos' },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', lat: -33.9649, lng: 18.6017, timezone: 'Africa/Johannesburg' },
  { code: 'DUR', name: 'King Shaka International', city: 'Durban', country: 'South Africa', lat: -29.6144, lng: 31.1197, timezone: 'Africa/Johannesburg' },
  { code: 'TNR', name: 'Ivato International', city: 'Antananarivo', country: 'Madagascar', lat: -18.7969, lng: 47.4788, timezone: 'Indian/Antananarivo' },
  // South America
  { code: 'GRU', name: 'Guarulhos International', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lng: -46.4731, timezone: 'America/Sao_Paulo' },
  { code: 'EZE', name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lng: -58.5358, timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'SCL', name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'Chile', lat: -33.3930, lng: -70.7858, timezone: 'America/Santiago' },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', lat: 4.7016, lng: -74.1469, timezone: 'America/Bogota' },
  { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', lat: -12.0219, lng: -77.1143, timezone: 'America/Lima' },
  { code: 'GIG', name: 'Galeão International', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8099, lng: -43.2505, timezone: 'America/Sao_Paulo' },
  { code: 'UIO', name: 'Mariscal Sucre International', city: 'Quito', country: 'Ecuador', lat: -0.1292, lng: -78.3575, timezone: 'America/Guayaquil' },
  { code: 'CCS', name: 'Simón Bolívar International', city: 'Caracas', country: 'Venezuela', lat: 10.6031, lng: -66.9913, timezone: 'America/Caracas' },
  // Oceania
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9461, lng: 151.1772, timezone: 'Australia/Sydney' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410, timezone: 'Australia/Melbourne' },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3842, lng: 153.1175, timezone: 'Australia/Brisbane' },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9403, lng: 115.9669, timezone: 'Australia/Perth' },
  { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia', lat: -34.9451, lng: 138.5306, timezone: 'Australia/Adelaide' },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lng: 174.7917, timezone: 'Pacific/Auckland' },
  { code: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand', lat: -43.4894, lng: 172.5322, timezone: 'Pacific/Auckland' },
  { code: 'NAN', name: 'Nadi International', city: 'Nadi', country: 'Fiji', lat: -17.7553, lng: 177.4436, timezone: 'Pacific/Fiji' },
  { code: 'PPT', name: 'Faa\'a International', city: 'Papeete', country: 'French Polynesia', lat: -17.5534, lng: -149.6066, timezone: 'Pacific/Tahiti' },
  // Caribbean
  { code: 'SJU', name: 'Luis Muñoz Marín International', city: 'San Juan', country: 'Puerto Rico', lat: 18.4394, lng: -66.0018, timezone: 'America/Puerto_Rico' },
  { code: 'NAS', name: 'Lynden Pindling International', city: 'Nassau', country: 'Bahamas', lat: 25.0388, lng: -77.4662, timezone: 'America/Nassau' },
  { code: 'BGI', name: 'Grantley Adams International', city: 'Bridgetown', country: 'Barbados', lat: 13.0746, lng: -59.4925, timezone: 'America/Barbados' },
  { code: 'MBJ', name: 'Sangster International', city: 'Montego Bay', country: 'Jamaica', lat: 18.5037, lng: -77.9133, timezone: 'America/Jamaica' },
  { code: 'POS', name: 'Piarco International', city: 'Port of Spain', country: 'Trinidad and Tobago', lat: 10.5954, lng: -61.3372, timezone: 'America/Port_of_Spain' },
  { code: 'ANU', name: 'V.C. Bird International', city: "St. John's", country: 'Antigua and Barbuda', lat: 17.1368, lng: -61.7927, timezone: 'America/Antigua' },
  // Central America
  { code: 'PTY', name: 'Tocumen International', city: 'Panama City', country: 'Panama', lat: 9.0714, lng: -79.3835, timezone: 'America/Panama' },
  { code: 'SJO', name: 'Juan Santamaría International', city: 'San José', country: 'Costa Rica', lat: 9.9939, lng: -84.2088, timezone: 'America/Costa_Rica' },
  { code: 'GUA', name: 'La Aurora International', city: 'Guatemala City', country: 'Guatemala', lat: 14.5833, lng: -90.5275, timezone: 'America/Guatemala' },
];

export function searchAirports(query: string): Airport[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code === code.toUpperCase());
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
