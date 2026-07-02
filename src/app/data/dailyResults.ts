export interface DayExercise {
  name: string;
  level: number;
  stars: number;
  quality: number;
  durationMin: number;
}

export interface DayResult {
  date: string;
  completed: number;
  total: number;
  accuracy: number;
  durationMin: number;
  exercises: DayExercise[];
  streak?: boolean;
}

const exerciseCatalog: DayExercise[] = [
  { name: "膝關節屈伸", level: 1, stars: 3, quality: 90, durationMin: 12 },
  { name: "踝關節旋轉", level: 2, stars: 2, quality: 84, durationMin: 8 },
  { name: "橋式運動", level: 3, stars: 2, quality: 86, durationMin: 10 },
  { name: "腹部收縮", level: 4, stars: 2, quality: 85, durationMin: 9 },
  { name: "肩關節外展", level: 5, stars: 2, quality: 83, durationMin: 10 },
  { name: "手腕屈伸", level: 6, stars: 3, quality: 89, durationMin: 8 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fmtDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildExercises(daySeed: number, completed: number): DayExercise[] {
  return exerciseCatalog.slice(0, completed).map((ex, idx) => {
    const variance = ((daySeed + idx * 3) % 9) - 4;
    const quality = clamp(ex.quality + variance, 72, 98);
    const stars = quality >= 92 ? 3 : quality >= 82 ? 2 : 1;
    return {
      ...ex,
      quality,
      stars,
      durationMin: ex.durationMin + ((daySeed + idx) % 3),
    };
  });
}

function buildDayResult(year: number, month: number, day: number): DayResult {
  const total = 6;
  const seed = year + month * 31 + day * 7;
  const weekend = new Date(year, month - 1, day).getDay();
  const completedBase = weekend === 0 || weekend === 6 ? 4 : 5;
  const completed = clamp(completedBase + (seed % 3) - 1, 3, 6);
  const exercises = buildExercises(seed, completed);
  const accuracy =
    Math.round(exercises.reduce((sum, ex) => sum + ex.quality, 0) / exercises.length);
  const durationMin = exercises.reduce((sum, ex) => sum + ex.durationMin, 0);

  return {
    date: fmtDate(year, month, day),
    completed,
    total,
    accuracy,
    durationMin,
    exercises,
    streak: true,
  };
}

function buildRange(
  year: number,
  month: number,
  startDay: number,
  endDay: number
): DayResult[] {
  return Array.from({ length: endDay - startDay + 1 }, (_, idx) =>
    buildDayResult(year, month, startDay + idx)
  );
}

/** Long-running rehab history — dense records across multiple months */
export const dailyResults: DayResult[] = [
  ...buildRange(2026, 4, 8, 30),
  ...buildRange(2026, 5, 1, 31),
  ...buildRange(2026, 6, 1, 30),
  ...buildRange(2026, 7, 1, 13),
].map((day) => {
  if (day.date === "2026-07-01") {
    return {
      ...day,
      completed: 2,
      accuracy: 86,
      durationMin: 20,
      exercises: [
        { name: "膝關節屈伸", level: 1, stars: 3, quality: 90, durationMin: 12 },
        { name: "手腕屈伸", level: 6, stars: 2, quality: 82, durationMin: 8 },
      ],
    };
  }

  if (day.date === "2026-07-02") {
    return {
      ...day,
      completed: 5,
      accuracy: 91,
      durationMin: 46,
      exercises: [
        { name: "膝關節屈伸", level: 1, stars: 3, quality: 94, durationMin: 12 },
        { name: "踝關節旋轉", level: 2, stars: 3, quality: 90, durationMin: 8 },
        { name: "橋式運動", level: 3, stars: 2, quality: 88, durationMin: 10 },
        { name: "腹部收縮", level: 4, stars: 2, quality: 89, durationMin: 8 },
        { name: "手腕屈伸", level: 6, stars: 3, quality: 93, durationMin: 8 },
      ],
    };
  }

  return day;
});

export function getDayResult(date: string): DayResult | undefined {
  return dailyResults.find((d) => d.date === date);
}

export function getCompletionRate(day: DayResult): number {
  return Math.round((day.completed / day.total) * 100);
}

/** Vivid color by completion rate */
export function getCompletionColor(rate: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (rate === 0) return { bg: "#f1f5f9", text: "#94a3b8", label: "未訓練" };
  if (rate < 34) return { bg: "#fecaca", text: "#b91c1c", label: "偏低" };
  if (rate < 67) return { bg: "#fde68a", text: "#b45309", label: "部分完成" };
  if (rate < 100) return { bg: "#bbf7d0", text: "#15803d", label: "良好" };
  return { bg: "#5eead4", text: "#0f766e", label: "全數完成" };
}

export const completionLegend = [
  { rate: 0, color: "#f1f5f9", label: "未訓練" },
  { rate: 33, color: "#fecaca", label: "< 34%" },
  { rate: 66, color: "#fde68a", label: "34–66%" },
  { rate: 99, color: "#bbf7d0", label: "67–99%" },
  { rate: 100, color: "#5eead4", label: "100%" },
];
