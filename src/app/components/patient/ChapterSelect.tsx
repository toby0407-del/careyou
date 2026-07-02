import { motion } from "motion/react";
import { Lock, ChevronRight, Gift } from "lucide-react";
import {
  chapters,
  getChapterProgress,
  isChapterUnlocked,
  isChapterCompleted,
} from "../../data/chapters";

interface ChapterSelectProps {
  onSelectChapter: (chapterId: string) => void;
  onShowSouvenirs?: () => void;
}

export function ChapterSelect({ onSelectChapter, onShowSouvenirs }: ChapterSelectProps) {
  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden pb-1">
      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <div>
          <p className="text-slate-800 text-xl" style={{ fontWeight: 800 }}>
            復健冒險篇章
          </p>
          <p className="text-slate-500 text-sm">6 個世界 · 每座島 10 關副本 · 通關獲戰利品</p>
        </div>
        <button
          type="button"
          onClick={onShowSouvenirs}
          className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-800 hover:bg-amber-100"
          style={{ fontWeight: 700 }}
        >
          <Gift className="w-4 h-4" />
          戰利品
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3 pb-2">
          {chapters.map((ch, i) => {
            const unlocked = isChapterUnlocked(ch.id);
            const progress = getChapterProgress(ch.id);
            const done = isChapterCompleted(ch.id);

            return (
              <motion.button
                key={ch.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && onSelectChapter(ch.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative text-left rounded-2xl overflow-hidden border-2 min-h-[148px] transition-all ${
                  unlocked
                    ? "border-white shadow-lg hover:scale-[1.02] cursor-pointer"
                    : "border-slate-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="absolute inset-0" style={{ background: ch.gradient }} />
                <div className="absolute inset-0 bg-black/10" />

                <div className="relative p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-white/80 bg-black/25 px-2 py-0.5 rounded-full">
                      第 {ch.index} 章
                    </span>
                    {!unlocked && <Lock className="w-4 h-4 text-white/80" />}
                    {done && (
                      <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full" style={{ fontWeight: 800 }}>
                        已通關
                      </span>
                    )}
                  </div>

                  <span className="text-3xl mt-2">{ch.icon}</span>
                  <p className="text-white text-lg mt-1 leading-tight" style={{ fontWeight: 800 }}>
                    {ch.name}
                  </p>
                  <p className="text-white/75 text-xs mt-0.5 line-clamp-2">{ch.subtitle}</p>

                  <div className="mt-auto pt-3">
                    <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
                      {ch.islands.length} 座島 · 各 {ch.islands[0]?.levelCount ?? 10} 關 ·{" "}
                      {progress.completed}/{progress.total}
                      {unlocked && <ChevronRight className="w-3 h-3" />}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
