const DARK = '#0b0429';

/**
 * The KseroSe mark: a chrome magnifying glass with a heart in the lens —
 * "looking closely at the people you love". Replaces the old flower.
 */
export default function BrandMark({ size = 80, shadow = true }: { size?: number; shadow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ filter: shadow ? `drop-shadow(3px 3px 0 ${DARK})` : undefined, flexShrink: 0 }}
      role="img"
      aria-label="KseroSe"
    >
      <defs>
        <radialGradient id="brandmark-chrome" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#d8e4f5" />
          <stop offset="0.7" stopColor="#8aa2bf" />
          <stop offset="1" stopColor="#eaf1fb" />
        </radialGradient>
      </defs>

      {/* Handle first, so the lens sits on top of it */}
      <line
        x1="60" y1="60" x2="88" y2="88"
        stroke={DARK} strokeWidth="16" strokeLinecap="round"
      />
      <line
        x1="62" y1="62" x2="85" y2="85"
        stroke="url(#brandmark-chrome)" strokeWidth="8" strokeLinecap="round"
      />

      {/* Lens */}
      <circle cx="42" cy="42" r="33" fill="url(#brandmark-chrome)" stroke={DARK} strokeWidth="4" />
      <circle cx="42" cy="42" r="25" fill="#FFF5DA" stroke={DARK} strokeWidth="3" />

      {/* Heart inside the lens */}
      <path
        d="M42 57 C42 57 27 47.5 27 38.5 C27 33.8 30.6 30.5 34.6 30.5 C37.3 30.5 39.9 32 42 34.6 C44.1 32 46.7 30.5 49.4 30.5 C53.4 30.5 57 33.8 57 38.5 C57 47.5 42 57 42 57 Z"
        fill="#FF1E8E"
        stroke={DARK}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Glass glint */}
      <path
        d="M26 30 Q32 22 42 21"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
