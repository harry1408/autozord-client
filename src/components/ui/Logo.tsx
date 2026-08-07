import { useId } from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ size = 36, className = '' }: LogoIconProps) {
  const uid = useId().replace(/:/g, '');
  const gShield = `${uid}gs`;
  const gSwoosh = `${uid}gsw`;
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
        <linearGradient id={gSwoosh} x1="0%" y1="0%" x2="100%" y2="40%">
          <stop offset="0%"   stopColor="#ffecec" />
          <stop offset="50%"  stopColor="#ff5252" />
          <stop offset="100%" stopColor="#8b0000" />
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

      {/* Trailing speed accent */}
      <path d="M23 76 C 40 70, 58 68, 82 61" fill="none" stroke={`url(#${gSwoosh})`} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />

      {/* Car-swoosh wing */}
      <path
        d="M26 68 C 34 52, 50 41, 68 41 C 79 41, 87 44, 95 49 C 88 51, 79 49, 70 49 C 55 49, 40 56, 31 72 Z"
        fill={`url(#${gSwoosh})`}
      />

      {/* Sparkle */}
      <path d="M30 40 L32.5 46.5 L39 49 L32.5 51.5 L30 58 L27.5 51.5 L21 49 L27.5 46.5 Z" fill="#fff8f8" />

      {/* Bottom star */}
      <path d="M60 94 L62 98.5 L67 99 L63.3 102.3 L64.3 107.2 L60 104.7 L55.7 107.2 L56.7 102.3 L53 99 L58 98.5 Z" fill="#fff8f8" opacity="0.9" />
    </svg>
  );
}

/* Horizontal lockup: shield icon left · AUTOZORD right */
export function LogoFull({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const gShield = `${uid}fgs`;
  const gSwoosh = `${uid}fgsw`;
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
        <linearGradient id={gSwoosh} x1="0%" y1="0%" x2="100%" y2="40%">
          <stop offset="0%"   stopColor="#ffecec" />
          <stop offset="50%"  stopColor="#ff5252" />
          <stop offset="100%" stopColor="#8b0000" />
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
        <path d="M23 76 C 40 70, 58 68, 82 61" fill="none" stroke={`url(#${gSwoosh})`} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
        <path
          d="M26 68 C 34 52, 50 41, 68 41 C 79 41, 87 44, 95 49 C 88 51, 79 49, 70 49 C 55 49, 40 56, 31 72 Z"
          fill={`url(#${gSwoosh})`}
        />
        <path d="M30 40 L32.5 46.5 L39 49 L32.5 51.5 L30 58 L27.5 51.5 L21 49 L27.5 46.5 Z" fill="#fff8f8" />
        <path d="M60 94 L62 98.5 L67 99 L63.3 102.3 L64.3 107.2 L60 104.7 L55.7 107.2 L56.7 102.3 L53 99 L58 98.5 Z" fill="#fff8f8" opacity="0.9" />
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
