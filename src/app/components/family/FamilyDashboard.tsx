import { useNavigate } from "react-router";
import { useMemo, useState, type ReactNode } from "react";
import { parseISO } from "date-fns";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Heart,
  TrendingUp,
  Flame,
  Activity,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { ChatWidget } from "../shared/ChatWidget";
import { NotificationBell } from "../shared/NotificationBell";
import { TimeGalleryComingSoon } from "../shared/TimeGalleryComingSoon";
import { PatientProfileDialog, ProfileAvatarButton } from "../shared/PatientProfileDialog";
import { AppointmentScheduleDialog } from "../shared/AppointmentScheduleDialog";
import { DEFAULT_PATIENT_ID, getPatientProfile } from "../../data/patientProfiles";
import {
  formatAppointmentShort,
  getAppointmentsForPatient,
  getNextAppointment,
} from "../../data/patientAppointments";

type FamilyTab = "overview" | "corridor";

const familyTabs: { id: FamilyTab; label: string; icon: typeof Heart }[] = [
  { id: "overview", label: "監護總覽", icon: Heart },
  { id: "corridor", label: "時光迴廊", icon: Sparkles },
];

const weeklyData = [
  { day: "週一", completion: 85, duration: 42, lastWeek: 72 },
  { day: "週二", completion: 70, duration: 35, lastWeek: 65 },
  { day: "週三", completion: 100, duration: 55, lastWeek: 80 },
  { day: "週四", completion: 60, duration: 30, lastWeek: 55 },
  { day: "週五", completion: 95, duration: 48, lastWeek: 78 },
  { day: "週六", completion: 80, duration: 40, lastWeek: 70 },
  { day: "今日", completion: 33, duration: 18, lastWeek: 60 },
];

const monthlyData = [
  { date: "6/1", score: 72, quality: 70 },
  { date: "6/5", score: 80, quality: 75 },
  { date: "6/9", score: 85, quality: 78 },
  { date: "6/13", score: 90, quality: 82 },
  { date: "6/17", score: 92, quality: 85 },
  { date: "6/21", score: 95, quality: 88 },
  { date: "6/25", score: 94, quality: 90 },
  { date: "6/29", score: 96, quality: 87 },
  { date: "7/1", score: 33, quality: 85 },
];

const painLevelData = [
  { day: "週一", level: 4 },
  { day: "週二", level: 3 },
  { day: "週三", level: 3 },
  { day: "週四", level: 2 },
  { day: "週五", level: 2 },
  { day: "週六", level: 2 },
  { day: "今日", level: 2 },
];

const qualityData = [
  { week: "W1", score: 72 },
  { week: "W2", score: 78 },
  { week: "W3", score: 85 },
  { week: "W4", score: 88 },
];

const bodyRecoveryData = [
  { part: "膝關節", score: 78, fullMark: 100 },
  { part: "踝關節", score: 85, fullMark: 100 },
  { part: "髖關節", score: 70, fullMark: 100 },
  { part: "核心", score: 65, fullMark: 100 },
  { part: "肌力", score: 72, fullMark: 100 },
  { part: "平衡", score: 60, fullMark: 100 },
];

const kpiData = [
  { name: "今日完成", value: 33 },
  { name: "本週均分", value: 74 },
  { name: "動作品質", value: 88 },
  { name: "整體遵從", value: 87 },
];

const chartCard =
  "bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-rose-100/80 p-2.5 flex flex-col min-h-0 overflow-hidden";
const chartTitle = "text-slate-600 portal-chart-title leading-tight";
const chartSub = "text-slate-400 portal-chart-sub leading-tight";
const CHART_TICK = 14;
const CHART_TICK_SM = 12;

function ChartBox({ children }: { children: ReactNode }) {
  return <div className="flex-1 min-h-0 w-full mt-1">{children}</div>;
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #fce7f3",
  fontSize: CHART_TICK,
  background: "rgba(255,255,255,0.95)",
};

function getKpiRingColor(value: number): string {
  if (value < 60) return "#f87171";
  if (value < 85) return "#facc15";
  return "#4ade80";
}

function KpiRadial({ name, value }: { name: string; value: number }) {
  const fill = getKpiRingColor(value);
  const size = 56;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - clampedValue / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[56px] h-[56px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#fce7f3"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fill}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-slate-600 text-[10px] leading-none" style={{ fontWeight: 700 }}>
            {value}%
          </span>
        </div>
      </div>
      <p className="text-slate-400 text-[9px] mt-0.5 whitespace-nowrap">{name}</p>
    </div>
  );
}

export function FamilyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FamilyTab>("overview");
  const [profileOpen, setProfileOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const streakDays = 12;
  const patientProfile = getPatientProfile(DEFAULT_PATIENT_ID)!;
  const nextAppointment = getNextAppointment(DEFAULT_PATIENT_ID);
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return getAppointmentsForPatient(DEFAULT_PATIENT_ID).filter(
      (appt) => parseISO(appt.datetime) >= now
    );
  }, []);

  return (
    <div className="portal-large-text h-screen bg-gradient-to-br from-rose-50/40 via-stone-50 to-sky-50/30 overflow-hidden flex flex-col">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-rose-100/80 shadow-sm">
        {/* Row 1 — 病患資訊與快捷狀態 */}
        <div className="px-6 py-3 border-b border-rose-50">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
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
                className="min-w-0 text-left rounded-xl hover:bg-rose-50/80 transition-colors px-2 py-1 -mx-2"
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
                <p className="text-rose-400 text-[10px] mt-0.5">點擊查看身高、體重、住址等資料</p>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5">
                  <Activity className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-emerald-600 text-sm whitespace-nowrap" style={{ fontWeight: 600 }}>
                    整體狀態良好
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
          <div className="max-w-[1440px] mx-auto flex lg:hidden items-center gap-2 mt-3">
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
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
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
                +8%
              </span>
            </div>
          </div>
        </div>
      </header>

      {activeTab === "corridor" ? (
        <div className="flex-1 min-h-0 px-6 py-3 overflow-hidden">
          <TimeGalleryComingSoon variant="family" patientName={patientProfile.name} />
        </div>
      ) : (
      <main className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-4 py-2 flex flex-col gap-2 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${chartCard} flex-row items-center justify-center gap-6 py-2 flex-shrink-0`}
        >
          {kpiData.map((kpi) => (
            <KpiRadial key={kpi.name} name={kpi.name} value={kpi.value} fill={kpi.fill} />
          ))}
          <div className="h-10 w-px bg-rose-100" />
          <div className="text-center">
            <p className={chartSub}>較上週完成率</p>
            <p className="text-emerald-500 text-lg mt-0.5 flex items-center justify-center gap-1" style={{ fontWeight: 700 }}>
              <TrendingUp className="w-4 h-4" />+8%
            </p>
          </div>
        </motion.div>

        <div className="family-dashboard-charts grid grid-cols-3 grid-rows-2 gap-2 flex-1 min-h-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={chartCard}>
            <h2 className={chartTitle} style={{ fontWeight: 600 }}>本週完成率</h2>
            <p className={chartSub}>每日達成百分比</p>
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fdf2f8" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "完成率"]} />
                  <Bar dataKey="completion" radius={[5, 5, 0, 0]}>
                    {weeklyData.map((e, i) => (
                      <Cell key={i} fill={i === weeklyData.length - 1 ? "#fecdd3" : e.completion >= 80 ? "#fda4af" : "#fce7f3"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={chartCard}>
            <h2 className={chartTitle} style={{ fontWeight: 600 }}>30 天復健趨勢</h2>
            <p className={chartSub}>完成率與動作品質</p>
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fdf2f8" />
                  <XAxis dataKey="date" tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                  <YAxis yAxisId="right" orientation="right" domain={[50, 100]} tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: CHART_TICK_SM }} />
                  <Area yAxisId="left" type="monotone" dataKey="score" name="完成率" fill="#fce7f3" stroke="#fda4af" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="quality" name="品質" stroke="#6ee7b7" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className={chartCard}>
            <h2 className={chartTitle} style={{ fontWeight: 600 }}>本週 vs 上週</h2>
            <p className={chartSub}>完成率週比對</p>
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={9}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: CHART_TICK_SM }} />
                  <Bar dataKey="completion" name="本週" fill="#fda4af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lastWeek" name="上週" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className={chartCard}>
            <h2 className={chartTitle} style={{ fontWeight: 600 }}>疼痛指數趨勢</h2>
            <p className={chartSub}>今日 2/10 · 較上週下降</p>
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={painLevelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}/10`, "疼痛"]} />
                  <Line type="monotone" dataKey="level" stroke="#fcd34d" strokeWidth={2.5} dot={{ r: 4, fill: "#fde68a" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className={chartCard}>
            <h2 className={chartTitle} style={{ fontWeight: 600 }}>各部位恢復雷達</h2>
            <p className={chartSub}>功能評估綜合圖</p>
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={bodyRecoveryData} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid stroke="#fce7f3" />
                  <PolarAngleAxis dataKey="part" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} />
                  <Radar dataKey="score" stroke="#fda4af" fill="#fda4af" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "恢復度"]} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartBox>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={chartCard}>
            <h2 className={chartTitle} style={{ fontWeight: 600 }}>動作品質週趨勢</h2>
            <p className={chartSub}>本週平均 88 分</p>
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qualityData}>
                  <defs>
                    <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}分`, "品質"]} />
                  <Area type="monotone" dataKey="score" stroke="#6ee7b7" fill="url(#qualityGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
          </motion.div>
        </div>
      </main>
      )}

      <ChatWidget accentColor="bg-rose-300" accentBg="bg-rose-50" portalLabel="家屬諮詢服務" />

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
    </div>
  );
}
