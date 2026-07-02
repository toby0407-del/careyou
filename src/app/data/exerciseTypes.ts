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
  pose: {
    joint: "leftKnee" | "rightKnee" | "leftShoulder" | "rightShoulder" | "leftHip" | "rightHip";
    flexedAngle: number;
    extendedAngle: number;
    tolerance: number;
  };
}
