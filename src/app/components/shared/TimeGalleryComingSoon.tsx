import { motion } from "motion/react";
import { Images, Sparkles, Clock, Construction } from "lucide-react";
import { RehabCompanion } from "../patient/RehabCompanion";
import { companionByTab } from "../../data/companionMessages";

interface TimeGalleryComingSoonProps {
  variant: "patient" | "family";
  patientName?: string;
}

const accent = {
  patient: { main: "#7c3aed", soft: "#ede9fe", label: "患者端" },
  family: { main: "#f43f5e", soft: "#fce7f3", label: "家屬端" },
};

export function TimeGalleryComingSoon({
  variant,
  patientName = "王大明",
}: TimeGalleryComingSoonProps) {
  const theme = accent[variant];

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50/40">
      {/* Decorative lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-8 left-12 w-24 h-px bg-gradient-to-r from-violet-300/60 to-transparent" />
        <div className="absolute bottom-12 right-16 w-32 h-px bg-gradient-to-l from-teal-300/50 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-40 h-40 rounded-full border border-violet-200/40" />
        <div className="absolute bottom-1/4 left-1/5 w-28 h-28 rounded-full border border-teal-200/30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 text-center px-8 max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-6 h-6" style={{ color: theme.main }} />
          <Images className="w-7 h-7 text-slate-400" />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-5 border"
          style={{
            background: theme.soft,
            color: theme.main,
            borderColor: `${theme.main}22`,
            fontWeight: 600,
          }}
        >
          <Construction className="w-3.5 h-3.5" />
          待開發
        </div>

        <div className="mb-6 flex justify-center">
          <RehabCompanion
            pose={companionByTab.gallery.pose}
            bubble={companionByTab.gallery.bubble}
            title={companionByTab.gallery.title}
            message={companionByTab.gallery.message}
            layout="vertical"
            variant="card"
            size={160}
          />
        </div>

        <h2 className="text-2xl text-slate-800 mb-2" style={{ fontWeight: 800 }}>
          {patientName} 的時光迴廊
        </h2>

        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          此功能正在規劃中，將記錄復健里程碑與珍貴回憶，
          並與{variant === "patient" ? "家屬端" : "患者端"}即時同步。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-100">
            <Clock className="w-3.5 h-3.5" />
            里程碑長廊
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-100">
            📸 訓練回憶
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-100">
            👨‍👩‍👧 家人互動
          </span>
        </div>

        <p className="text-[10px] text-slate-400 mt-8">
          {theme.label} · 設計方案確認後將開放使用
        </p>
      </motion.div>
    </div>
  );
}
