import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  Camera,
  AlertCircle,
  CheckCircle2,
  Mic,
  Activity,
  Target,
  Lock,
} from "lucide-react";
import { getExerciseById, allExercises, getLevelStatus } from "../../data/patientExercises";
import { getAppDisplayName } from "../../brand";
import { appendCorridorEvent } from "../../data/timeCorridor";
import { appendGalleryPhoto } from "../../data/timeGallery";
import { usePoseDetection } from "../../hooks/usePoseDetection";
import {
  getJointAngle,
  createRepTracker,
  updateRepTracker,
  drawPoseSkeleton,
  type RepTracker,
} from "../../utils/poseAnalysis";
import { Switch } from "../ui/switch";

const VOICE_PROMPTS = [
  "很好！保持這個姿勢，繼續加油！",
  "注意保持背部挺直，不要彎腰",
  "動作做得很標準，繼續保持！",
  "請放慢動作速度，感受肌肉用力",
  "再做幾次，你快完成了！",
];

export function RehabExecution() {
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const exerciseIndex = allExercises.findIndex((e) => e.id === exerciseId);
  const exercise =
    exerciseIndex >= 0 ? allExercises[exerciseIndex] : getExerciseById("knee-flexion")!;
  const levelStatus =
    exerciseIndex >= 0 ? getLevelStatus(exercise, exerciseIndex) : "active";
  const isLocked = levelStatus === "locked";

  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [validReps, setValidReps] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState(VOICE_PROMPTS[0]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [jointAngle, setJointAngle] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("請面向鏡頭，準備開始動作");
  const [isStandard, setIsStandard] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const repTrackerRef = useRef<RepTracker>(createRepTracker());
  const lastValidCountRef = useRef(0);
  const syncedCompleteRef = useRef(false);
  const isPausedRef = useRef(isPaused);
  const currentSetRef = useRef(currentSet);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastKeypointsRef = useRef<import("@tensorflow-models/pose-detection").Keypoint[]>([]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    currentSetRef.current = currentSet;
  }, [isPaused, currentSet]);

  const onPose = useCallback(
    (keypoints: import("@tensorflow-models/pose-detection").Keypoint[]) => {
      lastKeypointsRef.current = keypoints;

      const angle = getJointAngle(keypoints, exercise.pose.joint);
      setJointAngle(angle);

      if (isPausedRef.current) return;

      const tracker = updateRepTracker(repTrackerRef.current, angle, exercise);
      repTrackerRef.current = tracker;
      setFeedback(tracker.feedback);
      setIsStandard(tracker.isStandard);

      if (tracker.validReps > lastValidCountRef.current) {
        lastValidCountRef.current = tracker.validReps;
        setCurrentRep((r) => {
          const next = r + 1;
          if (next >= exercise.repsPerSet) {
            if (currentSetRef.current >= exercise.sets) {
              setShowComplete(true);
            } else {
              setCurrentSet((s) => s + 1);
              repTrackerRef.current = createRepTracker();
              lastValidCountRef.current = 0;
            }
            return 0;
          }
          return next;
        });
        setValidReps(tracker.validReps);
      }
    },
    [exercise]
  );

  const { cameraState, errorMessage, fps, engine, keypointTotal, activeKeypoints, videoLive, retry } =
    usePoseDetection({
    enabled: !showComplete,
    videoRef,
    onPose,
  });

  // 獨立渲染迴圈 — 確保骨架即時疊加在鏡頭畫面上
  useEffect(() => {
    if (!showSkeleton || cameraState !== "ready") return;

    let raf = 0;
    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw;
          canvas.height = vh;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (lastKeypointsRef.current.length > 0) {
            drawPoseSkeleton(ctx, lastKeypointsRef.current, vw, vh);
          } else {
            ctx.clearRect(0, 0, vw, vh);
          }
        }
      }
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [showSkeleton, cameraState]);

  // 關閉骨架時清除畫布
  useEffect(() => {
    if (showSkeleton) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [showSkeleton]);

  // Timer
  useEffect(() => {
    if (cameraState !== "ready" || isPaused) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [cameraState, isPaused]);

  // Sync to 時光迴廊 (patient ↔ family)
  useEffect(() => {
    if (!showComplete || syncedCompleteRef.current) return;
    syncedCompleteRef.current = true;
    const today = new Date().toISOString().slice(0, 10);
    const quality = Math.min(100, 70 + validReps * 2);

    appendCorridorEvent({
      date: today,
      title: `完成 ${exercise.name}`,
      description: `關卡 ${exercise.level} 通關，標準動作 ${validReps} 次，用時 ${Math.floor(elapsedSeconds / 60)} 分鐘。`,
      type: "training",
      exerciseName: exercise.name,
      quality,
      metrics: [
        { label: "動作品質", value: quality, unit: "分" },
        { label: "標準次數", value: validReps, unit: "次" },
      ],
    });

    appendGalleryPhoto({
      category: "training",
      date: today,
      title: `${exercise.name} 通關紀念`,
      caption: `今日完成 ${exercise.name} 訓練，標準動作 ${validReps} 次！`,
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
      tags: [exercise.name, "通關"],
    });
  }, [showComplete, exercise, validReps, elapsedSeconds]);

  // Voice prompts
  useEffect(() => {
    if (!voiceEnabled || isPaused || cameraState !== "ready") return;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * VOICE_PROMPTS.length);
      setCurrentPrompt(VOICE_PROMPTS[idx]);
      setShowPrompt(true);
      setTimeout(() => setShowPrompt(false), 3500);
    }, 10000);
    return () => clearInterval(interval);
  }, [voiceEnabled, isPaused, cameraState]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const overallProgress =
    ((currentSet - 1) * exercise.repsPerSet + currentRep) /
    (exercise.sets * exercise.repsPerSet);

  const isLoading =
    cameraState === "idle" || cameraState === "requesting" || cameraState === "loading-model";
  const isReady = cameraState === "ready";

  if (isLocked) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 px-6">
        <div className="w-20 h-20 rounded-full bg-slate-700/50 border-2 border-slate-500 flex items-center justify-center">
          <Lock className="w-9 h-9 text-slate-300" />
        </div>
        <div className="text-center">
          <h2 className="text-white mb-2">此關卡尚未解鎖</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            請依序完成前面的復健項目，通關後才能挑戰「{exercise.name}」
          </p>
        </div>
        <button
          onClick={() => navigate("/patient")}
          className="px-6 py-3 bg-teal-500 text-white rounded-xl"
        >
          返回闖關地圖
        </button>
      </div>
    );
  }

  if (cameraState === "denied" || cameraState === "error") {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-5 px-6">
        <video ref={videoRef} className="hidden" playsInline muted />
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
          <AlertCircle className="w-9 h-9 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-white mb-2">
            {cameraState === "denied" ? "攝影機存取遭拒" : "偵測系統錯誤"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            {cameraState === "denied"
              ? "請在瀏覽器設定中允許攝影機存取，以使用 TensorFlow 姿勢偵測"
              : errorMessage ?? "請重新整理頁面後再試"}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={retry} className="px-6 py-3 bg-teal-500 text-white rounded-xl">
            重試
          </button>
          <button
            onClick={() => navigate("/patient")}
            className="px-6 py-3 bg-white/10 text-white rounded-xl border border-white/20"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-large-text h-screen bg-black relative overflow-hidden flex">
      {/* Camera — single video element, never unmount */}
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Loading overlay — does NOT unmount video */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-slate-900/95 flex flex-col items-center justify-center gap-6 px-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center"
            >
              <Camera className="w-9 h-9 text-teal-400" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-white mb-2">
                {cameraState === "loading-model"
                  ? "載入姿勢偵測模型..."
                  : "正在請求攝影機權限"}
              </h2>
              <p className="text-slate-400 text-sm max-w-sm">
                {getAppDisplayName()} · BlazePose 33 關節點 / MoveNet 備援
              </p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-teal-500 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* No video signal warning */}
        {isReady && !videoLive && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
            <p className="text-white text-sm">鏡頭畫面載入中...</p>
          </div>
        )}

        {isReady && (
        <>
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-emerald-500/40 rounded-full px-3 py-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>
              {engine === "blazepose" ? "BlazePose 33點" : "MoveNet 17點"} · {activeKeypoints} 偵測中 · {fps} FPS
              {activeKeypoints === 0 && " · 請站入畫面"}
            </span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </motion.div>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
            <span className="text-white/80 text-xs">顯示骨架</span>
            <Switch
              checked={showSkeleton}
              onCheckedChange={setShowSkeleton}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        {/* Joint angle overlay */}
        {jointAngle != null ? (
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm border border-teal-500/30 rounded-lg px-3 py-2">
            <p className="text-teal-300 text-xs">關節角度</p>
            <p className="text-white text-lg" style={{ fontWeight: 700 }}>
              {jointAngle}°
            </p>
            <p className="text-[10px] text-slate-400">
              目標 {exercise.pose.flexedAngle}°–{exercise.pose.extendedAngle}°
            </p>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm border border-slate-500/30 rounded-lg px-3 py-2">
            <p className="text-slate-400 text-xs">關節角度</p>
            <p className="text-white text-lg" style={{ fontWeight: 700 }}>--°</p>
            <p className="text-[10px] text-slate-500">請面向鏡頭站入畫面</p>
          </div>
        )}

        {/* Standard indicator */}
        <div className="absolute top-4 right-4">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border ${
              isStandard
                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                : "bg-amber-500/20 border-amber-400/40 text-amber-300"
            }`}
            style={{ fontWeight: 600 }}
          >
            <Target className="w-3.5 h-3.5" />
            {isStandard ? "動作標準" : "調整姿勢"}
          </div>
        </div>
        </>
        )}
      </div>

      {/* Right panel — visible during load & ready */}
      {(isLoading || isReady) && (
      <div className="w-[340px] bg-slate-900/95 backdrop-blur-md border-l border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={() => navigate("/patient")}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="text-center flex-1">
            <p className="text-white/60 text-[10px]">關卡 {exercise.level}</p>
            <h2 className="text-white text-sm" style={{ fontWeight: 700 }}>
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-teal-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Voice prompt */}
        <AnimatePresence>
          {showPrompt && voiceEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3"
            >
              <div className="bg-teal-600/80 rounded-xl px-3 py-2 flex items-center gap-2">
                <Mic className="w-4 h-4 text-white flex-shrink-0" />
                <p className="text-white text-xs">{currentPrompt}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="flex-1 p-4 flex flex-col justify-center gap-4">
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-1">第 {currentSet} 組</p>
            <div className="flex items-end gap-1 justify-center">
              <motion.span
                key={currentRep}
                initial={{ scale: 1.3, color: "#34d399" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-6xl text-white"
                style={{ fontWeight: 800, lineHeight: 1 }}
              >
                {currentRep}
              </motion.span>
              <span className="text-slate-400 text-2xl mb-2">/{exercise.repsPerSet}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">標準次數 {validReps}</p>
          </div>

          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
              animate={{ width: `${overallProgress * 100}%` }}
            />
          </div>

          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-slate-500 text-[10px]">時間</p>
              <p className="text-white text-lg" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">組別</p>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: exercise.sets }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-1.5 rounded-full ${
                      i < currentSet - 1
                        ? "bg-emerald-400"
                        : i === currentSet - 1
                          ? "bg-teal-400"
                          : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-400 text-[10px]">姿勢偵測</p>
              <p className="text-emerald-400 text-[10px]" style={{ fontWeight: 600 }}>
                {keypointTotal} 關節點 · {activeKeypoints} 可見
              </p>
            </div>
            <p className="text-slate-300 text-xs text-center leading-relaxed">
              {exercise.instruction}
            </p>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2">
            <p className="text-teal-300 text-xs text-center">{feedback}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsPaused((p) => !p)}
            className="flex-1 h-11 rounded-xl bg-teal-500 flex items-center justify-center gap-2 text-white text-sm"
            style={{ fontWeight: 600 }}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-white" /> 繼續
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" /> 暫停
              </>
            )}
          </motion.button>
          <button
            onClick={() => navigate("/patient")}
            className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"
          >
            <Square className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      )}

      {/* Completion overlay */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-white text-xl mb-2" style={{ fontWeight: 700 }}>
                關卡 {exercise.level} 通關！
              </h2>
              <p className="text-teal-300 text-sm mb-1">
                {exercise.name} · 標準 {validReps} 次
              </p>
              <p className="text-slate-400 text-xs mb-6">用時 {formatTime(elapsedSeconds)}</p>
              <button
                onClick={() => navigate("/patient")}
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl"
                style={{ fontWeight: 600 }}
              >
                返回闖關地圖
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
