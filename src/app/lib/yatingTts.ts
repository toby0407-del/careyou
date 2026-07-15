/**
 * 雅婷（Yating）TTS — REST v2 short speech
 * https://developer.yating.tw/doc/tts-TTS%20語音合成v2
 *
 * 開發環境走 Vite proxy（密鑰不進前端 bundle）；
 * 正式／Capacitor 可設 VITE_YATING_TTS_KEY（會暴露於前端，僅適合展示）。
 */

const YATING_PROXY_PATH = "/api/yating-tts/v2/speeches/short";

export type YatingVoiceModel =
  | "tai_female_1"
  | "tai_female_2"
  | "tai_male_1"
  | "zh_en_female_1"
  | "zh_en_female_2"
  | "zh_en_male_1"
  | "zh_en_male_2";

function getEndpoint(): string {
  const base = (import.meta.env.VITE_YATING_TTS_BASE_URL as string | undefined)?.replace(/\/$/, "");
  if (base) return `${base}/v2/speeches/short`;
  // 開發預設走本機 proxy；正式若無 base 也走同源 proxy（需部署端轉發）
  return YATING_PROXY_PATH;
}

function getClientKey(): string | undefined {
  const key = import.meta.env.VITE_YATING_TTS_KEY as string | undefined;
  return key?.trim() || undefined;
}

/** 本機 proxy 是否已載入 key（由 vite.config define 注入，不把 key 暴露給前端） */
function isProxyReady(): boolean {
  return import.meta.env.VITE_YATING_PROXY_READY === "true";
}

export function isYatingTtsConfigured(): boolean {
  return Boolean(getClientKey()) || isProxyReady() || import.meta.env.VITE_YATING_TTS_PROXY === "true";
}

/** 雅婷計字：中文／全形約算 2，半形／空白算 1；上限約 600 */
function clipForYating(text: string, maxUnits = 560): string {
  let units = 0;
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const cost = code > 0x7f ? 2 : 1;
    if (units + cost > maxUnits) break;
    out += ch;
    units += cost;
  }
  return out.trim();
}

function isTaiwaneseModel(model: YatingVoiceModel): boolean {
  return model.startsWith("tai_");
}

export type YatingSpeakOptions = {
  model?: YatingVoiceModel;
  speed?: number;
  pitch?: number;
  energy?: number;
};

/**
 * 合成音訊，回傳可播放的 object URL（呼叫端負責 revoke）。
 */
export async function synthesizeYatingSpeech(
  text: string,
  options: YatingSpeakOptions = {}
): Promise<string> {
  const clipped = clipForYating(text);
  if (!clipped) throw new Error("沒有可朗讀的文字");

  const model = options.model ?? "zh_en_female_1";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const clientKey = getClientKey();
  if (clientKey) headers.key = clientKey;

  const res = await fetch(getEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: { text: clipped, type: "text" },
      voice: {
        model,
        speed: options.speed ?? 1,
        pitch: options.pitch ?? 1,
        energy: options.energy ?? 1,
      },
      // 台語音色僅保證 16K；國語可用 22K
      audioConfig: {
        encoding: "LINEAR16",
        sampleRate: isTaiwaneseModel(model) ? "16K" : "22K",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`雅婷 TTS 失敗（${res.status}）${detail ? `：${detail.slice(0, 160)}` : ""}`);
  }

  const data = (await res.json()) as { audioContent?: string; audioConfig?: { encoding?: string } };
  if (!data.audioContent) throw new Error("雅婷 TTS 未回傳音訊");

  const binary = atob(data.audioContent);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const encoding = (data.audioConfig?.encoding || "LINEAR16").toUpperCase();
  const mime = encoding.includes("MP3")
    ? "audio/mpeg"
    : bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      ? "audio/wav"
      : "audio/wav";
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

/** @deprecated 改用 synthesizeYatingSpeech；保留相容舊呼叫 */
export async function synthesizeYatingTaiwanese(
  text: string,
  options: YatingSpeakOptions = {}
): Promise<string> {
  return synthesizeYatingSpeech(text, { ...options, model: options.model ?? "tai_female_1" });
}
