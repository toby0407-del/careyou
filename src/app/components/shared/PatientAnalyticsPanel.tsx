import { useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Maximize2, TrendingDown, TrendingUp } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

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
    expandBtn:
      "w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100 transition-colors",
    dialogBorder: "border-rose-100",
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
    expandBtn:
      "w-7 h-7 rounded-lg flex items-center justify-center text-sky-500 hover:bg-sky-50 hover:text-sky-600 border border-transparent hover:border-sky-100 transition-colors",
    dialogBorder: "border-sky-100",
  },
} as const;

const CHART_TICK = 12;
const CHART_TICK_SM = 11;
const EXPANDED_CHART_HEIGHT = 420;

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: CHART_TICK,
  background: "rgba(255,255,255,0.96)",
};

type ChartId =
  | "weekly"
  | "monthly"
  | "compare"
  | "pain"
  | "radar"
  | "quality";

function getKpiRingColor(value: number): string {
  if (value < 60) return "#f87171";
  if (value < 85) return "#facc15";
  return "#4ade80";
}

function KpiRadial({
  name,
  value,
  ringBg,
  empty = false,
}: {
  name: string;
  value: number;
  ringBg: string;
  empty?: boolean;
}) {
  const fill = empty ? "#cbd5e1" : getKpiRingColor(value);
  const size = 56;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dashOffset = empty ? circumference : circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[56px] h-[56px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={ringBg} strokeWidth={strokeWidth} />
          {!empty && (
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
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-slate-400 text-[10px] leading-none" style={{ fontWeight: 700 }}>
            {empty ? "—" : `${value}%`}
          </span>
        </div>
      </div>
      <p className="text-slate-400 text-[9px] mt-0.5 whitespace-nowrap">{name}</p>
    </div>
  );
}

function ChartBox({
  children,
  minHeight,
  expanded = false,
}: {
  children: ReactNode;
  minHeight?: number;
  expanded?: boolean;
}) {
  return (
    <div
      className="flex-1 min-h-0 w-full mt-1"
      style={expanded ? { minHeight: EXPANDED_CHART_HEIGHT, height: EXPANDED_CHART_HEIGHT } : minHeight ? { minHeight } : undefined}
    >
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
  /** 家屬端：各圖表卡片右上角顯示放大按鈕 */
  expandable?: boolean;
}

export function PatientAnalyticsPanel({
  analytics,
  theme = "family",
  layout = "fluid",
  showKpi = true,
  expandable = false,
}: PatientAnalyticsPanelProps) {
  const t = THEMES[theme];
  const chartH = layout === "compact" ? 160 : "100%";
  const delta = analytics.weekOverWeekDelta;
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;
  const trendClass = delta >= 0 ? t.trendUp : t.trendDown;
  const trendLabel = delta >= 0 ? `+${delta}%` : `${delta}%`;
  const [expandedChart, setExpandedChart] = useState<ChartId | null>(null);

  const painSub =
    analytics.painToday != null ? `今日 ${analytics.painToday}/10` : "今日尚無訓練資料";
  const qualitySub =
    analytics.qualityToday != null
      ? `今日 ${analytics.qualityToday} 分`
      : "今日尚無訓練資料";

  const charts = useMemo(
    () =>
      [
        {
          id: "weekly" as const,
          title: "本週完成率",
          sub: "每日達成百分比",
          delay: 0.05,
          render: (height: number | string, barSize: number) => (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={analytics.weekly} barSize={barSize}>
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
          ),
        },
        {
          id: "monthly" as const,
          title: "30 天復健趨勢",
          sub: "完成率與動作品質",
          delay: 0.08,
          render: (height: number | string) => (
            <ResponsiveContainer width="100%" height={height}>
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
          ),
        },
        {
          id: "compare" as const,
          title: "本週 vs 上週",
          sub: "完成率週比對",
          delay: 0.11,
          render: (height: number | string, barSize: number) => (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={analytics.weekly} barSize={barSize}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: CHART_TICK_SM }} />
                <Bar dataKey="completion" name="本週" fill={t.barPrimary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="lastWeek" name="上週" fill={t.barCompare} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ),
        },
        {
          id: "pain" as const,
          title: "疼痛指數趨勢",
          sub: painSub,
          delay: 0.14,
          render: (height: number | string) => (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={analytics.pain}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: CHART_TICK, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [v == null ? "尚無" : `${v}/10`, "疼痛"]}
                />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke={t.painStroke}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: t.painDot }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ),
        },
        {
          id: "radar" as const,
          title: "各部位恢復雷達",
          sub: "功能評估綜合圖",
          delay: 0.17,
          render: (height: number | string) => (
            <ResponsiveContainer width="100%" height={height}>
              <RadarChart data={analytics.bodyRecovery} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke={t.polarGrid} />
                <PolarAngleAxis dataKey="part" tick={{ fontSize: CHART_TICK_SM, fill: "#94a3b8" }} />
                <Radar dataKey="score" stroke={t.radarStroke} fill={t.radarFill} fillOpacity={0.3} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "恢復度"]} />
              </RadarChart>
            </ResponsiveContainer>
          ),
        },
        {
          id: "quality" as const,
          title: "動作品質週趨勢",
          sub: qualitySub,
          delay: 0.2,
          render: (height: number | string) => (
            <ResponsiveContainer width="100%" height={height}>
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
          ),
        },
      ] satisfies Array<{
        id: ChartId;
        title: string;
        sub: string;
        delay: number;
        render: (height: number | string, barSize?: number) => ReactNode;
      }>,
    [analytics, t, painSub, qualitySub]
  );

  const activeChart = charts.find((chart) => chart.id === expandedChart);

  const renderChartContent = (chart: (typeof charts)[number], expanded = false) => {
    const height = expanded ? EXPANDED_CHART_HEIGHT : chartH;
    const barSize = expanded ? 22 : layout === "compact" ? 14 : 16;
    const compareBarSize = expanded ? 14 : 9;

    return (
      <ChartBox minHeight={layout === "compact" && !expanded ? 160 : undefined} expanded={expanded}>
        {chart.id === "weekly"
          ? chart.render(height, barSize)
          : chart.id === "compare"
            ? chart.render(height, compareBarSize)
            : chart.render(height)}
      </ChartBox>
    );
  };

  return (
    <div className={layout === "fluid" ? "flex flex-col gap-2 min-h-0 flex-1" : "space-y-4"}>
      {showKpi && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${t.card} flex-row items-center justify-center gap-5 py-2 flex-shrink-0`}
        >
          {analytics.kpi.map((kpi) => (
            <KpiRadial
              key={kpi.name}
              name={kpi.name}
              value={kpi.value}
              ringBg={t.kpiRing}
              empty={kpi.name === "動作品質" && !analytics.hasTodayTraining}
            />
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
        {charts.map((chart) => (
          <ChartCard
            key={chart.id}
            t={t}
            title={chart.title}
            sub={chart.sub}
            delay={chart.delay}
            expandable={expandable}
            onExpand={() => setExpandedChart(chart.id)}
          >
            {renderChartContent(chart)}
          </ChartCard>
        ))}
      </div>

      <Dialog open={expandedChart !== null} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent className={`sm:max-w-4xl rounded-3xl ${t.dialogBorder} p-0 overflow-hidden`}>
          {activeChart && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2 text-left">
                <DialogTitle className="text-slate-800 text-xl" style={{ fontWeight: 800 }}>
                  {activeChart.title}
                </DialogTitle>
                <DialogDescription className="text-slate-500">{activeChart.sub}</DialogDescription>
              </DialogHeader>
              <div className="px-4 pb-6">{renderChartContent(activeChart, true)}</div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChartCard({
  t,
  title,
  sub,
  delay,
  children,
  expandable,
  onExpand,
}: {
  t: (typeof THEMES)[AnalyticsTheme];
  title: string;
  sub: string;
  delay: number;
  children: ReactNode;
  expandable?: boolean;
  onExpand?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${t.card} relative`}
    >
      <div className="flex items-start justify-between gap-2 pr-1">
        <div className="min-w-0">
          <h2 className={t.title} style={{ fontWeight: 600 }}>
            {title}
          </h2>
          <p className={t.sub}>{sub}</p>
        </div>
        {expandable && onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className={`${t.expandBtn} flex-shrink-0`}
            aria-label={`放大查看${title}`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}
