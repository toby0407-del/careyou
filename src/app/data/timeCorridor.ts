import { shiftIsoDate } from "../lib/mockTime";
import { getTodaySummary, todayStr } from "./progressStore";

export type CorridorEventType =
  | "surgery"
  | "first_session"
  | "milestone"
  | "phase"
  | "achievement"
  | "training"
  | "encouragement";

export interface CorridorMetric {
  label: string;
  value: number;
  unit?: string;
}

export interface TimeCorridorEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: CorridorEventType;
  metrics?: CorridorMetric[];
  exerciseName?: string;
  quality?: number;
  phase?: string;
  syncedAt?: string;
}

export const STORAGE_KEY = "rehabbridge-time-corridor";

/** 患者與家屬共用的復健歷程資料 */
export const BASE_CORRIDOR_EVENTS: TimeCorridorEvent[] = [
  {
    id: "evt-surgery",
    date: "2026-05-15",
    title: "膝關節置換手術",
    description: "順利完成手術，開始術後復健計畫。",
    type: "surgery",
    phase: "術後第 0 天",
    metrics: [{ label: "疼痛指數", value: 8, unit: "/10" }],
  },
  {
    id: "evt-first",
    date: "2026-05-22",
    title: "首次居家復健",
    description: "完成第一次踝關節旋轉訓練，踏出復健第一步。",
    type: "first_session",
    exerciseName: "踝關節旋轉",
    quality: 62,
    metrics: [{ label: "動作品質", value: 62, unit: "分" }],
  },
  {
    id: "evt-phase1",
    date: "2026-06-01",
    title: "進入第一期復健",
    description: "基礎恢復階段，專注關節活動度與基礎肌力。",
    type: "phase",
    phase: "第一期 · 基礎恢復",
    metrics: [{ label: "膝關節活動度", value: 45, unit: "%" }],
  },
  {
    id: "evt-streak7",
    date: "2026-06-10",
    title: "連續訓練 7 天",
    description: "養成每日復健習慣，獲得堅持徽章。",
    type: "milestone",
    metrics: [
      { label: "連續天數", value: 7, unit: "天" },
      { label: "完成率", value: 82, unit: "%" },
    ],
  },
  {
    id: "evt-knee-90",
    date: "2026-06-18",
    title: "膝關節屈伸達 90°",
    description: "膝關節屈曲角度突破 90 度，醫師評估進度良好。",
    type: "achievement",
    exerciseName: "膝關節屈伸",
    quality: 88,
    metrics: [
      { label: "屈曲角度", value: 90, unit: "°" },
      { label: "動作品質", value: 88, unit: "分" },
    ],
  },
  {
    id: "evt-phase2",
    date: "2026-06-20",
    title: "進入第二期復健",
    description: "功能強化階段，增加訓練強度與平衡練習。",
    type: "phase",
    phase: "第二期 · 功能強化",
    metrics: [{ label: "整體恢復", value: 68, unit: "%" }],
  },
  {
    id: "evt-quality90",
    date: "2026-06-28",
    title: "動作品質突破 90 分",
    description: "姿勢偵測顯示動作標準度大幅提升。",
    type: "achievement",
    quality: 92,
    metrics: [{ label: "動作品質", value: 92, unit: "分" }],
  },
  {
    id: "evt-streak12",
    date: "2026-06-30",
    title: "連續訓練 12 天",
    description: "持續保持訓練，疼痛指數降至 2/10。",
    type: "milestone",
    metrics: [
      { label: "連續天數", value: 12, unit: "天" },
      { label: "疼痛指數", value: 2, unit: "/10" },
    ],
  },
  {
    id: "evt-today",
    date: "2026-07-01",
    title: "今日訓練進行中",
    description: "完成踝關節旋轉，膝關節屈伸訓練進行中。",
    type: "training",
    exerciseName: "膝關節屈伸",
    quality: 85,
    metrics: [
      { label: "今日完成", value: 33, unit: "%" },
      { label: "動作品質", value: 85, unit: "分" },
    ],
  },
].map((event) => ({
  ...event,
  date: shiftIsoDate(event.date),
}));

export function sortCorridorEvents(events: TimeCorridorEvent[]): TimeCorridorEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function loadCorridorEvents(): TimeCorridorEvent[] {
  const summary = getTodaySummary();
  const withLiveToday = BASE_CORRIDOR_EVENTS.map((event) => {
    if (event.id !== "evt-today") return event;
    return {
      ...event,
      date: todayStr(),
      description:
        summary.completed > 0
          ? `今日已完成 ${summary.completed}/${summary.total} 項訓練。`
          : "今日尚未開始訓練。",
      quality: summary.avgQualityToday ?? undefined,
      metrics: [
        { label: "今日完成", value: summary.progressPct, unit: "%" },
        ...(summary.avgQualityToday != null
          ? [{ label: "動作品質", value: summary.avgQualityToday, unit: "分" }]
          : []),
      ],
    };
  });

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dynamic: TimeCorridorEvent[] = stored ? JSON.parse(stored) : [];
    const merged = [...withLiveToday];
    for (const evt of dynamic) {
      if (!merged.some((e) => e.id === evt.id)) merged.push(evt);
    }
    return sortCorridorEvents(merged);
  } catch {
    return sortCorridorEvents([...withLiveToday]);
  }
}

export function appendCorridorEvent(event: Omit<TimeCorridorEvent, "id" | "syncedAt">): TimeCorridorEvent {
  const stored: TimeCorridorEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const newEvent: TimeCorridorEvent = {
    ...event,
    id: `dynamic-${Date.now()}`,
    syncedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, newEvent]));
  window.dispatchEvent(new Event("time-corridor-updated"));
  return newEvent;
}
