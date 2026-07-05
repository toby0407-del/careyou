import { motion } from "motion/react";
import { ArrowLeft, Camera, Hand, Loader2, Activity } from "lucide-react";
import type { Exercise } from "../../data/exerciseTypes";
import type { CameraState, PoseEngine } from "../../hooks/usePoseDetection";
import { HAND_RAISE_HOLD_MS } from "../../utils/poseAnalysis";

interface RehabReadyGateProps {
  exercise: Exercise;
  cameraState: CameraState;
  handRaiseProgress: number;
  readySide: "left" | "right" | null;
  detectedInFrame: boolean;
  activeKeypoints: number;
  keypointTotal: number;
  fps: number;
  engine: PoseEngine | null;
  showSkeleton: boolean;
  onToggleSkeleton: (value: boolean) => void;
  onBack: () => void;
}

export function RehabReadyOverlays({
  cameraState,
  activeKeypoints,
  fps,
  engine,
  showSkeleton,
  onToggleSkeleton,
}: Pick<
  RehabReadyGateProps,
  "cameraState" | "activeKeypoints" | "fps" | "engine" | "showSkeleton" | "onToggleSkeleton"
>) {
  const isLoading =
    cameraState === "idle" || cameraState === "requesting" || cameraState === "loading-model";
  const isReady = cameraState === "ready";

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-slate-900/95 flex flex-col items-center justify-center gap-5 px-6">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <div className="text-center">
            <h2 className="text-white mb-2">
              {cameraState === "loading-model" ? "載入姿勢偵測模型..." : "正在開啟鏡頭..."}
            </h2>
            <p className="text-slate-400 text-sm">準備完成後，請舉手確認開始訓練</p>
          </div>
        </div>
      )}

      {isReady && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-amber-500/40 rounded-full px-3 py-1.5">
            <Hand className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-amber-200 text-xs font-semibold">等待舉手確認</span>
          </div>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-emerald-500/40 rounded-full px-3 py-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">
              {engine === "blazepose" ? "33" : "17"} 測點 · {activeKeypoints} 偵測中 · {fps} FPS
              {activeKeypoints === 0 && " · 請站入畫面"}
            </span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <label className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => onToggleSkeleton(e.target.checked)}
              className="accent-emerald-500"
            />
            <span className="text-white/80 text-xs">顯示骨架測點</span>
          </label>
        </div>
      )}
    </>
  );
}

export function RehabReadyPanel({
  exercise,
  handRaiseProgress,
  readySide,
  detectedInFrame,
  activeKeypoints,
  keypointTotal,
  onBack,
}: Pick<
  RehabReadyGateProps,
  | "exercise"
  | "handRaiseProgress"
  | "readySide"
  | "detectedInFrame"
  | "activeKeypoints"
  | "keypointTotal"
  | "onBack"
>) {
  const progressPct = Math.min(100, (handRaiseProgress / HAND_RAISE_HOLD_MS) * 100);

  const statusText = !detectedInFrame
    ? "請站入畫面，讓上半身完整出現在鏡頭中"
    : readySide
      ? `已偵測到${readySide === "left" ? "左" : "右"}手舉起，請保持…`
      : "請舉起任一手，高於肩膀高度";

  return (
    <div className="w-[340px] bg-slate-900/95 backdrop-blur-md border-l border-white/10 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="text-center flex-1">
          <p className="text-white/60 text-[10px]">準備階段</p>
          <h2 className="text-white text-sm font-bold">{exercise.name}</h2>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Camera className="w-4 h-4 text-teal-400" />
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col justify-center gap-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-400/40 flex items-center justify-center mx-auto mb-4">
            <Hand className="w-9 h-9 text-amber-300" />
          </div>
          <h3 className="text-white text-lg font-bold mb-2">舉手確認準備完成</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{statusText}</p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500">確認進度</span>
            <span className="text-amber-300 font-semibold">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
          <p className="text-slate-500 text-[10px] mt-2 text-center">
            舉手並保持約 {HAND_RAISE_HOLD_MS / 1000} 秒後自動開始
          </p>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-[10px]">姿勢偵測</p>
            <p className="text-emerald-400 text-[10px] font-semibold">
              {keypointTotal} 關節點 · {activeKeypoints} 可見
            </p>
          </div>
          <p className="text-white text-sm font-semibold">{exercise.setsReps}</p>
          <p className="text-slate-400 text-xs leading-relaxed">{exercise.instruction}</p>
        </div>
      </div>
    </div>
  );
}
