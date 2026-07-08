import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  getCalendarDateRange,
  getStatsForDate,
  getStreakDays,
  getTodaySummary,
} from "./progressStore";
import { isAppToday } from "../lib/appClock";

export interface WeeklyDay {
  day: string;
  completion: number;
  duration: number;
  lastWeek: number;
}

export interface MonthlyPoint {
  date: string;
  score: number;
  quality: number | null;
}

export interface PainPoint {
  day: string;
  level: number | null;
}

export interface BodyRecoveryPoint {
  part: string;
  score: number;
  fullMark: number;
}

export interface PatientAnalytics {
  streakDays: number;
  weekOverWeekDelta: number;
  kpi: { name: string; value: number }[];
  weekly: WeeklyDay[];
  monthly: MonthlyPoint[];
  pain: PainPoint[];
  qualityWeekly: { week: string; score: number }[];
  bodyRecovery: BodyRecoveryPoint[];
  /** 今日是否有實際訓練紀錄 */
  hasTodayTraining: boolean;
  /** 今日疼痛指數；未訓練時為 null */
  painToday: number | null;
  /** 今日動作品質；未訓練時為 null */
  qualityToday: number | null;
  /** @deprecated 使用 qualityToday */
  qualityAvg: number | null;
  /** 近 7 日有訓練日的平均品質；全無則 null */
  weekQualityAvg: number | null;
}

function dayLabel(date: string, isToday: boolean): string {
  return isToday ? "今日" : format(new Date(date), "EEE", { locale: zhTW }).replace("週", "週");
}

function movingPain(rate: number): number {
  if (rate >= 90) return 2;
  if (rate >= 75) return 3;
  if (rate >= 60) return 4;
  return 5;
}

/** 僅在有實際訓練紀錄時才推算疼痛指數 */
function painForDay(stats: ReturnType<typeof getStatsForDate>): number | null {
  if (stats.completed === 0 || stats.accuracy === 0) return null;
  return movingPain(stats.completionPct);
}

function buildBaseAnalytics(): PatientAnalytics {
  const summary = getTodaySummary();
  const hasTodayTraining = summary.todaySessions.length > 0;
  const qualityToday = summary.avgQualityToday;
  const last30Dates = getCalendarDateRange(30);
  const last7Dates = last30Dates.slice(-7);
  const prev7Dates = last30Dates.slice(-14, -7);
  const stats30 = last30Dates.map((date) => getStatsForDate(date));
  const stats7 = last7Dates.map((date) => getStatsForDate(date));
  const statsPrev7 = prev7Dates.map((date) => getStatsForDate(date));

  const weekAvg = Math.round(
    stats7.reduce((sum, day) => sum + day.completionPct, 0) / Math.max(1, stats7.length)
  );
  const prevWeekAvg = statsPrev7.length
    ? Math.round(
        statsPrev7.reduce((sum, day) => sum + day.completionPct, 0) / statsPrev7.length
      )
    : weekAvg;
  const overallCompliance = Math.round(
    stats30.reduce((sum, day) => sum + day.completionPct, 0) / Math.max(1, stats30.length)
  );

  const weekly = stats7.map((day, index) => ({
    day: dayLabel(day.date, isAppToday(day.date)),
    completion: day.completionPct,
    duration: day.durationMin,
    lastWeek: statsPrev7[index]?.completionPct ?? 0,
  }));

  const monthly = stats30
    .filter((_, index) => index % 4 === 0 || index === stats30.length - 1)
    .map((day) => ({
      date: format(new Date(day.date), "M/d"),
      score: day.completionPct,
      quality: day.accuracy > 0 ? day.accuracy : null,
    }));

  const pain = stats7.map((day) => ({
    day: dayLabel(day.date, isAppToday(day.date)),
    level: painForDay(day),
  }));

  const trainedDays7 = stats7.filter((day) => day.completed > 0 && day.accuracy > 0);
  const weekQualityAvg = trainedDays7.length
    ? Math.round(trainedDays7.reduce((sum, day) => sum + day.accuracy, 0) / trainedDays7.length)
    : null;

  const qualityWeekly = Array.from({ length: 4 }, (_, index) => {
    const chunk = stats30.slice(
      Math.max(0, stats30.length - (4 - index) * 7),
      stats30.length - (3 - index) * 7 || undefined
    );
    const trained = chunk.filter((day) => day.completed > 0 && day.accuracy > 0);
    const avg = trained.length
      ? Math.round(trained.reduce((sum, day) => sum + day.accuracy, 0) / trained.length)
      : null;
    return { week: `W${index + 1}`, score: avg ?? 0 };
  });

  const todayStats = stats7[stats7.length - 1];

  return {
    streakDays: getStreakDays(),
    weekOverWeekDelta: weekAvg - prevWeekAvg,
    kpi: [
      { name: "今日完成", value: summary.progressPct },
      { name: "本週均分", value: weekAvg },
      { name: "動作品質", value: qualityToday ?? 0 },
      { name: "整體遵從", value: overallCompliance },
    ],
    weekly,
    monthly,
    pain,
    qualityWeekly,
    bodyRecovery: [
      { part: "膝關節", score: 78, fullMark: 100 },
      { part: "踝關節", score: 85, fullMark: 100 },
      { part: "髖關節", score: 70, fullMark: 100 },
      { part: "核心", score: 65, fullMark: 100 },
      { part: "肌力", score: 72, fullMark: 100 },
      { part: "平衡", score: 60, fullMark: 100 },
    ],
    hasTodayTraining,
    painToday: hasTodayTraining ? painForDay(todayStats!) : null,
    qualityToday,
    qualityAvg: qualityToday,
    weekQualityAvg,
  };
}

function scaleWeekly(base: WeeklyDay[], compliance: number, delta: number): WeeklyDay[] {
  const factor = compliance / 87;
  return base.map((day) => ({
    ...day,
    completion: Math.min(100, Math.round(day.completion * factor)),
    lastWeek: Math.min(100, Math.round(day.lastWeek * (factor - delta / 200))),
    duration: Math.round(day.duration * factor),
  }));
}

function makeAnalytics(
  compliance: number,
  streakDays: number,
  weekDelta: number,
  bodyParts: BodyRecoveryPoint[],
  painBase: number
): PatientAnalytics {
  const base = buildBaseAnalytics();
  const weekly = scaleWeekly(base.weekly, compliance, weekDelta);
  const weekAvg = Math.round(weekly.reduce((sum, day) => sum + day.completion, 0) / weekly.length);
  const quality = Math.min(98, Math.round(compliance * 0.95 + 5));
  return {
    streakDays,
    weekOverWeekDelta: weekDelta,
    kpi: [
      { name: "今日完成", value: base.kpi[0]?.value ?? 0 },
      { name: "本週均分", value: weekAvg },
      { name: "動作品質", value: quality },
      { name: "整體遵從", value: compliance },
    ],
    weekly,
    monthly: base.monthly.map((point, index) => ({
      ...point,
      score: Math.min(100, Math.round(point.score * (compliance / 87) * (0.85 + index * 0.02))),
      quality:
        point.quality == null
          ? null
          : Math.min(98, Math.round(point.quality * (quality / 88))),
    })),
    pain: base.pain.map((point) => ({
      ...point,
      level:
        point.level == null
          ? null
          : Math.max(1, Math.min(10, Math.round(painBase + (point.level - 2) * 0.5))),
    })),
    qualityWeekly: base.qualityWeekly.map((point, index) => ({
      week: point.week,
      score: Math.min(98, Math.round(quality - (3 - index) * 4)),
    })),
    bodyRecovery: bodyParts,
    hasTodayTraining: base.hasTodayTraining,
    painToday: base.hasTodayTraining ? Math.max(1, painBase) : null,
    qualityToday: base.hasTodayTraining ? quality : null,
    qualityAvg: base.hasTodayTraining ? quality : null,
    weekQualityAvg: base.weekQualityAvg,
  };
}

export function getPatientAnalytics(patientId: string): PatientAnalytics {
  if (patientId === "p1") return buildBaseAnalytics();
  if (patientId === "p2") {
    return makeAnalytics(72, 7, 5, [
      { part: "腰椎", score: 68, fullMark: 100 },
      { part: "核心", score: 62, fullMark: 100 },
      { part: "髖關節", score: 70, fullMark: 100 },
      { part: "下肢", score: 74, fullMark: 100 },
      { part: "肌力", score: 66, fullMark: 100 },
      { part: "平衡", score: 58, fullMark: 100 },
    ], 4);
  }
  if (patientId === "p3") {
    return makeAnalytics(45, 0, -12, [
      { part: "上肢", score: 42, fullMark: 100 },
      { part: "下肢", score: 38, fullMark: 100 },
      { part: "核心", score: 50, fullMark: 100 },
      { part: "平衡", score: 35, fullMark: 100 },
      { part: "肌力", score: 40, fullMark: 100 },
      { part: "協調", score: 36, fullMark: 100 },
    ], 5);
  }
  if (patientId === "p4") {
    return makeAnalytics(95, 21, 12, [
      { part: "肩關節", score: 88, fullMark: 100 },
      { part: "肘關節", score: 92, fullMark: 100 },
      { part: "旋轉肌群", score: 85, fullMark: 100 },
      { part: "核心", score: 80, fullMark: 100 },
      { part: "肌力", score: 90, fullMark: 100 },
      { part: "活動度", score: 87, fullMark: 100 },
    ], 1);
  }
  if (patientId === "p5") {
    return makeAnalytics(58, 3, 0, [
      { part: "踝關節", score: 62, fullMark: 100 },
      { part: "膝關節", score: 70, fullMark: 100 },
      { part: "小腿", score: 55, fullMark: 100 },
      { part: "平衡", score: 48, fullMark: 100 },
      { part: "肌力", score: 58, fullMark: 100 },
      { part: "活動度", score: 60, fullMark: 100 },
    ], 3);
  }
  return buildBaseAnalytics();
}

export function getAnalyticsKpiValue(analytics: PatientAnalytics, name: string): number {
  return analytics.kpi.find((item) => item.name === name)?.value ?? 0;
}
