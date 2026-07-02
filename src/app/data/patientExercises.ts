import { Dumbbell, Heart, TrendingUp } from "lucide-react";
import type { Exercise } from "./exerciseTypes";

export type { Exercise } from "./exerciseTypes";

export const categories = [
  {
    id: "lower",
    label: "下肢訓練",
    sublabel: "Lower Body",
    icon: TrendingUp,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    accent: "#f59e0b",
    exercises: [
      {
        id: "knee-flexion",
        name: "膝關節屈伸",
        nameEn: "Knee Flexion/Extension",
        setsReps: "3 組 × 15 次",
        duration: "約 12 分鐘",
        difficulty: 2 as const,
        completed: true,
        stars: 3 as const,
        sets: 3,
        repsPerSet: 15,
        instruction: "緩慢彎曲膝蓋至90度，然後伸直，保持背部挺直",
        level: 1,
        pose: { joint: "leftKnee" as const, flexedAngle: 90, extendedAngle: 165, tolerance: 15 },
      },
      {
        id: "ankle-rotation",
        name: "踝關節旋轉",
        nameEn: "Ankle Rotation",
        setsReps: "2 組 × 20 次",
        duration: "約 8 分鐘",
        difficulty: 1 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 20,
        instruction: "以腳踝為軸心，順時針與逆時針各旋轉，動作緩慢穩定",
        level: 2,
        pose: { joint: "leftKnee" as const, flexedAngle: 100, extendedAngle: 160, tolerance: 20 },
      },
    ],
  },
  {
    id: "core",
    label: "核心訓練",
    sublabel: "Core Training",
    icon: Heart,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-500",
    accent: "#10b981",
    exercises: [
      {
        id: "bridge",
        name: "橋式運動",
        nameEn: "Bridge Exercise",
        setsReps: "3 組 × 12 次",
        duration: "約 10 分鐘",
        difficulty: 2 as const,
        completed: false,
        stars: 0 as const,
        sets: 3,
        repsPerSet: 12,
        instruction: "平躺屈膝，雙腳踩地，臀部上抬至與身體成一直線，停留2秒",
        level: 3,
        pose: { joint: "leftHip" as const, flexedAngle: 140, extendedAngle: 175, tolerance: 12 },
      },
      {
        id: "ab-contraction",
        name: "腹部收縮",
        nameEn: "Abdominal Contraction",
        setsReps: "3 組 × 15 次",
        duration: "約 9 分鐘",
        difficulty: 1 as const,
        completed: false,
        stars: 0 as const,
        sets: 3,
        repsPerSet: 15,
        instruction: "深吸一口氣，吐氣時收縮腹部肌群，保持5秒後放鬆",
        level: 4,
        pose: { joint: "leftHip" as const, flexedAngle: 130, extendedAngle: 170, tolerance: 18 },
      },
    ],
  },
  {
    id: "upper",
    label: "上肢訓練",
    sublabel: "Upper Body",
    icon: Dumbbell,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    accent: "#3b82f6",
    exercises: [
      {
        id: "shoulder-abduction",
        name: "肩關節外展",
        nameEn: "Shoulder Abduction",
        setsReps: "2 組 × 10 次",
        duration: "約 10 分鐘",
        difficulty: 3 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 10,
        instruction: "手臂由側邊緩慢抬起至水平位置，保持肩膀放鬆不聳肩",
        level: 5,
        pose: { joint: "leftShoulder" as const, flexedAngle: 30, extendedAngle: 85, tolerance: 12 },
      },
      {
        id: "wrist-flexion",
        name: "手腕屈伸",
        nameEn: "Wrist Flexion/Extension",
        setsReps: "3 組 × 20 次",
        duration: "約 8 分鐘",
        difficulty: 1 as const,
        completed: false,
        stars: 0 as const,
        sets: 3,
        repsPerSet: 20,
        instruction: "前臂平放，緩慢彎曲手腕向上再向下，範圍不超過疼痛角度",
        level: 6,
        pose: { joint: "leftShoulder" as const, flexedAngle: 20, extendedAngle: 70, tolerance: 15 },
      },
    ],
  },
];

export const allExercises: Exercise[] = categories.flatMap((c) => c.exercises);

export function getExerciseById(id: string): Exercise | undefined {
  return allExercises.find((e) => e.id === id);
}

export function getLevelStatus(
  exercise: Exercise,
  index: number,
  list: Exercise[] = allExercises
): "locked" | "active" | "completed" {
  const prerequisitesMet = list.slice(0, index).every((e) => e.completed);
  if (!prerequisitesMet) return "locked";
  if (exercise.completed) return "completed";
  return "active";
}

export function isExerciseUnlocked(id: string): boolean {
  const index = allExercises.findIndex((e) => e.id === id);
  if (index < 0) return false;
  return getLevelStatus(allExercises[index], index) !== "locked";
}

export const weeklyResults = [
  { day: "週一", completed: 5, total: 6, accuracy: 88 },
  { day: "週二", completed: 6, total: 6, accuracy: 92 },
  { day: "週三", completed: 4, total: 6, accuracy: 85 },
  { day: "週四", completed: 6, total: 6, accuracy: 94 },
  { day: "週五", completed: 3, total: 6, accuracy: 78 },
  { day: "週六", completed: 5, total: 6, accuracy: 90 },
  { day: "今日", completed: 2, total: 6, accuracy: 86 },
];
