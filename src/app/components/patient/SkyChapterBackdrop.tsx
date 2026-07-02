import type { ChapterDef } from "../../data/chapters";

const SKY_BY_KIND: Record<ChapterDef["worldKind"], { gradient: string; cloud: string }> = {
  archipelago: {
    gradient: "linear-gradient(180deg, #4c1d95 0%, #7c3aed 45%, #c4b5fd 100%)",
    cloud: "rgba(255,255,255,0.85)",
  },
  "jungle-planet": {
    gradient: "linear-gradient(180deg, #4a7c59 0%, #7cb87a 40%, #b8e0b0 100%)",
    cloud: "rgba(255,255,255,0.75)",
  },
  "desert-planet": {
    gradient: "linear-gradient(180deg, #e8a54b 0%, #f5d08a 45%, #fff3d6 100%)",
    cloud: "rgba(255,248,230,0.9)",
  },
  "ice-ring": {
    gradient: "linear-gradient(180deg, #1e3a8a 0%, #60a5fa 50%, #dbeafe 100%)",
    cloud: "rgba(255,255,255,0.9)",
  },
  "volcano-planet": {
    gradient: "linear-gradient(180deg, #450a0a 0%, #dc2626 40%, #fb923c 80%, #fed7aa 100%)",
    cloud: "rgba(255,220,200,0.8)",
  },
  "space-station": {
    gradient: "linear-gradient(180deg, #0f0a2e 0%, #312e81 50%, #6366f1 100%)",
    cloud: "rgba(200,200,255,0.3)",
  },
};

export function SkyChapterBackdrop({ chapter }: { chapter: ChapterDef }) {
  const sky = SKY_BY_KIND[chapter.worldKind];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: sky.gradient }} />

      {/* 雲層 */}
      {[
        { w: "45%", h: "18%", left: "-5%", top: "12%", opacity: 0.7 },
        { w: "38%", h: "14%", left: "55%", top: "8%", opacity: 0.55 },
        { w: "50%", h: "20%", left: "25%", top: "28%", opacity: 0.45 },
        { w: "60%", h: "22%", left: "10%", top: "55%", opacity: 0.35 },
        { w: "42%", h: "16%", left: "60%", top: "62%", opacity: 0.4 },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            width: c.w,
            height: c.h,
            left: c.left,
            top: c.top,
            background: sky.cloud,
            opacity: c.opacity,
          }}
        />
      ))}
    </div>
  );
}
