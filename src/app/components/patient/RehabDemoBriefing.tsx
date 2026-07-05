import { motion } from "motion/react";
import { ArrowLeft, Clock, Dumbbell, PlayCircle, Repeat } from "lucide-react";
import type { Exercise } from "../../data/exerciseTypes";
import { RehabExerciseDemo2D } from "./RehabExerciseDemo2D";

interface RehabDemoBriefingProps {
  exercise: Exercise;
  onBack: () => void;
  onContinue: () => void;
}

export function RehabDemoBriefing({ exercise, onBack, onContinue }: RehabDemoBriefingProps) {
  return (
    <div className="patient-large-text fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onBack}
      />

      <div className="relative z-10 w-full max-w-3xl flex items-center justify-center px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col"
        >
          <div className="relative aspect-[4/3] flex-shrink-0 bg-slate-950">
            <RehabExerciseDemo2D exercise={exercise} overlay="full" mode="demo" />
          </div>

        <div className="px-5 py-3 border-b border-white/10 flex flex-col items-center gap-3 bg-slate-900">
          <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/35 px-4 py-2">
            <span className="briefing-angle-value text-amber-200 font-bold whitespace-nowrap">
              {exercise.pose.flexedAngle}°
            </span>
            <span className="text-slate-500 text-xs whitespace-nowrap">目標範圍</span>
            <span className="briefing-angle-value text-amber-200 font-bold whitespace-nowrap">
              {exercise.pose.extendedAngle}°
            </span>
          </div>
          <h2 className="text-white text-2xl font-bold text-center">{exercise.name}</h2>
        </div>

        <div className="patient-briefing-stats grid grid-cols-3 gap-1.5 px-4 py-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 px-2 py-2.5 text-center min-w-0">
            <Dumbbell className="w-4 h-4 text-teal-300 mx-auto mb-1" />
            <p className="briefing-stat-label text-slate-400">組數</p>
            <p className="briefing-stat-value text-white font-bold mt-0.5">{exercise.sets} 組</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-2 py-2.5 text-center min-w-0">
            <Repeat className="w-4 h-4 text-emerald-300 mx-auto mb-1" />
            <p className="briefing-stat-label text-slate-400">每組</p>
            <p className="briefing-stat-value text-white font-bold mt-0.5">{exercise.repsPerSet} 次</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 px-2 py-2.5 text-center min-w-0">
            <Clock className="w-4 h-4 text-sky-300 mx-auto mb-1" />
            <p className="briefing-stat-label text-slate-400">時間</p>
            <p className="briefing-stat-value text-white font-bold mt-0.5">
              {exercise.duration.replace(/\s+/g, "")}
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-white/10 bg-slate-950/60">
          <button
            onClick={onBack}
            className="h-11 px-4 rounded-xl bg-white/10 text-white text-sm font-semibold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            準備開始
          </motion.button>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
