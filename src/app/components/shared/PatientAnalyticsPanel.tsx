import type { ReactNode } from "react";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
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
import type { PatientAnalytics } from "../../data/patientAnalytics";

export type AnalyticsTheme = "family" | "doctor";

const THEMES = {
  family: {
    card: "bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-rose-100/80 p-2.5 flex flex-col min-h-0 overflow-hidden",
    title: "text-slate-600 portal-chart-title leading-tight",
    sub: "text-slate-400 portal-chart-sub leading-tight",
    kpiDivider: "bg-rose-100",
    gridStroke: "#fdf2f8",
    barPrimary: "#fda4af",
    barToday: "#fecdd3",
    barMuted: "#fce7f3",
    barCompare: "#e2e8f0",
    areaFill: "#fce7f3",
    areaStroke: "#fda4af",
    qualityStroke: "#6ee7b7",
    qualityGrad: "qualityGradFamily",
    painStroke: "#fcd34d",
    painDot: "#fde68a",
    radarStroke: "#fda4af",
    radarFill: "#fda4af",
    polarGrid: "#fce7f3",
    trendUp: "text-emerald-500",
    trendDown: "text-red-500",
    kpiRing: "#fce7f3",
  },
  doctor: {
    card: "bg-white rounded-xl shadow-sm border border-sky-100 p-3 flex flex-col min-h-0 overflow-hidden",
    title: "text-slate-700 text-sm leading-tight",
    sub: "text-slate-400 text-xs leading-tight",
    kpiDivider: "bg-sky-100",
    gridStroke: "#e0f2fe",
    barPrimary: "#38bdf8",
    barToday: "#7dd3fc",
    barMuted: "#bae6fd",
    barCompare: "#e2e8f0",
    areaFill: "#e0f2fe",
    areaStroke: "#38bdf8",
    qualityStroke: "#34d399",
    qualityGrad: "qualityGradDoctor",
    painStroke: "#fbbf24",
    painDot: "#fde68a",
    radarStroke: "#38bdf8",
    radarFill: "#38bdf8",
    polarGrid: "#e0f2fe",
    trendUp: "text-emerald-600",
    trendDown: "text-red-500",
    kpiRing: "#e0f2fe",
  },
} as const;

const CHART_TICK = 12;
const CHART_TICK_SM = 11;

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: CHART_TICK,
  background: "rgba(255,255,255,0.96)",
};

function getKpiRingColor(value: number): string {
  if (value < 60) return "#f87171";
  if (value < 85) return "#facc15";
  return "#4ade80";
}

function KpiRadial({ name, value, ringBg }: { name: string; value: number; ringBg: string }) {
  const fill = getKpiRingColor(value);
  const size = 56;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[56px] h-[56px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={ringBg} strokeWidth={strokeWidth} />
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

function ChartBox({ children, minHeight }: { children: ReactNode; minHeight?: number }) {
  return (
    <div className="flex-1 min-h-0 w-full mt-1" style={minHeight ? { minHeight } : undefined}>
      {children}
    </div>
  );
}

interface PatientAnalyticsPanelProps {
  analytics: PatientAnalytics;
  theme?: AnalyticsTheme;
  /** compact = fixed chart heights for dialog; fluid = fill parent grid */
  layout?: "compact" | "fluid";
  showKpi?: boolean;
}

export function PatientAnalyticsPanel({
  analytics,
  theme = "family",
  layout = "fluid",
  showKpi = true,
}: PatientAnalyticsPanelProps) {
  const t = THEMES[theme];
  const chartH = layout === "compact" ? 160 : "100%";
  const delta = analytics.weekOverWeekDelta;
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;
  const trendClass = delta >= 0 ? t.trendUp : t.trendDown;
  const trendLabel = delta >= 0 ? `+${delta}%` : `${delta}%`;

  return (
    <div className={layout === "fluid" ? "flex flex-col gap-2 min-h-0 flex-1" : "space-y-4"}>
      {showKpi && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${t.card} flex-row items-center justify-center gap-5 py-2 flex-shrink-0`}
        >
          {analytics.kpi.map((kpi) => (
            <KpiRadial key={kpi.name} name={kpi.name} value={kpi.value} ringBg={t.kpiRing} />
          ))}
          <div className={`h-10 w-px ${t.kpiDivider}`} />
          <div className="text-center">
            <p className={t.sub}>較上週完成率</p>
            <p className={`text-lg mt-0.5 flex items-center justify-center gap-1 ${trendClass}`} style={{ fontWeight: 700 }}>
              <TrendIcon className="w-4 h-4" />
              {trendLabel}
            </p>
          </div>
          <div className={`h-10 w-px ${t.kpiDivider}`} />
          <div className="text-center">
            <p className={t.sub}>連續訓練</p>
            <p className="text-slate-700 text-lg mt-0.5" style={{ fontWeight: 700 }}>
              {analytics.streakDays} 天
            </p>
          </div>
        </motion.div>
      )}

      <div
        className={
          layout === "fluid"
            ? "grid grid-cols-3 grid-rows-2 gap-2 flex-1 min-h-0"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        }
      >
        <ChartCard t={t} title="本週完成率" sub="每日達成百分比" delay={0.05}>
          <ChartBox minHeight={layout === "compact" ? 160 : undefined}>
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart data={analytics.weekly} barSize={layout === "compact" ? 14 : 16}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "完成率"]} />
                <Bar dataKey="completion" radius={[5, 5, 0, 0]}>
                  {analytics.weekly.map((e, i) => (
                    <Cell
                      key={i}
                      fill={
                        i === analytics.weekly.length - 1
                          ? t.barToday
                          : e.completion >= 80
                            ? t.barPrimary
                            : t.barMuted
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </ChartCard>

        <ChartCard t={t} title="30 天復健趨勢" sub="完成率與動作品質" delay={0.08}>
          <ChartBox minHeight={layout === "compact" ? 160 : undefined}>
            <ResponsiveContainer width="100%" height={chartH}>
              <ComposedChart data={analytics.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                <YAxis yAxisId="right" orientation="right" domain={[50, 100]} tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: CHART_TICK_SM }} />
                <Area yAxisId="left" type="monotone" dataKey="score" name="完成率" fill={t.areaFill} stroke={t.areaStroke} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="quality" name="品質" stroke={t.qualityStroke} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartBox>
        </ChartCard>

        <ChartCard t={t} title="本週 vs 上週" sub="完成率週比對" delay={0.11}>
          <ChartBox minHeight={layout === "compact" ? 160 : undefined}>
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart data={analytics.weekly} barSize={9}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: CHART_TICK_SM }} />
                <Bar dataKey="completion" name="本週" fill={t.barPrimary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="lastWeek" name="上週" fill={t.barCompare} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </ChartCard>

        <ChartCard t={t} title="疼痛指數趨勢" sub={`今日 ${analytics.painToday}/10`} delay={0.14}>
          <ChartBox minHeight={layout === "compact" ? 160 : undefined}>
            <ResponsiveContainer width="100%" height={chartH}>
              <LineChart data={analytics.pain}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}/10`, "疼痛"]} />
                <Line type="monotone" dataKey="level" stroke={t.painStroke} strokeWidth={2.5} dot={{ r: 4, fill: t.painDot }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </ChartCard>

        <ChartCard t={t} title="各部位恢復雷達" sub="功能評估綜合圖" delay={0.17}>
          <ChartBox minHeight={layout === "compact" ? 160 : undefined}>
            <ResponsiveContainer width="100%" height={chartH}>
              <RadarChart data={analytics.bodyRecovery} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke={t.polarGrid} />
                <PolarAngleAxis dataKey="part" tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} />
                <Radar dataKey="score" stroke={t.radarStroke} fill={t.radarFill} fillOpacity={0.3} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "恢復度"]} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartBox>
        </ChartCard>

        <ChartCard t={t} title="動作品質週趨勢" sub={`本週平均 ${analytics.qualityAvg} 分`} delay={0.2}>
          <ChartBox minHeight={layout === "compact" ? 160 : undefined}>
            <ResponsiveContainer width="100%" height={chartH}>
              <AreaChart data={analytics.qualityWeekly}>
                <defs>
                  <linearGradient id={t.qualityGrad} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.qualityStroke} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={t.qualityStroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}分`, "品質"]} />
                <Area type="monotone" dataKey="score" stroke={t.qualityStroke} fill={`url(#${t.qualityGrad})`} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  t,
  title,
  sub,
  delay,
  children,
}: {
  t: (typeof THEMES)[AnalyticsTheme];
  title: string;
  sub: string;
  delay: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={t.card}
    >
      <h2 className={t.title} style={{ fontWeight: 600 }}>
        {title}
      </h2>
      <p className={t.sub}>{sub}</p>
      {children}
    </motion.div>
  );
}
