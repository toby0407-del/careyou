import { useEffect, useId, useState } from "react";
import type { Exercise } from "../../data/exerciseTypes";
import type { BodyRegion } from "../../data/prescriptionExercises";
import { BODY_REGION_LABELS } from "../../data/prescriptionExercises";
import { getJointLabel } from "../../data/patientExercises";

interface RehabExerciseDemo2DProps {
  exercise: Exercise;
  compact?: boolean;
  /** none = 僅人偶（彈窗用），full = 含圖上標籤（展示用） */
  overlay?: "none" | "full";
  /** detection = 藍圖用，只標示偵測部位，不顯示固定角度 */
  mode?: "demo" | "detection";
}

type HighlightZone = "ankle" | "knee" | "shoulder" | "hip" | "wrist" | "core";

/** 各部位示意動畫用的通用角度（非處方值） */
const ZONE_MOTION: Record<HighlightZone, { flex: number; ext: number }> = {
  knee: { flex: 90, ext: 165 },
  ankle: { flex: 10, ext: 45 },
  shoulder: { flex: 30, ext: 85 },
  hip: { flex: 140, ext: 175 },
  wrist: { flex: 20, ext: 70 },
  core: { flex: 130, ext: 170 },
};

const JOINT_TRIPLET_DESC: Record<Exercise["pose"]["joint"], string> = {
  leftKnee: "髖 · 膝 · 踝",
  rightKnee: "髖 · 膝 · 踝",
  leftShoulder: "髖 · 肩 · 肘",
  rightShoulder: "髖 · 肩 · 肘",
  leftHip: "肩 · 髖 · 膝",
  rightHip: "肩 · 髖 · 膝",
};

export function getDetectionInfo(exercise: Exercise) {
  const joint = exercise.pose.joint;
  return {
    zone: getZoneLabel(exercise),
    jointLabel: getJointLabel(joint),
    triplet: JOINT_TRIPLET_DESC[joint],
  };
}

function bodyRegionToZone(region: BodyRegion): HighlightZone {
  switch (region) {
    case "neck":
    case "shoulder":
    case "elbow":
      return "shoulder";
    case "wrist":
      return "wrist";
    case "core":
      return "core";
    case "hip":
      return "hip";
    case "knee":
      return "knee";
    case "ankle":
      return "ankle";
  }
}

export function getHighlightZone(exercise: Exercise): HighlightZone {
  if (exercise.bodyRegion) return bodyRegionToZone(exercise.bodyRegion);
  if (exercise.id.includes("ankle")) return "ankle";
  if (exercise.id.includes("wrist")) return "wrist";
  if (exercise.id.includes("ab-")) return "core";
  const joint = exercise.pose.joint;
  if (joint.includes("Knee")) return "knee";
  if (joint.includes("Shoulder")) return "shoulder";
  return "hip";
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function useLoopingValue(keyframes: number[], durationMs: number) {
  const [value, setValue] = useState(keyframes[0] ?? 0);

  useEffect(() => {
    if (keyframes.length < 2) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) % durationMs;
      const t = elapsed / durationMs;
      const segCount = keyframes.length - 1;
      const pos = t * segCount;
      const idx = Math.min(Math.floor(pos), segCount - 1);
      const local = easeInOut(pos - idx);
      setValue(keyframes[idx] + (keyframes[idx + 1] - keyframes[idx]) * local);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [keyframes, durationMs]);

  return value;
}

const BONE = "#2dd4bf";
const BONE_DIM = "#115e59";
const JOINT = "#5eead4";
const GLOW_CORE = "#fff7cc";
const GLOW_MID = "#fde047";
const GLOW_OUT = "#fbbf24";
const SKIN = "#134e4a";

type Pt = { x: number; y: number };

function polar(cx: number, cy: number, r: number, deg: number): Pt {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function limbDeg(vertex: Pt, point: Pt) {
  return (Math.atan2(point.y - vertex.y, point.x - vertex.x) * 180) / Math.PI;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  let delta = endDeg - startDeg;
  if (delta < 0) delta += 360;
  const large = delta > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/** 在目標關節畫出 min°～max° 的扇形與虛線（數字標籤改由 HTML 顯示，避免被遮擋） */
function TargetAngleGuide({
  vertex,
  upperArm,
  lowerMin,
  lowerMax,
}: {
  vertex: Pt;
  upperArm: Pt;
  lowerMin: Pt;
  lowerMax: Pt;
}) {
  const minDeg = limbDeg(vertex, lowerMin);
  const maxDeg = limbDeg(vertex, lowerMax);
  const arcR = 20;

  return (
    <g>
      <line x1={vertex.x} y1={vertex.y} x2={upperArm.x} y2={upperArm.y} stroke="#5eead4" strokeWidth={2} opacity={0.35} />
      <line x1={vertex.x} y1={vertex.y} x2={lowerMin.x} y2={lowerMin.y} stroke={GLOW_MID} strokeWidth={2} strokeDasharray="5 4" opacity={0.7} />
      <line x1={vertex.x} y1={vertex.y} x2={lowerMax.x} y2={lowerMax.y} stroke={GLOW_CORE} strokeWidth={2} strokeDasharray="5 4" opacity={0.85} />
      <path d={`${arcPath(vertex.x, vertex.y, arcR, minDeg, maxDeg)} L ${vertex.x} ${vertex.y} Z`} fill={GLOW_OUT} fillOpacity={0.18} />
      <path d={arcPath(vertex.x, vertex.y, arcR, minDeg, maxDeg)} stroke={GLOW_MID} strokeWidth={1.5} fill="none" opacity={0.9} />
    </g>
  );
}

function kneePose(hip: Pt, angleDeg: number) {
  const rad = ((180 - angleDeg) * Math.PI) / 180;
  const knee = { x: hip.x + 38 * Math.cos(rad), y: hip.y + 38 * Math.sin(rad) };
  const ankle = {
    x: knee.x + 36 * Math.cos(rad + 0.06),
    y: knee.y + 36 * Math.sin(rad + 0.06),
  };
  return { knee, ankle };
}

function ankleFoot(knee: Pt, spinDeg: number) {
  const shinAngle = 88 + spinDeg * 0.35;
  const ankle = {
    x: knee.x + 34 * Math.cos((shinAngle * Math.PI) / 180),
    y: knee.y + 34 * Math.sin((shinAngle * Math.PI) / 180),
  };
  const footAngle = shinAngle + 20 + spinDeg;
  const foot = {
    x: ankle.x + 14 * Math.cos((footAngle * Math.PI) / 180),
    y: ankle.y + 14 * Math.sin((footAngle * Math.PI) / 180),
  };
  return { ankle, foot };
}

function shoulderElbow(shoulder: Pt, angleDeg: number) {
  return {
    x: shoulder.x - 30 * Math.sin((angleDeg * Math.PI) / 180),
    y: shoulder.y + 30 * Math.cos((angleDeg * Math.PI) / 180),
  };
}

function GlowJoint({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 22} fill={GLOW_OUT} opacity={0.12}>
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="r" values={`${r + 18};${r + 24};${r + 18}`} dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={r + 12} fill={GLOW_MID} opacity={0.35}>
        <animate attributeName="opacity" values="0.25;0.5;0.25" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={r + 5} fill={GLOW_OUT} opacity={0.7} />
      <circle cx={x} cy={y} r={r} fill={GLOW_MID} stroke={GLOW_CORE} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={r * 0.45} fill={GLOW_CORE} />
    </g>
  );
}

function JointDot({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) {
  return (
    <circle cx={x} cy={y} r={r} fill={JOINT} stroke="#99f6e4" strokeWidth={1.5} opacity={0.85} />
  );
}

function Limb({
  x1,
  y1,
  x2,
  y2,
  w = 7,
  dim = false,
  active = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w?: number;
  dim?: boolean;
  active?: boolean;
}) {
  if (active) {
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={GLOW_OUT} strokeWidth={w + 6} strokeLinecap="round" opacity={0.25} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={GLOW_MID} strokeWidth={w + 2} strokeLinecap="round" opacity={0.85} />
      </>
    );
  }
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={dim ? BONE_DIM : BONE}
      strokeWidth={w}
      strokeLinecap="round"
      opacity={dim ? 0.4 : 0.88}
    />
  );
}

/** 正面站姿人偶 — 依部位高亮並播放對應動作 */
function StandingFigure({
  zone,
  flexedAngle,
  extendedAngle,
  showAngleGuide = true,
}: {
  zone: HighlightZone;
  flexedAngle: number;
  extendedAngle: number;
  showAngleGuide?: boolean;
}) {
  const t = useLoopingValue([0, 1, 0], 2800);

  const cx = 100;
  const floorY = 212;
  const headY = 36;
  const shoulderY = 72;
  const hipY = 128;
  const lShoulder = { x: cx - 24, y: shoulderY };
  const rShoulder = { x: cx + 24, y: shoulderY };
  const lHip = { x: cx - 11, y: hipY };
  const rHip = { x: cx + 11, y: hipY };

  // 右腿（支撐側，略暗）
  const rKnee = { x: cx + 13, y: 172 };
  const rAnkle = { x: cx + 14, y: floorY };
  const rFoot = { x: cx + 22, y: floorY };

  // 左腿動畫
  const kneeBend = flexedAngle + (extendedAngle - flexedAngle) * (1 - t);
  const kneeRad = ((180 - kneeBend) * Math.PI) / 180;
  const ankleSpin = useLoopingValue([-22, 22, -22], 3000);
  const armRaise = flexedAngle * 0.12 + (extendedAngle - flexedAngle) * 0.5 * t;
  const hipShift = 6 + ((extendedAngle - flexedAngle) / 180) * 14 * t;

  let lKnee = { x: cx - 13, y: 172 };
  let lAnkle = { x: cx - 14, y: floorY };
  let lFoot = { x: cx - 22, y: floorY };
  let lElbow = { x: lShoulder.x - 16, y: lShoulder.y + 30 };
  let lHand = { x: lElbow.x - 12, y: lElbow.y + 24 };
  let lWrist = { x: lElbow.x - 6, y: lElbow.y + 22 };
  let lHipPos = { ...lHip };
  let coreY = shoulderY + 32;

  if (zone === "knee") {
    lKnee = {
      x: lHip.x + 38 * Math.cos(kneeRad),
      y: lHip.y + 38 * Math.sin(kneeRad),
    };
    lAnkle = {
      x: lKnee.x + 36 * Math.cos(kneeRad + 0.06),
      y: lKnee.y + 36 * Math.sin(kneeRad + 0.06),
    };
    lFoot = { x: lAnkle.x - 8, y: floorY };
  } else if (zone === "ankle") {
    const shinAngle = 88 + ankleSpin * 0.4;
    lAnkle = {
      x: lKnee.x + 34 * Math.cos((shinAngle * Math.PI) / 180),
      y: lKnee.y + 34 * Math.sin((shinAngle * Math.PI) / 180),
    };
    const footAngle = shinAngle + 20 + ankleSpin;
    lFoot = {
      x: lAnkle.x + 14 * Math.cos((footAngle * Math.PI) / 180),
      y: lAnkle.y + 14 * Math.sin((footAngle * Math.PI) / 180),
    };
  } else if (zone === "shoulder") {
    lElbow = {
      x: lShoulder.x - 30 * Math.sin((armRaise * Math.PI) / 180),
      y: lShoulder.y + 30 * Math.cos((armRaise * Math.PI) / 180),
    };
    lHand = {
      x: lElbow.x - 28 * Math.sin((armRaise * Math.PI) / 180),
      y: lElbow.y + 28 * Math.cos((armRaise * Math.PI) / 180),
    };
  } else if (zone === "hip") {
    lHipPos = { x: lHip.x - hipShift * 0.3, y: lHip.y - hipShift };
    lKnee = { x: lHipPos.x - 4, y: 172 - hipShift * 0.5 };
    lAnkle = { x: lHipPos.x - 6, y: floorY };
    lFoot = { x: lAnkle.x - 8, y: floorY };
  } else if (zone === "wrist") {
    lElbow = { x: lShoulder.x - 34, y: lShoulder.y + 22 };
    const wristBend = flexedAngle + (extendedAngle - flexedAngle) * t;
    lWrist = { x: lElbow.x - 4, y: lElbow.y + 24 };
    lHand = {
      x: lWrist.x - 10,
      y: lWrist.y + 10 + (wristBend - flexedAngle) * 0.12,
    };
  } else if (zone === "core") {
    const crunch = 4 + ((extendedAngle - flexedAngle) / 40) * 10 * t;
    coreY = shoulderY + 32 - crunch;
  }

  const rElbow = { x: rShoulder.x + 16, y: rShoulder.y + 30 };
  const rHand = { x: rElbow.x + 12, y: rElbow.y + 24 };

  const isActive = (part: HighlightZone) => zone === part;

  const angleGuide = (() => {
    if (zone === "knee") {
      const flex = kneePose(lHip, flexedAngle);
      const ext = kneePose(lHip, extendedAngle);
      return (
        <TargetAngleGuide
          vertex={flex.knee}
          upperArm={lHip}
          lowerMin={flex.ankle}
          lowerMax={ext.ankle}
        />
      );
    }
    if (zone === "ankle") {
      const spinMin = -((extendedAngle - flexedAngle) / 2.2);
      const spinMax = (extendedAngle - flexedAngle) / 2.2;
      const min = ankleFoot(lKnee, spinMin);
      const max = ankleFoot(lKnee, spinMax);
      return (
        <TargetAngleGuide
          vertex={min.ankle}
          upperArm={lKnee}
          lowerMin={min.foot}
          lowerMax={max.foot}
        />
      );
    }
    if (zone === "shoulder") {
      const torso = { x: lShoulder.x, y: lShoulder.y + 36 };
      return (
        <TargetAngleGuide
          vertex={lShoulder}
          upperArm={torso}
          lowerMin={shoulderElbow(lShoulder, flexedAngle)}
          lowerMax={shoulderElbow(lShoulder, extendedAngle)}
        />
      );
    }
    if (zone === "wrist") {
      const flexHand = {
        x: lWrist.x - 10,
        y: lWrist.y + 10,
      };
      const extHand = {
        x: lWrist.x - 10,
        y: lWrist.y + 10 + (extendedAngle - flexedAngle) * 0.12,
      };
      return (
        <TargetAngleGuide vertex={lWrist} upperArm={lElbow} lowerMin={flexHand} lowerMax={extHand} />
      );
    }
    if (zone === "core") {
      const low = { x: cx, y: coreY + 8 };
      const high = { x: cx, y: coreY - 10 };
      return <TargetAngleGuide vertex={{ x: cx, y: coreY }} upperArm={lHip} lowerMin={low} lowerMax={high} />;
    }
    const torso = { x: cx, y: shoulderY };
    const flexKnee = { x: lHip.x - 2, y: 172 - 4 };
    const extKnee = { x: lHip.x - 2, y: 172 - 16 };
    return (
      <TargetAngleGuide
        vertex={lHip}
        upperArm={torso}
        lowerMin={flexKnee}
        lowerMax={extKnee}
      />
    );
  })();

  return (
    <svg viewBox="0 0 200 240" className="w-full max-w-[240px] h-auto" fill="none" aria-hidden>
      <defs>
        <filter id="limb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <line x1="20" y1={floorY} x2="180" y2={floorY} stroke="#334155" strokeWidth="1.5" strokeDasharray="5 4" />

      {/* 右腿 */}
      <Limb x1={rHip.x} y1={rHip.y} x2={rKnee.x} y2={rKnee.y} w={7} dim />
      <Limb x1={rKnee.x} y1={rKnee.y} x2={rAnkle.x} y2={rAnkle.y} w={6} dim />
      <Limb x1={rAnkle.x} y1={rAnkle.y} x2={rFoot.x} y2={rFoot.y} w={5} dim />
      <JointDot x={rKnee.x} y={rKnee.y} r={4} />
      <JointDot x={rAnkle.x} y={rAnkle.y} r={3.5} />

      {/* 軀幹 */}
      <Limb x1={cx} y1={headY + 16} x2={cx} y2={hipY} w={14} active={isActive("hip") || isActive("core")} />
      <Limb x1={lShoulder.x} y1={shoulderY} x2={rShoulder.x} y2={shoulderY} w={8} />
      <Limb x1={lHipPos.x} y1={hipY} x2={rHip.x} y2={hipY} w={8} active={isActive("hip")} />
      <circle cx={cx} cy={headY} r={16} fill={SKIN} stroke={BONE} strokeWidth="2" />

      {/* 右臂 */}
      <Limb x1={rShoulder.x} y1={rShoulder.y} x2={rElbow.x} y2={rElbow.y} w={6} dim />
      <Limb x1={rElbow.x} y1={rElbow.y} x2={rHand.x} y2={rHand.y} w={5} dim />

      {/* 左臂 */}
      <Limb
        x1={lShoulder.x}
        y1={lShoulder.y}
        x2={lElbow.x}
        y2={lElbow.y}
        w={7}
        active={isActive("shoulder") || isActive("wrist")}
      />
      <Limb
        x1={lElbow.x}
        y1={lElbow.y}
        x2={lHand.x}
        y2={lHand.y}
        w={6}
        active={isActive("shoulder") || isActive("wrist")}
      />

      {/* 目標角度扇形（畫在發光關節之前，避免遮住標籤） */}
      {showAngleGuide && angleGuide}

      {/* 左腿 */}
      <Limb x1={lHipPos.x} y1={lHipPos.y} x2={lKnee.x} y2={lKnee.y} w={8} active={isActive("knee") || isActive("hip")} />
      <Limb x1={lKnee.x} y1={lKnee.y} x2={lAnkle.x} y2={lAnkle.y} w={7} active={isActive("knee") || isActive("ankle")} />
      <Limb x1={lAnkle.x} y1={lAnkle.y} x2={lFoot.x} y2={lFoot.y} w={5} active={isActive("ankle")} />

      {/* 一般關節 */}
      <JointDot x={lElbow.x} y={lElbow.y} r={4} />
      <JointDot x={lHand.x} y={lHand.y} r={3.5} />
      {!isActive("hip") && <JointDot x={lHipPos.x} y={lHipPos.y} r={5} />}
      {!isActive("knee") && <JointDot x={lKnee.x} y={lKnee.y} r={4.5} />}
      {!isActive("ankle") && <JointDot x={lAnkle.x} y={lAnkle.y} r={4} />}
      {!isActive("shoulder") && !isActive("wrist") && <JointDot x={lShoulder.x} y={lShoulder.y} r={5} />}

      {isActive("shoulder") && <GlowJoint x={lShoulder.x} y={lShoulder.y} r={7} />}
      {isActive("hip") && <GlowJoint x={lHipPos.x} y={lHipPos.y} r={7} />}
      {isActive("knee") && <GlowJoint x={lKnee.x} y={lKnee.y} r={7} />}
      {isActive("ankle") && <GlowJoint x={lAnkle.x} y={lAnkle.y} r={7} />}
      {isActive("wrist") && <GlowJoint x={lWrist.x} y={lWrist.y} r={6} />}
      {isActive("core") && <GlowJoint x={cx} y={coreY} r={8} />}

      {/* 踝關節旋轉提示弧 — 已由 TargetAngleGuide 涵蓋 */}
    </svg>
  );
}

const ZONE_LABEL: Record<HighlightZone, string> = {
  ankle: "踝關節",
  knee: "膝關節",
  shoulder: "肩關節",
  hip: "髖關節",
  wrist: "手腕",
  core: "核心",
};

export function getZoneLabel(exercise: Exercise): string {
  if (exercise.bodyRegion) {
    return BODY_REGION_LABELS[exercise.bodyRegion];
  }
  return ZONE_LABEL[getHighlightZone(exercise)];
}

export function RehabExerciseDemo2D({
  exercise,
  compact = false,
  overlay = "full",
  mode = "demo",
}: RehabExerciseDemo2DProps) {
  const zone = getHighlightZone(exercise);
  const uid = useId().replace(/:/g, "");
  const isDetection = mode === "detection";
  const flexedAngle = isDetection ? ZONE_MOTION[zone].flex : exercise.pose.flexedAngle;
  const extendedAngle = isDetection ? ZONE_MOTION[zone].ext : exercise.pose.extendedAngle;
  const detection = isDetection ? getDetectionInfo(exercise) : null;

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-slate-900 ${
        compact ? "" : "bg-gradient-to-b from-slate-800/90 to-slate-950"
      }`}
      aria-label={
        isDetection
          ? `${exercise.name} 偵測部位示意`
          : `${exercise.name} 2D 動作示範`
      }
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.06)_0%,transparent_65%)]" />

      {!compact && overlay === "full" && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 border border-amber-400/30">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse shadow-[0_0_8px_#fde047]" />
          <span className="text-amber-100 text-xs font-semibold">
            {isDetection ? "偵測部位示意" : "2D 動作示範"}
          </span>
        </div>
      )}

      <div
        className={`absolute inset-0 flex items-center justify-center px-6 ${
          overlay === "none" ? "py-4" : isDetection ? "pb-14 pt-8" : "pb-20 pt-8"
        }`}
      >
        <div className={overlay === "none" ? "scale-[0.88] -translate-y-2" : ""}>
          <StandingFigure
            zone={zone}
            flexedAngle={flexedAngle}
            extendedAngle={extendedAngle}
            showAngleGuide={!isDetection}
          />
        </div>
      </div>

      {!compact && overlay === "full" && !isDetection && (
        <div className="absolute left-0 right-0 bottom-10 z-10 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-sm border border-amber-400/40 px-3 py-1.5 shadow-lg">
            <span className="text-amber-200 text-xs font-bold whitespace-nowrap">{exercise.pose.flexedAngle}°</span>
            <span className="text-amber-400/70 text-[10px] whitespace-nowrap">～</span>
            <span className="text-amber-200 text-xs font-bold whitespace-nowrap">{exercise.pose.extendedAngle}°</span>
          </div>
        </div>
      )}

      {!compact && overlay === "full" && (
        <div className="absolute bottom-2 left-3 right-3 z-10 text-center pointer-events-none">
          <p className="text-slate-300 text-[10px] leading-snug">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-300 align-middle mr-1 shadow-[0_0_6px_#fde047]" />
            {isDetection && detection ? (
              <>
                <span className="text-amber-200 font-semibold">{detection.zone}</span>
                {" · BlazePose "}
                <span className="text-amber-200/90">{detection.triplet}</span>
                {" · 角度依醫師處方"}
              </>
            ) : (
              <>
                <span className="text-amber-200 font-semibold">{ZONE_LABEL[zone]}</span>
                {" "}為訓練重點
              </>
            )}
          </p>
        </div>
      )}

      <span id={`demo-${uid}`} className="sr-only">
        {isDetection ? `${exercise.name} 偵測部位示意` : `${exercise.name} 動作循環示範`}
      </span>
    </div>
  );
}
