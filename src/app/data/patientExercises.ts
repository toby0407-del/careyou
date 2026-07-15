import { Dumbbell, Heart, TrendingUp } from "lucide-react";
import type { Exercise } from "./exerciseTypes";

export type { Exercise } from "./exerciseTypes";

/**
 * 患者端今日關卡 — 專為展示／鏡頭計次穩定度挑選
 * 只保留大關節、幅度明顯、正面拍攝容易成功的動作
 * （踝部細動、等長收腹、手腕等已移出今日地圖）
 */
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
        setsReps: "3 組 × 12 次",
        duration: "約 10 分鐘",
        difficulty: 1 as const,
        completed: false,
        stars: 0 as const,
        sets: 3,
        repsPerSet: 12,
        instruction: "坐姿或站姿，緩慢彎曲膝蓋再伸直；請側身或正面讓鏡頭看清大腿與小腿",
        level: 1,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop",
          alt: "坐姿膝關節屈伸示意",
        },
        demoTips: [
          "膝蓋朝正前方，單腳彎至約 90 度後再伸直",
          "鏡頭請拍到髖、膝、踝三點",
          "伸直時不要鎖死關節，動作放慢較易計次",
        ],
        // 幅度大 + 容差略寬，展示較不易漏計
        pose: { joint: "leftKnee" as const, flexedAngle: 95, extendedAngle: 160, tolerance: 18 },
      },
      {
        id: "long-arc-quad",
        name: "坐姿膝伸直",
        nameEn: "Long Arc Quad",
        setsReps: "2 組 × 12 次",
        duration: "約 8 分鐘",
        difficulty: 1 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 12,
        instruction: "坐在椅子上，將小腿向前伸直再緩慢放下；側面拍攝最清楚",
        level: 2,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop",
          alt: "坐姿膝伸直示意",
        },
        demoTips: [
          "坐穩椅面，大腿固定，只動小腿",
          "伸直到接近水平即可，頂點停約 1 秒",
          "鏡頭放在座椅側邊，看到整條腿",
        ],
        pose: { joint: "leftKnee" as const, flexedAngle: 100, extendedAngle: 165, tolerance: 18 },
      },
      {
        id: "sit-to-stand",
        name: "坐到站",
        nameEn: "Sit to Stand",
        setsReps: "2 組 × 10 次",
        duration: "約 8 分鐘",
        difficulty: 2 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 10,
        instruction: "從椅子坐姿站起再坐下，軀幹保持穩定；請全身入鏡",
        level: 3,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
          alt: "坐到站示意",
        },
        demoTips: [
          "雙腳與肩同寬踩穩，起身時膝蓋朝前",
          "可輕扶椅緣，避免甩動借力",
          "鏡頭正面或側面拍攝，從頭到腳都入畫",
        ],
        pose: { joint: "leftHip" as const, flexedAngle: 100, extendedAngle: 168, tolerance: 16 },
      },
      {
        id: "mini-squat",
        name: "半蹲起",
        nameEn: "Mini Squat",
        setsReps: "2 組 × 10 次",
        duration: "約 8 分鐘",
        difficulty: 2 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 10,
        instruction: "雙腳與肩同寬，緩慢下蹲至大腿微彎再站起；請正面全身入鏡",
        level: 4,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
          alt: "半蹲起示意",
        },
        demoTips: [
          "膝蓋朝腳尖方向，不要內夾",
          "下蹲幅度約 1/3 即可，不必全蹲",
          "鏡頭正面從頭到腳都入畫，雙手可自然前伸輔助平衡",
        ],
        pose: { joint: "leftKnee" as const, flexedAngle: 110, extendedAngle: 165, tolerance: 16 },
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
        setsReps: "2 組 × 10 次",
        duration: "約 8 分鐘",
        difficulty: 2 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 10,
        instruction: "平躺屈膝，臀部上抬再放下；請側躺式側面拍攝看到髖部抬起",
        level: 5,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop",
          alt: "橋式運動示意",
        },
        demoTips: [
          "雙腳與臀同寬踩穩，吐氣抬臀",
          "抬至肩—髖—膝接近一直線後停留約 1 秒",
          "鏡頭放側邊，避免俯拍否則髖角不易偵測",
        ],
        pose: { joint: "leftHip" as const, flexedAngle: 135, extendedAngle: 172, tolerance: 14 },
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
        duration: "約 8 分鐘",
        difficulty: 2 as const,
        completed: false,
        stars: 0 as const,
        sets: 2,
        repsPerSet: 10,
        instruction: "手臂由身側緩慢抬至接近肩高再放下；正面拍攝最穩",
        level: 6,
        demoMedia: {
          type: "image" as const,
          url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop",
          alt: "肩關節外展示意",
        },
        demoTips: [
          "站直、肩膀放鬆不聳肩",
          "掌心朝下，抬至與肩同高即可",
          "鏡頭正面全身入鏡，手臂不要被身體擋住",
        ],
        pose: { joint: "leftShoulder" as const, flexedAngle: 25, extendedAngle: 80, tolerance: 15 },
      },
    ],
  },
];

/** 今日關卡順序（展示穩定優先） */
export const TODAY_LEVEL_IDS = [
  "knee-flexion",
  "long-arc-quad",
  "sit-to-stand",
  "mini-squat",
  "bridge",
  "shoulder-abduction",
] as const;

const exerciseById = new Map(
  categories.flatMap((c) => c.exercises).map((ex) => [ex.id, ex] as const)
);

export const allExercises: Exercise[] = TODAY_LEVEL_IDS.map((id) => {
  const ex = exerciseById.get(id);
  if (!ex) throw new Error(`缺少動作定義：${id}`);
  return ex;
});

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
  { day: "週一", completed: 4, total: 5, accuracy: 88 },
  { day: "週二", completed: 5, total: 5, accuracy: 92 },
  { day: "週三", completed: 3, total: 5, accuracy: 85 },
  { day: "週四", completed: 5, total: 5, accuracy: 94 },
  { day: "週五", completed: 3, total: 5, accuracy: 78 },
  { day: "週六", completed: 4, total: 5, accuracy: 90 },
  { day: "今日", completed: 3, total: 5, accuracy: 89 },
];
