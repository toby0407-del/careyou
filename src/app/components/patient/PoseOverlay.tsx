import { useEffect, useRef } from "react";
import type { Keypoint } from "@tensorflow-models/pose-detection";
import { SKELETON_CONNECTIONS, getKeypoint } from "../../lib/poseMath";

interface PoseOverlayProps {
  keypoints: Keypoint[];
  width: number;
  height: number;
  highlightJoint?: string;
  currentAngle?: number | null;
  targetAngle?: number;
  repQuality?: "good" | "ok" | "poor" | null;
}

export function PoseOverlay({
  keypoints,
  width,
  height,
  highlightJoint,
  currentAngle,
  targetAngle,
  repQuality,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const qualityColor =
      repQuality === "good"
        ? "#34d399"
        : repQuality === "ok"
        ? "#fbbf24"
        : repQuality === "poor"
        ? "#f87171"
        : "#34d399";

    // Bones
    ctx.lineCap = "round";
    for (const [from, to] of SKELETON_CONNECTIONS) {
      const a = getKeypoint(keypoints, from, 0.25);
      const b = getKeypoint(keypoints, to, 0.25);
      if (!a || !b) continue;

      const isHighlight =
        highlightJoint &&
        (from.includes(highlightJoint) || to.includes(highlightJoint));

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isHighlight ? qualityColor : "rgba(52, 211, 153, 0.75)";
      ctx.lineWidth = isHighlight ? 5 : 3;
      ctx.shadowColor = qualityColor;
      ctx.shadowBlur = isHighlight ? 12 : 4;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Joints
    for (const kp of keypoints) {
      if ((kp.score ?? 0) < 0.25) continue;
      const isHighlight = highlightJoint && kp.name?.includes(highlightJoint);

      ctx.beginPath();
      ctx.arc(kp.x, kp.y, isHighlight ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isHighlight ? qualityColor : "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Angle readout near highlighted joint
    if (highlightJoint && currentAngle != null) {
      const jointKp = keypoints.find(
        (k) => k.name?.includes(highlightJoint) && (k.score ?? 0) > 0.25
      );
      if (jointKp) {
        const label = `${currentAngle}°`;
        const target = targetAngle ? ` / ${targetAngle}°` : "";
        ctx.font = "bold 14px Arial Black, PingFang TC, Microsoft JhengHei, sans-serif";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(jointKp.x + 10, jointKp.y - 28, 90, 24);
        ctx.fillStyle = qualityColor;
        ctx.fillText(label + target, jointKp.x + 16, jointKp.y - 10);
      }
    }
  }, [keypoints, width, height, highlightJoint, currentAngle, targetAngle, repQuality]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
