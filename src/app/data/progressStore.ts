/**
 * 統一即時進度資料層 — 訓練完成 → 關卡解鎖 → 月曆 → 里程碑 → 連續天數
 * 患者端 / 家屬端 / 醫師端共用（localStorage 持久化 + 訂閱通知）
 */
import type { Exercise } from "./exerciseTypes";
import { allExercises } from "./patientExercises";
import { dailyResults, type DayResult, type DayExercise } from "./dailyResults";

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
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const date = yesterday.toISOString().slice(0, 10);
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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
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

/** 各運動的最佳成績（星星取最高、品質取最高） */
export function getBestResult(
  exerciseId: string
): { stars: 1 | 2 | 3; quality: number } | undefined {
  const sessions = loadState().sessions.filter((s) => s.exerciseId === exerciseId);
  if (sessions.length === 0) return undefined;
  return {
    stars: Math.max(...sessions.map((s) => s.stars)) as 1 | 2 | 3,
    quality: Math.max(...sessions.map((s) => s.quality)),
  };
}

export function isExerciseCompleted(exerciseId: string): boolean {
  return loadState().sessions.some((s) => s.exerciseId === exerciseId);
}

/** 把靜態運動清單合併即時完成狀態 */
export function withLiveProgress(exercises: Exercise[]): Exercise[] {
  return exercises.map((ex) => {
    const best = getBestResult(ex.id);
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

export function getTodaySummary() {
  const live = getLiveExercises();
  const total = live.length;
  const completed = live.filter((e) => e.completed).length;
  const pending = live.filter((e) => !e.completed);
  const estimatedMinutes = pending.reduce((sum, ex) => {
    const match = ex.duration.match(/(\d+)/);
    return sum + (match ? Number(match[1]) : 10);
  }, 0);
  const todaySessions = getSessionsForDate(todayStr());
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
export function getLiveDailyResults(): DayResult[] {
  const today = todayStr();
  const history = dailyResults.filter((d) => d.date < today);

  const todaySessions = getSessionsForDate(today);
  if (todaySessions.length === 0) return history;

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

  const todayEntry: DayResult = {
    date: today,
    completed: completedIds.size,
    total: allExercises.length,
    accuracy,
    durationMin: exercises.reduce((sum, ex) => sum + ex.durationMin, 0),
    exercises,
    streak: true,
  };

  return [...history, todayEntry];
}
