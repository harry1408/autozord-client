import axios from 'axios';

export interface VinDecodeResult {
  Variable: string;
  Value: string | null;
}

// NHTSA's free vPIC VIN decoder - no API key required.
export async function decodeVIN(vin: string): Promise<VinDecodeResult[]> {
  const res = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
  return res.data.Results as VinDecodeResult[];
}

// The vPIC variables worth showing a user, and their display labels. Lives
// here rather than in a component so the Add Vehicle form and the VIN
// Inspection panel can't drift apart on which fields they consider useful.
export const SPEC_FIELDS = [
  'Make', 'Model', 'Model Year', 'Trim', 'Series',
  'Body Class', 'Drive Type', 'Fuel Type - Primary',
  'Displacement (L)', 'Engine Number of Cylinders',
  'Engine Configuration', 'Transmission Style',
  'Number of Seats', 'Number of Doors',
  'Manufacturer Name', 'Plant Country',
  'Vehicle Type',
];

export const SPEC_LABELS: Record<string, string> = {
  'Make': 'Make',
  'Model': 'Model',
  'Model Year': 'Year',
  'Trim': 'Trim',
  'Series': 'Series',
  'Body Class': 'Body Style',
  'Drive Type': 'Drive Type',
  'Fuel Type - Primary': 'Fuel Type',
  'Displacement (L)': 'Engine (L)',
  'Engine Number of Cylinders': 'Cylinders',
  'Engine Configuration': 'Engine Config',
  'Transmission Style': 'Transmission',
  'Number of Seats': 'Seats',
  'Number of Doors': 'Doors',
  'Manufacturer Name': 'Manufacturer',
  'Plant Country': 'Made In',
  'Vehicle Type': 'Vehicle Type',
};

export interface VehicleSpec {
  variable: string;
  label: string;
  value: string;
}

// Read-only specs for display, pulled from a decode response that's already
// been fetched - no extra request. Ordered by SPEC_FIELDS rather than by the
// order vPIC happens to return, and drops the same placeholder values
// pickVehicleBasics ignores.
export function pickVehicleSpecs(results: VinDecodeResult[]): VehicleSpec[] {
  const specs: VehicleSpec[] = [];
  for (const variable of SPEC_FIELDS) {
    const value = results.find(r => r.Variable === variable)?.Value;
    if (!value || value === 'Not Applicable' || value === '0') continue;
    specs.push({ variable, label: SPEC_LABELS[variable] ?? variable, value });
  }
  return specs;
}

export interface DecodedVehicleBasics {
  make?: string;
  model?: string;
  year?: number;
  engineSize?: string;
}

// Pulls just the fields the Add Vehicle form cares about out of a full
// vPIC decode response, ignoring "Not Applicable"/"0" placeholder values.
export function pickVehicleBasics(results: VinDecodeResult[]): DecodedVehicleBasics {
  const byVar = (name: string) => {
    const r = results.find(r => r.Variable === name);
    return r?.Value && r.Value !== 'Not Applicable' && r.Value !== '0' ? r.Value : undefined;
  };

  const make = byVar('Make');
  const model = byVar('Model');
  const yearStr = byVar('Model Year');
  const displacement = byVar('Displacement (L)');

  return {
    make,
    model,
    year: yearStr ? Number(yearStr) : undefined,
    engineSize: displacement ? `${displacement}L` : undefined,
  };
}
