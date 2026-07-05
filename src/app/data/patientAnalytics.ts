export interface WeeklyDay {
  day: string;
  completion: number;
  duration: number;
  lastWeek: number;
}

export interface MonthlyPoint {
  date: string;
  score: number;
  quality: number;
}

export interface PainPoint {
  day: string;
  level: number;
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
  painToday: number;
  qualityAvg: number;
}

const P1_ANALYTICS: PatientAnalytics = {
  streakDays: 12,
  weekOverWeekDelta: 8,
  kpi: [
    { name: "今日完成", value: 33 },
    { name: "本週均分", value: 74 },
    { name: "動作品質", value: 88 },
    { name: "整體遵從", value: 87 },
  ],
  weekly: [
    { day: "週一", completion: 85, duration: 42, lastWeek: 72 },
    { day: "週二", completion: 70, duration: 35, lastWeek: 65 },
    { day: "週三", completion: 100, duration: 55, lastWeek: 80 },
    { day: "週四", completion: 60, duration: 30, lastWeek: 55 },
    { day: "週五", completion: 95, duration: 48, lastWeek: 78 },
    { day: "週六", completion: 80, duration: 40, lastWeek: 70 },
    { day: "今日", completion: 33, duration: 18, lastWeek: 60 },
  ],
  monthly: [
    { date: "6/1", score: 72, quality: 70 },
    { date: "6/5", score: 80, quality: 75 },
    { date: "6/9", score: 85, quality: 78 },
    { date: "6/13", score: 90, quality: 82 },
    { date: "6/17", score: 92, quality: 85 },
    { date: "6/21", score: 95, quality: 88 },
    { date: "6/25", score: 94, quality: 90 },
    { date: "6/29", score: 96, quality: 87 },
    { date: "7/1", score: 33, quality: 85 },
  ],
  pain: [
    { day: "週一", level: 4 },
    { day: "週二", level: 3 },
    { day: "週三", level: 3 },
    { day: "週四", level: 2 },
    { day: "週五", level: 2 },
    { day: "週六", level: 2 },
    { day: "今日", level: 2 },
  ],
  qualityWeekly: [
    { week: "W1", score: 72 },
    { week: "W2", score: 78 },
    { week: "W3", score: 85 },
    { week: "W4", score: 88 },
  ],
  bodyRecovery: [
    { part: "膝關節", score: 78, fullMark: 100 },
    { part: "踝關節", score: 85, fullMark: 100 },
    { part: "髖關節", score: 70, fullMark: 100 },
    { part: "核心", score: 65, fullMark: 100 },
    { part: "肌力", score: 72, fullMark: 100 },
    { part: "平衡", score: 60, fullMark: 100 },
  ],
  painToday: 2,
  qualityAvg: 88,
};

function scaleWeekly(base: WeeklyDay[], compliance: number, delta: number): WeeklyDay[] {
  const factor = compliance / 87;
  return base.map((d) => ({
    ...d,
    completion: Math.min(100, Math.round(d.completion * factor)),
    lastWeek: Math.min(100, Math.round(d.lastWeek * (factor - delta / 200))),
    duration: Math.round(d.duration * factor),
  }));
}

function makeAnalytics(
  compliance: number,
  streakDays: number,
  weekDelta: number,
  bodyParts: BodyRecoveryPoint[],
  painBase: number
): PatientAnalytics {
  const weekly = scaleWeekly(P1_ANALYTICS.weekly, compliance, weekDelta);
  const todayCompletion = weekly[weekly.length - 1]?.completion ?? compliance;
  const weekAvg = Math.round(weekly.reduce((s, d) => s + d.completion, 0) / weekly.length);
  const quality = Math.min(98, Math.round(compliance * 0.95 + 5));
  return {
    streakDays,
    weekOverWeekDelta: weekDelta,
    kpi: [
      { name: "今日完成", value: todayCompletion },
      { name: "本週均分", value: weekAvg },
      { name: "動作品質", value: quality },
      { name: "整體遵從", value: compliance },
    ],
    weekly,
    monthly: P1_ANALYTICS.monthly.map((m, i) => ({
      ...m,
      score: Math.min(100, Math.round(m.score * (compliance / 87) * (0.85 + i * 0.02))),
      quality: Math.min(98, Math.round(m.quality * (quality / 88))),
    })),
    pain: P1_ANALYTICS.pain.map((p) => ({
      ...p,
      level: Math.max(1, Math.min(10, Math.round(painBase + (p.level - 2) * 0.5))),
    })),
    qualityWeekly: P1_ANALYTICS.qualityWeekly.map((q, i) => ({
      week: q.week,
      score: Math.min(98, Math.round(quality - (3 - i) * 4)),
    })),
    bodyRecovery: bodyParts,
    painToday: Math.max(1, painBase),
    qualityAvg: quality,
  };
}

const ANALYTICS_BY_PATIENT: Record<string, PatientAnalytics> = {
  p1: P1_ANALYTICS,
  p2: makeAnalytics(72, 7, 5, [
    { part: "腰椎", score: 68, fullMark: 100 },
    { part: "核心", score: 62, fullMark: 100 },
    { part: "髖關節", score: 70, fullMark: 100 },
    { part: "下肢", score: 74, fullMark: 100 },
    { part: "肌力", score: 66, fullMark: 100 },
    { part: "平衡", score: 58, fullMark: 100 },
  ], 4),
  p3: makeAnalytics(45, 0, -12, [
    { part: "上肢", score: 42, fullMark: 100 },
    { part: "下肢", score: 38, fullMark: 100 },
    { part: "核心", score: 50, fullMark: 100 },
    { part: "平衡", score: 35, fullMark: 100 },
    { part: "肌力", score: 40, fullMark: 100 },
    { part: "協調", score: 36, fullMark: 100 },
  ], 5),
  p4: makeAnalytics(95, 21, 12, [
    { part: "肩關節", score: 88, fullMark: 100 },
    { part: "肘關節", score: 92, fullMark: 100 },
    { part: "旋轉肌群", score: 85, fullMark: 100 },
    { part: "核心", score: 80, fullMark: 100 },
    { part: "肌力", score: 90, fullMark: 100 },
    { part: "活動度", score: 87, fullMark: 100 },
  ], 1),
  p5: makeAnalytics(58, 3, 0, [
    { part: "踝關節", score: 62, fullMark: 100 },
    { part: "膝關節", score: 70, fullMark: 100 },
    { part: "小腿", score: 55, fullMark: 100 },
    { part: "平衡", score: 48, fullMark: 100 },
    { part: "肌力", score: 58, fullMark: 100 },
    { part: "活動度", score: 60, fullMark: 100 },
  ], 3),
};

export function getPatientAnalytics(patientId: string): PatientAnalytics {
  return ANALYTICS_BY_PATIENT[patientId] ?? P1_ANALYTICS;
}
