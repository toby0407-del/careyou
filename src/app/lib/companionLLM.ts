/**
 * 小伴本機 LLM — WebLLM + WebGPU（Qwen2.5）
 * 預設 fast：先載 1.5B（開放聊天較有邏輯），再退 0.5B；
 * quality：優先 3B（中文較強，但首次下載/推論較久）。
 * 已知意圖（休息／加油／回診／早餐等）由規則引擎處理，不依賴小模型。
 */
import type { ChatCompletionMessageParam, MLCEngineInterface } from "@mlc-ai/web-llm";
import {
  getCompanionLlmMode,
  LLM_CHAT_HISTORY_TURNS,
  LLM_MAX_TOKENS_FAST,
  LLM_MAX_TOKENS_QUALITY,
} from "./companionConfig";

const MODELS_FAST = [
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
] as const;

const MODELS_QUALITY = [
  "Qwen2.5-3B-Instruct-q4f16_1-MLC",
  "Qwen2.5-3B-Instruct-q4f32_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
] as const;

export type LlmLoadProgress = { text: string; progress: number };

let engine: MLCEngineInterface | null = null;
let initPromise: Promise<MLCEngineInterface | null> | null = null;
let activeModelId: string | null = null;
let loadedForMode: string | null = null;

export function isWebGpuSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function getActiveLlmModelId(): string | null {
  return activeModelId;
}

export function getActiveLlmLabel(): string | null {
  if (!activeModelId) return null;
  if (activeModelId.includes("3B")) return "Qwen2.5-3B";
  if (activeModelId.includes("1.5B")) return "Qwen2.5-1.5B";
  if (activeModelId.includes("0.5B")) return "Qwen2.5-0.5B";
  return activeModelId;
}

export function isCompanionLlmReady(): boolean {
  return engine != null;
}

function candidateModels() {
  return getCompanionLlmMode() === "quality" ? MODELS_QUALITY : MODELS_FAST;
}

/** 預載本機 LLM（開啟對話框時呼叫） */
export async function ensureCompanionLlm(
  onProgress?: (p: LlmLoadProgress) => void
): Promise<MLCEngineInterface | null> {
  if (!isWebGpuSupported()) return null;

  const mode = getCompanionLlmMode();
  if (engine && loadedForMode === mode) return engine;

  // 模式切換時丟棄舊引擎，重新載入對應模型清單
  if (engine && loadedForMode !== mode) {
    try {
      engine.unload?.();
    } catch {
      /* ignore */
    }
    engine = null;
    activeModelId = null;
    initPromise = null;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      const models = candidateModels();
      const modeHint = mode === "fast" ? "快速模式" : "高品質模式";

      for (const modelId of models) {
        try {
          onProgress?.({
            text: `正在準備本機 AI（${modeHint}）…`,
            progress: 0,
          });
          const instance = await CreateMLCEngine(modelId, {
            initProgressCallback: (report) => {
              const pct = Math.round((report.progress || 0) * 100);
              onProgress?.({
                text:
                  pct > 0
                    ? `正在載入本機 AI… ${pct}%（${modeHint}）`
                    : `正在載入本機 AI（${modeHint}）…`,
                progress: report.progress,
              });
            },
          });
          engine = instance;
          activeModelId = modelId;
          loadedForMode = mode;
          return instance;
        } catch {
          engine = null;
          activeModelId = null;
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export interface LlmChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmChatResult {
  text: string;
  thinking?: string;
}

/** 解析簡短思考 + 正式回答 */
export function parseLlmReply(raw: string): LlmChatResult {
  const cleaned = raw.trim();
  const thinkMatch = cleaned.match(/【思考】\s*([\s\S]*?)\s*【回答】\s*([\s\S]+)/);
  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim().slice(0, 120),
      text: thinkMatch[2].trim(),
    };
  }
  const altMatch = cleaned.match(
    /(?:思考|想法)[:：]\s*([\s\S]*?)\n+(?:回答|回覆)[:：]\s*([\s\S]+)/i
  );
  if (altMatch) {
    return {
      thinking: altMatch[1].trim().slice(0, 120),
      text: altMatch[2].trim(),
    };
  }
  return { text: cleaned };
}

/** 以本機 LLM 產生回覆；失敗回傳 null */
export async function chatWithLlm(
  systemPrompt: string,
  history: LlmChatMessage[],
  userMessage: string,
  onProgress?: (p: LlmLoadProgress) => void
): Promise<LlmChatResult | null> {
  const eng = await ensureCompanionLlm(onProgress);
  if (!eng) return null;

  const mode = getCompanionLlmMode();
  const maxTokens = mode === "fast" ? LLM_MAX_TOKENS_FAST : LLM_MAX_TOKENS_QUALITY;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-LLM_CHAT_HISTORY_TURNS).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await eng.chat.completions.create({
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content || content.length < 2) return null;
    const parsed = parseLlmReply(content);
    return parsed.text.length > 1 ? parsed : null;
  } catch {
    return null;
  }
}
