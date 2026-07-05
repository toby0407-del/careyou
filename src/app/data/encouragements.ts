/**
 * 家人鼓勵訊息 — 家屬端送出，患者端顯示並可語音播放
 * 同步寫入時光迴廊（encouragement 事件）
 */
import { appendCorridorEvent } from "./timeCorridor";

const STORAGE_KEY = "rehabbridge_encouragements";

export interface Encouragement {
  id: string;
  from: string;
  relation: string;
  message: string;
  createdAt: string; // ISO
  read: boolean;
}

function notify() {
  window.dispatchEvent(new Event("rehab-encouragement-updated"));
}

export function subscribeEncouragements(listener: () => void) {
  window.addEventListener("rehab-encouragement-updated", listener);
  return () => window.removeEventListener("rehab-encouragement-updated", listener);
}

function load(): Encouragement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Encouragement[]) : [];
  } catch {
    return [];
  }
}

function save(list: Encouragement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  notify();
}

export function getEncouragements(): Encouragement[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadEncouragements(): Encouragement[] {
  return getEncouragements().filter((e) => !e.read);
}

export function sendEncouragement(input: {
  from: string;
  relation: string;
  message: string;
}): Encouragement {
  const item: Encouragement = {
    id: `enc-${Date.now()}`,
    ...input,
    createdAt: new Date().toISOString(),
    read: false,
  };
  save([...load(), item]);

  appendCorridorEvent({
    date: item.createdAt.slice(0, 10),
    title: `${input.from}的打氣`,
    description: input.message,
    type: "encouragement",
  });

  return item;
}

export function markEncouragementRead(id: string) {
  save(load().map((e) => (e.id === id ? { ...e, read: true } : e)));
}

export function markAllEncouragementsRead() {
  save(load().map((e) => ({ ...e, read: true })));
}

export const ENCOURAGEMENT_PRESETS = [
  "爸，今天也要加油！做完我們視訊 💕",
  "阿公你最棒了，孫子等你康復一起去公園！",
  "慢慢來不要急，我們都在你身邊。",
  "看到你的進步好開心，繼續保持！",
];
