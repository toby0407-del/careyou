import type { Keypoint } from "@tensorflow-models/pose-detection";
import type { Exercise } from "../data/patientExercises";

export interface Point2D {
  x: number;
  y: number;
  score?: number;
}

/** MoveNet / COCO — 17 keypoints */
const COCO_CONNECTIONS: [string, string][] = [
  ["nose", "left_eye"],
  ["nose", "right_eye"],
  ["left_eye", "left_ear"],
  ["right_eye", "right_ear"],
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

/** BlazePose / ML Kit — 33 keypoints (face, hands, feet included) */
const BLAZEPOSE_KEYPOINTS = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer",
  "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_pinky", "right_pinky",
  "left_index", "right_index", "left_thumb", "right_thumb",
  "left_hip", "right_hip", "left_knee", "right_knee",
  "left_ankle", "right_ankle", "left_heel", "right_heel",
  "left_foot_index", "right_foot_index",
] as const;

const BLAZEPOSE_INDEX: Record<string, number> = Object.fromEntries(
  BLAZEPOSE_KEYPOINTS.map((n, i) => [n, i])
);

const BLAZEPOSE_PAIRS: [number, number][] = [
  [0, 1], [0, 4], [1, 2], [2, 3], [3, 7], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [11, 23], [12, 14], [14, 16], [12, 24],
  [13, 15], [15, 17], [16, 18], [16, 20], [15, 19], [15, 21], [16, 22],
  [17, 19], [18, 20], [23, 25], [23, 24], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [27, 31], [28, 32], [29, 31], [30, 32],
];

const FACE_NAMES = new Set([
  "nose", "left_eye_inner", "left_eye", "left_eye_outer",
  "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right",
]);

const HAND_NAMES = new Set([
  "left_pinky", "right_pinky", "left_index", "right_index",
  "left_thumb", "right_thumb",
]);

const JOINT_TRIPLETS: Record<
  Exercise["pose"]["joint"],
  [string, string, string]
> = {
  leftKnee: ["left_hip", "left_knee", "left_ankle"],
  rightKnee: ["right_hip", "right_knee", "right_ankle"],
  leftShoulder: ["left_hip", "left_shoulder", "left_elbow"],
  rightShoulder: ["right_hip", "right_shoulder", "right_elbow"],
  leftHip: ["left_shoulder", "left_hip", "left_knee"],
  rightHip: ["right_shoulder", "right_hip", "right_knee"],
};

export function getKeypoint(keypoints: Keypoint[], name: string, minScore = 0.3): Point2D | null {
  const kp = keypoints.find((k) => k.name === name);
  if (!kp || (kp.score ?? 0) < minScore) return null;
  return { x: kp.x, y: kp.y, score: kp.score };
}

export function isDenseModel(keypoints: Keypoint[]): boolean {
  return keypoints.length >= 25;
}

export function getKeypointCount(keypoints: Keypoint[]): number {
  return keypoints.filter((k) => (k.score ?? 0) >= 0.3).length;
}

export function angleAtJoint(a: Point2D, b: Point2D, c: Point2D): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return NaN;
  const angle = (Math.atan2(Math.abs(cross), dot) * 180) / Math.PI;
  return Number.isFinite(angle) ? angle : NaN;
}

export function getJointAngle(keypoints: Keypoint[], joint: Exercise["pose"]["joint"]): number | null {
  const [aName, bName, cName] = JOINT_TRIPLETS[joint];
  const a = getKeypoint(keypoints, aName);
  const b = getKeypoint(keypoints, bName);
  const c = getKeypoint(keypoints, cName);
  if (!a || !b || !c) return null;
  const angle = Math.round(angleAtJoint(a, b, c));
  return Number.isFinite(angle) ? angle : null;
}

export type RepPhase = "idle" | "flexed" | "extended";

export interface RepTracker {
  phase: RepPhase;
  validReps: number;
  invalidReps: number;
  lastAngle: number | null;
  feedback: string;
  isStandard: boolean;
}

export function createRepTracker(): RepTracker {
  return {
    phase: "idle",
    validReps: 0,
    invalidReps: 0,
    lastAngle: null,
    feedback: "請面向鏡頭，準備開始動作",
    isStandard: false,
  };
}

export function updateRepTracker(
  tracker: RepTracker,
  angle: number | null,
  exercise: Exercise
): RepTracker {
  const next = { ...tracker };
  if (angle === null) {
    next.feedback = "偵測不到關節，請調整站位";
    next.isStandard = false;
    return next;
  }

  next.lastAngle = angle;
  const { flexedAngle, extendedAngle, tolerance } = exercise.pose;
  const isFlexed = angle <= flexedAngle + tolerance;
  const isExtended = angle >= extendedAngle - tolerance;
  const midTarget = (flexedAngle + extendedAngle) / 2;
  const deviation = Math.abs(angle - midTarget);
  next.isStandard = deviation <= tolerance * 1.5;

  if (next.phase === "idle" || next.phase === "extended") {
    if (isFlexed) {
      next.phase = "flexed";
      next.feedback = "很好！現在慢慢伸直";
    } else if (!isExtended) {
      next.feedback = next.isStandard ? "動作穩定，繼續彎曲" : "請加大彎曲幅度";
    }
  }

  if (next.phase === "flexed") {
    if (isExtended) {
      next.phase = "extended";
      if (next.isStandard) {
        next.validReps += 1;
        next.feedback = "標準動作！+1 次";
      } else {
        next.invalidReps += 1;
        next.feedback = "幅度不足，這次不計入";
      }
    } else {
      next.feedback = next.isStandard ? "保持彎曲，準備伸直" : "請彎曲至目標角度";
    }
  }

  if (next.phase === "extended" && isFlexed) {
    next.phase = "flexed";
  }

  return next;
}

function kpByIndex(keypoints: Keypoint[], idx: number, minScore = 0.15): Point2D | null {
  const kp = keypoints[idx];
  if (!kp || (kp.score ?? 0) < minScore) return null;
  return { x: kp.x, y: kp.y };
}

/** 若模型回傳 0–1 正規化座標，轉成像素座標 */
function scaleKeypointsToPixels(keypoints: Keypoint[], width: number, height: number): Keypoint[] {
  if (keypoints.length === 0) return keypoints;
  const visible = keypoints.filter((k) => (k.score ?? 0) > 0.1);
  if (visible.length === 0) return keypoints;
  const maxX = Math.max(...visible.map((k) => k.x));
  const maxY = Math.max(...visible.map((k) => k.y));
  if (maxX > 1.5 || maxY > 1.5) return keypoints;
  return keypoints.map((k) => ({
    ...k,
    x: k.x * width,
    y: k.y * height,
  }));
}

function jointColor(name?: string): { fill: string; stroke: string; radius: number } {
  if (name && FACE_NAMES.has(name)) return { fill: "#a7f3d0", stroke: "#6ee7b7", radius: 3 };
  if (name && HAND_NAMES.has(name)) return { fill: "#5eead4", stroke: "#2dd4bf", radius: 4 };
  if (name?.includes("foot") || name?.includes("heel") || name?.includes("ankle")) {
    return { fill: "#34d399", stroke: "#10b981", radius: 5 };
  }
  return { fill: "#10b981", stroke: "#34d399", radius: 5 };
}

function drawJointDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke: string
) {
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  if (keypoints.length === 0) return;

  const scaled = scaleKeypointsToPixels(keypoints, width, height);
  const dense = isDenseModel(scaled);
  const minScore = 0.15;

  if (dense) {
    for (const [ai, bi] of BLAZEPOSE_PAIRS) {
      const a = kpByIndex(scaled, ai, minScore);
      const b = kpByIndex(scaled, bi, minScore);
      if (!a || !b) continue;
      const nameA = scaled[ai]?.name;
      const isFace = nameA && FACE_NAMES.has(nameA);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isFace ? "rgba(167, 243, 208, 0.85)" : "rgba(52, 211, 153, 0.95)";
      ctx.lineWidth = isFace ? 2 : 4;
      ctx.lineCap = "round";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = isFace ? 4 : 8;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    for (const kp of scaled) {
      if ((kp.score ?? 0) < minScore) continue;
      const { fill, stroke, radius } = jointColor(kp.name);
      drawJointDot(ctx, kp.x, kp.y, radius + 2, fill, stroke);
    }
  } else {
    for (const [from, to] of COCO_CONNECTIONS) {
      const a = getKeypoint(scaled, from, minScore);
      const b = getKeypoint(scaled, to, minScore);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.95)";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    for (const kp of scaled) {
      if ((kp.score ?? 0) < minScore) continue;
      drawJointDot(ctx, kp.x, kp.y, 8, "#10b981", "#ecfdf5");
    }
  }
}

export { BLAZEPOSE_KEYPOINTS, BLAZEPOSE_INDEX };
