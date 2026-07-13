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

export const KEYPOINT_VISIBILITY_MIN = 0.15;

export function countVisibleKeypoints(keypoints: Keypoint[], minScore = KEYPOINT_VISIBILITY_MIN): number {
  return keypoints.filter((k) => (k.score ?? 0) >= minScore).length;
}

export interface PersonScreenEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** 依螢幕座標關節點計算人體外框橢圓（用於偵測光圈） */
export function computePersonScreenEllipse(
  points: Array<{ x: number; y: number }>,
  paddingRatio = 0.035
): PersonScreenEllipse | null {
  if (points.length < 5) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    rx: w / 2 + w * paddingRatio,
    ry: h / 2 + h * paddingRatio,
  };
}

/** 人體光圈線寬（依較短邊縮放，刻意偏細） */
export function personHaloMetrics(cssWidth: number, cssHeight: number) {
  const vmin = Math.min(cssWidth, cssHeight);
  return {
    stroke: Math.max(0.75, vmin * 0.001),
    glowBlur: Math.max(1, vmin * 0.0012),
    jointRadius: Math.max(3, vmin * 0.004),
    jointHighlight: Math.max(4.5, vmin * 0.0055),
    lineWidth: Math.max(1.5, vmin * 0.0022),
    lineHighlight: Math.max(2.5, vmin * 0.0032),
  };
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

const JOINT_OPPOSITE: Partial<Record<Exercise["pose"]["joint"], Exercise["pose"]["joint"]>> = {
  leftKnee: "rightKnee",
  rightKnee: "leftKnee",
  leftShoulder: "rightShoulder",
  rightShoulder: "leftShoulder",
  leftHip: "rightHip",
  rightHip: "leftHip",
};

const ANGLE_KEYPOINT_MIN_SCORE = 0.15;

function tripletVisibility(keypoints: Keypoint[], triplet: [string, string, string]): number {
  return triplet.reduce((sum, name) => {
    const kp = keypoints.find((k) => k.name === name);
    return sum + (kp?.score ?? 0);
  }, 0);
}

function angleFromTriplet(
  keypoints: Keypoint[],
  triplet: [string, string, string]
): number | null {
  const [aName, bName, cName] = triplet;
  const a = getKeypoint(keypoints, aName, ANGLE_KEYPOINT_MIN_SCORE);
  const b = getKeypoint(keypoints, bName, ANGLE_KEYPOINT_MIN_SCORE);
  const c = getKeypoint(keypoints, cName, ANGLE_KEYPOINT_MIN_SCORE);
  if (!a || !b || !c) return null;
  const angle = Math.round(angleAtJoint(a, b, c));
  return Number.isFinite(angle) ? angle : null;
}

export function getJointAngle(keypoints: Keypoint[], joint: Exercise["pose"]["joint"]): number | null {
  const primary = JOINT_TRIPLETS[joint];
  const oppositeName = JOINT_OPPOSITE[joint];
  const opposite = oppositeName ? JOINT_TRIPLETS[oppositeName] : null;

  const candidates: [string, string, string][] = opposite ? [primary, opposite] : [primary];
  candidates.sort(
    (a, b) => tripletVisibility(keypoints, b) - tripletVisibility(keypoints, a)
  );

  for (const triplet of candidates) {
    const angle = angleFromTriplet(keypoints, triplet);
    if (angle != null) return angle;
  }
  return null;
}

export type RepPhase = "idle" | "flexed" | "extended";

export interface RepTracker {
  phase: RepPhase;
  validReps: number;
  invalidReps: number;
  lastAngle: number | null;
  feedback: string;
  isStandard: boolean;
  /** 本輪是否曾彎曲到目標幅度（計次時看彎曲+伸直，不看伸直當下是否「居中」） */
  reachedFlexed: boolean;
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
  next.isStandard = isFlexed || isExtended;

  if (next.phase === "idle" || next.phase === "extended") {
    if (isFlexed) {
      next.phase = "flexed";
      next.reachedFlexed = true;
      next.feedback = "很好！現在慢慢伸直";
    } else if (!isExtended) {
      next.feedback = "請加大彎曲幅度";
    }
  }

  if (next.phase === "flexed") {
    if (isFlexed) next.reachedFlexed = true;

    if (isExtended) {
      const flexOk = next.reachedFlexed;
      next.phase = "extended";
      next.reachedFlexed = false;
      if (flexOk) {
        next.validReps += 1;
        next.feedback = "標準動作！+1 次";
      } else {
        next.invalidReps += 1;
        next.feedback = "幅度不足，這次不計入";
      }
    } else {
      next.feedback = next.reachedFlexed ? "保持彎曲，準備伸直" : "請彎曲至目標角度";
    }
  }

  if (next.phase === "extended" && isFlexed) {
    next.phase = "flexed";
    next.reachedFlexed = true;
  }

  return next;
}

export const HAND_RAISE_HOLD_MS = 1500;

export interface HandRaiseTracker {
  holdingMs: number;
  side: "left" | "right" | null;
}

export function createHandRaiseTracker(): HandRaiseTracker {
  return { holdingMs: 0, side: null };
}

export function detectHandRaised(
  keypoints: Keypoint[]
): { raised: boolean; side: "left" | "right" | null } {
  const minScore = 0.25;
  const shoulderOffset = 30;

  for (const side of ["left", "right"] as const) {
    const shoulder = getKeypoint(keypoints, `${side}_shoulder`, minScore);
    const wrist = getKeypoint(keypoints, `${side}_wrist`, minScore);
    const elbow = getKeypoint(keypoints, `${side}_elbow`, minScore);
    if (!shoulder || !wrist) continue;

    const wristAboveShoulder = wrist.y < shoulder.y - shoulderOffset;
    const armExtended = !elbow || wrist.y <= elbow.y + 20;

    if (wristAboveShoulder && armExtended) {
      return { raised: true, side };
    }
  }

  return { raised: false, side: null };
}

export function updateHandRaiseTracker(
  tracker: HandRaiseTracker,
  keypoints: Keypoint[],
  deltaMs: number
): HandRaiseTracker {
  const { raised, side } = detectHandRaised(keypoints);
  if (!raised || !side) {
    return { holdingMs: 0, side: null };
  }

  return {
    holdingMs: tracker.side === side ? tracker.holdingMs + deltaMs : deltaMs,
    side,
  };
}

export function createRepTracker(): RepTracker {
  return {
    phase: "idle",
    validReps: 0,
    invalidReps: 0,
    lastAngle: null,
    feedback: "請面向鏡頭，準備開始動作",
    isStandard: false,
    reachedFlexed: false,
  };
}

function kpByIndex(keypoints: Keypoint[], idx: number, minScore = 0.15): Point2D | null {
  const kp = keypoints[idx];
  if (!kp || (kp.score ?? 0) < minScore) return null;
  return { x: kp.x, y: kp.y };
}

/** 若模型回傳 0–1 正規化或較小解析度座標，轉成影片像素座標 */
export function prepareKeypointsForVideo(
  keypoints: Keypoint[],
  width: number,
  height: number
): Keypoint[] {
  if (keypoints.length === 0 || width <= 0 || height <= 0) return keypoints;

  const named = keypoints.map((k, i) => ({
    ...k,
    name: k.name ?? BLAZEPOSE_KEYPOINTS[i] ?? `kp_${i}`,
  }));

  const visible = named.filter((k) => (k.score ?? 0) > 0.05);
  if (visible.length === 0) return named;

  const maxX = Math.max(...visible.map((k) => k.x));
  const maxY = Math.max(...visible.map((k) => k.y));
  const minX = Math.min(...visible.map((k) => k.x));
  const minY = Math.min(...visible.map((k) => k.y));

  // 0–1 正規化座標
  if (maxX <= 1.05 && maxY <= 1.05) {
    return named.map((k) => ({
      ...k,
      x: k.x * width,
      y: k.y * height,
    }));
  }

  // 模型內部解析度（常見 192–256），需放大至影片尺寸
  if (maxX <= 640 && maxY <= 640 && (maxX < width * 0.75 || maxY < height * 0.75)) {
    const spanX = Math.max(maxX - minX, maxX);
    const spanY = Math.max(maxY - minY, maxY);
    const scaleX = width / spanX;
    const scaleY = height / spanY;
    const scale = Math.min(scaleX, scaleY);
    if (scale > 1.05) {
      const offsetX = (width - spanX * scale) / 2;
      const offsetY = (height - spanY * scale) / 2;
      return named.map((k) => ({
        ...k,
        x: (k.x - minX) * scale + offsetX,
        y: (k.y - minY) * scale + offsetY,
      }));
    }
  }

  return named;
}

function scaleKeypointsToPixels(keypoints: Keypoint[], width: number, height: number): Keypoint[] {
  return prepareKeypointsForVideo(keypoints, width, height);
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
  height: number,
  options?: { mirror?: boolean }
) {
  ctx.clearRect(0, 0, width, height);
  if (keypoints.length === 0) return;

  const scaled = scaleKeypointsToPixels(keypoints, width, height);
  const mirror = options?.mirror ?? true;
  const mapX = (x: number) => (mirror ? width - x : x);
  const dense = isDenseModel(scaled);
  const minScore = 0.1;

  if (dense) {
    for (const [ai, bi] of BLAZEPOSE_PAIRS) {
      const a = kpByIndex(scaled, ai, minScore);
      const b = kpByIndex(scaled, bi, minScore);
      if (!a || !b) continue;
      const nameA = scaled[ai]?.name;
      const isFace = nameA && FACE_NAMES.has(nameA);
      ctx.beginPath();
      ctx.moveTo(mapX(a.x), a.y);
      ctx.lineTo(mapX(b.x), b.y);
      ctx.strokeStyle = isFace ? "rgba(167, 243, 208, 0.85)" : "rgba(52, 211, 153, 0.95)";
      ctx.lineWidth = isFace ? 2.5 : 5;
      ctx.lineCap = "round";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = isFace ? 4 : 8;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    for (const kp of scaled) {
      if ((kp.score ?? 0) < minScore) continue;
      const { fill, stroke, radius } = jointColor(kp.name);
      drawJointDot(ctx, mapX(kp.x), kp.y, radius + 2, fill, stroke);
    }
  } else {
    for (const [from, to] of COCO_CONNECTIONS) {
      const a = getKeypoint(scaled, from, minScore);
      const b = getKeypoint(scaled, to, minScore);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(mapX(a.x), a.y);
      ctx.lineTo(mapX(b.x), b.y);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.95)";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    for (const kp of scaled) {
      if ((kp.score ?? 0) < minScore) continue;
      drawJointDot(ctx, mapX(kp.x), kp.y, 9, "#10b981", "#ecfdf5");
    }
  }
}

export { BLAZEPOSE_KEYPOINTS, BLAZEPOSE_INDEX };
