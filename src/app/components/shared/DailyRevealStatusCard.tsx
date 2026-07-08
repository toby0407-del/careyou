/** 今日照片解鎖進度 — 家屬端 / 醫師端即時同步 */
import { Images, Lock, Sparkles } from "lucide-react";
import { useDailyReveal } from "../../hooks/useDailyReveal";

const THEMES = {
  family: {
    border: "border-rose-100",
    bg: "bg-gradient-to-r from-rose-50/90 to-pink-50/60",
    accent: "#f43f5e",
    text: "text-rose-500",
    chip: "bg-white/80 border-rose-100",
  },
  doctor: {
    border: "border-sky-100",
    bg: "bg-gradient-to-r from-sky-50/90 to-blue-50/60",
    accent: "#0ea5e9",
    text: "text-sky-500",
    chip: "bg-white/80 border-sky-100",
  },
  patient: {
    border: "border-teal-50",
    bg: "bg-gradient-to-r from-teal-50/90 to-emerald-50/60",
    accent: "#5eead4",
    text: "text-teal-300",
    chip: "bg-white/80 border-teal-50",
  },
};

export function DailyRevealStatusCard({
  variant,
  compact = false,
}: {
  variant: "family" | "doctor" | "patient";
  compact?: boolean;
}) {
  const theme = THEMES[variant];
  const { slots, unlockedCount, total, photoPoolSize } = useDailyReveal();

  if (total === 0) return null;

  return (
    <div
      className={`rounded-2xl border ${theme.border} ${theme.bg} ${compact ? "px-4 py-3" : "px-5 py-4"}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-2xl bg-white/90 flex items-center justify-center shadow-sm flex-shrink-0`}
          >
            <Images className={`${compact ? "w-5 h-5" : "w-6 h-6"} ${theme.text}`} />
          </div>
          <div className="min-w-0">
            <p className="text-slate-800 text-sm" style={{ fontWeight: 800 }}>
              今日回憶解鎖牆
            </p>
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              {total} 個關卡藏了 {total} 張照片 · 相簿共 {photoPoolSize} 張
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`${compact ? "w-24" : "w-32"} h-2.5 bg-white/70 rounded-full overflow-hidden`}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${total > 0 ? (unlockedCount / total) * 100 : 0}%`,
                background: theme.accent,
              }}
            />
          </div>
          <span className={`${theme.text} text-sm tabular-nums whitespace-nowrap`} style={{ fontWeight: 800 }}>
            {unlockedCount}/{total} 已解鎖
          </span>
        </div>
      </div>

      {!compact && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "thin" }}>
          {slots.map((slot) => (
            <div
              key={slot.levelId}
              className={`flex-shrink-0 w-14 h-[72px] rounded-xl border overflow-hidden relative ${theme.chip}`}
              title={slot.unlocked ? `第 ${slot.levelNo} 關已解鎖` : `完成「${slot.levelName}」解鎖`}
            >
              {slot.photo.imageUrl ? (
                <img
                  src={slot.photo.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: slot.unlocked ? "blur(0)" : "blur(10px) saturate(0.5)",
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-slate-200" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                {slot.unlocked ? (
                  <Sparkles className="w-4 h-4 text-white drop-shadow" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-white/90 drop-shadow" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
