import { ArrowLeft, Gift } from "lucide-react";
import {
  getChapterById,
  getChapterProgress,
  getUnlockedSouvenirCount,
  getAllIslandSouvenirs,
} from "../../data/chapters";
import { ChapterBackdrop } from "./ChapterBackdrop";
import { IslandMarker } from "./IslandMarker";

interface ChapterWorldMapProps {
  chapterId: string;
  onBack: () => void;
  onSelectIsland: (islandId: string) => void;
}

export function ChapterWorldMap({ chapterId, onBack, onSelectIsland }: ChapterWorldMapProps) {
  const chapter = getChapterById(chapterId)!;
  const progress = getChapterProgress(chapterId);
  const souvenirs = getAllIslandSouvenirs().filter((s) => s.chapterId === chapterId);
  const earned = souvenirs.filter((s) => s.unlocked).length;

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden pb-1">
      <div className="flex items-center gap-3 flex-shrink-0 px-1">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 text-lg truncate" style={{ fontWeight: 800 }}>
            第 {chapter.index} 章 · {chapter.name}
          </p>
          <p className="text-slate-500 text-sm truncate">
            {chapter.islands.length} 座浮島 · {progress.completed}/{progress.total} 關
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs" style={{ fontWeight: 700 }}>
          <Gift className="w-3.5 h-3.5" />
          {earned}/{souvenirs.length}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <ChapterBackdrop chapter={chapter} />

        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            {chapter.islands.slice(0, -1).map((island, i) => {
              const next = chapter.islands[i + 1];
              return (
                <path
                  key={island.id}
                  d={`M ${island.position.x} ${island.position.y - 6} Q ${(island.position.x + next.position.x) / 2} ${Math.min(island.position.y, next.position.y) - 14} ${next.position.x} ${next.position.y - 6}`}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.35"
                  strokeDasharray="1.5 1.5"
                />
              );
            })}
          </svg>

          {chapter.islands.map((island, index) => (
            <IslandMarker
              key={island.id}
              chapterId={chapterId}
              island={island}
              index={index}
              onSelect={() => onSelectIsland(island.id)}
            />
          ))}
        </div>

        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <p className="text-center text-[11px] text-white/85 bg-black/35 backdrop-blur-sm rounded-lg py-2 px-3 border border-white/10">
            點擊浮島進入 <strong>10 個復健副本</strong> · 通關整座島獲得戰利品箱
          </p>
        </div>
      </div>
    </div>
  );
}
