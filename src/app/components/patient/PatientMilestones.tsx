import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { Trophy, Lock, CheckCircle2, Calendar, Sparkles } from "lucide-react";
import {
  getLiveMilestones,
  milestones,
  type MilestoneCategory,
} from "../../data/milestones";
import { subscribeProgress } from "../../data/progressStore";
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
    text: "text-teal-300",
    bg: "bg-teal-50",
    iconBg: "bg-white",
    progress: "from-teal-200 to-emerald-200",
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

const GRID_COLS = 4;
const GRID_GAP_PX = 12;
const CARD_HEIGHT_PX = 172;

function useMilestonePageLayout(scrollRef: RefObject<HTMLDivElement | null>) {
  const [layout, setLayout] = useState({ rows: 2, perPage: GRID_COLS * 2 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const height = el.clientHeight;
      const rows = Math.max(1, Math.floor((height + GRID_GAP_PX) / (CARD_HEIGHT_PX + GRID_GAP_PX)));
      setLayout({ rows, perPage: GRID_COLS * rows });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef]);

  return layout;
}

function chunkMilestones<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages.length > 0 ? pages : [[]];
}

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
      className={`${theme.bg} milestone-card rounded-2xl border p-3 flex flex-col relative overflow-hidden ${
        milestone.unlocked ? "border-emerald-100" : "border-slate-200"
      } text-left hover:shadow-sm transition-all w-full`}
      style={{ height: CARD_HEIGHT_PX, minHeight: CARD_HEIGHT_PX, maxHeight: CARD_HEIGHT_PX }}
    >
      <div className="absolute top-3 right-3">
        {milestone.unlocked ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
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
                milestone.unlocked ? "bg-white/90 text-emerald-300" : "bg-white/70 text-slate-500"
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

      {!milestone.unlocked ? (
        <div className="mt-3 flex-shrink-0">
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
      ) : (
        <div className="mt-3 flex-shrink-0 h-[26px]" aria-hidden />
      )}

      <div className="mt-auto pt-2 flex justify-end">
        <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
      </div>
    </button>
  );
}

type MilestoneFilter = "completed" | "locked";

function MilestoneLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 ml-auto flex-shrink-0">
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
        已完成
      </span>
      <span className="flex items-center gap-1">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        未完成
      </span>
      <span className="flex items-center gap-1">
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
        獎勵
      </span>
      <span className="flex items-center gap-1">
        <span className="w-8 h-1.5 rounded-full bg-gradient-to-r from-teal-200 to-emerald-200" />
        進度
      </span>
    </div>
  );
}

let milestoneVersion = 0;

export function PatientMilestones() {
  const [activeFilter, setActiveFilter] = useState<MilestoneFilter>("locked");
  const [selectedMilestone, setSelectedMilestone] = useState<(typeof milestones)[0] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { rows, perPage } = useMilestonePageLayout(scrollRef);

  // 訂閱進度更新 → 里程碑即時反映（連續天數 / 關卡 / 標準動作）
  const version = useSyncExternalStore(
    (listener) => subscribeProgress(() => {
      milestoneVersion += 1;
      listener();
    }),
    () => milestoneVersion
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const liveMilestones = useMemo(() => getLiveMilestones(), [version]);

  const sourceList =
    activeFilter === "locked"
      ? liveMilestones.filter((m) => !m.unlocked)
      : liveMilestones.filter((m) => m.unlocked);

  const pages = useMemo(() => chunkMilestones(sourceList, perPage), [sourceList, perPage]);

  const switchFilter = (filter: MilestoneFilter) => {
    setActiveFilter(filter);
    scrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [perPage]);

  return (
    <div className="patient-milestones-ui h-full flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center gap-2 pb-1 flex-shrink-0 flex-wrap">
        <button
          onClick={() => switchFilter("completed")}
          className={`px-4 py-2 rounded-full milestone-chip flex-shrink-0 transition-all ${
            activeFilter === "completed"
              ? "bg-teal-300 text-white"
              : "bg-white/80 text-emerald-800 border border-emerald-50"
          }`}
          style={{ fontWeight: 700 }}
        >
          已完成
        </button>
        <button
          onClick={() => switchFilter("locked")}
          className={`px-4 py-2 rounded-full milestone-chip flex-shrink-0 transition-all ${
            activeFilter === "locked"
              ? "bg-teal-300 text-white"
              : "bg-white/80 text-emerald-800 border border-emerald-50"
          }`}
          style={{ fontWeight: 700 }}
        >
          未完成
        </button>
        <MilestoneLegend />
      </div>

      <p className="text-[10px] text-slate-400 flex-shrink-0">
        {activeFilter === "locked" ? "未完成" : "已完成"}共 {sourceList.length} 項 · ← 左右滑動切換 →
      </p>

      <div
        ref={scrollRef}
        className="milestone-scroll flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth touch-pan-x"
      >
        {pages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className="snap-start snap-always flex-shrink-0 w-full h-full grid grid-cols-4 gap-3"
            style={{ gridTemplateRows: `repeat(${rows}, ${CARD_HEIGHT_PX}px)` }}
          >
            {pageItems.map((m) => (
              <MilestoneCard key={m.id} milestone={m} onOpen={() => setSelectedMilestone(m)} />
            ))}
            {pageItems.length < perPage &&
              Array.from({ length: perPage - pageItems.length }).map((_, i) => (
                <div
                  key={`pad-${pageIndex}-${i}`}
                  className="rounded-2xl border border-transparent pointer-events-none"
                  style={{ height: CARD_HEIGHT_PX }}
                  aria-hidden
                />
              ))}
          </div>
        ))}
      </div>

      <Dialog open={!!selectedMilestone} onOpenChange={(open) => !open && setSelectedMilestone(null)}>
        {selectedMilestone && (
          <DialogContent className="sm:max-w-xl rounded-3xl border-teal-50 p-0 overflow-hidden">
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
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-50 px-4 py-3">
                  <p className="text-slate-400 text-xs">目前進度</p>
                  <p className="text-slate-800 text-lg mt-1" style={{ fontWeight: 800 }}>
                    {selectedMilestone.current}/{selectedMilestone.target}
                    <span className="text-sm ml-1">{selectedMilestone.unit}</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-50 px-4 py-3">
                  <p className="text-slate-400 text-xs">狀態</p>
                  <p
                    className={`text-lg mt-1 ${selectedMilestone.unlocked ? "text-emerald-300" : "text-amber-600"}`}
                    style={{ fontWeight: 800 }}
                  >
                    {selectedMilestone.unlocked ? "已解鎖" : "進行中"}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-50 px-4 py-3">
                  <p className="text-slate-400 text-xs">完成度</p>
                  <p className="text-teal-300 text-lg mt-1" style={{ fontWeight: 800 }}>
                    {Math.min(100, Math.round((selectedMilestone.current / selectedMilestone.target) * 100))}%
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/85 border border-emerald-50 px-4 py-4 space-y-3">
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
