import { Region } from '@/types';

export const COUNTRIES: { value: Region; label: string; stateLabel: string; zipLabel: string }[] = [
  { value: 'CA', label: 'Canada', stateLabel: 'Province', zipLabel: 'Postal Code' },
  { value: 'US', label: 'United States', stateLabel: 'State', zipLabel: 'ZIP Code' },
  { value: 'IN', label: 'India', stateLabel: 'State', zipLabel: 'PIN Code' },
];

export function getCountryMeta(country?: string | null) {
  return COUNTRIES.find(c => c.value === country) ?? COUNTRIES[0];
}

// value = abbreviation used on real addresses (matches Canada Post / USPS
// convention); label = full name shown in the dropdown.
export const STATES_BY_COUNTRY: Record<Region, { value: string; label: string }[]> = {
  CA: [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ],
  US: [
    { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' }, { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  ],
  IN: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  ].map(name => ({ value: name, label: name })),
};

export function getStatesForCountry(country?: string | null): { value: string; label: string }[] {
  return STATES_BY_COUNTRY[(country as Region) ?? 'CA'] ?? STATES_BY_COUNTRY.CA;
}

// Common/major cities per state/province, keyed the same way as
// STATES_BY_COUNTRY's `value` (province/state abbreviation for CA/US, full
// name for IN). Not exhaustive - used to populate suggestions once a state
// is picked, but the city field stays a free-text input so a city missing
// from this list can still be typed in.
const CITIES_BY_STATE: Record<string, string[]> = {
  // Canada
  AB: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie'],
  BC: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Kelowna', 'Victoria', 'Langley', 'Saanich'],
  MB: ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie'],
  NB: ['Moncton', 'Saint John', 'Fredericton', 'Dieppe', 'Miramichi'],
  NL: ["St. John's", 'Mount Pearl', 'Corner Brook', 'Conception Bay South'],
  NS: ['Halifax', 'Sydney', 'Truro', 'New Glasgow', 'Dartmouth'],
  NT: ['Yellowknife', 'Hay River', 'Inuvik'],
  NU: ['Iqaluit', 'Rankin Inlet', 'Arviat'],
  ON: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor', 'Richmond Hill', 'Oakville', 'Burlington', 'Oshawa', 'Barrie'],
  PE: ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall'],
  QC: ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Trois-Rivières'],
  SK: ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current'],
  YT: ['Whitehorse', 'Dawson City', 'Watson Lake'],

  // United States
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Tempe'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
  CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
  CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
  DE: ['Wilmington', 'Dover', 'Newark'],
  DC: ['Washington'],
  FL: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale'],
  GA: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
  HI: ['Honolulu', 'Hilo', 'Kailua'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'Augusta'],
  MD: ['Baltimore', 'Columbia', 'Germantown', 'Annapolis'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth'],
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
  NH: ['Manchester', 'Nashua', 'Concord'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe'],
  NY: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
  OR: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Bend'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Harrisburg'],
  RI: ['Providence', 'Cranston', 'Warwick'],
  SC: ['Columbia', 'Charleston', 'North Charleston', 'Greenville'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'],
  VT: ['Burlington', 'South Burlington', 'Rutland', 'Montpelier'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Everett'],
  WV: ['Charleston', 'Huntington', 'Morgantown'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
  WY: ['Cheyenne', 'Casper', 'Laramie'],

  // India
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  Assam: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
  Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Durg'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  Haryana: ['Faridabad', 'Gurugram', 'Panipat', 'Ambala'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
  Manipur: ['Imphal', 'Thoubal'],
  Meghalaya: ['Shillong', 'Tura'],
  Mizoram: ['Aizawl', 'Lunglei'],
  Nagaland: ['Kohima', 'Dimapur'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  Sikkim: ['Gangtok', 'Namchi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad'],
  Tripura: ['Agartala', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Noida'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  Chandigarh: ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman'],
  Delhi: ['New Delhi', 'Delhi'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
  Ladakh: ['Leh', 'Kargil'],
  Lakshadweep: ['Kavaratti'],
  Puducherry: ['Puducherry', 'Karaikal'],
};

export function getCitiesForState(state?: string | null): string[] {
  if (!state) return [];
  return CITIES_BY_STATE[state] ?? [];
}
