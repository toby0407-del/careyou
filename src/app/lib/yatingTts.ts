/**
 * 雅婷（Yating）台語 TTS — REST v2 short speech
 * https://developer.yating.tw/doc/tts-TTS%20語音合成v2
 *
 * 開發環境走 Vite proxy（密鑰不進前端 bundle）；
 * 正式環境可設 VITE_YATING_TTS_KEY（會暴露於前端，僅適合展示）。
 */

const YATING_PROXY_PATH = "/api/yating-tts/v2/speeches/short";

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

export function isYatingTtsConfigured(): boolean {
  // proxy 開發模式或有前端 key 都視為可用
  return Boolean(getClientKey()) || import.meta.env.DEV || Boolean(import.meta.env.VITE_YATING_TTS_PROXY);
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

export type YatingSpeakOptions = {
  /** tai_female_1 = 雅婷台語 */
  model?: "tai_female_1" | "tai_female_2" | "tai_male_1";
  speed?: number;
  pitch?: number;
  energy?: number;
};

/**
 * 合成台語音訊，回傳可播放的 object URL（呼叫端負責 revoke）。
 */
export async function synthesizeYatingTaiwanese(
  text: string,
  options: YatingSpeakOptions = {}
): Promise<string> {
  const clipped = clipForYating(text);
  if (!clipped) throw new Error("沒有可朗讀的文字");

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
        model: options.model ?? "tai_female_1",
        speed: options.speed ?? 1,
        pitch: options.pitch ?? 1,
        energy: options.energy ?? 1,
      },
      // 台語音色僅保證 16K；LINEAR16 為官方穩定格式（MP3 文件曾標「即將支援」）
      audioConfig: {
        encoding: "LINEAR16",
        sampleRate: "16K",
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
