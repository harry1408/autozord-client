import { Region } from '@/types';

interface RegionPricing {
  value: Region;
  label: string;
  currency: string;
  symbol: string;
  monthly: number;
  yearly: number;
}

// Mirrors autozord-server/src/utils/pricing.ts - keep both in sync.
export const REGIONS: RegionPricing[] = [
  { value: 'CA', label: 'Canada', currency: 'CAD', symbol: '$', monthly: 50, yearly: 400 },
  { value: 'US', label: 'United States', currency: 'USD', symbol: '$', monthly: 40, yearly: 300 },
  { value: 'IN', label: 'India', currency: 'INR', symbol: '₹', monthly: 1000, yearly: 10000 },
];

export function getRegionPricing(region: Region): RegionPricing {
  return REGIONS.find(r => r.value === region) ?? REGIONS[0];
}

export function formatPrice(region: Region, amount: number): string {
  const { symbol, currency } = getRegionPricing(region);
  return `${symbol}${amount.toLocaleString()} ${currency}`;
}
