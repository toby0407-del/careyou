/**
 * 小伴本機 LLM — WebLLM + WebGPU（Qwen2.5-3B，中文強）
 * 首次開啟會下載模型並快取，之後可離線自由對話。
 * 失敗時依序退回 1.5B → 0.5B。
 */
import type { ChatCompletionMessageParam, MLCEngineInterface } from "@mlc-ai/web-llm";
import { LLM_HISTORY_TURNS } from "./companionConfig";

/** 優先 3B（中文強、適合查 App + 聊天）；記憶體不足再退回較小模型 */
const MODEL_CANDIDATES = [
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

/** 預載本機 LLM（開啟對話框時呼叫） */
export async function ensureCompanionLlm(
  onProgress?: (p: LlmLoadProgress) => void
): Promise<MLCEngineInterface | null> {
  if (!isWebGpuSupported()) return null;
  if (engine) return engine;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

      for (const modelId of MODEL_CANDIDATES) {
        try {
          onProgress?.({
            text: "正在準備本機 AI…",
            progress: 0,
          });
          const instance = await CreateMLCEngine(modelId, {
            initProgressCallback: (report) => {
              const pct = Math.round((report.progress || 0) * 100);
              onProgress?.({
                text: pct > 0 ? `正在載入本機 AI… ${pct}%` : "正在載入本機 AI…",
                progress: report.progress,
              });
            },
          });
          engine = instance;
          activeModelId = modelId;
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
  const thinkMatch = cleaned.match(
    /【思考】\s*([\s\S]*?)\s*【回答】\s*([\s\S]+)/
  );
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

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-LLM_HISTORY_TURNS).map((m) => ({
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
      max_tokens: 420,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content || content.length < 2) return null;
    const parsed = parseLlmReply(content);
    return parsed.text.length > 1 ? parsed : null;
  } catch {
    return null;
  }
}
