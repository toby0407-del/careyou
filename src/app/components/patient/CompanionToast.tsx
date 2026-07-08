import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { CompanionBubble, CompanionPose } from "../../data/companionMessages";
import { CompanionPanel, type CompanionPanelProps } from "./RehabCompanion";

interface CompanionToastProps {
  pose: CompanionPose;
  message: string;
  title?: string;
  bubble?: CompanionBubble;
  trigger?: string | number;
  /** 0 = 不自動關閉 */
  durationMs?: number;
  height?: number;
  showTitle?: boolean;
  bubbleTone?: CompanionPanelProps["bubbleTone"];
  className?: string;
  style?: CSSProperties;
}

export function CompanionToast({
  pose,
  message,
  title,
  trigger = 0,
  durationMs = 5500,
  height = 148,
  showTitle = false,
  bubbleTone = "default",
  className = "",
  style,
}: CompanionToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (durationMs <= 0) return;
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [trigger, durationMs]);

  return (
    <div className={`pointer-events-none ${className}`} style={style}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={String(trigger)}
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="pointer-events-auto relative inline-block pr-9 pt-1"
          >
            <CompanionPanel
              pose={pose}
              title={title}
              message={message}
              height={height}
              showTitle={showTitle}
              bubbleTone={bubbleTone}
            />
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="absolute top-0 right-0 z-20 w-7 h-7 rounded-full bg-white/95 border border-teal-50/80 shadow-sm hover:bg-emerald-50 flex items-center justify-center"
              aria-label="關閉提示"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
