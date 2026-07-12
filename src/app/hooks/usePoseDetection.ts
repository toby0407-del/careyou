import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import type { Keypoint, PoseDetector } from "@tensorflow-models/pose-detection";


export type CameraState =
  | "idle"
  | "requesting"
  | "loading-model"
  | "ready"
  | "denied"
  | "error";

export type PoseEngine = "blazepose" | "movenet";

const BLAZEPOSE_NAMES = [
  "nose",
  "left_eye_inner", "left_eye", "left_eye_outer",
  "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_pinky", "right_pinky",
  "left_index", "right_index", "left_thumb", "right_thumb",
  "left_hip", "right_hip", "left_knee", "right_knee",
  "left_ankle", "right_ankle", "left_heel", "right_heel",
  "left_foot_index", "right_foot_index",
] as const;

const MOVENET_NAMES = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const;

interface UsePoseDetectionOptions {
  enabled?: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onPose?: (keypoints: Keypoint[]) => void;
}

function checkCameraSupport(): string | null {
  if (!window.isSecureContext) return "攝影機需要 HTTPS 或 localhost";
  if (!navigator.mediaDevices?.getUserMedia) return "此瀏覽器不支援攝影機";
  return null;
}

async function initTfBackend(): Promise<void> {
  try {
    await tf.setBackend("webgl");
    await tf.ready();
  } catch {
    await tf.setBackend("cpu");
    await tf.ready();
  }
}

async function createMoveNetDetector(): Promise<PoseDetector> {
  await initTfBackend();
  return poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    }
  );
}

/** 優先使用 MediaPipe runtime 的 BlazePose Full；模型無法載入時才使用 MoveNet。 */
async function createDetector(): Promise<{ detector: PoseDetector; engine: PoseEngine; keypointTotal: number }> {
  try {
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      {
        runtime: "mediapipe",
        solutionPath: "/mediapipe/pose",
        modelType: "full",
        enableSmoothing: true,
      }
    );
    return { detector, engine: "blazepose", keypointTotal: 33 };
  } catch (error) {
    console.warn("BlazePose 初始化失敗，改用 MoveNet：", error);
    const detector = await createMoveNetDetector();
    return { detector, engine: "movenet", keypointTotal: 17 };
  }
}
function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      resolve();
      return;
    }
    const onReady = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("影片串流失敗")); };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    setTimeout(() => {
      cleanup();
      video.videoWidth > 0 ? resolve() : reject(new Error("攝影機畫面載入逾時"));
    }, 10000);
  });
}

export function usePoseDetection({
  enabled = true,
  videoRef,
  onPose,
}: UsePoseDetectionOptions) {
  const detectorRef = useRef<PoseDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const busyRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const consecutiveEmptyRef = useRef(0);
  const recoveringRef = useRef(false);
  const engineRef = useRef<PoseEngine | null>(null);
  const onPoseRef = useRef(onPose);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [engine, setEngine] = useState<PoseEngine | null>(null);
  const [keypointTotal, setKeypointTotal] = useState(17);
  const [activeKeypoints, setActiveKeypoints] = useState(0);
  const [videoLive, setVideoLive] = useState(false);

  useEffect(() => { onPoseRef.current = onPose; }, [onPose]);

  const stop = useCallback(() => {
    runningRef.current = false;
    busyRef.current = false;
    consecutiveErrorsRef.current = 0;
    consecutiveEmptyRef.current = 0;
    recoveringRef.current = false;
    engineRef.current = null;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    detectorRef.current?.dispose();
    detectorRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setVideoLive(false);
  }, [videoRef]);

  const bindStreamToVideo = useCallback(async (video: HTMLVideoElement) => {
    if (!streamRef.current) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.srcObject = streamRef.current;
    try {
      await video.play();
      await waitForVideoReady(video);
      setVideoLive(true);
    } catch (e) {
      console.warn("video.play failed, retrying:", e);
      await new Promise((r) => setTimeout(r, 300));
      await video.play();
      setVideoLive(true);
    }
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;

    const err = checkCameraSupport();
    if (err) { setCameraState("error"); setErrorMessage(err); return; }

    stop();
    setCameraState("requesting");
    setErrorMessage(null);
    setEngine(null);
    setVideoLive(false);

    try {
      const video = videoRef.current;
      if (!video) throw new Error("攝影機元件尚未就緒");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      await bindStreamToVideo(video);

      setCameraState("loading-model");
      const { detector, engine: eng, keypointTotal: total } = await createDetector();
      detectorRef.current = detector;
      engineRef.current = eng;
      setEngine(eng);
      setKeypointTotal(total);
      setCameraState("ready");

      runningRef.current = true;
      let frames = 0;
      let lastT = performance.now();

      const loop = () => {
        if (!runningRef.current) return;
        rafRef.current = requestAnimationFrame(loop);

        if (busyRef.current || !detectorRef.current || !videoRef.current) return;
        const v = videoRef.current;
        if (v.videoWidth === 0 || v.readyState < 2) return;

        busyRef.current = true;
        detectorRef.current
          // 保留原始影片座標；畫面鏡像只交給 video/canvas 的 CSS 處理，
          // 避免模型座標與骨架疊圖各自鏡像而失去對齊。
          .estimatePoses(v, { flipHorizontal: false, maxPoses: 1 })
          .then(async (poses) => {
            const raw = poses[0]?.keypoints ?? [];
            const currentEngine = engineRef.current ?? eng;
            const pointNames = currentEngine === "blazepose" ? BLAZEPOSE_NAMES : MOVENET_NAMES;
            const kp = raw.map((point, index) => ({
              ...point,
              name: point.name ?? pointNames[index] ?? `point_${index}`,
            }));
            const visibleCount = kp.filter((k) => (k.score ?? 0) >= 0.25).length;
            setKeypoints(kp);
            setActiveKeypoints(visibleCount);
            onPoseRef.current?.(kp);
            consecutiveErrorsRef.current = 0;

            if (currentEngine === "blazepose" && visibleCount < 5) {
              consecutiveEmptyRef.current += 1;
            } else {
              consecutiveEmptyRef.current = 0;
            }

            // BlazePose 有時會成功初始化，卻持續回傳空陣列。此時用 MoveNet
            // 做一次健康檢查；只有 MoveNet 確實看到人體時才切換，避免單純
            // 因為使用者暫時離開畫面而誤判模型故障。
            if (
              currentEngine === "blazepose" &&
              consecutiveEmptyRef.current >= 90 &&
              !recoveringRef.current
            ) {
              recoveringRef.current = true;
              try {
                const fallback = await createMoveNetDetector();
                const fallbackPoses = await fallback.estimatePoses(v, {
                  flipHorizontal: false,
                  maxPoses: 1,
                });
                const fallbackPoints = fallbackPoses[0]?.keypoints ?? [];
                const fallbackVisible = fallbackPoints.filter((k) => (k.score ?? 0) >= 0.25).length;

                if (fallbackVisible >= 5 && runningRef.current) {
                  const previous = detectorRef.current;
                  detectorRef.current = fallback;
                  engineRef.current = "movenet";
                  setEngine("movenet");
                  setKeypointTotal(17);
                  setErrorMessage("BlazePose 未回傳人體，已自動切換為 MoveNet 備援");
                  previous?.dispose();
                } else {
                  fallback.dispose();
                }
              } catch (fallbackError) {
                console.warn("MoveNet 健康檢查失敗：", fallbackError);
              } finally {
                consecutiveEmptyRef.current = 0;
                recoveringRef.current = false;
              }
            }
            frames++;
            const now = performance.now();
            if (now - lastT >= 1000) {
              setFps(frames);
              frames = 0;
              lastT = now;
            }
          })
          .catch((err) => {
            consecutiveErrorsRef.current += 1;
            console.warn("pose estimatePoses failed:", err);
            if (consecutiveErrorsRef.current >= 30) {
              runningRef.current = false;
              setCameraState("error");
              setErrorMessage("姿勢模型連續偵測失敗，請按重試");
            }
          })
          .finally(() => { busyRef.current = false; });
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      stop();
      const msg = e instanceof Error ? e.message : "啟動失敗";
      const low = msg.toLowerCase();
      if (low.includes("permission") || low.includes("notallowed") || low.includes("denied")) {
        setCameraState("denied");
        setErrorMessage("請允許瀏覽器使用攝影機");
      } else {
        setCameraState("error");
        setErrorMessage(msg);
      }
    }
  }, [enabled, stop, videoRef, bindStreamToVideo]);

  // Re-bind stream if video element remounts while stream is alive
  useEffect(() => {
    if (!enabled || cameraState !== "ready") return;
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (video.srcObject === streamRef.current && video.readyState >= 2) return;
    void bindStreamToVideo(video);
  }, [enabled, cameraState, bindStreamToVideo, videoRef]);

  useEffect(() => {
    if (!enabled) { stop(); setCameraState("idle"); return; }
    const t = setTimeout(start, 150);
    return () => { clearTimeout(t); stop(); };
  }, [enabled, start, stop]);

  return {
    cameraState,
    keypoints,
    errorMessage,
    fps,
    engine,
    keypointTotal,
    activeKeypoints,
    videoLive,
    retry: start,
    stop,
  };
}

