import { ReactElement } from 'react';
import { CreditCard } from 'lucide-react';
import { CardBrand } from '@/types';

// Simplified brand marks (not pixel-exact official logos) - just enough to
// make the card network recognizable at a glance in a payments table.
const LOGO_WIDTH = 30;
const LOGO_HEIGHT = 19;

function VisaLogo() {
  return (
    <svg width={LOGO_WIDTH} height={LOGO_HEIGHT} viewBox="0 0 30 19" className="rounded-[3px]">
      <rect width="30" height="19" rx="3" fill="#1A1F71" />
      <text x="15" y="13" textAnchor="middle" fontSize="8" fontStyle="italic" fontWeight="bold" fill="#ffffff" fontFamily="Arial, sans-serif">VISA</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg width={LOGO_WIDTH} height={LOGO_HEIGHT} viewBox="0 0 30 19" className="rounded-[3px]">
      <rect width="30" height="19" rx="3" fill="#f4f4f5" />
      <circle cx="12.5" cy="9.5" r="6" fill="#EB001B" />
      <circle cx="17.5" cy="9.5" r="6" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg width={LOGO_WIDTH} height={LOGO_HEIGHT} viewBox="0 0 30 19" className="rounded-[3px]">
      <rect width="30" height="19" rx="3" fill="#2E77BC" />
      <text x="15" y="12.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff" fontFamily="Arial, sans-serif">AMEX</text>
    </svg>
  );
}

function DiscoverLogo() {
  return (
    <svg width={LOGO_WIDTH} height={LOGO_HEIGHT} viewBox="0 0 30 19" className="rounded-[3px]">
      <rect width="30" height="19" rx="3" fill="#f4f4f5" stroke="#e4e4e7" />
      <circle cx="23" cy="9.5" r="5" fill="#FF6000" />
      <text x="13" y="12" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#1a1a1a" fontFamily="Arial, sans-serif">DISC</text>
    </svg>
  );
}

const BRAND_LOGOS: Record<CardBrand, () => ReactElement> = {
  VISA: VisaLogo,
  MASTERCARD: MastercardLogo,
  AMEX: AmexLogo,
  DISCOVER: DiscoverLogo,
  OTHER: () => <CreditCard size={LOGO_HEIGHT} className="text-gray-400" />,
};

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'Amex',
  DISCOVER: 'Discover',
  OTHER: 'Other',
};

export function CardBrandLogo({ brand }: { brand: CardBrand }) {
  const Logo = BRAND_LOGOS[brand] ?? BRAND_LOGOS.OTHER;
  return <Logo />;
}

// Combined "[logo] Debit/Credit" chip shown next to the payment method badge
// when a payment's method is CARD and card details were captured.
export function CardDetailsChip({ cardType, cardBrand }: { cardType?: string | null; cardBrand?: string | null }) {
  if (!cardType && !cardBrand) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {cardBrand && <CardBrandLogo brand={cardBrand as CardBrand} />}
      {cardType && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {cardType === 'DEBIT' ? 'Debit' : 'Credit'}
        </span>
      )}
    </span>
  );
}
