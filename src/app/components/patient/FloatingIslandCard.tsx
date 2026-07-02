import { motion } from "motion/react";
import { Lock, Gift } from "lucide-react";
import {
  getChapterById,
  getIslandProgress,
  getIslandSouvenir,
  isIslandCompleted,
  isIslandUnlocked,
  type ChapterIsland,
} from "../../data/chapters";
import { IslandSceneSvg, islandVariantForIndex } from "./IslandSceneSvg";

interface FloatingIslandCardProps {
  chapterId: string;
  island: ChapterIsland;
  index: number;
  isCurrent?: boolean;
  onSelect: () => void;
}

/** 橫向排列的浮空島嶼卡片（程式繪製） */
export function FloatingIslandCard({
  chapterId,
  island,
  index,
  isCurrent,
  onSelect,
}: FloatingIslandCardProps) {
  const chapter = getChapterById(chapterId)!;
  const unlocked = isIslandUnlocked(chapterId, island.id);
  const progress = getIslandProgress(chapterId, island.id);
  const souvenir = getIslandSouvenir(chapterId, island.id);
  const completed = isIslandCompleted(chapterId, island.id);
  const floatOffset = index % 2 === 0 ? 0 : -8;

  return (
    <motion.button
      type="button"
      disabled={!unlocked}
      onClick={() => unlocked && onSelect()}
      className={`relative flex-1 min-w-0 max-w-[32%] flex flex-col items-center ${
        unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-55"
      }`}
      style={{ marginBottom: floatOffset }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={unlocked ? { y: -4, scale: 1.03 } : {}}
    >
      {isCurrent && (
        <span
          className="mb-0.5 text-[9px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full border border-white shadow z-10"
          style={{ fontWeight: 800 }}
        >
          你在這裡
        </span>
      )}

      <motion.div
        animate={unlocked ? { y: [0, -6, 0] } : {}}
        transition={{ duration: 3.5 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full aspect-[4/3] max-h-[min(24vh,130px)]"
      >
        <div
          className={`absolute inset-0 rounded-xl overflow-hidden border-2 shadow-lg ${
            isCurrent
              ? "border-amber-300 ring-2 ring-amber-300/50"
              : completed
              ? "border-amber-200"
              : "border-white/70"
          }`}
          style={{ background: `${chapter.accent}22` }}
        >
          <IslandSceneSvg variant={islandVariantForIndex(index)} />

          {!unlocked && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white/90" />
            </div>
          )}

          {souvenir.unlocked && (
            <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-amber-400 border border-white flex items-center justify-center">
              <Gift className="w-3 h-3 text-amber-900" />
            </span>
          )}

          <span
            className="absolute bottom-1 left-1 text-[9px] text-white bg-black/45 px-1.5 py-0.5 rounded-full"
            style={{ fontWeight: 800 }}
          >
            {island.levelCount} 關
          </span>
        </div>

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[75%] h-2 rounded-full bg-white/50 blur-sm" />
      </motion.div>

      <div className="mt-1.5 w-full text-center px-1 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/15">
        <p className="text-[10px] text-white leading-tight truncate" style={{ fontWeight: 800 }}>
          {island.name}
        </p>
        <p className="text-[8px] text-white/70 truncate">{island.sublabel}</p>
        {unlocked && (
          <>
            <div className="h-0.5 bg-white/20 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="text-[8px] text-white/80 mt-0.5">
              {progress.completed}/{progress.total} 關
            </p>
          </>
        )}
      </div>
    </motion.button>
  );
}
