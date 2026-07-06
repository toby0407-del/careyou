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
  CalendarDays,
  Dumbbell,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  getCompletionRate,
  getCompletionColor,
  completionLegend,
  type DayResult,
} from "../../data/dailyResults";
import { allExercises } from "../../data/patientExercises";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface DayExerciseStatus {
  name: string;
  level: number;
  completed: boolean;
  quality?: number;
  stars?: number;
  durationMin?: number;
}

function buildDayExerciseStatuses(day: DayResult): DayExerciseStatus[] {
  const doneByName = new Map(day.exercises.map((e) => [e.name, e]));
  return allExercises.map((ex) => {
    const done = doneByName.get(ex.name);
    return {
      name: ex.name,
      level: ex.level,
      completed: Boolean(done),
      quality: done?.quality,
      stars: done?.stars,
      durationMin: done?.durationMin,
    };
  });
}

function DayDetailPanel({ day }: { day: DayResult }) {
  const [completionOpen, setCompletionOpen] = useState(false);
  const exerciseStatuses = useMemo(() => buildDayExerciseStatuses(day), [day]);
  const rate = getCompletionRate(day);
  const color = getCompletionColor(rate);
  const chartData = day.exercises.map((ex) => ({
    name: ex.name,
    quality: ex.quality,
    stars: ex.stars,
  }));
  const yAxisWidth = Math.max(120, ...chartData.map((d) => d.name.length * 20 + 16));
  const chartTick = { fontSize: 18, fill: "#334155", fontWeight: 600 };
  const chartTickMuted = { fontSize: 15, fill: "#94a3b8" };

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
          { icon: Dumbbell, label: "完成項目", value: `${day.completed}/${day.total}`, clickable: true },
          { icon: Target, label: "動作品質", value: `${day.accuracy}%`, clickable: false },
          { icon: Clock, label: "訓練時間", value: `${day.durationMin} 分`, clickable: false },
        ].map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <Icon className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <div>
                <p className="text-base text-slate-800 leading-none" style={{ fontWeight: 800 }}>
                  {s.value}
                </p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            </>
          );
          if (s.clickable) {
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setCompletionOpen(true)}
                className="bg-white rounded-xl border border-slate-100 px-3 py-2 flex items-center gap-2 text-left hover:border-teal-200 hover:bg-teal-50/60 transition-colors"
                aria-label="查看當日各項目完成狀態"
              >
                {inner}
              </button>
            );
          }
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 px-3 py-2 flex items-center gap-2"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <Dialog open={completionOpen} onOpenChange={setCompletionOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-emerald-100 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100 text-left">
            <DialogTitle className="text-slate-800 text-base" style={{ fontWeight: 800 }}>
              當日完成項目 · {day.completed}/{day.total}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {format(parseISO(day.date), "yyyy年 M月 d日 EEEE", { locale: zhTW })}
            </DialogDescription>
          </DialogHeader>
          <ul className="px-4 py-3 space-y-2 max-h-[min(60vh,360px)] overflow-y-auto">
            {exerciseStatuses.map((ex) => (
              <li
                key={ex.name}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${
                  ex.completed
                    ? "bg-emerald-50/80 border-emerald-100"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {ex.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ fontWeight: 700 }}
                      >
                        Lv.{ex.level}
                      </span>
                      <span className="text-sm text-slate-800 truncate" style={{ fontWeight: 600 }}>
                        {ex.name}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${ex.completed ? "text-emerald-600" : "text-slate-400"}`}>
                      {ex.completed ? "已完成" : "尚未完成"}
                    </p>
                  </div>
                </div>
                {ex.completed && ex.quality != null && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">{ex.quality}%</span>
                    <div className="flex gap-px">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            ex.stars != null && s <= ex.stars
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Quality chart */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex-1 min-h-0 flex flex-col">
        <p className="results-text-sm text-slate-700 mb-3 flex-shrink-0" style={{ fontWeight: 700 }}>
          各項目動作品質
        </p>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              barCategoryGap="20%"
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
              <Tooltip contentStyle={{ fontSize: 16, borderRadius: 8 }} formatter={(v) => [`${v}%`, "品質"]} />
              <Bar dataKey="quality" radius={[0, 6, 6, 0]} barSize={28}>
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
      <div className="flex-[3] results-calendar-col flex flex-col min-w-0 bg-white/85 rounded-2xl border border-emerald-100 p-4 overflow-hidden shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-center mb-3 flex-shrink-0">
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
                className={`results-day-cell relative rounded-xl flex flex-col items-center justify-center transition-all border-2 min-h-[52px] ${
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
      <div className="flex-[2] results-detail-col min-w-[280px] bg-white/85 rounded-2xl border border-emerald-100 p-4 overflow-hidden shadow-sm">
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
