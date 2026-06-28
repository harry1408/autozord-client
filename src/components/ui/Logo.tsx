import { useId } from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ size = 36, className = '' }: LogoIconProps) {
  const uid = useId().replace(/:/g, '');
  const gShield = `${uid}gs`;
  const gAZ     = `${uid}gaz`;
  const gBolt   = `${uid}gb`;
  const gBorder = `${uid}gbo`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Autozord"
    >
      <defs>
        <linearGradient id={gShield} x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#1c0000" />
          <stop offset="100%" stopColor="#6b0000" />
        </linearGradient>
        <linearGradient id={gAZ} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ffd4d4" />
          <stop offset="45%"  stopColor="#e60000" />
          <stop offset="100%" stopColor="#8b0000" />
        </linearGradient>
        <linearGradient id={gBolt} x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%"   stopColor="#fff0f0" />
          <stop offset="100%" stopColor="#ff3333" />
        </linearGradient>
        <linearGradient id={gBorder} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <path d="M60 9 L96 25 L96 72 Q96 101 60 114 Q24 101 24 72 L24 25 Z" fill={`url(#${gShield})`} />
      <path d="M60 9 L96 25 L96 72 Q96 101 60 114 Q24 101 24 72 L24 25 Z" fill={`url(#${gBorder})`} />
      <path d="M60 9 L96 25 L96 72 Q96 101 60 114 Q24 101 24 72 L24 25 Z" fill="none" stroke="#0d0000" strokeWidth="2.5" />

      <rect x="57"  y="2.5" width="6"   height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8"/>
      <rect x="44.5" y="4"  width="5.5" height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(-20 47.25 8)"/>
      <rect x="70"  y="4"   width="5.5" height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(20 72.75 8)"/>
      <rect x="32"  y="10"  width="5"   height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(-40 34.5 14)"/>
      <rect x="83"  y="10"  width="5"   height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(40 85.5 14)"/>
      <rect x="21"  y="21"  width="4.5" height="7" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(-62 23.25 24.5)"/>
      <rect x="94"  y="21"  width="4.5" height="7" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(62 96.25 24.5)"/>

      <text x="21" y="90" fontFamily="'Arial Black','Arial Bold',Arial,sans-serif" fontWeight="900" fontSize="58" fill={`url(#${gAZ})`} letterSpacing="-2">AZ</text>

      <polygon points="74,20 64,54 72,54 55,98 65,98 79,60 69,60 82,20" fill={`url(#${gBolt})`} opacity="0.88" />
    </svg>
  );
}

/* Horizontal lockup: shield icon left · AUTOZORD right */
export function LogoFull({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const gShield = `${uid}fgs`;
  const gAZ     = `${uid}fgaz`;
  const gBolt   = `${uid}fgb`;
  const gBorder = `${uid}fgbo`;
  const gText   = `${uid}fgt`;

  return (
    <svg
      viewBox="0 0 240 60"
      width="240"
      height="60"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Autozord"
    >
      <defs>
        <linearGradient id={gShield} x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#1c0000" />
          <stop offset="100%" stopColor="#6b0000" />
        </linearGradient>
        <linearGradient id={gAZ} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ffd4d4" />
          <stop offset="45%"  stopColor="#e60000" />
          <stop offset="100%" stopColor="#8b0000" />
        </linearGradient>
        <linearGradient id={gBolt} x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%"   stopColor="#fff0f0" />
          <stop offset="100%" stopColor="#ff3333" />
        </linearGradient>
        <linearGradient id={gBorder} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id={gText} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff2222" />
          <stop offset="100%" stopColor="#8b0000" />
        </linearGradient>
      </defs>

      {/* Shield — scaled to fit 60px tall slot, anchored left */}
      <g transform="translate(2, 2) scale(0.467)">
        <path d="M60 9 L96 25 L96 72 Q96 101 60 114 Q24 101 24 72 L24 25 Z" fill={`url(#${gShield})`} />
        <path d="M60 9 L96 25 L96 72 Q96 101 60 114 Q24 101 24 72 L24 25 Z" fill={`url(#${gBorder})`} />
        <path d="M60 9 L96 25 L96 72 Q96 101 60 114 Q24 101 24 72 L24 25 Z" fill="none" stroke="#0d0000" strokeWidth="2.5" />
        <rect x="57"  y="2.5" width="6"   height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8"/>
        <rect x="44.5" y="4"  width="5.5" height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(-20 47.25 8)"/>
        <rect x="70"  y="4"   width="5.5" height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(20 72.75 8)"/>
        <rect x="32"  y="10"  width="5"   height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(-40 34.5 14)"/>
        <rect x="83"  y="10"  width="5"   height="8" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(40 85.5 14)"/>
        <rect x="21"  y="21"  width="4.5" height="7" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(-62 23.25 24.5)"/>
        <rect x="94"  y="21"  width="4.5" height="7" rx="1.5" fill="#3d0000" stroke="#0d0000" strokeWidth="0.8" transform="rotate(62 96.25 24.5)"/>
        <text x="21" y="90" fontFamily="'Arial Black','Arial Bold',Arial,sans-serif" fontWeight="900" fontSize="58" fill={`url(#${gAZ})`} letterSpacing="-2">AZ</text>
        <polygon points="74,20 64,54 72,54 55,98 65,98 79,60 69,60 82,20" fill={`url(#${gBolt})`} opacity="0.88" />
      </g>

      {/* Thin divider */}
      <line x1="66" y1="10" x2="66" y2="50" stroke="#e60000" strokeWidth="1" opacity="0.25" />

      {/* Wordmark */}
      <text
        x="76"
        y="30"
        fontFamily="'Arial Black','Arial Bold',Arial,sans-serif"
        fontWeight="900"
        fontSize="19"
        fill={`url(#${gText})`}
        letterSpacing="3.5"
        dominantBaseline="middle"
      >AUTOZORD</text>
    </svg>
  );
}

export default LogoIcon;
