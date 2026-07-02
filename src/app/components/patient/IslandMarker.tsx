import { motion } from "motion/react";
import { Lock, ChevronRight, Gift } from "lucide-react";
import {
  getChapterById,
  getIslandProgress,
  getIslandSouvenir,
  isIslandCompleted,
  isIslandUnlocked,
  type ChapterIsland,
} from "../../data/chapters";

interface IslandMarkerProps {
  chapterId: string;
  island: ChapterIsland;
  onSelect: () => void;
  index: number;
  isCurrent?: boolean;
}

/** 簡潔遊戲 UI 浮島節點（非 AI 插畫） */
export function IslandMarker({ chapterId, island, onSelect, index, isCurrent }: IslandMarkerProps) {
  const chapter = getChapterById(chapterId)!;
  const unlocked = isIslandUnlocked(chapterId, island.id);
  const progress = getIslandProgress(chapterId, island.id);
  const souvenir = getIslandSouvenir(chapterId, island.id);
  const completed = isIslandCompleted(chapterId, island.id);
  const size = Math.round(88 * island.scale);

  return (
    <motion.button
      type="button"
      disabled={!unlocked}
      onClick={() => unlocked && onSelect()}
      className={`absolute -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center ${
        unlocked ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      }`}
      style={{ left: `${island.position.x}%`, top: `${island.position.y}%` }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      whileHover={unlocked ? { scale: 1.05 } : {}}
    >
      <motion.div
        animate={unlocked ? { y: [0, -5, 0] } : {}}
        transition={unlocked ? { duration: 3 + index * 0.2, repeat: Infinity, ease: "easeInOut" } : {}}
        className="relative flex flex-col items-center"
      >
        <div
          className="absolute -bottom-2 w-[90%] h-3 rounded-full bg-black/20 blur-sm"
          style={{ transform: "scaleY(0.5)" }}
        />

        <div
          className={`relative rounded-full border-[3px] flex flex-col items-center justify-center shadow-lg ${
            isCurrent
              ? "border-amber-300 ring-4 ring-amber-300/60"
              : completed
              ? "border-amber-300"
              : unlocked
              ? "border-white/90"
              : "border-slate-400"
          }`}
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 35% 30%, ${chapter.accent}ee, ${chapter.accent}99)`,
            boxShadow: unlocked ? `0 12px 32px ${chapter.accent}55` : undefined,
          }}
        >
          <span className="text-2xl leading-none">{chapter.icon}</span>
          <span className="text-[10px] text-white mt-0.5" style={{ fontWeight: 800 }}>
            {island.levelCount}關
          </span>

          {!unlocked && (
            <div className="absolute inset-0 rounded-full bg-slate-900/45 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          )}

          {souvenir.unlocked && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs">
              <Gift className="w-3 h-3 text-amber-900" />
            </span>
          )}

          {isCurrent && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full border border-white shadow" style={{ fontWeight: 800 }}>
              你在這裡
            </span>
          )}
        </div>

        <div className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900/75 backdrop-blur-sm border border-white/15 text-center min-w-[108px]">
          <p className="text-xs text-white" style={{ fontWeight: 800 }}>
            {island.name}
          </p>
          <p className="text-[9px] text-white/70">{island.sublabel}</p>
          {unlocked && (
            <>
              <div className="h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="text-[9px] text-white/80 mt-0.5 flex items-center justify-center gap-0.5">
                {progress.completed}/{progress.total}
                <ChevronRight className="w-3 h-3" />
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.button>
  );
}
