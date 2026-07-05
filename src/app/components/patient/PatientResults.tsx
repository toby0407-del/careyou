import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  parseISO,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Star,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Dumbbell,
} from "lucide-react";
import {
  getCompletionRate,
  getCompletionColor,
  completionLegend,
  type DayResult,
} from "../../data/dailyResults";
import {
  useLiveDailyResults,
  useLiveExercises,
  useLiveStreak,
} from "../../hooks/useLiveProgress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function DayDetailPanel({ day }: { day: DayResult }) {
  const rate = getCompletionRate(day);
  const color = getCompletionColor(rate);
  const chartData = day.exercises.map((ex) => ({
    name: ex.name,
    quality: ex.quality,
    stars: ex.stars,
  }));
  const yAxisWidth = Math.max(88, ...chartData.map((d) => d.name.length * 14 + 8));
  const chartTick = { fontSize: 11, fill: "#64748b" };
  const chartTickMuted = { fontSize: 11, fill: "#94a3b8" };

  return (
    <motion.div
      key={day.date}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col gap-3 overflow-hidden"
    >
      {/* Date header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-slate-400 results-text-xs">
            {format(parseISO(day.date), "yyyy年 M月 d日 EEEE", { locale: zhTW })}
          </p>
          <h3 className="results-text-lg text-slate-800" style={{ fontWeight: 800 }}>
            當日復健分析
          </h3>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-sm"
          style={{ background: color.bg, color: color.text, fontWeight: 700 }}
        >
          完成度 {rate}%
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {[
          { icon: Dumbbell, label: "完成項目", value: `${day.completed}/${day.total}` },
          { icon: Target, label: "動作品質", value: `${day.accuracy}%` },
          { icon: Clock, label: "訓練時間", value: `${day.durationMin} 分` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 px-3 py-2 flex items-center gap-2"
            >
              <Icon className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <div>
                <p className="text-base text-slate-800 leading-none" style={{ fontWeight: 800 }}>
                  {s.value}
                </p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quality chart */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 flex-1 min-h-0 flex flex-col">
        <p className="results-text-sm text-slate-700 mb-2 flex-shrink-0" style={{ fontWeight: 700 }}>
          各項目動作品質
        </p>
        <div className="flex-1 min-h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={chartTickMuted} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={chartTick}
                width={yAxisWidth}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={{ fontSize: 14, borderRadius: 8 }} formatter={(v) => [`${v}%`, "品質"]} />
              <Bar dataKey="quality" radius={[0, 4, 4, 0]} barSize={12}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.quality >= 90 ? "#10b981" : entry.quality >= 80 ? "#14b8a6" : "#fbbf24"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-shrink-0 space-y-1.5 max-h-[28%] overflow-y-auto">
        {day.exercises.map((ex) => (
          <div
            key={ex.name}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded" style={{ fontWeight: 700 }}>
                Lv.{ex.level}
              </span>
              <span className="text-sm text-slate-700 truncate" style={{ fontWeight: 600 }}>
                {ex.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-500">{ex.quality}%</span>
              <div className="flex gap-px">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${s <= ex.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function EmptyDetailPanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <CalendarDays className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-600 text-sm mb-1" style={{ fontWeight: 700 }}>
        點選日期查看分析
      </p>
      <p className="text-slate-400 text-xs leading-relaxed">
        月曆上以豔色標示每日完成度
        <br />
        點擊有紀錄的日期即可展開當日詳細數據
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {completionLegend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-4 h-4 rounded" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PatientResults() {
  const dailyResults = useLiveDailyResults();
  const liveExercises = useLiveExercises();
  const streakDays = useLiveStreak();
  const todayDate = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(todayDate));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const latest = [...dailyResults].sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest?.date ?? null;
  });

  const completedCount = liveExercises.filter((e) => e.completed).length;
  const totalStars = liveExercises
    .filter((e) => e.completed)
    .reduce((s, e) => s + e.stars, 0);

  const getDayResult = (date: string) => dailyResults.find((d) => d.date === date);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const padding = getDay(start);
    return { days, padding };
  }, [currentMonth]);

  const selectedDay = selectedDate ? getDayResult(selectedDate) : undefined;

  const monthStats = useMemo(() => {
    const monthStr = format(currentMonth, "yyyy-MM");
    const monthDays = dailyResults.filter((d) => d.date.startsWith(monthStr));
    if (monthDays.length === 0) return null;
    const avgRate = Math.round(
      monthDays.reduce((s, d) => s + getCompletionRate(d), 0) / monthDays.length
    );
    const avgQuality = Math.round(
      monthDays.reduce((s, d) => s + d.accuracy, 0) / monthDays.length
    );
    return { trained: monthDays.length, avgRate, avgQuality };
  }, [currentMonth, dailyResults]);

  return (
    <div className="patient-results-ui h-full flex gap-2 overflow-hidden">
      <div className="flex-1 min-w-0 flex gap-3 overflow-hidden">
      {/* Left: Calendar */}
      <div className="flex-[3] flex flex-col min-w-0 bg-white/85 rounded-2xl border border-emerald-100 p-4 overflow-hidden shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-500" />
            <div>
              <p className="text-slate-800 text-base leading-none" style={{ fontWeight: 800 }}>
                復健完成月曆
              </p>
              {monthStats && (
                <p className="text-slate-400 text-[10px] mt-0.5">
                  本月訓練 {monthStats.trained} 天 · 平均完成 {monthStats.avgRate}% · 品質 {monthStats.avgQuality}%
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm text-slate-700 min-w-[100px] text-center" style={{ fontWeight: 700 }}>
              {format(currentMonth, "yyyy年 M月", { locale: zhTW })}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
          {completionLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-3.5 h-3.5 rounded-sm border border-slate-200/50" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 flex-shrink-0">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-slate-400" style={{ fontWeight: 600 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0 auto-rows-fr">
          {Array.from({ length: calendarDays.padding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {calendarDays.days.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const result = getDayResult(dateStr);
            const rate = result ? getCompletionRate(result) : 0;
            const color = getCompletionColor(rate);
            const isSelected = selectedDate === dateStr;
            const isToday = isSameDay(date, todayDate);
            const hasData = !!result;

            return (
              <motion.button
                key={dateStr}
                whileHover={hasData ? { scale: 1.05 } : {}}
                whileTap={hasData ? { scale: 0.97 } : {}}
                onClick={() => hasData && setSelectedDate(dateStr)}
                disabled={!hasData}
                className={`relative rounded-xl flex flex-col items-center justify-center transition-all border-2 min-h-[52px] ${
                  isSelected
                    ? "border-teal-500 shadow-md ring-2 ring-teal-100"
                    : hasData
                    ? "border-transparent hover:border-teal-200 cursor-pointer"
                    : "border-transparent cursor-default opacity-60"
                }`}
                style={{ background: hasData ? color.bg : "#f8fafc" }}
              >
                {isToday && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
                <span
                  className="text-sm leading-none"
                  style={{
                    fontWeight: isSelected || isToday ? 800 : 600,
                    color: hasData ? color.text : "#cbd5e1",
                  }}
                >
                  {format(date, "d")}
                </span>
                {hasData && (
                  <span
                    className="text-[9px] mt-0.5 leading-none"
                    style={{ color: color.text, fontWeight: 700 }}
                  >
                    {rate}%
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom summary strip */}
        <div className="grid grid-cols-4 gap-2 mt-3 flex-shrink-0">
          {[
            { icon: TrendingUp, label: "連續天數", value: `${streakDays} 天`, color: "text-blue-500" },
            {
              icon: Target,
              label: "動作品質",
              value: monthStats ? `${monthStats.avgQuality}%` : "--",
              color: "text-teal-500",
            },
            { icon: Star, label: "總星數", value: `${totalStars} ★`, color: "text-amber-500" },
            {
              icon: Dumbbell,
              label: "完成項目",
              value: `${completedCount}/${liveExercises.length}`,
              color: "text-emerald-500",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50/70">
                <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                <div>
                  <p className="text-xs text-slate-800" style={{ fontWeight: 700 }}>
                    {s.value}
                  </p>
                  <p className="text-[9px] text-slate-400">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="flex-[2] min-w-[280px] bg-white/85 rounded-2xl border border-emerald-100 p-4 overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <DayDetailPanel key={selectedDay.date} day={selectedDay} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <EmptyDetailPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
