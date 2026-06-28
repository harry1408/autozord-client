import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ExternalLink, AlertTriangle, Car, ChevronDown, ChevronUp, Loader2, Hash } from 'lucide-react';
import axios from 'axios';

interface VINInspectionProps {
  vin?: string;
}

const DECODE_FIELDS = [
  'Make', 'Model', 'Model Year', 'Trim', 'Series',
  'Body Class', 'Drive Type', 'Fuel Type - Primary',
  'Displacement (L)', 'Engine Number of Cylinders',
  'Engine Configuration', 'Transmission Style',
  'Number of Seats', 'Number of Doors',
  'Manufacturer Name', 'Plant Country',
  'Vehicle Type',
];

const FIELD_LABELS: Record<string, string> = {
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

interface DecodeResult {
  Variable: string;
  Value: string | null;
}

interface Recall {
  NHTSACampaignNumber: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  ReportReceivedDate: string;
}

async function decodeVIN(vin: string) {
  const res = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
  return (res.data.Results as DecodeResult[]).filter(
    r => DECODE_FIELDS.includes(r.Variable) && r.Value && r.Value !== 'Not Applicable' && r.Value !== '0'
  );
}

async function fetchRecalls(vin: string) {
  const res = await axios.get(`https://api.nhtsa.gov/recalls/recallsByVIN?vin=${vin}`);
  return (res.data.results ?? []) as Recall[];
}

export default function VINInspection({ vin: savedVin }: VINInspectionProps) {
  const [manualVin, setManualVin] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [ran, setRan] = useState(false);

  const activeVin = savedVin || manualVin.trim().toUpperCase();

  const { data: specs, isLoading: specsLoading, error: specsError } = useQuery({
    queryKey: ['vin-decode', activeVin],
    queryFn: () => decodeVIN(activeVin),
    enabled: ran && activeVin.length === 17,
    staleTime: Infinity,
  });

  const { data: recalls, isLoading: recallsLoading } = useQuery({
    queryKey: ['vin-recalls', activeVin],
    queryFn: () => fetchRecalls(activeVin),
    enabled: ran && activeVin.length === 17,
    staleTime: Infinity,
  });

  const loading = specsLoading || recallsLoading;

  function run() {
    if (activeVin.length !== 17) return;
    setRan(true);
    setExpanded(true);
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">VIN Inspection</h2>
            <p className="text-xs text-gray-400">
              {savedVin
                ? <span className="font-mono">{savedVin}</span>
                : 'Enter a VIN to check accident history, ownership & recalls'}
            </p>
          </div>
        </div>
        {ran && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      {/* VIN input row (shown when no saved VIN) */}
      {!savedVin && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 font-mono uppercase tracking-widest text-sm"
              placeholder="e.g. 2HGFC2F59JH123456"
              maxLength={17}
              value={manualVin}
              onChange={e => { setManualVin(e.target.value); setRan(false); }}
            />
          </div>
          <button
            onClick={run}
            disabled={manualVin.trim().length !== 17}
            className="btn-primary text-sm py-2 px-4 shrink-0 disabled:opacity-40"
          >
            Run VIN Check
          </button>
        </div>
      )}

      {/* Run button when VIN is saved but not yet run */}
      {savedVin && !ran && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={run} className="btn-primary text-sm py-1.5 px-4">
            Run VIN Check
          </button>
        </div>
      )}

      {ran && expanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Fetching vehicle data...</span>
            </div>
          )}

          {/* Error */}
          {specsError && !loading && (
            <div className="px-6 py-4 text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle size={16} />
              Could not decode VIN. Ensure the VIN is a valid 17-character code.
            </div>
          )}

          {/* Decoded Specs */}
          {specs && specs.length > 0 && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Car size={13} />
                Decoded Vehicle Specs
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                {specs.map(r => (
                  <div key={r.Variable}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {FIELD_LABELS[r.Variable] ?? r.Variable}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                      {r.Value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recalls */}
          {recalls !== undefined && !recallsLoading && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle size={13} />
                Safety Recalls
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  recalls.length === 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                }`}>
                  {recalls.length === 0 ? 'None found' : `${recalls.length} recall${recalls.length > 1 ? 's' : ''}`}
                </span>
              </h3>

              {recalls.length === 0 ? (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <ShieldCheck size={16} />
                  No open safety recalls found for this VIN.
                </p>
              ) : (
                <div className="space-y-3">
                  {recalls.map(r => (
                    <div
                      key={r.NHTSACampaignNumber}
                      className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">{r.Component}</p>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">
                          {r.NHTSACampaignNumber}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{r.Summary}</p>
                      {r.Remedy && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <span className="font-semibold">Remedy:</span> {r.Remedy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* External Links */}
          {specs && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Further Checks (Canadian Resources)
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://www.carfax.ca/vehicle-history-reports/free-vin-check?vin=${vin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink size={14} />
                  CARFAX Canada — Free Check
                </a>
                <a
                  href={`https://tc.canada.ca/en/road-transportation/motor-vehicle-safety/defect-investigations-recalls/recalls-motor-vehicles`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink size={14} />
                  Transport Canada Recalls
                </a>
                <a
                  href={`https://www.icbc.com/vehicle-registration/buy-vehicle/Pages/Vehicle-history-report.aspx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink size={14} />
                  ICBC History Report (BC)
                </a>
                <a
                  href={`https://www.ontario.ca/page/uvip`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink size={14} />
                  Ontario UVIP
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                CARFAX Canada and provincial registries provide accident history, lien checks, and ownership records. Some reports require payment for full details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
