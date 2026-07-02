/** 程式繪製的浮島場景（參考東海浮島風格，非貼圖） */
export type IslandSceneVariant = "palace" | "terrace" | "market" | "grotto" | "generic";

const VARIANTS: IslandSceneVariant[] = ["palace", "terrace", "market", "grotto"];

export function islandVariantForIndex(index: number): IslandSceneVariant {
  return VARIANTS[index % VARIANTS.length] ?? "generic";
}

interface IslandSceneSvgProps {
  variant: IslandSceneVariant;
  className?: string;
}

export function IslandSceneSvg({ variant, className = "" }: IslandSceneSvgProps) {
  return (
    <svg
      viewBox="0 0 120 90"
      className={`w-full h-full ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b5344" />
          <stop offset="100%" stopColor="#3d2e26" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6dbe6a" />
          <stop offset="100%" stopColor="#3d8f4a" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5d78e" />
          <stop offset="100%" stopColor="#c9a227" />
        </linearGradient>
      </defs>

      {/* 浮島岩石底座 */}
      <ellipse cx="60" cy="78" rx="48" ry="10" fill="rgba(255,255,255,0.35)" />
      <path d="M18 72 Q60 48 102 72 L95 82 Q60 68 25 82 Z" fill="url(#rock)" />
      <ellipse cx="60" cy="58" rx="42" ry="16" fill="url(#grass)" />

      {variant === "palace" && (
        <g>
          <rect x="42" y="38" width="36" height="18" fill="#8b4513" rx="1" />
          <polygon points="40,38 60,24 80,38" fill="url(#gold)" />
          <rect x="48" y="44" width="8" height="12" fill="#5c3d2e" />
          <rect x="64" y="44" width="8" height="12" fill="#5c3d2e" />
          <path d="M8 70 Q20 62 28 70" fill="none" stroke="#7ec8e3" strokeWidth="2" opacity="0.7" />
          <rect x="4" y="68" width="14" height="3" fill="#8b6914" rx="1" />
        </g>
      )}

      {variant === "terrace" && (
        <g>
          <path d="M25 62 L45 56 L65 60 L85 54 L95 62" fill="#4a9e4a" stroke="#3d7a3d" strokeWidth="0.5" />
          <path d="M30 58 L50 52 L70 56 L90 50" fill="#5cb85c" opacity="0.8" />
          <rect x="52" y="42" width="16" height="12" fill="#8b4513" />
          <polygon points="50,42 60,32 70,42" fill="url(#gold)" />
          <circle cx="38" cy="54" r="2" fill="#ffd700" opacity="0.9" />
          <circle cx="72" cy="52" r="2" fill="#ffd700" opacity="0.9" />
        </g>
      )}

      {variant === "market" && (
        <g>
          <rect x="30" y="52" width="60" height="8" fill="#9ca3af" rx="1" />
          <rect x="35" y="44" width="14" height="10" fill="#c2410c" />
          <rect x="53" y="44" width="14" height="10" fill="#1d4ed8" />
          <rect x="71" y="44" width="14" height="10" fill="#c2410c" />
          <polygon points="33,44 42,36 51,44" fill="#fef3c7" />
          <polygon points="51,44 60,36 69,44" fill="#dbeafe" />
          <rect x="6" y="66" width="18" height="4" fill="#8b6914" rx="1" />
          <path d="M24 68 L8 68" stroke="#8b6914" strokeWidth="2" />
        </g>
      )}

      {variant === "grotto" && (
        <g>
          <ellipse cx="75" cy="55" rx="18" ry="12" fill="#4a3728" />
          <ellipse cx="75" cy="55" rx="12" ry="8" fill="#1a1a2e" />
          <circle cx="75" cy="54" r="5" fill="#f5d78e" opacity="0.85" />
          <rect x="28" y="48" width="10" height="14" fill="#6b5344" />
          <polygon points="26,48 33,38 40,48" fill="#7c3aed" />
          <path d="M48 62 Q60 58 72 62" fill="none" stroke="#9ca3af" strokeWidth="2" />
        </g>
      )}

      {variant === "generic" && (
        <g>
          <rect x="48" y="42" width="24" height="14" fill="#8b4513" />
          <polygon points="46,42 60,30 74,42" fill="url(#gold)" />
          <circle cx="35" cy="55" r="6" fill="#2d6a4f" />
          <circle cx="85" cy="56" r="5" fill="#2d6a4f" />
        </g>
      )}
    </svg>
  );
}
