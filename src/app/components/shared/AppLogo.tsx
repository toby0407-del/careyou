import { useId } from "react";
import { getAppDisplayName, getAppTagline } from "../../brand";

/** Icon — family flanking senior on playful steps, 倍伴練 / PlusRep */

interface AppLogoProps {
  size?: number;
  showBadge?: boolean;
  className?: string;
}

function PersonIcon({ x, scale = 1, color = "white" }: { x: number; scale?: number; color?: string }) {
  const s = scale;
  return (
    <g transform={`translate(${x}, 0) scale(${s})`} fill={color} fillOpacity="0.95">
      <circle cx="0" cy="0" r="5" />
      <path d="M-7 18 Q0 10 7 18 L5 32 Q0 28 -5 32 Z" />
    </g>
  );
}

export function AppLogo({ size = 80, showBadge = true, className = "" }: AppLogoProps) {
  const uid = useId().replace(/:/g, "");
  const bgId = `prBg-${uid}`;
  const shineId = `prShine-${uid}`;
  const heartId = `prHeart-${uid}`;

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={bgId} x1="8" y1="8" x2="72" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="40%" stopColor="#FDBA74" />
            <stop offset="100%" stopColor="#5EEAD4" />
          </linearGradient>
          <linearGradient id={shineId} x1="40" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.45" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={heartId} x1="40" y1="14" x2="40" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>

        <rect x="4" y="4" width="72" height="72" rx="18" fill={`url(#${bgId})`} />
        <rect x="4" y="4" width="72" height="36" rx="18" fill={`url(#${shineId})`} />

        {/* heart halo — 永遠陪伴 */}
        <path
          d="M40 16 C36 10 28 10 28 18 C28 26 40 32 40 32 C40 32 52 26 52 18 C52 10 44 10 40 16Z"
          fill={`url(#${heartId})`}
          fillOpacity="0.85"
        />

        {/* connection arc */}
        <path
          d="M18 38 Q40 24 62 38"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.6"
          fill="none"
        />

        {/* playful hopscotch tiles */}
        <rect x="22" y="56" width="12" height="10" rx="3" fill="white" fillOpacity="0.5" />
        <rect x="34" y="52" width="12" height="10" rx="3" fill="white" fillOpacity="0.7" />
        <rect x="46" y="56" width="12" height="10" rx="3" fill="white" fillOpacity="0.5" />
        <text x="28" y="64" fill="#F97316" fontSize="7" fontWeight="800" fontFamily="Arial Black, PingFang TC, sans-serif">1</text>
        <text x="40" y="60" fill="#F97316" fontSize="7" fontWeight="800" fontFamily="Arial Black, PingFang TC, sans-serif">2</text>
        <text x="52" y="64" fill="#F97316" fontSize="7" fontWeight="800" fontFamily="Arial Black, PingFang TC, sans-serif">3</text>

        {/* three figures: family — senior — family */}
        <g transform="translate(0, 34)">
          <PersonIcon x={22} scale={0.85} color="#FFF1F2" />
          <PersonIcon x={40} scale={1.05} color="white" />
          <PersonIcon x={58} scale={0.85} color="#FFF1F2" />
        </g>

        {/* center foot lifted — 邊玩邊練 */}
        <ellipse cx="40" cy="58" rx="4" ry="2.5" fill="white" fillOpacity="0.9" transform="rotate(-15 40 58)" />

        {/* small dice — 好玩 */}
        <rect x="58" y="18" width="10" height="10" rx="2" fill="white" fillOpacity="0.9" />
        <circle cx="61" cy="21" r="1.2" fill="#F97316" />
        <circle cx="65" cy="25" r="1.2" fill="#F97316" />
      </svg>
      {showBadge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-400 border-2 border-white shadow-sm" />
      )}
    </div>
  );
}

export function AppBrandHeader({
  nameSize = "text-5xl",
  className = "",
}: {
  nameSize?: string;
  className?: string;
}) {
  const name = getAppDisplayName();
  const tagline = getAppTagline();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <AppLogo size={80} />
      <div className="text-left">
        <h1 className={`${nameSize} text-slate-800 tracking-tight`} style={{ fontWeight: 800 }}>
          {name}
        </h1>
        <p className="text-slate-500 text-lg tracking-wide">{tagline}</p>
      </div>
    </div>
  );
}
