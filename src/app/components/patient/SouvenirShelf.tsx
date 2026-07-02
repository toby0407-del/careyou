import { motion } from "motion/react";
import { Gift, Lock, ArrowLeft } from "lucide-react";
import {
  chapters,
  getAllIslandSouvenirs,
  getUnlockedSouvenirCount,
  type IslandSouvenir,
} from "../../data/chapters";

function SouvenirCard({ souvenir }: { souvenir: IslandSouvenir }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3 flex flex-col h-full relative overflow-hidden ${
        souvenir.unlocked
          ? "bg-white border-amber-200 shadow-sm"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="absolute top-2 right-2">
        {souvenir.unlocked ? (
          <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 700 }}>
            已獲得
          </span>
        ) : (
          <Lock className="w-3.5 h-3.5 text-slate-300" />
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2 ${
          souvenir.unlocked ? "bg-amber-50" : "bg-slate-100 grayscale opacity-50"
        }`}
      >
        {souvenir.emoji}
      </div>

      <h3
        className={`text-xs leading-tight ${
          souvenir.unlocked ? "text-slate-800" : "text-slate-400"
        }`}
        style={{ fontWeight: 800 }}
      >
        {souvenir.name}
      </h3>
      <p className="text-[10px] text-slate-400 mt-0.5">{souvenir.islandName}</p>
      <p className="text-[9px] text-slate-400">{souvenir.chapterName}</p>
      <p
        className={`text-[10px] mt-1.5 line-clamp-2 leading-snug flex-1 ${
          souvenir.unlocked ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {souvenir.description}
      </p>
    </motion.div>
  );
}

interface SouvenirShelfProps {
  onBack?: () => void;
  embedded?: boolean;
}

export function SouvenirShelf({ onBack, embedded }: SouvenirShelfProps) {
  const allSouvenirs = getAllIslandSouvenirs();
  const unlocked = getUnlockedSouvenirCount();

  return (
    <div className={`flex flex-col h-full gap-3 overflow-y-auto ${embedded ? "" : "pb-2"}`}>
      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <Gift className="w-7 h-7 text-amber-500" />
          <div>
            <p className="text-slate-800 text-lg leading-tight" style={{ fontWeight: 800 }}>
              冒險戰利品
            </p>
            <p className="text-slate-500 text-sm">
              每座島通關 10 關獲獎 · {unlocked}/{allSouvenirs.length} 已收集
            </p>
          </div>
        </div>
      </div>

      {chapters.map((chapter) => {
        const chapterSouvenirs = allSouvenirs.filter((s) => s.chapterId === chapter.id);
        const chapterUnlocked = chapterSouvenirs.filter((s) => s.unlocked).length;

        return (
          <div key={chapter.id} className="flex-shrink-0 px-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-white shadow"
                style={{ background: chapter.accent }}
              >
                {chapter.icon}
              </div>
              <div>
                <p className="text-sm text-slate-800" style={{ fontWeight: 800 }}>
                  {chapter.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {chapterUnlocked}/{chapterSouvenirs.length} 件戰利品
                </p>
              </div>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full ml-2 overflow-hidden max-w-[120px]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${chapterSouvenirs.length ? (chapterUnlocked / chapterSouvenirs.length) * 100 : 0}%`,
                    background: chapter.accent,
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {chapterSouvenirs.map((s) => (
                <SouvenirCard key={s.id} souvenir={s} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
