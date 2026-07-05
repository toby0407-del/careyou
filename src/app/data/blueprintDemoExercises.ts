import type { Exercise } from "./exerciseTypes";
import { getExerciseById, allExercises as patientLevelExercises } from "./patientExercises";
import {
  ALL_PRESCRIPTION_EXERCISES,
  BODY_REGION_LABELS,
  exercisesByRegion,
  type BodyRegion,
  type PrescriptionExercise,
} from "./prescriptionExercises";

const REGION_ACCENTS: Record<BodyRegion, string> = {
  neck: "#a78bfa",
  shoulder: "#3b82f6",
  elbow: "#6366f1",
  wrist: "#8b5cf6",
  core: "#10b981",
  hip: "#f59e0b",
  knee: "#ef4444",
  ankle: "#14b8a6",
};

const REGION_POSE: Record<BodyRegion, Exercise["pose"]> = {
  neck: { joint: "leftShoulder", flexedAngle: 0, extendedAngle: 0, tolerance: 15 },
  shoulder: { joint: "leftShoulder", flexedAngle: 0, extendedAngle: 0, tolerance: 12 },
  elbow: { joint: "leftShoulder", flexedAngle: 0, extendedAngle: 0, tolerance: 15 },
  wrist: { joint: "leftShoulder", flexedAngle: 0, extendedAngle: 0, tolerance: 15 },
  core: { joint: "leftHip", flexedAngle: 0, extendedAngle: 0, tolerance: 18 },
  hip: { joint: "leftHip", flexedAngle: 0, extendedAngle: 0, tolerance: 12 },
  knee: { joint: "leftKnee", flexedAngle: 0, extendedAngle: 0, tolerance: 15 },
  ankle: { joint: "leftKnee", flexedAngle: 0, extendedAngle: 0, tolerance: 20 },
};

const REGION_TIPS: Record<BodyRegion, string[]> = {
  neck: ["保持肩膀放鬆，動作緩慢", "以不引起頭暈或疼痛為準", "呼吸自然，避免憋氣"],
  shoulder: ["肩胛骨穩定，避免聳肩", "動作範圍以無痛為原則", "控制速度，避免甩動"],
  elbow: ["上臂固定，僅前臂活動", "全程控制，避免借力", "關節伸直時勿鎖死"],
  wrist: ["前臂支撐穩定", "手腕活動範圍漸進增加", "出現麻木應立即停止"],
  core: ["吐氣時用力，吸氣時放鬆", "保持骨盆中立", "感受目標肌群收縮"],
  hip: ["膝蓋與腳尖同向", "核心微收，軀幹穩定", "單側完成後再換邊"],
  knee: ["膝蓋朝向正前方", "控制彎伸速度", "避免膝蓋內扣或過度伸直"],
  ankle: ["腳踝為支點，動作畫圓或上下", "幅度以不引起疼痛為準", "可扶穩椅背保持平衡"],
};

function parseSetsReps(setsReps: string): { sets: number; repsPerSet: number } {
  const setsMatch = setsReps.match(/(\d+)\s*組/);
  const repsMatch = setsReps.match(/(\d+)\s*次/);
  return {
    sets: setsMatch ? Number(setsMatch[1]) : 2,
    repsPerSet: repsMatch ? Number(repsMatch[1]) : 10,
  };
}

function estimateDuration(ex: PrescriptionExercise): string {
  const { sets, repsPerSet } = parseSetsReps(ex.setsReps);
  const minutes = Math.max(5, Math.round((sets * repsPerSet) / 12));
  return `約 ${minutes} 分鐘`;
}

function prescriptionToDemoExercise(ex: PrescriptionExercise, level: number): Exercise {
  const existing = getExerciseById(ex.id);
  if (existing) {
    return { ...existing, bodyRegion: ex.region, level };
  }

  const { sets, repsPerSet } = parseSetsReps(ex.setsReps);
  return {
    id: ex.id,
    name: ex.name,
    nameEn: ex.nameEn,
    setsReps: ex.setsReps,
    duration: estimateDuration(ex),
    difficulty: ex.difficulty,
    completed: false,
    stars: 0,
    sets,
    repsPerSet,
    instruction: ex.nameEn ? `${ex.name}（${ex.nameEn}）` : ex.name,
    level,
    demoMedia: {
      type: "image",
      url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop",
      alt: ex.name,
    },
    demoTips: REGION_TIPS[ex.region],
    pose: REGION_POSE[ex.region],
    bodyRegion: ex.region,
  };
}

export interface BlueprintDemoGroup {
  id: BodyRegion | "patient-levels";
  label: string;
  accent: string;
  exercises: Exercise[];
}

function buildBlueprintDemoCatalog(): BlueprintDemoGroup[] {
  let level = 1;
  const groups: BlueprintDemoGroup[] = (Object.keys(exercisesByRegion) as BodyRegion[])
    .map((region) => ({
      id: region,
      label: BODY_REGION_LABELS[region],
      accent: REGION_ACCENTS[region],
      exercises: exercisesByRegion[region].map((ex) => prescriptionToDemoExercise(ex, level++)),
    }))
    .filter((g) => g.exercises.length > 0);

  const prescriptionIds = new Set(ALL_PRESCRIPTION_EXERCISES.map((e) => e.id));
  const extras = patientLevelExercises.filter((e) => !prescriptionIds.has(e.id));
  if (extras.length > 0) {
    groups.push({
      id: "patient-levels",
      label: "患者關卡專屬",
      accent: "#0d9488",
      exercises: extras.map((ex, i) => ({ ...ex, level: level + i })),
    });
  }

  return groups;
}

export const BLUEPRINT_DEMO_GROUPS = buildBlueprintDemoCatalog();

export const allBlueprintDemoExercises: Exercise[] = BLUEPRINT_DEMO_GROUPS.flatMap(
  (g) => g.exercises
);

export function getBlueprintDemoExerciseById(id: string): Exercise | undefined {
  return allBlueprintDemoExercises.find((e) => e.id === id);
}
