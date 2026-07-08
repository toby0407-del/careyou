import { motion } from "motion/react";
import { Lock, Gift, ChevronRight } from "lucide-react";
import type { ChapterDef } from "../../data/chapters";
import {
  getChapterProgress,
  getCurrentProgressLocation,
  getIslandProgress,
  getIslandSouvenir,
  isIslandCompleted,
  isIslandUnlocked,
} from "../../data/chapters";
import { IslandSpriteCutout } from "./IslandSpriteCutout";

interface ArchipelagoChapterMapProps {
  chapter: ChapterDef;
  onSelectIsland: (islandId: string) => void;
}

/** 張氏群島 — 四座浮島橫排（去背素材，適配容器） */
export function ArchipelagoChapterMap({ chapter, onSelectIsland }: ArchipelagoChapterMapProps) {
  const progress = getCurrentProgressLocation();
  const chapterProgress = getChapterProgress(chapter.id);
  const islands = chapter.islands;
  const spritesheet = chapter.islandSpritesheet;

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[15, 40, 65].map((top) => (
          <div
            key={top}
            className="absolute rounded-full blur-3xl bg-white/25"
            style={{ width: "50%", height: "26%", left: `${top - 25}%`, top: `${top}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex-shrink-0 pt-3 px-3 flex justify-center">
        <div className="bg-indigo-950/50 backdrop-blur-md rounded-xl px-4 py-1.5 border border-white/15 text-center">
          <p className="text-white text-xs" style={{ fontWeight: 800 }}>
            {chapter.subtitle}
          </p>
          <p className="text-white/70 text-[10px]">
            {chapterProgress.completed}/{chapterProgress.total} 關 · {islands.length} 座浮島
          </p>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex items-end justify-center gap-0 sm:gap-1 px-1 sm:px-3 pb-2 pt-1">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {islands.slice(0, -1).map((_, i) => {
            const n = islands.length;
            const x1 = (100 / n) * (i + 0.5);
            const x2 = (100 / n) * (i + 1.5);
            return (
              <path
                key={i}
                d={`M ${x1} 78 Q ${(x1 + x2) / 2} 68 ${x2} 78`}
                fill="none"
                stroke="white"
                strokeWidth="0.35"
                strokeDasharray="1.2 1.2"
                opacity="0.35"
              />
            );
          })}
        </svg>

        {islands.map((island, index) => {
          const unlocked = isIslandUnlocked(chapter.id, island.id);
          const islandProgress = getIslandProgress(chapter.id, island.id);
          const souvenir = getIslandSouvenir(chapter.id, island.id);
          const completed = isIslandCompleted(chapter.id, island.id);
          const isCurrent =
            progress.chapterId === chapter.id && progress.islandId === island.id;
          const floatY = index % 2 === 0 ? 0 : -5;

          return (
            <motion.button
              key={island.id}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onSelectIsland(island.id)}
              className={`relative flex-1 min-w-0 max-w-[25%] flex flex-col items-center justify-end ${
                unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-45"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: floatY }}
              transition={{ delay: index * 0.07 }}
              whileHover={unlocked ? { y: floatY - 4, scale: 1.02 } : {}}
            >
              {isCurrent && (
                <span
                  className="mb-1 text-[8px] sm:text-[9px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full border border-white shadow whitespace-nowrap z-10"
                  style={{ fontWeight: 800 }}
                >
                  你在這裡
                </span>
              )}

              <motion.div
                className="relative w-full h-[min(30vh,150px)] sm:h-[min(34vh,170px)] flex items-end justify-center"
                animate={unlocked ? { y: [0, -6, 0] } : {}}
                transition={{ duration: 3.2 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
              >
                {spritesheet ? (
                  <div
                    className={`relative w-full h-full ${
                      isCurrent ? "drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]" : ""
                    }`}
                  >
                    <IslandSpriteCutout
                      src={spritesheet}
                      index={index}
                      total={islands.length}
                      className="w-full h-full"
                    />
                  </div>
                ) : null}

                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 rounded-lg">
                    <Lock className="w-6 h-6 text-white/90 drop-shadow" />
                  </div>
                )}

                {souvenir.unlocked && (
                  <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-amber-400 border border-white flex items-center justify-center shadow z-10">
                    <Gift className="w-2.5 h-2.5 text-amber-900" />
                  </span>
                )}

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[65%] h-2 rounded-full bg-white/35 blur-sm pointer-events-none" />
              </motion.div>

              <div
                className={`mt-1 w-full text-center px-1 py-1 rounded-lg backdrop-blur-sm border ${
                  isCurrent
                    ? "bg-amber-100/90 border-amber-300 text-amber-950"
                    : completed
                    ? "bg-emerald-50/90 border-emerald-100 text-slate-800"
                    : "bg-black/40 border-white/10 text-white"
                }`}
              >
                <p className="text-[9px] sm:text-[10px] leading-tight truncate" style={{ fontWeight: 800 }}>
                  {island.name}
                </p>
                <p className="text-[8px] opacity-70 truncate">{island.sublabel}</p>
                {unlocked && (
                  <p className="text-[8px] mt-0.5 flex items-center justify-center gap-0.5 opacity-80">
                    {islandProgress.completed}/{island.levelCount} 關
                    <ChevronRight className="w-2.5 h-2.5" />
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
