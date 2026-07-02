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

export type PoseEngine = "movenet" | "blazepose";

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

/** BlazePose lite — 33 keypoints (ML Kit 同源); MoveNet fallback — 17 points */
async function createDetector(): Promise<{ detector: PoseDetector; engine: PoseEngine; keypointTotal: number }> {
  await initTfBackend();

  try {
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      { runtime: "tfjs", modelType: "lite", enableSmoothing: true }
    );
    return { detector, engine: "blazepose", keypointTotal: 33 };
  } catch (blazeErr) {
    console.warn("BlazePose failed, falling back to MoveNet:", blazeErr);
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );
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
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      await bindStreamToVideo(video);

      setCameraState("loading-model");
      const { detector, engine: eng, keypointTotal: total } = await createDetector();
      detectorRef.current = detector;
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
          .estimatePoses(v, { flipHorizontal: false, maxPoses: 1 })
          .then((poses) => {
            const kp = poses[0]?.keypoints ?? [];
            setKeypoints(kp);
            setActiveKeypoints(kp.filter((k) => (k.score ?? 0) >= 0.2).length);
            onPoseRef.current?.(kp);
            frames++;
            const now = performance.now();
            if (now - lastT >= 1000) {
              setFps(frames);
              frames = 0;
              lastT = now;
            }
          })
          .catch((err) => {
            console.warn("pose estimatePoses failed:", err);
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
    const video = videoRef.current;
    if (!video || !streamRef.current || cameraState !== "ready") return;
    if (!video.srcObject) bindStreamToVideo(video);
  });

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
