export type RepPhase = "idle" | "descending" | "bottom" | "ascending";

export interface RepCounterState {
  phase: RepPhase;
  currentRep: number;
  currentSet: number;
  qualityReps: number;
  lastAngle: number | null;
}

export interface RepCounterConfig {
  sets: number;
  repsPerSet: number;
  targetAngle: number;
  angleTolerance: number;
  /** Standing/extended angle threshold */
  extendedAngle?: number;
}

export function createRepCounter(config: RepCounterConfig): RepCounterState {
  return {
    phase: "idle",
    currentRep: 0,
    currentSet: 1,
    qualityReps: 0,
    lastAngle: null,
  };
}

/**
 * State machine for rep counting based on joint angle.
 * A rep counts when angle goes from extended → bent (bottom) → extended.
 */
export function updateRepCounter(
  state: RepCounterState,
  angle: number | null,
  config: RepCounterConfig
): { state: RepCounterState; repCompleted: boolean; quality: boolean; setCompleted: boolean; allCompleted: boolean } {
  const extended = config.extendedAngle ?? 160;
  const bottomTarget = config.targetAngle;
  const tol = config.angleTolerance;

  if (angle === null) {
    return { state, repCompleted: false, quality: false, setCompleted: false, allCompleted: false };
  }

  const next = { ...state, lastAngle: angle };
  let repCompleted = false;
  let quality = false;
  let setCompleted = false;
  let allCompleted = false;

  const isExtended = angle >= extended - tol;
  const isBottom = angle <= bottomTarget + tol;

  switch (state.phase) {
    case "idle":
      if (!isExtended && angle < extended - 10) next.phase = "descending";
      else if (isExtended) next.phase = "descending";
      break;

    case "descending":
      if (isBottom) next.phase = "bottom";
      break;

    case "bottom":
      if (angle > bottomTarget + tol) next.phase = "ascending";
      break;

    case "ascending":
      if (isExtended) {
        repCompleted = true;
        quality = Math.abs(angle - extended) < tol + 5;
        next.currentRep += 1;
        if (quality) next.qualityReps += 1;
        next.phase = "idle";

        if (next.currentRep >= config.repsPerSet) {
          setCompleted = true;
          next.currentRep = 0;
          next.currentSet += 1;

          if (next.currentSet > config.sets) {
            allCompleted = true;
          }
        }
      }
      break;
  }

  return { state: next, repCompleted, quality, setCompleted, allCompleted };
}
