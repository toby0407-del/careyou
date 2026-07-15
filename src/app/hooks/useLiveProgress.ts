import { useSyncExternalStore } from "react";
import {
  subscribeProgress,
  getLiveExercises,
  getStreakDays,
  getTodaySummary,
  getLiveDailyResults,
} from "../data/progressStore";
import { getPatientAnalytics, type PatientAnalytics } from "../data/patientAnalytics";
import type { Exercise } from "../data/exerciseTypes";
import type { DayResult } from "../data/dailyResults";

let snapshotVersion = 0;
let cachedExercises: Exercise[] | null = null;
let cachedSummary: ReturnType<typeof getTodaySummary> | null = null;
let cachedStreak: number | null = null;
let cachedDaily: DayResult[] | null = null;
let cachedAnalytics: PatientAnalytics | null = null;
let cachedAnalyticsPatientId: string | null = null;

function invalidateCache() {
  snapshotVersion += 1;
  cachedExercises = null;
  cachedSummary = null;
  cachedStreak = null;
  cachedDaily = null;
  cachedAnalytics = null;
  cachedAnalyticsPatientId = null;
}

/**
 * 模組級訂閱：訓練頁（RehabExecution）完成時 PatientHome 可能已卸載，
 * 若只在 hook subscribe 裡清快取，返回地圖會讀到舊的 completed／解鎖狀態。
 */
subscribeProgress(() => {
  invalidateCache();
});

function subscribe(listener: () => void) {
  return subscribeProgress(listener);
}

function getVersion() {
  return snapshotVersion;
}

/** 即時運動清單（含解鎖 / 星星狀態），訓練完成後自動更新 */
export function useLiveExercises(): Exercise[] {
  useSyncExternalStore(subscribe, getVersion);
  if (!cachedExercises) cachedExercises = getLiveExercises();
  return cachedExercises;
}

/** 即時連續天數 */
export function useLiveStreak(): number {
  useSyncExternalStore(subscribe, getVersion);
  if (cachedStreak === null) cachedStreak = getStreakDays();
  return cachedStreak;
}

/** 今日訓練摘要（完成數、預估時間、下一項…） */
export function useTodaySummary() {
  useSyncExternalStore(subscribe, getVersion);
  if (!cachedSummary) cachedSummary = getTodaySummary();
  return cachedSummary;
}

/** 即時月曆結果（歷史 + 今日真實紀錄） */
export function useLiveDailyResults(): DayResult[] {
  useSyncExternalStore(subscribe, getVersion);
  if (!cachedDaily) cachedDaily = getLiveDailyResults();
  return cachedDaily;
}

/** 家屬端 / 醫師端 / 患者端共用的分析圖表資料 */
export function usePatientAnalytics(patientId: string): PatientAnalytics {
  useSyncExternalStore(subscribe, getVersion);
  if (!cachedAnalytics || cachedAnalyticsPatientId !== patientId) {
    cachedAnalytics = getPatientAnalytics(patientId);
    cachedAnalyticsPatientId = patientId;
  }
  return cachedAnalytics;
}
