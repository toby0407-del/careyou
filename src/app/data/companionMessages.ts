export type CompanionPose = "greet" | "cheer" | "tip" | "celebrate" | "rest" | "report";

export type CompanionBubble = "rect" | "oval" | "circle" | "cloud" | "scroll";

export interface CompanionMessage {
  pose: CompanionPose;
  bubble: CompanionBubble;
  title?: string;
  message: string;
}

export interface BubbleTextRegion {
  left: string;
  top: string;
  width: string;
  height: string;
}

export type BubbleSurface = "dark" | "light";

export interface PoseBubbleStyle {
  region: BubbleTextRegion;
  fillInset: InsetValue;
  textInset: InsetValue;
  maxLines: number;
  /** 對話框內底色：dark=設計稿深色框；light=白/淺色雲朵框 */
  surface: BubbleSurface;
}

export type InsetValue =
  | string
  | { top: string; right: string; bottom: string; left: string };

/** 各姿勢獨立 PNG（760×1024 直向） */
export const POSE_IMAGE: Record<CompanionPose, string> = {
  greet: "/assets/companion/poses/greet.png",
  cheer: "/assets/companion/poses/cheer.png",
  tip: "/assets/companion/poses/tip.png",
  celebrate: "/assets/companion/poses/celebrate.png",
  rest: "/assets/companion/poses/rest.png",
  report: "/assets/companion/poses/report.png",
};

/** 文字疊在原圖對話框內的區域（百分比，依新設計稿量測） */
export const POSE_BUBBLE_STYLE: Record<CompanionPose, PoseBubbleStyle> = {
  greet: {
    region: { left: "35%", top: "14%", width: "60%", height: "40%" },
    fillInset: { top: "6%", right: "5%", bottom: "6%", left: "8%" },
    textInset: { top: "10%", right: "8%", bottom: "10%", left: "10%" },
    maxLines: 3,
    surface: "dark",
  },
  cheer: {
    region: { left: "15%", top: "20%", width: "80%", height: "34%" },
    fillInset: "7%",
    textInset: "12%",
    maxLines: 2,
    surface: "dark",
  },
  tip: {
    region: { left: "42%", top: "9%", width: "54%", height: "46%" },
    fillInset: "10%",
    textInset: "14%",
    maxLines: 3,
    surface: "dark",
  },
  celebrate: {
    region: { left: "35%", top: "22%", width: "63%", height: "36%" },
    fillInset: "6%",
    textInset: "10%",
    maxLines: 2,
    surface: "light",
  },
  rest: {
    region: { left: "48%", top: "10%", width: "48%", height: "36%" },
    fillInset: "6%",
    textInset: "10%",
    maxLines: 3,
    surface: "dark",
  },
  report: {
    region: { left: "35%", top: "16%", width: "61%", height: "36%" },
    fillInset: "6%",
    textInset: "10%",
    maxLines: 3,
    surface: "dark",
  },
};

/** @deprecated 使用 POSE_BUBBLE_STYLE */
export const POSE_BUBBLE_REGION: Record<CompanionPose, BubbleTextRegion> = {
  greet: POSE_BUBBLE_STYLE.greet.region,
  cheer: POSE_BUBBLE_STYLE.cheer.region,
  tip: POSE_BUBBLE_STYLE.tip.region,
  celebrate: POSE_BUBBLE_STYLE.celebrate.region,
  rest: POSE_BUBBLE_STYLE.rest.region,
  report: POSE_BUBBLE_STYLE.report.region,
};

/** 新設計稿 760×1024，寬高比 */
export const POSE_CELL_ASPECT = 760 / 1024;

/** 姿勢對應對話框形狀 */
export const POSE_BUBBLE: Record<CompanionPose, CompanionBubble> = {
  greet: "rect",
  cheer: "oval",
  tip: "circle",
  celebrate: "cloud",
  rest: "scroll",
  report: "cloud",
};

/** @deprecated 使用 POSE_IMAGE */
export const POSE_SPRITE: Record<
  CompanionPose,
  { bgX: string; bgY: string; bubble: CompanionBubble }
> = {
  greet: { bgX: "0%", bgY: "0%", bubble: POSE_BUBBLE.greet },
  cheer: { bgX: "50%", bgY: "0%", bubble: POSE_BUBBLE.cheer },
  tip: { bgX: "100%", bgY: "0%", bubble: POSE_BUBBLE.tip },
  celebrate: { bgX: "0%", bgY: "100%", bubble: POSE_BUBBLE.celebrate },
  rest: { bgX: "50%", bgY: "100%", bubble: POSE_BUBBLE.rest },
  report: { bgX: "100%", bgY: "100%", bubble: POSE_BUBBLE.report },
};

export const companionByTab = {
  tasks: {
    pose: "greet" as const,
    bubble: "rect" as const,
    title: "小伴陪你出發",
    message: "今天也要一步一步來！點亮的地圖節點就是你可以挑戰的關卡，慢慢做、穩穩贏。",
  },
  results: {
    pose: "report" as const,
    bubble: "cloud" as const,
    title: "訓練小結",
    message: "看完成率與品質",
  },
  milestones: {
    pose: "celebrate" as const,
    bubble: "cloud" as const,
    title: "成就就在前方",
    message: "每解鎖一個里程碑，胸口的小彩虹就會更亮一點。左右滑動看看還有哪些等你挑戰！",
  },
  gallery: {
    pose: "rest" as const,
    bubble: "scroll" as const,
    title: "時光迴廊",
    message: "復健路上每個值得紀念的日子，都會在這裡留下溫暖片段。敬請期待，小伴會陪你記住。",
  },
};

export function companionForDemo(exerciseName: string): CompanionMessage {
  return {
    pose: "tip",
    bubble: "circle",
    title: "動作小提醒",
    message: `「${exerciseName}」開始前，先確認醫師幫你調好的組數與角度。放慢速度，感受關節活動範圍。`,
  };
}

export function companionForReady(): CompanionMessage {
  return {
    pose: "tip",
    bubble: "circle",
    title: "準備好了嗎？",
    message: "請站進畫面中央，把整個身體都讓鏡頭看到。舉起右手 2 秒，小伴就會幫你開始計數！",
  };
}

export function companionForTraining(feedback: string): CompanionMessage {
  return {
    pose: "cheer",
    bubble: "oval",
    title: "加油中",
    message: feedback || "保持呼吸，動作放慢一點會更標準喔！",
  };
}

export function companionForComplete(exerciseName: string, reps: number): CompanionMessage {
  return {
    pose: "celebrate",
    bubble: "cloud",
    title: "太棒了！",
    message: `「${exerciseName}」完成 ${reps} 次標準動作！今天又多前進一步，胸口的小彩虹為你閃耀 ✨`,
  };
}

export function companionForLockedLevel(): CompanionMessage {
  return {
    pose: "tip",
    bubble: "circle",
    title: "還差一點點",
    message: "這關還沒解鎖喔！先把前面的關卡完成，路就會為你打開。",
  };
}
