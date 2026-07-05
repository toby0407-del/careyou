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
      "knee-flexion": knee(3, 15, 90, 165, 15),
      "ankle-rotation": knee(2, 20, 10, 45, 12),
      bridge: knee(3, 12, 140, 175, 12),
      "ab-contraction": knee(3, 15, 30, 60, 10),
      "shoulder-abduction": knee(3, 12, 30, 85, 12),
      "wrist-flexion": knee(2, 15, 45, 75, 15),
    },
    p2: {
      "knee-flexion": knee(2, 10, 75, 150, 20),
      "ankle-rotation": knee(2, 15, 8, 40, 15),
      bridge: knee(2, 10, 130, 170, 15),
      "ab-contraction": knee(2, 12, 25, 55, 12),
      "shoulder-abduction": knee(2, 10, 25, 75, 15),
      "wrist-flexion": knee(2, 12, 40, 70, 18),
    },
    p3: {
      "knee-flexion": knee(2, 12, 80, 155, 18),
      "ankle-rotation": knee(2, 18, 12, 42, 14),
      bridge: knee(2, 8, 125, 168, 18),
      "ab-contraction": knee(2, 10, 28, 58, 14),
      "shoulder-abduction": knee(3, 8, 20, 70, 18),
      "wrist-flexion": knee(3, 10, 50, 80, 16),
    },
    p4: {
      "knee-flexion": knee(3, 12, 88, 162, 14),
      "ankle-rotation": knee(2, 16, 10, 44, 12),
      bridge: knee(3, 10, 135, 172, 14),
      "ab-contraction": knee(3, 12, 32, 62, 11),
      "shoulder-abduction": knee(3, 10, 28, 80, 13),
      "wrist-flexion": knee(2, 14, 42, 72, 14),
    },
    p5: {
      "knee-flexion": knee(2, 8, 70, 145, 22),
      "ankle-rotation": knee(2, 12, 6, 38, 16),
      bridge: knee(2, 6, 120, 165, 20),
      "ab-contraction": knee(2, 8, 22, 50, 15),
      "shoulder-abduction": knee(2, 8, 18, 65, 20),
      "wrist-flexion": knee(2, 10, 38, 68, 18),
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
