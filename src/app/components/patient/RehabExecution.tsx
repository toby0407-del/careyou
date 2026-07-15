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
import confetti from "canvas-confetti";
import { getExerciseById, allExercises, getLevelStatus } from "../../data/patientExercises";
import { useResolvedExercise } from "../../hooks/useResolvedExercise";
import { getAppDisplayName } from "../../brand";
import { appendCorridorEvent } from "../../data/timeCorridor";
import { appendGalleryPhoto } from "../../data/timeGallery";
import { recordSessionComplete, withLiveProgress } from "../../data/progressStore";
import {
  speak,
  speakCount,
  stopSpeaking,
  getVoiceEnabled,
  setVoiceEnabled as persistVoiceEnabled,
} from "../../lib/speech";
import { getPatientSpeechLang } from "../../lib/patientLanguage";
import { L } from "../../lib/companionLocale";
import { SpeechLanguageToggle } from "./SpeechLanguageToggle";
import { usePoseDetection } from "../../hooks/usePoseDetection";
import { RehabDemoBriefing } from "./RehabDemoBriefing";
import { RehabReadyOverlays, RehabReadyPanel } from "./RehabReadyGate";
import { LivePoseCanvas } from "./LivePoseCanvas";
import { JointAngleGauge } from "./JointAngleGauge";
import {
  getJointAngle,
  createRepTracker,
  updateRepTracker,
  prepareKeypointsForVideo,

  createHandRaiseTracker,
  updateHandRaiseTracker,
  HAND_RAISE_HOLD_MS,
  countVisibleKeypoints,
  type RepTracker,
} from "../../utils/poseAnalysis";
import { Switch } from "../ui/switch";

const VOICE_PROMPTS_ZH = [
  "很好！保持這個姿勢，繼續加油！",
  "注意保持背部挺直，不要彎腰",
  "動作做得很標準，繼續保持！",
  "請放慢動作速度，感受肌肉用力",
  "再做幾次，你快完成了！",
];

const VOICE_PROMPTS_NAN = [
  "足讚！維持這个姿勢，繼續加油！",
  "注意背部欲挺直，莫彎腰",
  "動作做足標準，繼續維持！",
  "動作放慢咧，感覺肌肉咧用力",
  "閣做幾个，你快完成矣！",
];

function getVoicePrompts() {
  return getPatientSpeechLang() === "nan" ? VOICE_PROMPTS_NAN : VOICE_PROMPTS_ZH;
}

type RehabPhase = "demo" | "ready" | "training";

export function RehabExecution() {
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const resolvedExercise = useResolvedExercise(exerciseId ?? "knee-flexion");
  const liveExercises = withLiveProgress(allExercises);
  const exerciseIndex = liveExercises.findIndex((e) => e.id === exerciseId);
  const fallback =
    exerciseIndex >= 0 ? liveExercises[exerciseIndex] : getExerciseById("knee-flexion")!;
  const exercise = resolvedExercise ?? fallback;
  const levelStatus =
    exerciseIndex >= 0
      ? getLevelStatus(liveExercises[exerciseIndex], exerciseIndex, liveExercises)
      : "active";
  const isLocked = levelStatus === "locked";

  const [phase, setPhase] = useState<RehabPhase>("demo");
  const [handRaiseProgress, setHandRaiseProgress] = useState(0);
  const [readySide, setReadySide] = useState<"left" | "right" | null>(null);
  const [detectedInFrame, setDetectedInFrame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => getVoiceEnabled());
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [validReps, setValidReps] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState(() => getVoicePrompts()[0]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [jointAngle, setJointAngle] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("請面向鏡頭，準備開始動作");
  const [isStandard, setIsStandard] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const [restSuggested, setRestSuggested] = useState(false);
  const [sessionResult, setSessionResult] = useState<{
    stars: 1 | 2 | 3;
    quality: number;
  } | null>(null);

  const repTrackerRef = useRef<RepTracker>(createRepTracker());
  const handRaiseRef = useRef(createHandRaiseTracker());
  const lastPoseTimeRef = useRef(performance.now());
  const phaseRef = useRef<RehabPhase>("demo");
  const lastValidCountRef = useRef(0);
  const lastInvalidCountRef = useRef(0);
  const syncedCompleteRef = useRef(false);
  const celebratedCompleteRef = useRef(false);
  const isPausedRef = useRef(isPaused);
  const currentSetRef = useRef(currentSet);
  const elapsedSecondsRef = useRef(elapsedSeconds);
  const voiceEnabledRef = useRef(voiceEnabled);
  /** 跨組累計（品質評分用） */
  const totalValidRef = useRef(0);
  const totalInvalidRef = useRef(0);
  /** 每次有效動作的時間戳（疲勞偵測用） */
  const repTimesRef = useRef<number[]>([]);
  const currentRepRef = useRef(0);
  const restSuggestedRef = useRef(false);
  const lastInvalidSpeakRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    isPausedRef.current = isPaused;
    currentSetRef.current = currentSet;
    elapsedSecondsRef.current = elapsedSeconds;
    phaseRef.current = phase;
    voiceEnabledRef.current = voiceEnabled;
  }, [isPaused, currentSet, elapsedSeconds, phase, voiceEnabled]);

  const speakIfOn = useCallback((text: string, interrupt = false) => {
    if (voiceEnabledRef.current) speak(text, { interrupt });
  }, []);
  const beginTraining = useCallback(() => {
    handRaiseRef.current = createHandRaiseTracker();
    repTrackerRef.current = createRepTracker();
    lastValidCountRef.current = 0;
    lastInvalidCountRef.current = 0;
    totalValidRef.current = 0;
    totalInvalidRef.current = 0;
    repTimesRef.current = [];
    currentRepRef.current = 0;
    restSuggestedRef.current = false;
    setHandRaiseProgress(0);
    setReadySide(null);
    setCurrentSet(1);
    setCurrentRep(0);
    setValidReps(0);
    setElapsedSeconds(0);
    setShowComplete(false);
    setSessionResult(null);
    syncedCompleteRef.current = false;
    celebratedCompleteRef.current = false;
    setPhase("training");
    speakIfOn(
      L(
        `開始訓練！${exercise.name}，共 ${exercise.sets} 組、每組 ${exercise.repsPerSet} 次。${exercise.instruction}`,
        `開始訓練！${exercise.name}，共 ${exercise.sets} 組、逐組 ${exercise.repsPerSet} 擺。${exercise.instruction}`
      ),
      true
    );
  }, [exercise, speakIfOn]);

  // 離開頁面時停止語音
  useEffect(() => () => stopSpeaking(), []);

  // 語音教練：動作講解（demo 進入時朗讀一次）
  const demoSpokenRef = useRef(false);
  useEffect(() => {
    if (phase === "demo" && !demoSpokenRef.current && !isLocked) {
      demoSpokenRef.current = true;
      const nan = getPatientSpeechLang() === "nan";
      speakIfOn(
        nan
          ? `${exercise.name}，共 ${exercise.sets} 組、逐組 ${exercise.repsPerSet} 擺。${exercise.instruction}。準備好了，請按「準備開始」。`
          : `${exercise.name}，共 ${exercise.sets} 組、每組 ${exercise.repsPerSet} 次。${exercise.instruction}。準備好後，請按「準備開始」。`
      );
    }
  }, [phase, isLocked, exercise, speakIfOn]);

  // 語音教練：就位指引
  const readySpokenRef = useRef(false);
  useEffect(() => {
    if (phase === "ready" && !readySpokenRef.current) {
      readySpokenRef.current = true;
      speakIfOn(
        getPatientSpeechLang() === "nan"
          ? "請徛入去畫面中央，予鏡頭看著全身。扞一支手維持兩秒，訓練就會開始！"
          : "請站進畫面中央，讓鏡頭看到全身。舉起一隻手保持兩秒，訓練就會開始！",
        true
      );
    }
    if (phase !== "ready") readySpokenRef.current = false;
  }, [phase, speakIfOn]);

  /** 疲勞偵測：後段動作間隔明顯變慢 → 建議休息（每組最多提醒一次） */
  const checkFatigue = useCallback(() => {
    const times = repTimesRef.current;
    if (restSuggestedRef.current || times.length < 6) return;
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1]);
    const early = intervals.slice(0, 3);
    const late = intervals.slice(-3);
    const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
    if (avg(late) > avg(early) * 1.7) {
      restSuggestedRef.current = true;
      setRestSuggested(true);
      speakIfOn(
        getPatientSpeechLang() === "nan"
          ? "我看你動作變慢矣，需要休息一下無？隨時通按暫停，莫勉強。"
          : "我注意到你的動作變慢了，需要休息一下嗎？隨時可以按暫停，不用勉強。",
        true
      );
      setTimeout(() => setRestSuggested(false), 8000);
    }
  }, [speakIfOn]);

  const onPose = useCallback(
    (keypoints: import("@tensorflow-models/pose-detection").Keypoint[]) => {
      const video = videoRef.current;
      const prepared =
        video && video.videoWidth > 0
          ? prepareKeypointsForVideo(keypoints, video.videoWidth, video.videoHeight)
          : keypoints;

      const now = performance.now();
      const deltaMs = now - lastPoseTimeRef.current;
      lastPoseTimeRef.current = now;

      if (phaseRef.current === "ready") {
        const visibleCount = countVisibleKeypoints(prepared);
        setDetectedInFrame(visibleCount >= 5);
        setJointAngle(getJointAngle(prepared, exercise.pose.joint));

        const tracker = updateHandRaiseTracker(handRaiseRef.current, prepared, deltaMs);
        handRaiseRef.current = tracker;
        setHandRaiseProgress(tracker.holdingMs);
        setReadySide(tracker.side);

        if (tracker.holdingMs >= HAND_RAISE_HOLD_MS) {
          beginTraining();
        }
        return;
      }

      if (phaseRef.current !== "training") return;

      const angle = getJointAngle(prepared, exercise.pose.joint);
      setJointAngle(angle);

      if (isPausedRef.current) return;

      const tracker = updateRepTracker(repTrackerRef.current, angle, exercise);
      repTrackerRef.current = tracker;
      setFeedback(tracker.feedback);
      setIsStandard(tracker.isStandard);

      // 無效動作 — 累計並以語音提醒（節流）
      if (tracker.invalidReps > lastInvalidCountRef.current) {
        totalInvalidRef.current += tracker.invalidReps - lastInvalidCountRef.current;
        lastInvalidCountRef.current = tracker.invalidReps;
        const nowMs = performance.now();
        if (nowMs - lastInvalidSpeakRef.current > 6000) {
          lastInvalidSpeakRef.current = nowMs;
          speakIfOn(
            L(
              "這次幅度不足，不計入。放慢速度，再彎多一點。",
              "這擺幅度無夠，袂算。放慢咧，閣彎較濟一屑。"
            )
          );
        }
      }

      if (tracker.validReps > lastValidCountRef.current) {
        totalValidRef.current += tracker.validReps - lastValidCountRef.current;
        lastValidCountRef.current = tracker.validReps;
        repTimesRef.current.push(performance.now());

        const next = currentRepRef.current + 1;
        if (next >= exercise.repsPerSet) {
          currentRepRef.current = 0;
          setCurrentRep(0);
          if (currentSetRef.current >= exercise.sets) {
            // 同步寫入進度，避免關閉完成彈窗時 useEffect 尚未跑完導致下一關不解鎖
            if (!syncedCompleteRef.current) {
              syncedCompleteRef.current = true;
              const valid = totalValidRef.current;
              const invalid = totalInvalidRef.current;
              const attempts = Math.max(1, valid + invalid);
              const quality = Math.max(55, Math.min(100, Math.round((valid / attempts) * 100)));
              const stars: 1 | 2 | 3 = quality >= 90 ? 3 : quality >= 75 ? 2 : 1;
              setSessionResult({ stars, quality });
              recordSessionComplete({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                stars,
                quality,
                validReps: valid,
                invalidReps: invalid,
                durationSec: elapsedSecondsRef.current,
              });
            }
            setShowComplete(true);
          } else {
            const finishedSet = currentSetRef.current;
            const nextSet = finishedSet + 1;
            currentSetRef.current = nextSet;
            setCurrentSet(nextSet);
            repTrackerRef.current = createRepTracker();
            lastValidCountRef.current = 0;
            lastInvalidCountRef.current = 0;
            repTimesRef.current = [];
            restSuggestedRef.current = false;
            speakIfOn(
              L(
                `太棒了，第 ${finishedSet} 組完成！休息一下，準備第 ${finishedSet + 1} 組。`,
                `足讚！第 ${finishedSet} 組完成矣！歇一下，準備第 ${finishedSet + 1} 組。`
              ),
              true
            );
          }
        } else {
          currentRepRef.current = next;
          setCurrentRep(next);
          if (voiceEnabledRef.current) speakCount(next);
        }
        setValidReps(totalValidRef.current);
        checkFatigue();
      }
    },
    [exercise, speakIfOn, checkFatigue, beginTraining]
  );

  const poseDetectionEnabled = !showComplete && (phase === "ready" || phase === "training");

  const { cameraState, keypoints, errorMessage, fps, engine, keypointTotal, activeKeypoints, videoLive, retry } =
    usePoseDetection({
    enabled: poseDetectionEnabled,
    videoRef,
    onPose,
  });

  // Timer
  useEffect(() => {
    if (phase !== "training" || cameraState !== "ready" || isPaused) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase, cameraState, isPaused]);

  // 訓練完成慶祝 — 進度已在通關當下同步寫入；此處只做迴廊／相簿／彩帶／語音
  useEffect(() => {
    if (!showComplete || !sessionResult || celebratedCompleteRef.current) return;
    celebratedCompleteRef.current = true;

    const valid = totalValidRef.current;
    const { stars, quality } = sessionResult;
    const durationSec = elapsedSecondsRef.current;
    const today = new Date().toISOString().slice(0, 10);

    appendCorridorEvent({
      date: today,
      title: `完成 ${exercise.name}`,
      description: `關卡 ${exercise.level} 通關，標準動作 ${valid} 次，動作品質 ${quality} 分，用時 ${Math.max(1, Math.floor(durationSec / 60))} 分鐘。`,
      type: "training",
      exerciseName: exercise.name,
      quality,
      metrics: [
        { label: "動作品質", value: quality, unit: "分" },
        { label: "標準次數", value: valid, unit: "次" },
      ],
    });

    appendGalleryPhoto({
      category: "training",
      date: today,
      title: `${exercise.name} 通關紀念`,
      caption: `今日完成 ${exercise.name} 訓練，標準動作 ${valid} 次、品質 ${quality} 分，獲得 ${stars} 顆星！`,
      imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
      tags: [exercise.name, "通關"],
    });

    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#14b8a6", "#34d399", "#fbbf24", "#f472b6"],
      zIndex: 9999,
      disableForReducedMotion: true,
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        zIndex: 9999,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        zIndex: 9999,
        disableForReducedMotion: true,
      });
    }, 350);

    speakIfOn(
      L(
        `恭喜！${exercise.name}全部完成，標準動作 ${valid} 次，動作品質 ${quality} 分，獲得 ${stars} 顆星！下一關已經為你解鎖了。`,
        `恭喜！${exercise.name}攏總完成，標準動作 ${valid} 擺，動作品質 ${quality} 分，提著 ${stars} 粒星！下一關已經共你開放矣。`
      ),
      true
    );
  }, [showComplete, sessionResult, exercise, speakIfOn]);

  // 語音鼓勵 — 視覺提示 + 真實 TTS 朗讀
  useEffect(() => {
    if (phase !== "training" || !voiceEnabled || isPaused || cameraState !== "ready") return;
    const interval = setInterval(() => {
      const prompts = getVoicePrompts();
      const idx = Math.floor(Math.random() * prompts.length);
      setCurrentPrompt(prompts[idx]);
      setShowPrompt(true);
      speak(prompts[idx]);
      setTimeout(() => setShowPrompt(false), 3500);
    }, 15000);
    return () => clearInterval(interval);
  }, [phase, voiceEnabled, isPaused, cameraState]);

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
      <div className="rehab-app-shell bg-slate-900 flex flex-col items-center justify-center gap-5 px-6">
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
          className="px-6 py-3 bg-teal-300 text-white rounded-xl"
        >
          返回闖關地圖
        </button>
      </div>
    );
  }

  if (phase === "demo") {
    return (
      <div className="rehab-app-shell bg-slate-950">
        <RehabDemoBriefing
          exercise={exercise}
          onBack={() => navigate("/patient")}
          onContinue={() => {
            handRaiseRef.current = createHandRaiseTracker();
            setHandRaiseProgress(0);
            setReadySide(null);
            setPhase("ready");
          }}
        />
      </div>
    );
  }

  if (cameraState === "denied" || cameraState === "error") {
    return (
      <div className="rehab-app-shell bg-slate-900 flex flex-col items-center justify-center gap-5 px-6">
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
          <button onClick={retry} className="px-6 py-3 bg-teal-300 text-white rounded-xl">
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

  if (phase === "ready" || phase === "training") {
    return (
      <div className="patient-large-text rehab-app-shell bg-black relative overflow-hidden flex">
        {/* 鏡頭與骨架測點 — ready / training 共用，避免切換時卸載 */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
            autoPlay
          />
          <LivePoseCanvas
            videoRef={videoRef}
            keypoints={keypoints}
            visible={showSkeleton && cameraState === "ready"}
            showPersonHalo={phase === "ready"}
            personDetected={activeKeypoints >= 5}
            highlightJoint={exercise.pose.joint.replace(/^(left|right)/, "").toLowerCase()}
          />

          {isLoading && (
            <div className="absolute inset-0 z-40 bg-slate-900/95 flex flex-col items-center justify-center gap-6 px-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-teal-300/20 border-2 border-teal-300 flex items-center justify-center"
              >
                <Camera className="w-9 h-9 text-teal-200" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-white mb-2">
                  {cameraState === "loading-model"
                    ? "載入姿勢偵測模型..."
                    : "正在請求攝影機權限"}
                </h2>
                <p className="text-slate-400 text-sm max-w-sm">
                  {getAppDisplayName()} · BlazePose 33 關節點 / MoveNet 安全備援
                </p>
              </div>
            </div>
          )}

          {isReady && !videoLive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
              <p className="text-white text-sm">鏡頭畫面載入中...</p>
            </div>
          )}

          {phase === "ready" && isReady && (
            <div className="absolute bottom-8 left-4 z-20 pointer-events-none max-w-[min(300px,50vw)]">
              <div className="bg-black/65 backdrop-blur-md border border-teal-200/30 rounded-2xl px-4 py-3">
                <p className="text-teal-100 text-xs mb-1" style={{ fontWeight: 700 }}>準備好了嗎？</p>
                <p className="text-white/90 text-sm leading-relaxed">
                  請站進畫面中央，把整個身體都讓鏡頭看到。舉起右手 2 秒就會開始計數！
                </p>
              </div>
            </div>
          )}

          {phase === "training" && isReady && (
            <div className="absolute bottom-28 left-4 z-20 pointer-events-none max-w-[min(280px,44vw)]">
              <div className="bg-black/65 backdrop-blur-md border border-emerald-200/30 rounded-2xl px-4 py-2.5">
                <p className="text-white/90 text-sm leading-relaxed">
                  {feedback || "保持呼吸，動作放慢一點會更標準喔！"}
                </p>
              </div>
            </div>
          )}

          {phase === "ready" ? (
            <RehabReadyOverlays
              cameraState={cameraState}
              activeKeypoints={activeKeypoints}
              fps={fps}
              engine={engine}
              showSkeleton={showSkeleton}
              onToggleSkeleton={setShowSkeleton}
            />
          ) : (
            isReady && (
              <>
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                  <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-emerald-300/40 rounded-full px-3 py-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-200" />
                    <span className="text-emerald-200 text-xs" style={{ fontWeight: 600 }}>
                      {engine === "blazepose" ? "BlazePose 33點" : "MoveNet 17點"} · {activeKeypoints}{" "}
                      偵測中 · {fps} FPS
                      {activeKeypoints === 0 && " · 請站入畫面"}
                    </span>
                    <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse" />
                  </motion.div>

                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                    <span className="text-white/80 text-xs">顯示骨架</span>
                    <Switch
                      checked={showSkeleton}
                      onCheckedChange={setShowSkeleton}
                      className="data-[state=checked]:bg-emerald-300"
                    />
                  </div>
                </div>

                {jointAngle != null ? (
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm border border-teal-300/30 rounded-lg px-3 py-2">
                    <p className="text-teal-100 text-xs">關節角度</p>
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
                    <p className="text-white text-lg" style={{ fontWeight: 700 }}>
                      --°
                    </p>
                    <p className="text-[10px] text-slate-500">請面向鏡頭站入畫面</p>
                  </div>
                )}

                <div className="absolute top-4 right-4">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border ${
                      isStandard
                        ? "bg-emerald-300/20 border-emerald-200/40 text-emerald-200"
                        : "bg-amber-500/20 border-amber-400/40 text-amber-300"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    <Target className="w-3.5 h-3.5" />
                    {isStandard ? "動作標準" : "調整姿勢"}
                  </div>
                </div>

                {/* 疲勞偵測 — 休息建議 */}
                <AnimatePresence>
                  {restSuggested && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-amber-500/90 backdrop-blur-sm text-white rounded-2xl px-5 py-3 shadow-xl"
                      role="status"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm" style={{ fontWeight: 700 }}>
                        動作變慢了，需要休息一下嗎？隨時可以按暫停
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )
          )}
        </div>

        {phase === "ready" && (
          <RehabReadyPanel
            exercise={exercise}
            handRaiseProgress={handRaiseProgress}
            readySide={readySide}
            detectedInFrame={detectedInFrame}
            activeKeypoints={activeKeypoints}
            keypointTotal={keypointTotal}
            onBack={() => setPhase("demo")}
            onStart={beginTraining}
          />
        )}

        {phase === "training" && (isLoading || isReady) && (
          <div className="w-[340px] bg-slate-900/95 backdrop-blur-md border-l border-white/10 flex flex-col flex-shrink-0">
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
              <div className="flex items-center gap-1.5">
                <SpeechLanguageToggle
                  size="sm"
                  className="bg-white/10 border-white/15 [&_button]:min-w-[2.25rem] [&_button[aria-pressed=true]]:bg-teal-400 [&_button[aria-pressed=true]]:text-white [&_button[aria-pressed=false]]:text-white/80"
                  onChanged={() => stopSpeaking()}
                />
                <button
                  onClick={() =>
                    setVoiceEnabled((v) => {
                      const next = !v;
                      persistVoiceEnabled(next);
                      if (!next) stopSpeaking();
                      return next;
                    })
                  }
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
                  aria-label={voiceEnabled ? "關閉語音教練" : "開啟語音教練"}
                  aria-pressed={voiceEnabled}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-teal-200" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showPrompt && voiceEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pt-3"
                >
                  <div className="bg-teal-300/80 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-white flex-shrink-0" />
                    <p className="text-white text-xs">{currentPrompt}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 p-4 flex flex-col justify-center gap-4">
              <JointAngleGauge exercise={exercise} angle={jointAngle} />

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
                  className="h-full bg-gradient-to-r from-teal-200 to-emerald-200 rounded-full"
                  animate={{ width: `${overallProgress * 100}%` }}
                />
              </div>

              <div className="flex justify-center gap-6 text-center">
                <div>
                  <p className="text-slate-500 text-[10px]">時間</p>
                  <p
                    className="text-white text-lg"
                    style={{ fontFamily: "monospace", fontWeight: 700 }}
                  >
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
                            ? "bg-emerald-200"
                            : i === currentSet - 1
                              ? "bg-teal-200"
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
                  <p className="text-emerald-200 text-[10px]" style={{ fontWeight: 600 }}>
                    {keypointTotal} 關節點 · {activeKeypoints} 可見
                  </p>
                </div>
                <p className="text-slate-300 text-xs text-center leading-relaxed">
                  {exercise.instruction}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  setIsPaused((p) => {
                    const next = !p;
                    speakIfOn(
                      next
                        ? L("已暫停，好好休息，不用急。", "已經暫停矣，好好歇睏，免著急。")
                        : L("繼續加油！", "繼續加油！"),
                      true
                    );
                    return next;
                  })
                }
                className="flex-1 h-11 rounded-xl bg-teal-300 flex items-center justify-center gap-2 text-white text-sm"
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

        <AnimatePresence>
          {showComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center px-6">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="mb-4"
                >
                  <p className="text-4xl mb-2" aria-hidden>🎉</p>
                  <h2 className="text-white text-2xl" style={{ fontWeight: 800 }}>
                    「{exercise.name}」完成！
                  </h2>
                  <p className="text-teal-50 text-sm mt-1">
                    今天又多前進一步，繼續保持！
                  </p>
                </motion.div>

                {sessionResult && (
                  <div className="mb-5">
                    <div className="flex justify-center gap-2 mb-3" aria-label={`獲得 ${sessionResult.stars} 顆星`}>
                      {[1, 2, 3].map((s) => (
                        <motion.svg
                          key={s}
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3 + s * 0.25, type: "spring", damping: 10 }}
                          viewBox="0 0 24 24"
                          className={`w-12 h-12 ${
                            s <= sessionResult.stars
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-700 text-slate-700"
                          }`}
                        >
                          <path d="M12 2l2.9 6.26 6.86.62-5.18 4.53 1.54 6.72L12 16.77l-6.12 3.36 1.54-6.72L2.24 8.88l6.86-.62L12 2z" />
                        </motion.svg>
                      ))}
                    </div>
                    <div className="flex justify-center gap-6 text-center">
                      <div>
                        <p className="text-slate-400 text-xs">動作品質</p>
                        <p className="text-teal-100 text-2xl" style={{ fontWeight: 800 }}>
                          {sessionResult.quality} 分
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">標準次數</p>
                        <p className="text-emerald-200 text-2xl" style={{ fontWeight: 800 }}>
                          {validReps} 次
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">訓練時間</p>
                        <p className="text-sky-300 text-2xl" style={{ fontWeight: 800 }}>
                          {formatTime(elapsedSeconds)}
                        </p>
                      </div>
                    </div>
                    <p className="text-emerald-200/90 text-sm mt-3" style={{ fontWeight: 700 }}>
                      🔓 下一關已解鎖，成果已同步給家人與醫師
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate("/patient")}
                  className="px-8 py-3 bg-gradient-to-r from-teal-300 to-emerald-300 text-white rounded-xl"
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

  return null;
}
