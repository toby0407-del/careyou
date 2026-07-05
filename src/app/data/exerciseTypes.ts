import type { BodyRegion } from "./prescriptionExercises";

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  setsReps: string;
  duration: string;
  difficulty: 1 | 2 | 3;
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  sets: number;
  repsPerSet: number;
  instruction: string;
  level: number;
  demoMedia: {
    type: "image";
    url: string;
    alt: string;
  };
  demoTips: string[];
  pose: {
    joint: "leftKnee" | "rightKnee" | "leftShoulder" | "rightShoulder" | "leftHip" | "rightHip";
    flexedAngle: number;
    extendedAngle: number;
    tolerance: number;
  };
  /** 動作庫部位（藍圖示範／處方動作用） */
  bodyRegion?: BodyRegion;
}
