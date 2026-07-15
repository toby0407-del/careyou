/** 小伴 AI 對話記憶與本機 LLM 設定 */

export const LLM_HISTORY_TURNS = 24;
export const CHAT_STORAGE_LIMIT = 100;

/**
 * 本機 LLM 策略
 * - fast：優先 1.5B（開放聊天較穩），已知意圖仍走規則引擎
 * - quality：優先 3B（品質較好，首次可能要跑很久）
 *
 * 可在瀏覽器 Console 執行：
 *   localStorage.setItem("rehabbridge_llm_mode", "quality")
 * 然後重新整理切回高品質。
 */
export type CompanionLlmMode = "fast" | "quality";

const LLM_MODE_KEY = "rehabbridge_llm_mode";

export function getCompanionLlmMode(): CompanionLlmMode {
  try {
    const raw = localStorage.getItem(LLM_MODE_KEY);
    if (raw === "quality" || raw === "fast") return raw;
  } catch {
    /* ignore */
  }
  return "fast";
}

export function setCompanionLlmMode(mode: CompanionLlmMode) {
  try {
    localStorage.setItem(LLM_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** 送給本機 LLM 的歷史輪數（愈短愈快） */
export const LLM_CHAT_HISTORY_TURNS = 8;

/** 單次回覆 token 上限（愈小愈快） */
export const LLM_MAX_TOKENS_FAST = 160;
export const LLM_MAX_TOKENS_QUALITY = 320;
