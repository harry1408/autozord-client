interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ size = 36, className = '' }: LogoIconProps) {
  return (
    <img
      src="/logo.png"
      alt="Autozord"
      width={size}
      height={size}
      className={className}
    />
  );
}

/* Horizontal lockup: wheel icon left · AUTOZORD wordmark right.
   Sized via an explicit pixel height (not CSS classes) so the wordmark's
   font-size can scale proportionally with it. */
export function LogoFull({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`inline-flex items-center ${className}`} style={{ height: size, gap: size * 0.2 }}>
      <img src="/logo.png" alt="" style={{ height: size, width: size }} className="object-contain shrink-0" />
      <span
        className="font-black tracking-wider leading-none bg-clip-text text-transparent whitespace-nowrap"
        style={{ fontSize: size * 0.4, backgroundImage: 'linear-gradient(90deg, #ff2222, #8b0000)' }}
      >
        AUTOZORD
      </span>
    </div>
  );
}

export default LogoIcon;
