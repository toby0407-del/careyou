import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  User,
  Award,
  Clock,
  CheckCircle2,
  Star,
  Dumbbell,
  BarChart3,
  Trophy,
  Images,
  Heart,
  Volume2,
  X,
} from "lucide-react";
import { NotificationBell } from "../shared/NotificationBell";
import { PatientProfileDialog } from "../shared/PatientProfileDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DEFAULT_PATIENT_ID, getPatientProfile } from "../../data/patientProfiles";
import { LevelMap } from "./LevelMap";
import { PatientResults } from "./PatientResults";
import { PatientMilestones } from "./PatientMilestones";
import { TimeGallery } from "../shared/TimeGallery";
import { AiCompanionWidget } from "./AiCompanionWidget";
import { useLiveStreak, useTodaySummary } from "../../hooks/useLiveProgress";
import {
  getUnreadEncouragements,
  markEncouragementRead,
  subscribeEncouragements,
  type Encouragement,
} from "../../data/encouragements";
import { speak, getVoiceEnabled, isSpeechSupported } from "../../lib/speech";

type Tab = "tasks" | "results" | "milestones" | "gallery";

const tabs: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: "tasks", label: "復健", icon: Dumbbell },
  { id: "results", label: "結果", icon: BarChart3 },
  { id: "milestones", label: "里程碑", icon: Trophy },
  { id: "gallery", label: "迴廊", icon: Images },
];

function EncouragementBanner() {
  const [item, setItem] = useState<Encouragement | null>(
    () => getUnreadEncouragements()[0] ?? null
  );

  useEffect(
    () =>
      subscribeEncouragements(() => {
        setItem(getUnreadEncouragements()[0] ?? null);
      }),
    []
  );

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-3 bg-rose-50 border-b border-rose-100 px-4 py-2.5 flex-shrink-0 overflow-hidden"
        role="status"
      >
        <Heart className="w-5 h-5 text-rose-400 fill-rose-300 flex-shrink-0" aria-hidden />
        <p className="text-sm text-slate-700 min-w-0 truncate flex-1">
          <span className="text-rose-500" style={{ fontWeight: 800 }}>
            {item.from}
          </span>
          <span className="text-slate-400 mx-1.5">·</span>
          {item.message}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isSpeechSupported() && (
            <button
              type="button"
              onClick={() => getVoiceEnabled() && speak(`${item.from}說：${item.message}`, { interrupt: true })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-rose-200 text-rose-500 text-xs hover:bg-rose-100 transition-colors"
              style={{ fontWeight: 700 }}
              aria-label="播放家人的打氣語音"
            >
              <Volume2 className="w-3.5 h-3.5" />
              聽
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              markEncouragementRead(item.id);
              setItem(getUnreadEncouragements()[0] ?? null);
            }}
            className="w-8 h-8 rounded-full hover:bg-rose-100 flex items-center justify-center transition-colors"
            aria-label="關閉家人打氣"
          >
            <X className="w-4 h-4 text-rose-300" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StreakStar({ days }: { days: number }) {
  const digits = String(days).length;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <Star className="absolute inset-0 w-full h-full text-amber-400 fill-amber-400" strokeWidth={1.5} />
      <span
        className={`absolute inset-0 flex items-center justify-center text-white leading-none pt-0.5 ${
          digits >= 2 ? "text-lg" : "text-xl"
        }`}
        style={{ fontWeight: 800 }}
      >
        {days}
      </span>
    </div>
  );
}

export function PatientHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [profileOpen, setProfileOpen] = useState(false);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  const patientProfile = getPatientProfile(DEFAULT_PATIENT_ID)!;
  const summary = useTodaySummary();
  const streakDays = useLiveStreak();
  const { total: totalExercises, completed: completedExercises, progressPct } = summary;
  const now = useMemo(() => new Date(), []);
  const greeting = now.getHours() < 11 ? "早安" : now.getHours() < 18 ? "午安" : "晚安";

  const personalLine =
    summary.completed >= summary.total
      ? "今日全數完成 🌟"
      : summary.nextExercise
        ? `下一項：${summary.nextExercise.name}`
        : `${completedExercises}/${totalExercises} 項完成`;

  return (
    <div className="patient-large-text patient-shell h-screen flex flex-col overflow-hidden">
      {/* 精簡頂部列 */}
      <header className="patient-shell-header flex-shrink-0 border-b shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate("/")}
              className="w-12 h-12 rounded-xl bg-emerald-100/70 hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors border border-emerald-100"
              aria-label="返回首頁"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-slate-800 text-lg whitespace-nowrap" style={{ fontWeight: 800 }}>
                  {greeting}，{patientProfile.name}
                </h1>
                {activeTab !== "gallery" && activeTab !== "milestones" && (
                  <>
                    <span
                      className="flex items-center gap-1.5 bg-emerald-100/60 text-emerald-800 text-xs px-3 py-1.5 rounded-full whitespace-nowrap border border-emerald-100"
                      style={{ fontWeight: 600 }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {summary.remaining > 0 ? `預計 ${summary.estimatedMinutes} 分` : "已完成"}
                    </span>
                    <span
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                      style={{ fontWeight: 600 }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {completedExercises}/{totalExercises} 項
                    </span>
                    {summary.avgQualityToday != null && (
                      <span
                        className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                        style={{ fontWeight: 600 }}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-400" />
                        品質 {summary.avgQualityToday}
                      </span>
                    )}
                  </>
                )}
              </div>
              {activeTab === "gallery" || activeTab === "milestones" ? (
                <p className="text-slate-400 text-xs truncate mt-0.5">{personalLine}</p>
              ) : summary.nextExercise && summary.completed < summary.total ? (
                <p className="text-slate-400 text-xs truncate mt-0.5">下一項：{summary.nextExercise.name}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setStreakInfoOpen(true)}
              className="rounded-xl hover:bg-amber-50 p-2 transition-colors"
              aria-label="查看連續天數"
            >
              <StreakStar days={streakDays} />
            </button>

            <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-2.5 min-w-[9.5rem]">
              <div className="flex-1 h-3.5 bg-teal-100 rounded-full overflow-hidden min-w-[4.5rem]">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-teal-700 text-base tabular-nums min-w-[2.75rem] text-right" style={{ fontWeight: 800 }}>
                {progressPct}%
              </span>
            </div>

            <NotificationBell
              variant="patient"
              buttonClassName="w-14 h-14 rounded-2xl bg-emerald-100/70 hover:bg-emerald-100 flex items-center justify-center relative transition-colors border border-emerald-100"
              iconClassName="w-7 h-7 text-slate-600"
              badgeClassName="absolute top-2.5 right-2.5 w-3 h-3 bg-red-400 rounded-full ring-2 ring-white"
            />
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="w-14 h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 flex items-center justify-center transition-colors"
              aria-label="查看個人資料"
            >
              <User className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </header>

      <EncouragementBanner />

      {/* 主內容區 */}
      <main className="flex-1 min-h-0 px-3 pt-1 overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="h-full"
        >
          {activeTab === "tasks" && <LevelMap />}
          {activeTab === "results" && <PatientResults />}
          {activeTab === "milestones" && <PatientMilestones />}
          {activeTab === "gallery" && (
            <TimeGallery variant="patient" patientName={patientProfile.name} />
          )}
        </motion.div>
      </main>

      {/* 底部導覽 — 佔版面流，避免 fixed 被裁切 */}
      <nav
        className="patient-shell-nav flex-shrink-0 z-40 border-t shadow-[0_-2px_12px_rgba(16,185,129,0.06)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        role="tablist"
        aria-label="患者端主選單"
      >
        <div className="grid grid-cols-4 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={active}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
                  active ? "text-teal-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    active
                      ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                      : "bg-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] leading-tight" style={{ fontWeight: active ? 800 : 600 }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <AiCompanionWidget patientName={patientProfile.name} />

      <PatientProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={patientProfile}
        variant="patient"
      />

      <Dialog open={streakInfoOpen} onOpenChange={setStreakInfoOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-teal-100 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-5 text-white">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-4">
                <StreakStar days={streakDays} />
                <div>
                  <DialogTitle className="text-white text-xl" style={{ fontWeight: 800 }}>
                    連續 {streakDays} 天
                  </DialogTitle>
                  <DialogDescription className="text-teal-50 mt-1">
                    每天完成至少一項復健就會累積
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <p className="text-slate-600 text-sm leading-relaxed">
              持續訓練有助於恢復，也會讓時光迴廊解鎖更多珍貴回憶。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
