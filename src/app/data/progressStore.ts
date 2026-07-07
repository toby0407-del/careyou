/**
 * 統一即時進度資料層 — 訓練完成 → 關卡解鎖 → 月曆 → 里程碑 → 連續天數
 * 患者端 / 家屬端 / 醫師端共用（localStorage 持久化 + 訂閱通知）
 */
import { differenceInCalendarDays, format, formatDistanceToNow, parseISO, subDays } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { Exercise } from "./exerciseTypes";
import { allExercises } from "./patientExercises";
import { dailyResults, type DayResult, type DayExercise } from "./dailyResults";
import { getAppBusinessDate, getAppBusinessDateStr, isAppToday } from "../lib/appClock";

export interface DayStats {
  date: string;
  completed: number;
  total: number;
  completionPct: number;
  accuracy: number;
  durationMin: number;
}

const STORAGE_KEY = "rehabbridge_progress_v1";

/** 展示情境的基礎連續天數（mock 歷史至昨天為止） */
const BASE_STREAK_DAYS = 12;

export interface SessionRecord {
  exerciseId: string;
  exerciseName: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO
  stars: 1 | 2 | 3;
  quality: number; // 0–100
  validReps: number;
  invalidReps: number;
  durationSec: number;
}

interface ProgressState {
  sessions: SessionRecord[];
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
  window.dispatchEvent(new Event("rehab-progress-updated"));
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("rehab-progress-updated", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("rehab-progress-updated", onStorage);
  };
}

/** 種子紀錄 — 對應原 mock：關卡 1 已通關（3 星） */
function seedState(): ProgressState {
  const yesterday = new Date(getAppBusinessDate().getTime() - 24 * 60 * 60 * 1000);
  const date = getAppBusinessDateStr(yesterday);
  return {
    sessions: [
      {
        exerciseId: "knee-flexion",
        exerciseName: "膝關節屈伸",
        date,
        completedAt: `${date}T09:30:00.000Z`,
        stars: 3,
        quality: 94,
        validReps: 45,
        invalidReps: 3,
        durationSec: 660,
      },
    ],
  };
}

let cache: ProgressState | null = null;

function loadState(): ProgressState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as ProgressState;
      return cache;
    }
  } catch {
    /* ignore */
  }
  cache = seedState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  return cache;
}

function saveState(state: ProgressState) {
  cache = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  notify();
}

export function todayStr(): string {
  return getAppBusinessDateStr();
}

/** 記錄一次完整訓練（RehabExecution 完成時呼叫） */
export function recordSessionComplete(
  record: Omit<SessionRecord, "date" | "completedAt">
): SessionRecord {
  const state = loadState();
  const session: SessionRecord = {
    ...record,
    date: todayStr(),
    completedAt: new Date().toISOString(),
  };
  saveState({ sessions: [...state.sessions, session] });
  return session;
}

export function getAllSessions(): SessionRecord[] {
  return loadState().sessions;
}

export function getSessionsForDate(date: string): SessionRecord[] {
  return loadState().sessions.filter((s) => s.date === date);
}

/** 各運動在指定日期的最佳成績（預設為今日） */
export function getBestResult(
  exerciseId: string,
  date = todayStr()
): { stars: 1 | 2 | 3; quality: number } | undefined {
  const sessions = loadState().sessions.filter((s) => s.exerciseId === exerciseId && s.date === date);
  if (sessions.length === 0) return undefined;
  return {
    stars: Math.max(...sessions.map((s) => s.stars)) as 1 | 2 | 3,
    quality: Math.max(...sessions.map((s) => s.quality)),
  };
}

/** 歷史任一日的最佳成績（里程碑等長期成就用） */
export function getLifetimeBestResult(
  exerciseId: string
): { stars: 1 | 2 | 3; quality: number } | undefined {
  const sessions = loadState().sessions.filter((s) => s.exerciseId === exerciseId);
  if (sessions.length === 0) return undefined;
  return {
    stars: Math.max(...sessions.map((s) => s.stars)) as 1 | 2 | 3,
    quality: Math.max(...sessions.map((s) => s.quality)),
  };
}

export function isExerciseCompleted(exerciseId: string, date = todayStr()): boolean {
  return loadState().sessions.some((s) => s.exerciseId === exerciseId && s.date === date);
}

/** 歷史累計通關關卡數（里程碑用，不影響今日關卡地圖） */
export function getLifetimeCompletedLevelCount(): number {
  return new Set(loadState().sessions.map((session) => session.exerciseId)).size;
}

/** 合併今日訓練進度 — 關卡地圖 / 今日計畫只看當日完成狀態 */
export function withLiveProgress(exercises: Exercise[]): Exercise[] {
  const today = todayStr();
  return exercises.map((ex) => {
    const best = getBestResult(ex.id, today);
    if (!best) return { ...ex, completed: false, stars: 0 };
    return { ...ex, completed: true, stars: best.stars };
  });
}

export function getLiveExercises(): Exercise[] {
  return withLiveProgress(allExercises);
}

/** 連續天數：mock 歷史 12 天 + 今天是否已訓練 */
export function getStreakDays(): number {
  const trainedToday = getSessionsForDate(todayStr()).length > 0;
  return BASE_STREAK_DAYS + (trainedToday ? 1 : 0);
}

export function getCalendarDateRange(dayCount: number, reference = new Date()): string[] {
  const today = getAppBusinessDate(reference);
  return Array.from({ length: dayCount }, (_, index) =>
    format(subDays(today, dayCount - 1 - index), "yyyy-MM-dd")
  );
}

export function getDayResultLookup(): Map<string, DayResult> {
  return new Map(getLiveDailyResults().map((day) => [day.date, day]));
}

export function getStatsForDate(date: string): DayStats {
  const total = allExercises.length;
  const entry = getDayResultLookup().get(date);

  if (entry) {
    return {
      date,
      completed: entry.completed,
      total: entry.total,
      completionPct: total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
      accuracy: entry.accuracy,
      durationMin: entry.durationMin,
    };
  }

  if (isAppToday(date)) {
    const todaySessions = getSessionsForDate(date);
    const completed = new Set(todaySessions.map((session) => session.exerciseId)).size;
    const accuracy = todaySessions.length
      ? Math.round(todaySessions.reduce((sum, session) => sum + session.quality, 0) / todaySessions.length)
      : 0;
    const durationMin = todaySessions.reduce(
      (sum, session) => sum + Math.max(1, Math.round(session.durationSec / 60)),
      0
    );

    return {
      date,
      completed,
      total,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      accuracy,
      durationMin,
    };
  }

  return {
    date,
    completed: 0,
    total,
    completionPct: 0,
    accuracy: 0,
    durationMin: 0,
  };
}

export function getTodaySummary() {
  const total = allExercises.length;
  const today = todayStr();
  const todaySessions = getSessionsForDate(today);
  const completedTodayIds = new Set(todaySessions.map((session) => session.exerciseId));
  const completed = completedTodayIds.size;
  const pending = allExercises.filter((exercise) => !completedTodayIds.has(exercise.id));
  const estimatedMinutes = pending.reduce((sum, ex) => {
    const match = ex.duration.match(/(\d+)/);
    return sum + (match ? Number(match[1]) : 10);
  }, 0);
  const avgQualityToday = todaySessions.length
    ? Math.round(todaySessions.reduce((s, x) => s + x.quality, 0) / todaySessions.length)
    : null;

  return {
    total,
    completed,
    remaining: pending.length,
    estimatedMinutes,
    pendingNames: pending.map((e) => e.name),
    nextExercise: pending[0] ?? null,
    todaySessions,
    avgQualityToday,
    progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/** 累計標準動作次數（品質里程碑用，含 mock 基數；423 + 種子 45 = 468 對應原設定） */
const BASE_VALID_REPS = 423;
export function getTotalValidReps(): number {
  return BASE_VALID_REPS + loadState().sessions.reduce((s, x) => s + x.validReps, 0);
}

/**
 * 即時月曆結果 — 歷史 mock（今天以前）+ 今日真實訓練紀錄
 * 未來日期不顯示（避免假資料穿幫）
 */
function buildTodayDayResult(): DayResult {
  const today = todayStr();
  const total = allExercises.length;
  const todaySessions = getSessionsForDate(today);

  if (todaySessions.length === 0) {
    return {
      date: today,
      completed: 0,
      total,
      accuracy: 0,
      durationMin: 0,
      exercises: [],
      streak: false,
    };
  }

  const levelById = new Map(allExercises.map((ex) => [ex.id, ex.level]));
  const exercises: DayExercise[] = todaySessions.map((s) => ({
    name: s.exerciseName,
    level: levelById.get(s.exerciseId) ?? 0,
    stars: s.stars,
    quality: s.quality,
    durationMin: Math.max(1, Math.round(s.durationSec / 60)),
  }));
  const completedIds = new Set(todaySessions.map((s) => s.exerciseId));
  const accuracy = Math.round(
    exercises.reduce((sum, ex) => sum + ex.quality, 0) / exercises.length
  );

  return {
    date: today,
    completed: completedIds.size,
    total,
    accuracy,
    durationMin: exercises.reduce((sum, ex) => sum + ex.durationMin, 0),
    exercises,
    streak: true,
  };
}

export function getLiveDailyResults(): DayResult[] {
  const today = todayStr();
  const history = dailyResults.filter((d) => d.date < today);
  return [...history, buildTodayDayResult()];
}

/** 最近一次訓練的相對時間（三端病患詳情共用） */
export function getLastSessionLabel(): string {
  const sessions = getAllSessions();
  if (sessions.length === 0) return "尚未訓練";

  const latest = sessions.reduce((current, next) =>
    new Date(next.completedAt).getTime() > new Date(current.completedAt).getTime() ? next : current
  );
  const today = todayStr();
  const yesterday = format(subDays(getAppBusinessDate(), 1), "yyyy-MM-dd");

  if (latest.date === today) {
    return formatDistanceToNow(new Date(latest.completedAt), { addSuffix: true, locale: zhTW });
  }
  if (latest.date === yesterday) return "昨日";

  const daysAgo = differenceInCalendarDays(getAppBusinessDate(), parseISO(latest.date));
  return `${daysAgo}天前`;
}
