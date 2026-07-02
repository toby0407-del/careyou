import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Lock, CheckCircle2, Calendar, Sparkles } from "lucide-react";
import {
  milestones,
  milestoneCategories,
  type MilestoneCategory,
} from "../../data/milestones";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

const CATEGORY_THEME: Record<
  MilestoneCategory,
  { text: string; bg: string; iconBg: string; progress: string }
> = {
  streak: {
    text: "text-orange-600",
    bg: "bg-orange-50",
    iconBg: "bg-white",
    progress: "from-orange-400 to-amber-400",
  },
  level: {
    text: "text-teal-600",
    bg: "bg-teal-50",
    iconBg: "bg-white",
    progress: "from-teal-400 to-emerald-400",
  },
  quality: {
    text: "text-blue-600",
    bg: "bg-blue-50",
    iconBg: "bg-white",
    progress: "from-sky-400 to-blue-400",
  },
  recovery: {
    text: "text-rose-600",
    bg: "bg-rose-50",
    iconBg: "bg-white",
    progress: "from-rose-400 to-pink-400",
  },
  special: {
    text: "text-pink-600",
    bg: "bg-pink-50",
    iconBg: "bg-white",
    progress: "from-pink-400 to-fuchsia-400",
  },
};

function MilestoneCard({
  milestone,
  onOpen,
}: {
  milestone: (typeof milestones)[0];
  onOpen: () => void;
}) {
  const Icon = milestone.icon;
  const theme = CATEGORY_THEME[milestone.category];
  const pct = Math.min(100, Math.round((milestone.current / milestone.target) * 100));
  const progressLabel = `${milestone.current}/${milestone.target}${milestone.unit}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${theme.bg} milestone-card rounded-2xl border p-3 flex flex-col h-full relative overflow-hidden ${
        milestone.unlocked ? "border-emerald-200" : "border-slate-200"
      } text-left hover:shadow-sm transition-all`}
    >
      <div className="absolute top-3 right-3">
        {milestone.unlocked ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-slate-300" />
        )}
      </div>

      <div className="flex items-start gap-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: milestone.unlocked ? "white" : "rgba(255,255,255,0.72)" }}
        >
          <Icon className={`w-5 h-5 ${theme.text}`} />
        </div>
        <div className="min-w-0 flex-1 pr-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                milestone.unlocked ? "bg-white/90 text-emerald-600" : "bg-white/70 text-slate-500"
              }`}
              style={{ fontWeight: 700 }}
            >
              {milestone.unlocked ? "已解鎖" : "進行中"}
            </span>
          </div>
          <h3 className={`milestone-title ${theme.text} leading-tight mt-1`} style={{ fontWeight: 800 }}>
            {milestone.title}
          </h3>
          <p className="milestone-progress text-slate-800 mt-1" style={{ fontWeight: 800 }}>
            {progressLabel}
          </p>
        </div>
      </div>

      {!milestone.unlocked && (
        <div className="mt-3">
          <div className="h-2 bg-white/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.progress}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
            <span>完成度</span>
            <span style={{ fontWeight: 700 }}>{pct}%</span>
          </div>
        </div>
      )}

      <div className="mt-auto pt-2 flex justify-end">
        <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
      </div>
    </button>
  );
}

export function PatientMilestones() {
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | "all" | "locked">("locked");
  const [selectedMilestone, setSelectedMilestone] = useState<(typeof milestones)[0] | null>(null);
  const [lockedPage, setLockedPage] = useState(0);

  const filtered =
    activeCategory === "all"
      ? milestones.filter((m) => m.unlocked)
      : activeCategory === "locked"
      ? milestones.filter((m) => !m.unlocked)
      : milestones.filter((m) => m.category === activeCategory && m.unlocked);
  const lockedMilestones = milestones.filter((m) => !m.unlocked).slice(0, 20);
  const lockedPageSize = 8;
  const lockedPageCount = Math.ceil(lockedMilestones.length / lockedPageSize);
  const visibleMilestones =
    activeCategory === "locked"
      ? lockedMilestones.slice(
          lockedPage * lockedPageSize,
          lockedPage * lockedPageSize + lockedPageSize
        )
      : filtered;
  const gridClassName =
    activeCategory === "locked"
      ? "grid-cols-4 auto-rows-[minmax(148px,1fr)]"
      : "grid-cols-4 auto-rows-[minmax(148px,1fr)]";

  return (
    <div className="patient-milestones-ui h-full flex flex-col gap-3 overflow-hidden">
      <div className="flex gap-2 pb-1 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => {
            setActiveCategory("all");
            setLockedPage(0);
          }}
          className={`px-4 py-2 rounded-full milestone-chip flex-shrink-0 transition-all ${
            activeCategory === "all"
              ? "bg-teal-600 text-white"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
          style={{ fontWeight: 700 }}
        >
          全部
        </button>
        <button
          onClick={() => {
            setActiveCategory("locked");
            setLockedPage(0);
          }}
          className={`px-4 py-2 rounded-full milestone-chip flex-shrink-0 transition-all ${
            activeCategory === "locked"
              ? "bg-teal-600 text-white"
              : "bg-white text-slate-600 border border-slate-200"
          }`}
          style={{ fontWeight: 700 }}
        >
          未完成
        </button>
        {milestoneCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setLockedPage(0);
            }}
            className={`px-4 py-2 rounded-full milestone-chip flex-shrink-0 transition-all ${
              activeCategory === cat.id
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
            style={{ fontWeight: 700 }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {activeCategory === "locked" && lockedPageCount > 1 && (
        <div className="flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-500">
            未完成成就 {lockedMilestones.length} 項
          </p>
          <div className="flex items-center gap-2">
            {Array.from({ length: lockedPageCount }).map((_, page) => (
              <button
                key={page}
                type="button"
                onClick={() => setLockedPage(page)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  lockedPage === page
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
                style={{ fontWeight: 700 }}
              >
                {page * lockedPageSize + 1}-{Math.min((page + 1) * lockedPageSize, lockedMilestones.length)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`flex-1 min-h-0 grid ${gridClassName} gap-3 overflow-hidden content-start`}>
        {visibleMilestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            onOpen={() => setSelectedMilestone(m)}
          />
        ))}
      </div>

      <Dialog open={!!selectedMilestone} onOpenChange={(open) => !open && setSelectedMilestone(null)}>
        {selectedMilestone && (
          <DialogContent className="sm:max-w-xl rounded-3xl border-teal-100 p-0 overflow-hidden">
            <div className={`${CATEGORY_THEME[selectedMilestone.category].bg} px-6 py-5 border-b border-white/60`}>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-4 pr-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center flex-shrink-0">
                    <selectedMilestone.icon className={`w-7 h-7 ${CATEGORY_THEME[selectedMilestone.category].text}`} />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className={`text-xl ${CATEGORY_THEME[selectedMilestone.category].text}`} style={{ fontWeight: 800 }}>
                      {selectedMilestone.title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 mt-1">
                      {selectedMilestone.unlocked ? "已解鎖成就" : "尚未解鎖成就"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-slate-400 text-xs">目前進度</p>
                  <p className="text-slate-800 text-lg mt-1" style={{ fontWeight: 800 }}>
                    {selectedMilestone.current}/{selectedMilestone.target}
                    <span className="text-sm ml-1">{selectedMilestone.unit}</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-slate-400 text-xs">狀態</p>
                  <p
                    className={`text-lg mt-1 ${selectedMilestone.unlocked ? "text-emerald-600" : "text-amber-600"}`}
                    style={{ fontWeight: 800 }}
                  >
                    {selectedMilestone.unlocked ? "已解鎖" : "進行中"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-slate-400 text-xs">完成度</p>
                  <p className="text-teal-600 text-lg mt-1" style={{ fontWeight: 800 }}>
                    {Math.min(100, Math.round((selectedMilestone.current / selectedMilestone.target) * 100))}%
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">獲取原因 / 達成條件</p>
                    <p className="text-slate-800 text-sm mt-1 leading-relaxed" style={{ fontWeight: 600 }}>
                      {selectedMilestone.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">獎勵內容</p>
                    <p className="text-slate-800 text-sm mt-1 leading-relaxed" style={{ fontWeight: 600 }}>
                      {selectedMilestone.reward}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">獲取日期</p>
                    <p className="text-slate-800 text-sm mt-1 leading-relaxed" style={{ fontWeight: 600 }}>
                      {selectedMilestone.unlockedDate
                        ? selectedMilestone.unlockedDate.replaceAll("-", "/")
                        : "尚未解鎖，達成條件後會顯示日期"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
