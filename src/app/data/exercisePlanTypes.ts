export interface ExercisePlanConfig {
  sets: number;
  repsPerSet: number;
  flexedAngle: number;
  extendedAngle: number;
  tolerance: number;
}

export function planFromPose(
  sets: number,
  repsPerSet: number,
  flexedAngle: number,
  extendedAngle: number,
  tolerance: number
): ExercisePlanConfig {
  return { sets, repsPerSet, flexedAngle, extendedAngle, tolerance };
}

export function formatSetsReps(plan: ExercisePlanConfig): string {
  return `${plan.sets} 組 × ${plan.repsPerSet} 次`;
}

export function formatAngleRange(plan: ExercisePlanConfig): string {
  return `${plan.flexedAngle}°–${plan.extendedAngle}°`;
}
