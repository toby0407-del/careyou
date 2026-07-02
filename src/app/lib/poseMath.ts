import type { Keypoint } from "@tensorflow-models/pose-detection";

export interface Point2D {
  x: number;
  y: number;
  score?: number;
}

/** Angle at point B formed by segments AB and BC (degrees, 0–180) */
export function angleAtJoint(a: Point2D, b: Point2D, c: Point2D): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return 180;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function getKeypoint(
  keypoints: Keypoint[],
  name: string,
  minScore = 0.3
): Point2D | null {
  const kp = keypoints.find((k) => k.name === name);
  if (!kp || (kp.score ?? 0) < minScore) return null;
  return { x: kp.x, y: kp.y, score: kp.score };
}

export function getJointAngle(
  keypoints: Keypoint[],
  joint: "knee" | "hip" | "shoulder" | "wrist",
  side: "left" | "right" = "left"
): number | null {
  const prefix = side === "left" ? "left" : "right";
  const configs: Record<string, [string, string, string]> = {
    knee: [`${prefix}_hip`, `${prefix}_knee`, `${prefix}_ankle`],
    hip: [`${prefix}_shoulder`, `${prefix}_hip`, `${prefix}_knee`],
    shoulder: [`${prefix}_hip`, `${prefix}_shoulder`, `${prefix}_elbow`],
    wrist: [`${prefix}_shoulder`, `${prefix}_elbow`, `${prefix}_wrist`],
  };

  const [aName, bName, cName] = configs[joint];
  const a = getKeypoint(keypoints, aName);
  const b = getKeypoint(keypoints, bName);
  const c = getKeypoint(keypoints, cName);

  if (!a || !b || !c) {
    const other = side === "left" ? "right" : "left";
    if (side === "left") return getJointAngle(keypoints, joint, other);
    return null;
  }

  return Math.round(angleAtJoint(a, b, c));
}

export const SKELETON_CONNECTIONS: [string, string][] = [
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

export const JOINT_LABELS: Record<string, string> = {
  left_knee: "左膝",
  right_knee: "右膝",
  left_hip: "左髖",
  right_hip: "右髖",
  left_shoulder: "左肩",
  right_shoulder: "右肩",
  left_wrist: "左腕",
  right_wrist: "右腕",
};

type PoseJoint =
  | "leftKnee"
  | "rightKnee"
  | "leftShoulder"
  | "rightShoulder"
  | "leftHip"
  | "rightHip";

const POSE_JOINT_MAP: Record<
  PoseJoint,
  { joint: "knee" | "hip" | "shoulder"; side: "left" | "right"; highlight: string }
> = {
  leftKnee: { joint: "knee", side: "left", highlight: "knee" },
  rightKnee: { joint: "knee", side: "right", highlight: "knee" },
  leftHip: { joint: "hip", side: "left", highlight: "hip" },
  rightHip: { joint: "hip", side: "right", highlight: "hip" },
  leftShoulder: { joint: "shoulder", side: "left", highlight: "shoulder" },
  rightShoulder: { joint: "shoulder", side: "right", highlight: "shoulder" },
};

export function getAngleForPoseJoint(
  keypoints: Keypoint[],
  poseJoint: PoseJoint
): number | null {
  const cfg = POSE_JOINT_MAP[poseJoint];
  return getJointAngle(keypoints, cfg.joint, cfg.side);
}

export function getHighlightForPoseJoint(poseJoint: PoseJoint): string {
  return POSE_JOINT_MAP[poseJoint].highlight;
}

