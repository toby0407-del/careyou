import type { Exercise } from "./exerciseTypes";
import type { ExercisePlanConfig } from "./exercisePlanTypes";
import { formatSetsReps, planFromPose } from "./exercisePlanTypes";
import { getExerciseById } from "./patientExercises";

const STORAGE_KEY = "rehabbridge_exercise_plans";
const ACTIVE_PATIENT_KEY = "rehabbridge_active_patient";

type PlansStore = Record<string, Record<string, ExercisePlanConfig>>;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeExercisePlans(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function defaultPlanFromExercise(exercise: Exercise): ExercisePlanConfig {
  return planFromPose(
    exercise.sets,
    exercise.repsPerSet,
    exercise.pose.flexedAngle,
    exercise.pose.extendedAngle,
    exercise.pose.tolerance
  );
}

/** 每位示範病患的預設個人化參數（醫師可再調整） */
function seedPlans(): PlansStore {
  const knee = (sets: number, reps: number, flex: number, ext: number, tol: number) =>
    planFromPose(sets, reps, flex, ext, tol);

  return {
    p1: {
      "knee-flexion": knee(3, 12, 95, 160, 18),
      "long-arc-quad": knee(2, 12, 100, 165, 18),
      "sit-to-stand": knee(2, 10, 100, 168, 16),
      "mini-squat": knee(2, 10, 110, 165, 16),
      bridge: knee(2, 10, 135, 172, 14),
      "shoulder-abduction": knee(2, 10, 25, 80, 15),
    },
    p2: {
      "knee-flexion": knee(2, 10, 90, 155, 20),
      "long-arc-quad": knee(2, 10, 95, 160, 20),
      "sit-to-stand": knee(2, 8, 95, 165, 18),
      "mini-squat": knee(2, 8, 105, 160, 18),
      bridge: knee(2, 8, 130, 170, 16),
      "shoulder-abduction": knee(2, 8, 20, 75, 18),
    },
    p3: {
      "knee-flexion": knee(2, 12, 92, 158, 18),
      "long-arc-quad": knee(2, 10, 98, 162, 18),
      "sit-to-stand": knee(2, 8, 98, 166, 16),
      "mini-squat": knee(2, 8, 108, 162, 16),
      bridge: knee(2, 8, 132, 170, 15),
      "shoulder-abduction": knee(2, 10, 22, 78, 16),
    },
    p4: {
      "knee-flexion": knee(3, 12, 94, 162, 16),
      "long-arc-quad": knee(2, 12, 100, 165, 16),
      "sit-to-stand": knee(2, 10, 100, 168, 15),
      "mini-squat": knee(2, 10, 110, 165, 15),
      bridge: knee(2, 10, 136, 172, 14),
      "shoulder-abduction": knee(2, 10, 25, 82, 14),
    },
    p5: {
      "knee-flexion": knee(2, 8, 85, 150, 22),
      "long-arc-quad": knee(2, 8, 90, 155, 22),
      "sit-to-stand": knee(2, 6, 90, 160, 20),
      "mini-squat": knee(2, 6, 100, 155, 20),
      bridge: knee(2, 6, 125, 168, 18),
      "shoulder-abduction": knee(2, 8, 18, 70, 20),
    },
  };
}

let memoryStore: PlansStore | null = null;

function loadStore(): PlansStore {
  if (memoryStore) return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryStore = JSON.parse(raw) as PlansStore;
      return memoryStore;
    }
  } catch {
    /* ignore */
  }
  memoryStore = seedPlans();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  return memoryStore;
}

function saveStore(store: PlansStore) {
  memoryStore = store;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  notify();
}

export function getActivePatientId(): string {
  try {
    return localStorage.getItem(ACTIVE_PATIENT_KEY) ?? "p1";
  } catch {
    return "p1";
  }
}

export function setActivePatientId(patientId: string) {
  localStorage.setItem(ACTIVE_PATIENT_KEY, patientId);
  notify();
}

export function getExercisePlan(
  patientId: string,
  exerciseId: string,
  fallback?: Exercise
): ExercisePlanConfig | undefined {
  const store = loadStore();
  const plan = store[patientId]?.[exerciseId];
  if (plan) return plan;
  if (fallback) return defaultPlanFromExercise(fallback);
  return undefined;
}

export function setExercisePlan(
  patientId: string,
  exerciseId: string,
  plan: ExercisePlanConfig
) {
  const store = loadStore();
  if (!store[patientId]) store[patientId] = {};
  store[patientId][exerciseId] = plan;
  saveStore(store);
}

export function setExercisePlans(
  patientId: string,
  plans: Record<string, ExercisePlanConfig>
) {
  const store = loadStore();
  store[patientId] = { ...store[patientId], ...plans };
  saveStore(store);
}

export function getAllPlansForPatient(patientId: string): Record<string, ExercisePlanConfig> {
  const store = loadStore();
  return store[patientId] ?? {};
}

export function resolveExercise(exercise: Exercise, patientId = getActivePatientId()): Exercise {
  const plan = getExercisePlan(patientId, exercise.id, exercise);
  if (!plan) return exercise;

  return {
    ...exercise,
    sets: plan.sets,
    repsPerSet: plan.repsPerSet,
    setsReps: formatSetsReps(plan),
    pose: {
      ...exercise.pose,
      flexedAngle: plan.flexedAngle,
      extendedAngle: plan.extendedAngle,
      tolerance: plan.tolerance,
    },
  };
}

export function resolveExerciseById(
  exerciseId: string,
  patientId = getActivePatientId()
): Exercise | undefined {
  const base = getExerciseById(exerciseId);
  if (!base) return undefined;
  return resolveExercise(base, patientId);
}
