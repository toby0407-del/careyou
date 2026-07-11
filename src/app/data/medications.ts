/**
 * 患者端用藥提醒 — 早／中／晚／睡前時段表
 * 本機 localStorage；示範資料對應膝關節置換術後常見用藥
 */

import { getAppBusinessDateStr } from "../lib/appClock";
import { DEFAULT_PATIENT_ID } from "./patientProfiles";

const STORAGE_KEY = "rehabbridge_medications_v3";
const TAKEN_KEY = "rehabbridge_med_taken_v1";

export type MedSlot = "morning" | "noon" | "evening" | "bedtime";

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  /** 商品名／俗稱，可選 */
  brandName?: string;
  /** 藥品外觀圖（對應辨識用） */
  image: string;
  dose: string;
  /** 服用方式，如飯後、整粒吞服 */
  instruction: string;
  slots: MedSlot[];
  prescribedBy: string;
  /** 開立科別 */
  department?: string;
  purpose: string;
  sideEffects: string[];
  /** 注意事項 */
  cautions?: string[];
  /** 開始日期 YYYY-MM-DD */
  startDate?: string;
  /** 預計結束日期，空＝長期 */
  endDate?: string | null;
  color: string;
}

export interface MedTakenRecord {
  /** `${date}|${medId}|${slot}` */
  key: string;
  takenAt: string;
}

export const MED_SLOTS: {
  id: MedSlot;
  label: string;
  shortLabel: string;
  defaultTime: string;
  hint: string;
}[] = [
  { id: "morning", label: "早上", shortLabel: "早", defaultTime: "08:00", hint: "早餐後" },
  { id: "noon", label: "中午", shortLabel: "午", defaultTime: "12:30", hint: "午餐後" },
  { id: "evening", label: "晚上", shortLabel: "晚", defaultTime: "18:30", hint: "晚餐後" },
  { id: "bedtime", label: "睡前", shortLabel: "睡", defaultTime: "21:30", hint: "就寢前" },
];

export function slotMeta(slot: MedSlot) {
  return MED_SLOTS.find((s) => s.id === slot)!;
}

/** 依目前時段建議高亮哪一欄 */
export function currentSlotHint(now = new Date()): MedSlot {
  const h = now.getHours();
  if (h < 11) return "morning";
  if (h < 15) return "noon";
  if (h < 20) return "evening";
  return "bedtime";
}

const SEED_MEDS: Medication[] = [
  {
    id: "med-celecoxib",
    patientId: DEFAULT_PATIENT_ID,
    name: "塞來昔布",
    brandName: "西樂葆",
    image: "/meds/celecoxib.jpg",
    dose: "200 mg · 1 粒",
    instruction: "飯後整粒吞服，配溫開水",
    slots: ["morning", "evening"],
    prescribedBy: "陳建宏 醫師",
    department: "骨科復健科",
    purpose: "減輕術後關節腫痛與發炎",
    sideEffects: ["胃部不適或消化不良", "頭痛", "水腫", "少數人可能血壓上升"],
    cautions: ["有胃潰瘍病史請先告知醫師", "勿與其他 NSAID 併用", "若胸悶、喘不過氣請立即就醫"],
    startDate: "2026-06-20",
    endDate: "2026-07-20",
    color: "#0d9488",
  },
  {
    id: "med-acetaminophen",
    patientId: DEFAULT_PATIENT_ID,
    name: "乙醯胺酚",
    brandName: "普拿疼",
    image: "/meds/acetaminophen.jpg",
    dose: "500 mg · 1–2 粒",
    instruction: "疼痛時服用，兩次間隔至少 4 小時",
    slots: ["noon"],
    prescribedBy: "陳建宏 醫師",
    department: "骨科復健科",
    purpose: "緩解中度疼痛（必要時）",
    sideEffects: ["少見皮疹", "長期過量可能影響肝功能"],
    cautions: ["一日總量勿超過 4000 mg", "飲酒後勿服用", "與其他含乙醯胺酚成藥勿重複吃"],
    startDate: "2026-06-20",
    endDate: null,
    color: "#0284c7",
  },
  {
    id: "med-pantoprazole",
    patientId: DEFAULT_PATIENT_ID,
    name: "潘妥拉唑",
    brandName: "潘妥洛克",
    image: "/meds/pantoprazole.jpg",
    dose: "40 mg · 1 粒",
    instruction: "早餐前約 30 分鐘整粒吞服",
    slots: ["morning"],
    prescribedBy: "陳建宏 醫師",
    department: "骨科復健科",
    purpose: "保護胃黏膜，降低止痛藥對胃的刺激",
    sideEffects: ["腹瀉或便秘", "腹脹", "頭痛", "少數人可能頭暈"],
    cautions: ["長期使用請依醫師指示", "勿咬碎腸溶錠"],
    startDate: "2026-06-20",
    endDate: "2026-07-20",
    color: "#7c3aed",
  },
  {
    id: "med-rivaroxaban",
    patientId: DEFAULT_PATIENT_ID,
    name: "利伐沙班",
    brandName: "拜瑞妥",
    image: "/meds/rivaroxaban.jpg",
    dose: "10 mg · 1 粒",
    instruction: "晚餐後服用，勿漏服",
    slots: ["evening"],
    prescribedBy: "陳建宏 醫師",
    department: "骨科復健科",
    purpose: "預防術後深部靜脈血栓",
    sideEffects: ["容易瘀青或出血", "牙齦出血", "胃部不適", "少數人可能貧血"],
    cautions: ["跌倒撞傷請告知醫師", "手術／拔牙前務必告知正在服用抗凝血藥", "若黑便、吐血請立即就醫"],
    startDate: "2026-06-20",
    endDate: "2026-07-05",
    color: "#dc2626",
  },
  {
    id: "med-calcium",
    patientId: DEFAULT_PATIENT_ID,
    name: "碳酸鈣＋維生素 D",
    brandName: "鈣爾奇",
    image: "/meds/calcium.jpg",
    dose: "1 錠",
    instruction: "睡前配溫開水",
    slots: ["bedtime"],
    prescribedBy: "林雅婷 醫師",
    department: "復健醫學科",
    purpose: "輔助骨骼與術後恢復",
    sideEffects: ["便秘", "腹脹", "打嗝"],
    cautions: ["與部分抗生素間隔 2 小時", "多喝水"],
    startDate: "2026-06-15",
    endDate: null,
    color: "#ca8a04",
  },
  {
    id: "med-melatonin",
    patientId: DEFAULT_PATIENT_ID,
    name: "褪黑激素",
    image: "/meds/melatonin.jpg",
    dose: "3 mg · 1 粒",
    instruction: "睡前 30 分鐘服用",
    slots: ["bedtime"],
    prescribedBy: "林雅婷 醫師",
    department: "復健醫學科",
    purpose: "改善術後睡眠品質（短期）",
    sideEffects: ["隔日嗜睡", "作夢變多", "輕微頭痛"],
    cautions: ["服藥後勿開車或操作機械", "隔日若仍昏沉請告知醫師調整"],
    startDate: "2026-06-22",
    endDate: "2026-07-12",
    color: "#4f46e5",
  },
];

function notify() {
  window.dispatchEvent(new Event("rehab-medications-updated"));
}

export function subscribeMedications(listener: () => void) {
  window.addEventListener("rehab-medications-updated", listener);
  return () => window.removeEventListener("rehab-medications-updated", listener);
}

function loadMeds(): Medication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Medication[];
  } catch {
    /* ignore */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEDS));
  return [...SEED_MEDS];
}

function saveMeds(list: Medication[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  notify();
}

function loadTaken(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TAKEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveTaken(map: Record<string, string>) {
  try {
    localStorage.setItem(TAKEN_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  notify();
}

function takenKey(date: string, medId: string, slot: MedSlot) {
  return `${date}|${medId}|${slot}`;
}

export function getMedications(patientId = DEFAULT_PATIENT_ID): Medication[] {
  return loadMeds().filter((m) => m.patientId === patientId);
}

export function getMedicationById(id: string): Medication | undefined {
  return loadMeds().find((m) => m.id === id);
}

export function getMedicationsForSlot(
  slot: MedSlot,
  patientId = DEFAULT_PATIENT_ID
): Medication[] {
  return getMedications(patientId).filter((m) => m.slots.includes(slot));
}

export function isMedTaken(
  medId: string,
  slot: MedSlot,
  date = getAppBusinessDateStr()
): boolean {
  return Boolean(loadTaken()[takenKey(date, medId, slot)]);
}

export function markMedTaken(
  medId: string,
  slot: MedSlot,
  date = getAppBusinessDateStr()
) {
  const map = loadTaken();
  map[takenKey(date, medId, slot)] = new Date().toISOString();
  saveTaken(map);
}

export function unmarkMedTaken(
  medId: string,
  slot: MedSlot,
  date = getAppBusinessDateStr()
) {
  const map = loadTaken();
  delete map[takenKey(date, medId, slot)];
  saveTaken(map);
}

export function toggleMedTaken(
  medId: string,
  slot: MedSlot,
  date = getAppBusinessDateStr()
) {
  if (isMedTaken(medId, slot, date)) unmarkMedTaken(medId, slot, date);
  else markMedTaken(medId, slot, date);
}

export function getSlotProgress(
  slot: MedSlot,
  patientId = DEFAULT_PATIENT_ID,
  date = getAppBusinessDateStr()
) {
  const meds = getMedicationsForSlot(slot, patientId);
  const taken = meds.filter((m) => isMedTaken(m.id, slot, date)).length;
  return { total: meds.length, taken, done: meds.length > 0 && taken === meds.length };
}

export function getTodayMedProgress(
  patientId = DEFAULT_PATIENT_ID,
  date = getAppBusinessDateStr()
) {
  const meds = getMedications(patientId);
  let total = 0;
  let taken = 0;
  for (const m of meds) {
    for (const slot of m.slots) {
      total += 1;
      if (isMedTaken(m.id, slot, date)) taken += 1;
    }
  }
  return {
    total,
    taken,
    pct: total === 0 ? 0 : Math.round((taken / total) * 100),
  };
}

/** 測試／重置用 */
export function resetMedicationsToSeed() {
  saveMeds([...SEED_MEDS]);
  saveTaken({});
}
