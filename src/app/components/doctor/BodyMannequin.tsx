import { useState, useId, type ReactNode } from "react";
import { motion } from "motion/react";
import type { BodyRegion } from "../../data/prescriptionExercises";
import { BODY_REGION_LABELS } from "../../data/prescriptionExercises";

export const REGION_COLORS: Record<BodyRegion, string> = {
  neck: "#c084fc",
  shoulder: "#38bdf8",
  elbow: "#60a5fa",
  wrist: "#818cf8",
  core: "#34d399",
  hip: "#fbbf24",
  knee: "#fb923c",
  ankle: "#f472b6",
};

interface BodyMannequinProps {
  selectedRegion?: BodyRegion | null;
  assignedRegions?: BodyRegion[];
  onSelectRegion?: (region: BodyRegion) => void;
  compact?: boolean;
  showHint?: boolean;
  size?: "compact" | "default" | "large" | "mini";
  /** 關閉已指派部位的呼吸燈動畫（列表預覽用） */
  staticGlow?: boolean;
}

function isAssigned(region: BodyRegion, assigned: BodyRegion[]) {
  return assigned.includes(region);
}

function RegionShape({
  region,
  children,
  selectedRegion,
  hoveredRegion,
  assignedRegions,
  interactive,
  onSelect,
  onHover,
  glowFilterId,
  staticGlow = false,
}: {
  region: BodyRegion;
  children: ReactNode;
  selectedRegion: BodyRegion | null;
  hoveredRegion: BodyRegion | null;
  assignedRegions: BodyRegion[];
  interactive: boolean;
  onSelect?: (region: BodyRegion) => void;
  onHover: (region: BodyRegion | null) => void;
  glowFilterId: string;
  staticGlow?: boolean;
}) {
  const assigned = isAssigned(region, assignedRegions);
  const selected = selectedRegion === region;
  const hovered = hoveredRegion === region;
  const color = REGION_COLORS[region];

  const fill = assigned
    ? color
    : selected || hovered
      ? color
      : `${color}55`;

  const stroke = assigned || selected || hovered ? color : "#94a3b8";
  const strokeWidth = assigned ? 3 : 2;

  const glow = assigned && !selected && !staticGlow;

  return (
    <motion.g
      onClick={interactive && onSelect ? () => onSelect(region) : undefined}
      onMouseEnter={interactive ? () => onHover(region) : undefined}
      onMouseLeave={interactive ? () => onHover(null) : undefined}
      className={interactive ? "cursor-pointer" : undefined}
      animate={glow ? { opacity: [0.7, 1, 0.7] } : undefined}
      transition={glow ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
      filter={assigned ? `url(#${glowFilterId})` : undefined}
    >
      <g style={{ fill, stroke, strokeWidth }}>{children}</g>
    </motion.g>
  );
}

/** 2D 正視人偶 — 可點選部位；已指派部位會發光 */
export function BodyMannequin({
  selectedRegion = null,
  assignedRegions = [],
  onSelectRegion,
  compact = false,
  showHint = true,
  size,
  staticGlow = false,
}: BodyMannequinProps) {
  const [hovered, setHovered] = useState<BodyRegion | null>(null);
  const glowFilterId = `region-glow-${useId().replace(/:/g, "")}`;
  const interactive = Boolean(onSelectRegion);
  const resolvedSize = size ?? (compact ? "compact" : "default");

  const svgClass =
    resolvedSize === "mini"
      ? "h-[100px] w-auto"
      : resolvedSize === "compact"
      ? "h-[160px] w-auto"
      : resolvedSize === "large"
        ? "w-full min-h-[400px] max-h-[460px] h-auto"
        : "h-full max-h-[340px] w-auto";

  const shapeProps = (region: BodyRegion) => ({
    region,
    selectedRegion,
    hoveredRegion: hovered,
    assignedRegions,
    interactive,
    onSelect: onSelectRegion,
    onHover: setHovered,
    glowFilterId,
    staticGlow,
  });

  return (
    <div className={`flex flex-col items-center ${compact ? "" : "h-full"}`}>
      {showHint && (
        <p className="text-slate-500 text-sm mb-2 text-center">
          {interactive
            ? "點選身體部位，查看可開立的復健動作"
            : "已指派部位會發光顯示"}
        </p>
      )}
      <svg
        viewBox="0 0 200 380"
        className={svgClass}
        aria-label={interactive ? "2D 人偶身體部位選擇" : "已指派部位預覽"}
      >
        <defs>
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="100" cy="36" r="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <RegionShape {...shapeProps("neck")}>
          <rect x="88" y="54" width="24" height="18" rx="6" />
        </RegionShape>
        <rect x="92" y="70" width="16" height="8" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

        <RegionShape {...shapeProps("shoulder")}>
          <ellipse cx="62" cy="88" rx="18" ry="12" />
          <ellipse cx="138" cy="88" rx="18" ry="12" />
        </RegionShape>

        <rect x="44" y="96" width="16" height="44" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="140" y="96" width="16" height="44" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

        <RegionShape {...shapeProps("elbow")}>
          <circle cx="52" cy="148" r="11" />
          <circle cx="148" cy="148" r="11" />
        </RegionShape>

        <rect x="46" y="158" width="12" height="38" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="142" y="158" width="12" height="38" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

        <RegionShape {...shapeProps("wrist")}>
          <ellipse cx="52" cy="206" rx="10" ry="8" />
          <ellipse cx="148" cy="206" rx="10" ry="8" />
        </RegionShape>

        <RegionShape {...shapeProps("core")}>
          <path d="M72 78 L128 78 L122 200 L78 200 Z" />
        </RegionShape>

        <RegionShape {...shapeProps("hip")}>
          <ellipse cx="78" cy="212" rx="16" ry="12" />
          <ellipse cx="122" cy="212" rx="16" ry="12" />
        </RegionShape>

        <rect x="70" y="222" width="18" height="58" rx="9" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="112" y="222" width="18" height="58" rx="9" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

        <RegionShape {...shapeProps("knee")}>
          <circle cx="79" cy="292" r="13" />
          <circle cx="121" cy="292" r="13" />
        </RegionShape>

        <rect x="72" y="304" width="14" height="48" rx="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="114" y="304" width="14" height="48" rx="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

        <RegionShape {...shapeProps("ankle")}>
          <ellipse cx="79" cy="362" rx="11" ry="9" />
          <ellipse cx="121" cy="362" rx="11" ry="9" />
        </RegionShape>
      </svg>

      {interactive && (selectedRegion || hovered) && (
        <p className="text-sky-600 text-sm mt-2" style={{ fontWeight: 700 }}>
          {BODY_REGION_LABELS[(selectedRegion ?? hovered)!]}
        </p>
      )}
    </div>
  );
}
