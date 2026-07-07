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
        completed: false,
        stars: 0 as const,
        sets: 3,
        repsPerSet: 15,
        instruction: "緩慢彎曲膝蓋至90度，然後伸直，保持背部挺直",
        level: 1,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop",
          alt: "坐姿膝關節屈伸示意",
        },
        demoTips: [
          "坐姿或扶椅背站立，單腳緩慢彎曲至約 90 度",
          "膝蓋朝向正前方，不要內扣或外撇",
          "伸直時避免鎖死關節，感受大腿前後側肌群",
        ],
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
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1516307365426-bea5f780b4ad?w=800&h=500&fit=crop",
          alt: "踝關節旋轉示意",
        },
        demoTips: [
          "坐姿將腳踝懸空，以腳跟為支點畫圓",
          "順時針與逆時針各做一半次數",
          "旋轉幅度以不引起疼痛為準",
        ],
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
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop",
          alt: "橋式運動示意",
        },
        demoTips: [
          "平躺屈膝，雙腳與臀同寬踩穩地面",
          "吐氣時將臀部上抬至肩、髖、膝呈一直線",
          "頂點停留 2 秒後緩慢下放",
        ],
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
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop",
          alt: "腹部收縮示意",
        },
        demoTips: [
          "仰臥屈膝，雙手自然放在腹部",
          "吐氣時將肚臍向脊椎方向輕輕內收",
          "保持 5 秒後吸氣放鬆，避免憋氣",
        ],
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
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop",
          alt: "肩關節外展示意",
        },
        demoTips: [
          "身體站直，手臂貼於身側",
          "掌心向下，將手臂緩慢抬至與肩同高",
          "抬至水平即可，避免聳肩或身體側傾",
        ],
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
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=500&fit=crop",
          alt: "手腕屈伸示意",
        },
        demoTips: [
          "前臂平放於桌面或大腿上，手腕懸空",
          "緩慢向上彎曲手腕，再向下回到中立",
          "動作範圍以不引起疼痛為限",
        ],
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

export function getTodayPlanSummary() {
  const completed = allExercises.filter((e) => e.completed).length;
  const pending = allExercises.filter((e) => !e.completed);
  const estimatedMinutes = pending.reduce((sum, exercise) => {
    const match = exercise.duration.match(/(\d+)/);
    return sum + (match ? Number(match[1]) : 10);
  }, 0);

  return {
    total: allExercises.length,
    completed,
    remaining: pending.length,
    estimatedMinutes,
    pendingNames: pending.map((e) => e.name),
  };
}

const JOINT_LABELS: Record<Exercise["pose"]["joint"], string> = {
  leftKnee: "左膝",
  rightKnee: "右膝",
  leftShoulder: "左肩",
  rightShoulder: "右肩",
  leftHip: "左髖",
  rightHip: "右髖",
};

export function getJointLabel(joint: Exercise["pose"]["joint"]): string {
  return JOINT_LABELS[joint];
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
