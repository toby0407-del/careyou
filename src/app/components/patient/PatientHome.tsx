import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
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
} from "lucide-react";
import { ChatWidget } from "../shared/ChatWidget";
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
import { TimeGalleryComingSoon } from "../shared/TimeGalleryComingSoon";
import { allExercises } from "../../data/patientExercises";

type Tab = "tasks" | "results" | "milestones" | "gallery";

const tabs: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: "tasks", label: "復健項目", icon: Dumbbell },
  { id: "results", label: "復健結果", icon: BarChart3 },
  { id: "milestones", label: "里程碑", icon: Trophy },
  { id: "gallery", label: "時光迴廊", icon: Images },
];

const totalExercises = allExercises.length;
const completedExercises = allExercises.filter((e) => e.completed).length;
const progressPct = Math.round((completedExercises / totalExercises) * 100);

const STREAK_DAYS = 12;

function StreakStar({ days, large = false }: { days: number; large?: boolean }) {
  const digits = String(days).length;
  return (
    <div className={`relative flex-shrink-0 ${large ? "w-16 h-16" : "w-11 h-11"}`}>
      <Star
        className="absolute inset-0 w-full h-full text-amber-400 fill-amber-400 drop-shadow-sm"
        strokeWidth={1.5}
      />
      <span
        className={`absolute inset-0 flex items-center justify-center text-white leading-none pt-0.5 ${
          large ? (digits >= 2 ? "text-lg" : "text-xl") : digits >= 2 ? "text-sm" : "text-base"
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
  const isMilestonesTab = activeTab === "milestones";
  const [profileOpen, setProfileOpen] = useState(false);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  const patientProfile = getPatientProfile(DEFAULT_PATIENT_ID)!;
  const now = useMemo(() => new Date(), []);
  const currentHour = now.getHours();
  const greeting = currentHour < 11 ? "早安" : currentHour < 18 ? "午安" : "晚安";
  const todayLabel = now.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="patient-large-text h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r from-teal-600 to-emerald-600 px-5 ${isMilestonesTab ? "py-2.5" : "py-3"} relative overflow-hidden flex-shrink-0`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-white/20" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className="w-11 h-11 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-teal-100 text-sm">{todayLabel}</p>
                <h1 className="text-white text-2xl" style={{ fontWeight: 800 }}>
                  {greeting}，{patientProfile.name}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setStreakInfoOpen(true)}
                className="rounded-2xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/60"
                aria-label="查看連續天數說明"
                title="查看連續天數說明"
              >
                <StreakStar days={STREAK_DAYS} large />
              </button>
            </div>
          </div>

          {/* 4-tab switcher */}
          <div className="flex bg-white/15 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-white/90 hover:text-white"
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2 border border-white/15">
              <Award className="w-6 h-6 text-amber-300" />
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                  {progressPct}% 今日進度
                </p>
                <div className="w-28 h-2 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-amber-300 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
            <NotificationBell
              variant="patient"
              buttonClassName="w-11 h-11 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center relative"
              iconClassName="w-5 h-5 text-white"
              badgeClassName="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full"
            />
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="w-11 h-11 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="查看個人資料"
              title="個人資料"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className={`flex items-center ${isMilestonesTab ? "gap-6 px-4 py-2.5" : "gap-10 px-5 py-3.5"} bg-white border-b border-slate-100 flex-shrink-0`}>
        <div className={`flex items-center ${isMilestonesTab ? "gap-2 text-base" : "gap-2.5 text-lg"} text-slate-700`}>
          <Clock className={`${isMilestonesTab ? "w-5 h-5" : "w-6 h-6"} text-slate-400`} />
          <span style={{ fontWeight: 600 }}>預計 47 分鐘</span>
        </div>
        <div className={`flex items-center ${isMilestonesTab ? "gap-2 text-base" : "gap-2.5 text-lg"} text-slate-700`}>
          <CheckCircle2 className={`${isMilestonesTab ? "w-5 h-5" : "w-6 h-6"} text-emerald-500`} />
          <span style={{ fontWeight: 600 }}>{completedExercises}/{totalExercises} 項完成</span>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isMilestonesTab ? "px-3 py-2 pb-2" : "px-4 py-3 pb-4"}`}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === "tasks" && <LevelMap />}
          {activeTab === "results" && <PatientResults />}
          {activeTab === "milestones" && <PatientMilestones />}
          {activeTab === "gallery" && <TimeGalleryComingSoon variant="patient" patientName={patientProfile.name} />}
        </motion.div>
      </div>

      <ChatWidget
        accentColor="bg-teal-500"
        accentBg="bg-teal-50"
        portalLabel="復健客服支援"
        textScaleClass="patient-large-text patient-chat-panel"
      />

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
                <StreakStar days={STREAK_DAYS} />
                <div>
                  <DialogTitle className="text-white text-xl" style={{ fontWeight: 800 }}>
                    連續 {STREAK_DAYS} 天
                  </DialogTitle>
                  <DialogDescription className="text-teal-50 mt-1">
                    星星上的數字代表你的連續復健天數
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-2xl bg-teal-50 border border-teal-100 px-4 py-3">
              <p className="text-slate-800 text-base" style={{ fontWeight: 700 }}>
                什麼是連續天數？
              </p>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                只要你當天有完成至少一項復健訓練，就會累積一天。像現在的
                <span className="text-teal-600" style={{ fontWeight: 700 }}> {STREAK_DAYS} </span>
                天，表示你已經連續 {STREAK_DAYS} 天都有持續做復健。
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                <p className="text-slate-400 text-xs">目前紀錄</p>
                <p className="text-amber-500 text-lg mt-1" style={{ fontWeight: 800 }}>
                  {STREAK_DAYS} 天
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                <p className="text-slate-400 text-xs">今天狀態</p>
                <p className="text-emerald-500 text-lg mt-1" style={{ fontWeight: 800 }}>
                  已累積
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                <p className="text-slate-400 text-xs">中斷條件</p>
                <p className="text-rose-500 text-lg mt-1" style={{ fontWeight: 800 }}>
                  一天未做
                </p>
              </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed">
              持續連續訓練有助於建立復健習慣，也會讓里程碑和獎勵累積得更快。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
