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
