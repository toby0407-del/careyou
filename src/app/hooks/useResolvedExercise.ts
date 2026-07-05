import { useEffect, useState } from "react";
import type { Exercise } from "../data/exerciseTypes";
import { allExercises, getExerciseById } from "../data/patientExercises";
import {
  getActivePatientId,
  resolveExercise,
  subscribeExercisePlans,
} from "../data/patientExercisePlans";

export function useResolvedExercise(exerciseId: string): Exercise | undefined {
  const [, version] = useState(0);

  useEffect(() => subscribeExercisePlans(() => version((v) => v + 1)), []);

  const base = getExerciseById(exerciseId);
  if (!base) return undefined;
  return resolveExercise(base, getActivePatientId());
}

export function useResolvedExercises(): Exercise[] {
  const [, version] = useState(0);

  useEffect(() => subscribeExercisePlans(() => version((v) => v + 1)), []);

  const patientId = getActivePatientId();
  return allExercises.map((ex) => resolveExercise(ex, patientId));
}
