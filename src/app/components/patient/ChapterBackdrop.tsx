import type { ChapterDef } from "../../data/chapters";

export function ChapterBackdrop({ chapter }: { chapter: ChapterDef }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: chapter.gradient }} />

      {/* 星點 / 氛圍 */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 8) % 70}%`,
              opacity: 0.2 + (i % 5) * 0.1,
            }}
          />
        ))}
      </div>

      {/* 海面 / 地平線 */}
      {(chapter.worldKind === "archipelago" ||
        chapter.worldKind === "ice-ring") && (
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-sky-950/50 via-sky-800/20 to-transparent" />
      )}

      {chapter.worldKind === "space-station" && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}
    </div>
  );
}
