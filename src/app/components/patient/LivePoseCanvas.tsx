import { useEffect, useRef } from "react";
import type { Keypoint } from "@tensorflow-models/pose-detection";

const CONNECTIONS: Array<[string, string]> = [
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

interface LivePoseCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  keypoints: Keypoint[];
  visible: boolean;
  highlightJoint?: string;
}

export function LivePoseCanvas({
  videoRef,
  keypoints,
  visible,
  highlightJoint,
}: LivePoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(cssWidth * dpr);
      const pixelHeight = Math.round(cssHeight * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      if (!visible || video.videoWidth <= 0 || video.videoHeight <= 0) return;

      const scale = Math.max(cssWidth / video.videoWidth, cssHeight / video.videoHeight);
      const renderedWidth = video.videoWidth * scale;
      const renderedHeight = video.videoHeight * scale;
      const offsetX = (cssWidth - renderedWidth) / 2;
      const offsetY = (cssHeight - renderedHeight) / 2;

      const points = new Map<string, { x: number; y: number; score: number }>();
      for (const point of keypoints) {
        if (!point.name || (point.score ?? 0) < 0.25) continue;
        const sourceX = offsetX + point.x * scale;
        const sourceY = offsetY + point.y * scale;
        points.set(point.name, {
          x: cssWidth - sourceX,
          y: sourceY,
          score: point.score ?? 0,
        });
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const [from, to] of CONNECTIONS) {
        const a = points.get(from);
        const b = points.get(to);
        if (!a || !b) continue;
        const highlighted = Boolean(
          highlightJoint && (from.includes(highlightJoint) || to.includes(highlightJoint))
        );
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = highlighted ? "#fde047" : "#34d399";
        ctx.lineWidth = highlighted ? 6 : 4;
        ctx.shadowColor = highlighted ? "#facc15" : "#10b981";
        ctx.shadowBlur = 8;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      for (const [name, point] of points) {
        const highlighted = Boolean(highlightJoint && name.includes(highlightJoint));
        ctx.beginPath();
        ctx.arc(point.x, point.y, highlighted ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = highlighted ? "#fde047" : "#34d399";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [videoRef, keypoints, visible, highlightJoint]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-30 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
