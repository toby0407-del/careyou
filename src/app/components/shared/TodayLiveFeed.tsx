/** 今日即時訓練動態 — 家屬端/醫師端即時看到患者今天完成了什麼 */
import { Star, Radio, Dumbbell } from "lucide-react";
import { useTodaySummary } from "../../hooks/useLiveProgress";

const THEMES = {
  family: {
    border: "border-rose-100",
    bg: "bg-white/85",
    live: "text-rose-400",
    chipBg: "bg-rose-50/80 border-rose-100",
    empty: "今天還沒有訓練紀錄，送個鼓勵讓他動起來吧！",
  },
  doctor: {
    border: "border-sky-100",
    bg: "bg-white/90",
    live: "text-sky-500",
    chipBg: "bg-sky-50/80 border-sky-100",
    empty: "患者今日尚未開始訓練",
  },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TodayLiveFeed({ variant }: { variant: "family" | "doctor" }) {
  const theme = THEMES[variant];
  const { todaySessions } = useTodaySummary();

  return (
    <div className={`flex items-center gap-3 rounded-2xl border ${theme.border} ${theme.bg} px-4 py-2.5 overflow-hidden`}>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="relative flex w-2.5 h-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-500" />
        </span>
        <Radio className={`w-4 h-4 ${theme.live}`} aria-hidden />
        <span className="text-slate-700 text-sm whitespace-nowrap" style={{ fontWeight: 700 }}>
          今日即時動態
        </span>
      </div>

      {todaySessions.length === 0 ? (
        <p className="text-slate-400 text-sm truncate">{theme.empty}</p>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {[...todaySessions].reverse().map((s, i) => (
            <div
              key={`${s.exerciseId}-${i}`}
              className={`flex items-center gap-2 border rounded-full pl-2.5 pr-3 py-1.5 flex-shrink-0 ${theme.chipBg}`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-slate-400" aria-hidden />
              <span className="text-slate-700 text-xs whitespace-nowrap" style={{ fontWeight: 700 }}>
                {formatTime(s.completedAt)} {s.exerciseName}
              </span>
              <span className="flex items-center gap-px" aria-label={`${s.stars} 顆星`}>
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={`w-3 h-3 ${
                      n <= s.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"
                    }`}
                  />
                ))}
              </span>
              <span className="text-emerald-600 text-xs whitespace-nowrap" style={{ fontWeight: 700 }}>
                品質 {s.quality}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
