import { motion } from "motion/react";
import { getJointLabel } from "../../data/patientExercises";
import type { Exercise } from "../../data/exerciseTypes";

interface JointAngleGaugeProps {
  exercise: Exercise;
  angle: number | null;
  compact?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function JointAngleGauge({ exercise, angle, compact = false }: JointAngleGaugeProps) {
  const { flexedAngle, extendedAngle, joint } = exercise.pose;
  const pad = Math.max(12, (extendedAngle - flexedAngle) * 0.25);
  const scaleMin = flexedAngle - pad;
  const scaleMax = extendedAngle + pad;
  const span = scaleMax - scaleMin || 1;

  const inRange =
    angle != null && angle >= flexedAngle - exercise.pose.tolerance && angle <= extendedAngle + exercise.pose.tolerance;

  const markerPct = angle != null ? clamp(((angle - scaleMin) / span) * 100, 0, 100) : 0;
  const rangeStartPct = clamp(((flexedAngle - scaleMin) / span) * 100, 0, 100);
  const rangeEndPct = clamp(((extendedAngle - scaleMin) / span) * 100, 0, 100);
  const rangeWidth = Math.max(rangeEndPct - rangeStartPct, 2);

  return (
    <div
      className={`rounded-2xl border ${
        inRange ? "bg-emerald-300/10 border-emerald-300/30" : "bg-amber-500/10 border-amber-500/35"
      } ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-400 text-[10px]">{getJointLabel(joint)}即時角度</p>
        <p className={`text-[10px] font-semibold ${inRange ? "text-emerald-200" : "text-amber-300"}`}>
          {inRange ? "目標範圍內" : "調整中"}
        </p>
      </div>

      <div className="flex items-end justify-center gap-1">
        <motion.span
          key={angle ?? "none"}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          className={`${compact ? "text-4xl" : "text-5xl"} leading-none font-extrabold ${
            angle != null ? (inRange ? "text-emerald-200" : "text-white") : "text-slate-500"
          }`}
        >
          {angle != null ? angle : "--"}
        </motion.span>
        <span className={`${compact ? "text-xl" : "text-2xl"} text-slate-400 mb-1 font-bold`}>°</span>
      </div>

      <div className="relative h-2.5 bg-white/10 rounded-full mt-3 overflow-visible">
        <div
          className="absolute top-0 h-full rounded-full bg-amber-400/25 border border-amber-400/40"
          style={{ left: `${rangeStartPct}%`, width: `${rangeWidth}%` }}
        />
        {angle != null && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] border-2 border-teal-200"
            style={{ left: `calc(${markerPct}% - 6px)` }}
            layout
          />
        )}
      </div>

      <div className="flex justify-between mt-1.5 text-[10px]">
        <span className="text-amber-300 font-semibold">{flexedAngle}°</span>
        <span className="text-slate-500">目標區間</span>
        <span className="text-amber-300 font-semibold">{extendedAngle}°</span>
      </div>
    </div>
  );
}
