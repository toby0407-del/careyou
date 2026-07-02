import type { ReactNode } from "react";
import type { ChapterDef } from "../../data/chapters";

const TERRAIN_BY_KIND: Record<
  ChapterDef["worldKind"],
  { filter: string; overlay: string; water: string }
> = {
  archipelago: { filter: "none", overlay: "transparent", water: "#5ec4c4" },
  "jungle-planet": { filter: "hue-rotate(85deg) saturate(1.15)", overlay: "rgba(20,83,45,0.12)", water: "#2d6a4f" },
  "desert-planet": { filter: "hue-rotate(35deg) saturate(0.9) brightness(1.05)", overlay: "rgba(120,53,15,0.15)", water: "#d4a574" },
  "ice-ring": { filter: "hue-rotate(180deg) saturate(0.7) brightness(1.1)", overlay: "rgba(12,74,110,0.18)", water: "#7dd3fc" },
  "volcano-planet": { filter: "hue-rotate(-25deg) saturate(1.2) contrast(1.05)", overlay: "rgba(69,10,10,0.2)", water: "#fb923c" },
  "space-station": { filter: "grayscale(0.6) hue-rotate(220deg) brightness(0.85)", overlay: "rgba(30,27,75,0.35)", water: "#312e81" },
};

interface IslandTerrainProps {
  chapter: ChapterDef;
  children?: ReactNode;
}

/**
 * 島嶼地形 — 整塊區域為地圖範圍。
 * 依容器等比縮放（object-contain），不裁切島嶼本體。
 */
export function IslandTerrain({ chapter, children }: IslandTerrainProps) {
  const style = TERRAIN_BY_KIND[chapter.worldKind];

  return (
    <div className="absolute inset-0" style={{ background: style.water }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full max-h-full aspect-square max-w-full">
          <img
            src="/assets/world-map/island-scatter-map.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: style.filter }}
            draggable={false}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: style.overlay }}
          />
          {children && (
            <div className="absolute inset-0 pointer-events-none [&_*]:pointer-events-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
