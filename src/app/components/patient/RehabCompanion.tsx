import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import {
  POSE_BUBBLE_STYLE,
  POSE_CELL_ASPECT,
  POSE_IMAGE,
  type CompanionBubble,
  type CompanionPose,
  type InsetValue,
} from "../../data/companionMessages";

const BUBBLE_FILL_SHAPE: Record<CompanionPose, string> = {
  greet: "rounded-2xl rounded-br-lg",
  cheer: "rounded-[50%]",
  tip: "rounded-full",
  celebrate: "rounded-[1.75rem]",
  rest: "rounded-lg",
  report: "rounded-[1.5rem]",
};

const BUBBLE_REGION_CLIP: Partial<Record<CompanionPose, string>> = {
  greet: "rounded-2xl rounded-br-lg",
  cheer: "rounded-[50%]",
  tip: "rounded-full",
  report: "rounded-[1.5rem]",
};

function insetStyle(inset: InsetValue): CSSProperties {
  if (typeof inset === "string") {
    return { top: inset, right: inset, bottom: inset, left: inset };
  }
  return inset;
}

const LINE_CLAMP: Record<number, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

export interface CompanionPanelProps {
  pose: CompanionPose;
  message: string;
  title?: string;
  height?: number;
  showTitle?: boolean;
  /** default=白底；map=融入淺綠地圖背景 */
  bubbleTone?: "default" | "map" | "dark";
  className?: string;
}

const BUBBLE_TONE_CLASS: Record<
  NonNullable<CompanionPanelProps["bubbleTone"]>,
  { dark: string; light: string }
> = {
  default: {
    dark: "bg-[#0c1222]/96 border-transparent shadow-none",
    light: "bg-white/98 border-slate-200/90 shadow-sm",
  },
  map: {
    dark: "bg-[#0c1222]/96 border-transparent shadow-none",
    light: "bg-[#ecfdf5]/96 border-transparent shadow-none backdrop-blur-[1px]",
  },
  dark: {
    dark: "bg-[#0c1222]/96 border-transparent shadow-none",
    light: "bg-white/98 border-slate-200/90 shadow-sm",
  },
};

const TEXT_TONE_CLASS: Record<
  NonNullable<CompanionPanelProps["bubbleTone"]>,
  { dark: { title: string; message: string }; light: { title: string; message: string } }
> = {
  default: {
    dark: { title: "text-teal-400", message: "text-slate-100" },
    light: { title: "text-teal-700", message: "text-slate-800" },
  },
  map: {
    dark: { title: "text-teal-400", message: "text-slate-100" },
    light: { title: "text-teal-800", message: "text-slate-800" },
  },
  dark: {
    dark: { title: "text-teal-400", message: "text-slate-100" },
    light: { title: "text-teal-700", message: "text-slate-900" },
  },
};

export function CompanionPanel({
  pose,
  message,
  title,
  height = 120,
  showTitle = true,
  bubbleTone = "default",
  className = "",
}: CompanionPanelProps) {
  const style = POSE_BUBBLE_STYLE[pose];
  const width = height * POSE_CELL_ASPECT;
  const titleSize = Math.max(11, Math.round(height * 0.095));
  const messageSize = Math.max(12, Math.round(height * 0.1));
  const lineClamp = LINE_CLAMP[style.maxLines] ?? "line-clamp-3";
  const hasTitle = showTitle && Boolean(title);
  const surface = style.surface;
  const fillClass = BUBBLE_TONE_CLASS[bubbleTone][surface];
  const textClass = TEXT_TONE_CLASS[bubbleTone][surface];
  const regionClip = BUBBLE_REGION_CLIP[pose] ?? "";

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width, height }}
      role="img"
      aria-label={hasTitle && title ? `${title}：${message}` : message}
    >
      <img
        src={POSE_IMAGE[pose]}
        alt=""
        className="absolute inset-0 h-full w-full object-contain object-left-bottom pointer-events-none select-none"
        draggable={false}
        aria-hidden
      />
      <div
        className={`absolute overflow-hidden pointer-events-none ${regionClip}`}
        style={{
          left: style.region.left,
          top: style.region.top,
          width: style.region.width,
          height: style.region.height,
        }}
      >
        <div
          className={`absolute ${fillClass} ${BUBBLE_FILL_SHAPE[pose]}`}
          style={insetStyle(style.fillInset)}
          aria-hidden
        />
        <div
          className="absolute z-10 flex flex-col items-center justify-center text-center overflow-hidden"
          style={insetStyle(style.textInset)}
        >
          {hasTitle && (
            <p
              className={`${textClass.title} leading-tight mb-0.5 line-clamp-1 w-full shrink-0 px-0.5`}
              style={{ fontWeight: 800, fontSize: titleSize }}
            >
              {title}
            </p>
          )}
          <p
            className={`${textClass.message} leading-tight w-full whitespace-pre-line break-words px-0.5 ${lineClamp}`}
            style={{ fontWeight: 700, fontSize: messageSize }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface RehabCompanionProps {
  pose: CompanionPose;
  message: string;
  title?: string;
  bubble?: CompanionBubble;
  layout?: "horizontal" | "vertical";
  variant?: "card" | "float" | "compact" | "dark" | "inline";
  size?: number;
  showTitle?: boolean;
  bubbleTone?: CompanionPanelProps["bubbleTone"];
  className?: string;
  children?: ReactNode;
}

export function RehabCompanion({
  pose,
  message,
  title,
  layout = "horizontal",
  variant = "card",
  size,
  showTitle = true,
  bubbleTone = "default",
  className = "",
  children,
}: RehabCompanionProps) {
  const panelHeight =
    size ??
    (variant === "compact"
      ? 120
      : variant === "float"
        ? 108
        : layout === "vertical"
          ? 156
          : 124);

  const panel = (
    <CompanionPanel
      pose={pose}
      title={title}
      message={message}
      height={panelHeight}
      showTitle={showTitle}
      bubbleTone={bubbleTone}
    />
  );

  if (variant === "inline") {
    return (
      <div className={className}>
        {panel}
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {panel}
      {children}
    </motion.div>
  );
}
