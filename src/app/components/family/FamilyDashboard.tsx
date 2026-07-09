import { useNavigate } from "react-router";
import { useMemo, useRef, useState } from "react";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  TrendingUp,
  Flame,
  Activity,
  MapPin,
  Sparkles,
  Send,
} from "lucide-react";
import { ChatWidget } from "../shared/ChatWidget";
import { NotificationBell } from "../shared/NotificationBell";
import { TimeGallery } from "../shared/TimeGallery";
import { PatientProfileDialog, ProfileAvatarButton } from "../shared/PatientProfileDialog";
import { AppointmentScheduleDialog } from "../shared/AppointmentScheduleDialog";
import { PatientAnalyticsPanel } from "../shared/PatientAnalyticsPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DEFAULT_PATIENT_ID, getPatientProfile } from "../../data/patientProfiles";
import {
  formatAppointmentShort,
  getAppointmentsForPatient,
  getNextAppointment,
} from "../../data/patientAppointments";
import { useLiveStreak, usePatientAnalytics, useTodaySummary } from "../../hooks/useLiveProgress";
import { sendEncouragement, ENCOURAGEMENT_PRESETS } from "../../data/encouragements";

type FamilyTab = "overview" | "corridor";

/** 傳送鼓勵對話框 — 訊息即時同步到患者端橫幅與時光迴廊 */
function EncouragementDialog({
  open,
  onClose,
  patientName,
}: {
  open: boolean;
  onClose: () => void;
  patientName: string;
}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendEncouragement({ from: "家人", relation: "家屬", message: trimmed });
    toast.success("打氣已送達！", {
      description: `${patientName}打開 App 就會看到你的鼓勵，還可以語音播放。`,
    });
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-3xl border-rose-100 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-400 to-pink-400 px-6 py-5 text-white">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white/60" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl" style={{ fontWeight: 800 }}>
                  給{patientName}打氣
                </DialogTitle>
                <DialogDescription className="text-rose-50 mt-1">
                  你的鼓勵會即時出現在他的復健畫面，還能語音播放給他聽
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ENCOURAGEMENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setMessage(preset);
                  textareaRef.current?.focus();
                }}
                className="px-3.5 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-500 text-sm hover:bg-rose-100 transition-colors text-left"
                style={{ fontWeight: 600 }}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="或寫下自己的話..."
              aria-label="輸入鼓勵訊息"
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-200 resize-none"
            />
            <button
              type="button"
              onClick={() => send(message)}
              disabled={!message.trim()}
              className="h-12 px-5 rounded-2xl bg-rose-400 text-white flex items-center gap-2 disabled:opacity-40 transition-opacity"
              style={{ fontWeight: 700 }}
              aria-label="送出鼓勵"
            >
              <Send className="w-4 h-4" />
              送出
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const familyTabs: { id: FamilyTab; label: string; icon: typeof Heart }[] = [
  { id: "overview", label: "監護總覽", icon: Heart },
  { id: "corridor", label: "時光迴廊", icon: Sparkles },
];

export function FamilyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FamilyTab>("overview");
  const [profileOpen, setProfileOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [encourageOpen, setEncourageOpen] = useState(false);
  const streakDays = useLiveStreak();
  const todaySummary = useTodaySummary();
  const patientProfile = getPatientProfile(DEFAULT_PATIENT_ID)!;
  const analytics = usePatientAnalytics(DEFAULT_PATIENT_ID);
  const nextAppointment = getNextAppointment(DEFAULT_PATIENT_ID);
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return getAppointmentsForPatient(DEFAULT_PATIENT_ID).filter(
      (appt) => parseISO(appt.datetime) >= now
    );
  }, []);

  return (
    <div className="portal-large-text rehab-app-shell bg-gradient-to-br from-rose-50/40 via-stone-50 to-sky-50/30 overflow-hidden flex flex-col">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-rose-100/80 shadow-sm">
        {/* Row 1 — 病患資訊與快捷狀態 */}
        <div className="px-6 py-3 border-b border-rose-50">
          <div className="rehab-content flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-11 h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center border border-rose-100 transition-colors flex-shrink-0"
                aria-label="返回首頁"
              >
                <ArrowLeft className="w-5 h-5 text-rose-400" />
              </button>

              <ProfileAvatarButton
                name={patientProfile.name}
                onClick={() => setProfileOpen(true)}
                showHint={false}
              />

              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="min-w-0 text-left rounded-xl bg-rose-50/50 border border-rose-100/50 shadow-[0_2px_10px_rgba(251,113,133,0.12)] hover:bg-rose-50/80 hover:shadow-[0_4px_14px_rgba(251,113,133,0.16)] transition-all px-3 py-2 -mx-2"
                aria-label="查看個人資料"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-slate-800 text-2xl leading-tight" style={{ fontWeight: 800 }}>
                    {patientProfile.name}
                  </h1>
                  <span className="text-rose-500 text-xs bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                    家屬監護中
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-0.5 truncate">
                  {patientProfile.age} 歲 · {patientProfile.diagnosis} · {patientProfile.rehabPhase}
                </p>
                <p className="text-rose-400 text-[10px] mt-0.5">點選查看患者資料</p>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5">
                  <Activity className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-emerald-600 text-sm whitespace-nowrap" style={{ fontWeight: 600 }}>
                    今日 {todaySummary.completed}/{todaySummary.total} 項 · {todaySummary.progressPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2.5">
                  <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-orange-500 text-sm whitespace-nowrap" style={{ fontWeight: 600 }}>
                    連續訓練 {streakDays} 天
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEncourageOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-2xl px-4 py-2.5 shadow-sm shadow-rose-200 hover:shadow-md transition-shadow"
                style={{ fontWeight: 700 }}
                aria-label="傳送鼓勵給患者"
              >
                <Heart className="w-4 h-4 fill-white/60" />
                <span className="text-sm whitespace-nowrap">傳送鼓勵</span>
              </button>

              <button
                type="button"
                onClick={() => setAppointmentsOpen(true)}
                className="flex items-center gap-2.5 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-2.5 hover:bg-sky-100/80 transition-colors text-left"
                aria-label="查看各科回診日期"
              >
                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div className="whitespace-nowrap">
                  <p className="text-sky-400 text-[11px] leading-none">下次回診</p>
                  <p className="text-sky-600 text-sm mt-0.5" style={{ fontWeight: 700 }}>
                    {nextAppointment
                      ? formatAppointmentShort(nextAppointment.datetime)
                      : "尚無排程"}
                  </p>
                  {upcomingAppointments.length > 1 && (
                    <p className="text-sky-400 text-[10px] mt-0.5">
                      另有 {upcomingAppointments.length - 1} 科 · 點擊查看
                    </p>
                  )}
                </div>
              </button>

              <NotificationBell
                variant="family"
                buttonClassName="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center relative hover:bg-rose-100 transition-colors"
                iconClassName="w-5 h-5 text-rose-400"
                badgeClassName="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-400 rounded-full ring-2 ring-white"
              />
            </div>
          </div>

          {/* 手機版狀態列 */}
          <div className="rehab-content flex lg:hidden items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm text-emerald-600" style={{ fontWeight: 600 }}>
              <Activity className="w-3.5 h-3.5" />
              狀態良好
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-sm text-orange-500" style={{ fontWeight: 600 }}>
              <Flame className="w-3.5 h-3.5" />
              連續 {streakDays} 天
            </div>
          </div>
        </div>

        {/* Row 2 — 分頁導覽 */}
        <div className="px-6 py-2">
          <div className="rehab-content flex items-center justify-between gap-4">
            <div className="flex bg-rose-50/80 rounded-2xl p-1.5 border border-rose-100">
              {familyTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-white text-rose-500 shadow-sm shadow-rose-100"
                        : "text-slate-400 hover:text-rose-400"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>本週完成率較上週</span>
              <span className="text-emerald-500" style={{ fontWeight: 700 }}>
                {analytics.weekOverWeekDelta >= 0 ? "+" : ""}
                {analytics.weekOverWeekDelta}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {activeTab === "corridor" ? (
        <div className="flex-1 min-h-0 px-6 py-3 overflow-hidden">
          <TimeGallery variant="family" patientName={patientProfile.name} />
        </div>
      ) : (
      <main className="flex-1 min-h-0 w-full rehab-content px-4 py-2 flex flex-col gap-2 overflow-hidden">
        <PatientAnalyticsPanel analytics={analytics} theme="family" layout="fluid" expandable />
      </main>
      )}

      <ChatWidget
        portal="family"
        patientId={DEFAULT_PATIENT_ID}
        accentColor="bg-rose-300"
        accentBg="bg-rose-50"
      />

      <PatientProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={patientProfile}
        variant="family"
      />

      <AppointmentScheduleDialog
        open={appointmentsOpen}
        onClose={() => setAppointmentsOpen(false)}
        patientName={patientProfile.name}
        appointments={upcomingAppointments}
      />

      <EncouragementDialog
        open={encourageOpen}
        onClose={() => setEncourageOpen(false)}
        patientName={patientProfile.name}
      />
    </div>
  );
}
