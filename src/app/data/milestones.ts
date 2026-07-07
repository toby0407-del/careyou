import {
  Flame,
  Trophy,
  Target,
  Heart,
  Star,
  Medal,
  Zap,
  Calendar,
  Users,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import {
  getStreakDays,
  getLifetimeCompletedLevelCount,
  getTotalValidReps,
  getAllSessions,
  todayStr,
} from "./progressStore";
import { shiftIsoDate } from "../lib/mockTime";

export type MilestoneCategory = "streak" | "level" | "quality" | "recovery" | "special";

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  icon: LucideIcon;
  target: number;
  current: number;
  unit: string;
  unlocked: boolean;
  unlockedDate?: string;
  color: string;
  bg: string;
  reward: string;
}

export const milestoneCategories: { id: MilestoneCategory; label: string; sublabel: string }[] = [
  { id: "streak", label: "連續訓練", sublabel: "堅持每一天" },
  { id: "level", label: "關卡通關", sublabel: "闖關成就" },
  { id: "quality", label: "動作品質", sublabel: "標準動作累積" },
  { id: "recovery", label: "康復進展", sublabel: "身體機能提升" },
  { id: "special", label: "特別時刻", sublabel: "溫暖回憶" },
];

const EXTRA_LOCKED_MILESTONES: Milestone[] = [
  ["streak-45", "streak", "45 天堅持", "連續訓練 45 天", Medal, 45, 24, "天", "text-orange-600", "bg-orange-50", "獲得進階毅力徽章"],
  ["streak-60", "streak", "雙月勇者", "連續訓練 60 天", Star, 60, 24, "天", "text-amber-600", "bg-amber-50", "解鎖專屬勳章底座"],
  ["streak-90", "streak", "百日近在眼前", "連續訓練 90 天", Flame, 90, 24, "天", "text-orange-600", "bg-orange-50", "家屬端榮譽展示"],
  ["level-4", "level", "四關突破", "完成 4 個復健關卡", Trophy, 4, 3, "關", "text-teal-600", "bg-teal-50", "解鎖新挑戰島"],
  ["level-5", "level", "五星衝刺", "完成 5 個復健關卡", Trophy, 5, 3, "關", "text-emerald-600", "bg-emerald-50", "獲得進階星星包"],
  ["level-speed", "level", "快速通關", "7 天內完成 2 個關卡", Zap, 2, 1, "關", "text-teal-600", "bg-teal-50", "速度達人成就"],
  ["quality-95", "quality", "品質王者", "單次訓練準確率達 95%", Target, 95, 91, "%", "text-blue-600", "bg-blue-50", "AI 高階稱讚語音"],
  ["quality-1000", "quality", "千次標準", "累計 1000 次標準動作", Zap, 1000, 468, "次", "text-blue-600", "bg-blue-50", "動作宗師稱號"],
  ["quality-streak", "quality", "三日完美", "連續 3 天訓練品質超過 90%", Star, 3, 2, "天", "text-violet-600", "bg-violet-50", "品質連勝徽章"],
  ["quality-balance", "quality", "穩定輸出", "連續 10 次動作全部達標", Target, 10, 7, "次", "text-blue-600", "bg-blue-50", "穩定高手徽章"],
  ["recovery-ankle", "recovery", "踝關節提升", "踝關節活動角度提升 10°", Heart, 10, 7, "°", "text-rose-600", "bg-rose-50", "踝部進步回饋"],
  ["recovery-core", "recovery", "核心穩定", "核心控制分數提升 20 分", Heart, 20, 12, "分", "text-rose-600", "bg-rose-50", "核心穩定徽章"],
  ["recovery-gait", "recovery", "步態更穩", "步行穩定度提升 15%", Heart, 15, 9, "%", "text-rose-600", "bg-rose-50", "步態進步通知"],
  ["recovery-pain", "recovery", "疼痛下降", "疼痛指數下降 3 分", Heart, 3, 2, "分", "text-rose-600", "bg-rose-50", "疼痛改善紀錄"],
  ["recovery-posture", "recovery", "姿勢調整", "骨盆控制穩定 7 天", Heart, 7, 4, "天", "text-rose-600", "bg-rose-50", "姿勢控制徽章"],
  ["special-morning", "special", "晨間打卡", "連續 5 次上午完成訓練", Calendar, 5, 3, "次", "text-pink-600", "bg-pink-50", "晨間好習慣勳章"],
  ["special-night", "special", "晚間堅持", "連續 5 次晚間完成訓練", Calendar, 5, 2, "次", "text-pink-600", "bg-pink-50", "晚間自律徽章"],
  ["special-weekend", "special", "週末也努力", "連續 4 個週末都有訓練", Calendar, 4, 2, "週", "text-pink-600", "bg-pink-50", "週末堅持成就"],
  ["special-family3", "special", "家人三連拍", "與家人共同完成 3 次訓練", Users, 3, 1, "次", "text-pink-600", "bg-pink-50", "時光迴廊主題框"],
].map(([id, category, title, description, icon, target, current, unit, color, bg, reward]) => ({
  id,
  category: category as MilestoneCategory,
  title,
  description,
  icon: icon as LucideIcon,
  target: target as number,
  current: current as number,
  unit: unit as string,
  unlocked: false,
  color: color as string,
  bg: bg as string,
  reward: reward as string,
}));

export const milestones: Milestone[] = [
  // 連續訓練
  {
    id: "streak-3",
    category: "streak",
    title: "初露鋒芒",
    description: "連續訓練 3 天",
    icon: Flame,
    target: 3,
    current: 24,
    unit: "天",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-06-20"),
    color: "text-orange-600",
    bg: "bg-orange-50",
    reward: "獲得「起步者」徽章",
  },
  {
    id: "streak-7",
    category: "streak",
    title: "一週達人",
    description: "連續訓練 7 天",
    icon: Flame,
    target: 7,
    current: 24,
    unit: "天",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-06-24"),
    color: "text-orange-600",
    bg: "bg-orange-50",
    reward: "解鎖專屬鼓勵語音",
  },
  {
    id: "streak-14",
    category: "streak",
    title: "兩週勇士",
    description: "連續訓練 14 天",
    icon: Medal,
    target: 14,
    current: 24,
    unit: "天",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-07-01"),
    color: "text-orange-600",
    bg: "bg-orange-50",
    reward: "獲得「毅力」勳章",
  },
  {
    id: "streak-30",
    category: "streak",
    title: "月度之星",
    description: "連續訓練 30 天",
    icon: Star,
    target: 30,
    current: 24,
    unit: "天",
    unlocked: false,
    color: "text-amber-600",
    bg: "bg-amber-50",
    reward: "家屬端收到喜報通知",
  },
  // 關卡通關
  {
    id: "level-first",
    category: "level",
    title: "首關告捷",
    description: "完成第一個復健關卡",
    icon: Trophy,
    target: 1,
    current: 1,
    unit: "關",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-06-18"),
    color: "text-teal-600",
    bg: "bg-teal-50",
    reward: "解鎖關卡 2",
  },
  {
    id: "level-half",
    category: "level",
    title: "半程英雄",
    description: "完成 3 個復健關卡",
    icon: Trophy,
    target: 3,
    current: 3,
    unit: "關",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-07-06"),
    color: "text-teal-600",
    bg: "bg-teal-50",
    reward: "獲得 50 顆星星",
  },
  {
    id: "level-all",
    category: "level",
    title: "全關制霸",
    description: "完成全部 6 個關卡",
    icon: Trophy,
    target: 6,
    current: 3,
    unit: "關",
    unlocked: false,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    reward: "頒發「復健達人」證書",
  },
  // 動作品質
  {
    id: "quality-90",
    category: "quality",
    title: "精準達人",
    description: "單次訓練準確率達 90%",
    icon: Target,
    target: 90,
    current: 91,
    unit: "%",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-07-08"),
    color: "text-blue-600",
    bg: "bg-blue-50",
    reward: "AI 語音特別讚美",
  },
  {
    id: "quality-500",
    category: "quality",
    title: "五百標準",
    description: "累計 500 次標準動作",
    icon: Zap,
    target: 500,
    current: 468,
    unit: "次",
    unlocked: false,
    color: "text-blue-600",
    bg: "bg-blue-50",
    reward: "動作大師稱號",
  },
  {
    id: "quality-perfect",
    category: "quality",
    title: "完美一課",
    description: "單次訓練全部動作達標",
    icon: Star,
    target: 1,
    current: 1,
    unit: "次",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-06-25"),
    color: "text-violet-600",
    bg: "bg-violet-50",
    reward: "3 顆金星獎勵",
  },
  // 康復進展
  {
    id: "recovery-knee",
    category: "recovery",
    title: "膝關節進步",
    description: "膝關節活動角度提升 15°",
    icon: Heart,
    target: 15,
    current: 15,
    unit: "°",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-07-10"),
    color: "text-rose-600",
    bg: "bg-rose-50",
    reward: "醫師端進度更新",
  },
  {
    id: "recovery-independent",
    category: "recovery",
    title: "自主復健",
    description: "連續 5 天不需提醒即開始訓練",
    icon: Heart,
    target: 5,
    current: 5,
    unit: "天",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-07-13"),
    color: "text-rose-600",
    bg: "bg-rose-50",
    reward: "獨立復健者徽章",
  },
  // 特別時刻
  {
    id: "special-family",
    category: "special",
    title: "家人陪伴日",
    description: "在家屬陪同下完成訓練",
    icon: Users,
    target: 1,
    current: 1,
    unit: "次",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-06-22"),
    color: "text-pink-600",
    bg: "bg-pink-50",
    reward: "時光迴廊新增合照",
  },
  {
    id: "special-doctor",
    category: "special",
    title: "醫師嘉獎",
    description: "獲得醫師親筆鼓勵評語",
    icon: Stethoscope,
    target: 1,
    current: 1,
    unit: "次",
    unlocked: true,
    unlockedDate: shiftIsoDate("2026-06-28"),
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    reward: "專屬鼓勵卡片",
  },
  {
    id: "special-birthday",
    category: "special",
    title: "生日訓練",
    description: "在生日當天完成復健訓練",
    icon: Calendar,
    target: 1,
    current: 0,
    unit: "次",
    unlocked: false,
    color: "text-pink-600",
    bg: "bg-pink-50",
    reward: "生日限定徽章",
  },
  ...EXTRA_LOCKED_MILESTONES,
];

export const unlockedCount = milestones.filter((m) => m.unlocked).length;

const LEVEL_COUNT_IDS = new Set(["level-first", "level-half", "level-all", "level-4", "level-5"]);
const REP_COUNT_IDS = new Set(["quality-500", "quality-1000"]);
const QUALITY_PCT_IDS = new Set(["quality-90", "quality-95"]);

/** 里程碑即時進度 — 由統一進度資料層驅動（連續天數 / 關卡 / 標準動作 / 品質） */
export function getLiveMilestones(): Milestone[] {
  const streak = getStreakDays();
  const completedLevels = getLifetimeCompletedLevelCount();
  const totalReps = getTotalValidReps();
  const sessionQualities = getAllSessions().map((s) => s.quality);
  const bestQuality = Math.max(91, ...(sessionQualities.length ? sessionQualities : [0]));

  return milestones.map((m) => {
    let current: number | null = null;
    if (m.category === "streak" && m.unit === "天") current = streak;
    else if (LEVEL_COUNT_IDS.has(m.id)) current = completedLevels;
    else if (REP_COUNT_IDS.has(m.id)) current = totalReps;
    else if (QUALITY_PCT_IDS.has(m.id)) current = bestQuality;

    // 非即時驅動的里程碑維持原設定
    if (current === null) return m;

    const unlocked = current >= m.target;
    return {
      ...m,
      current,
      unlocked,
      unlockedDate: unlocked ? (m.unlockedDate ?? todayStr()) : undefined,
    };
  });
}
