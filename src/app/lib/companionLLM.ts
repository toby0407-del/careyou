/**
 * 小伴本機 LLM — WebLLM + WebGPU（開源 Qwen2.5-0.5B）
 * 首次開啟會下載模型並快取，之後可離線自由對話。
 */
import type { ChatCompletionMessageParam, MLCEngineInterface } from "@mlc-ai/web-llm";
import { LLM_HISTORY_TURNS } from "./companionConfig";

const MODEL_CANDIDATES = [
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
          const instance = await CreateMLCEngine(modelId, {
            initProgressCallback: (report) => {
              onProgress?.({ text: report.text, progress: report.progress });
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

/** 以本機 LLM 產生回覆；失敗回傳 null */
export async function chatWithLlm(
  systemPrompt: string,
  history: LlmChatMessage[],
  userMessage: string,
  onProgress?: (p: LlmLoadProgress) => void
): Promise<string | null> {
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
      temperature: 0.8,
      max_tokens: 320,
    });

    const content = response.choices[0]?.message?.content?.trim();
    return content && content.length > 1 ? content : null;
  } catch {
    return null;
  }
}
