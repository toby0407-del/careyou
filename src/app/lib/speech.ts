/**
 * 語音引擎 — Web Speech API（speechSynthesis）
 * 提供全程語音教練：動作講解、報數、鼓勵、休息提醒
 */

const VOICE_PREF_KEY = "rehabbridge_voice_enabled";

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  voicesLoaded = true;
  cachedVoice =
    voices.find((v) => v.lang === "zh-TW" && v.localService) ??
    voices.find((v) => v.lang === "zh-TW") ??
    voices.find((v) => v.lang.startsWith("zh")) ??
    null;
  return cachedVoice;
}

if (isSpeechSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}

export interface SpeakOptions {
  /** 中斷目前語音立即播放（預設 false = 排隊） */
  interrupt?: boolean;
  rate?: number;
  pitch?: number;
}

/** 朗讀文字（自動選擇 zh-TW 語音） */
export function speak(text: string, options: SpeakOptions = {}) {
  if (!isSpeechSupported() || !text.trim()) return;
  const { interrupt = false, rate = 0.95, pitch = 1.05 } = options;
  if (interrupt) window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = rate;
  utterance.pitch = pitch;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);

  // Safari / Chrome 首次呼叫時 voices 可能還沒載入，載入後不重播，僅暖機
  if (!voicesLoaded) pickVoice();
}

/** 快速報數（較快語速、打斷前一句避免堆積） */
export function speakCount(n: number) {
  speak(String(n), { interrupt: true, rate: 1.15 });
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/** 全域語音偏好（患者端共用） */
export function getVoiceEnabled(): boolean {
  try {
    const raw = localStorage.getItem(VOICE_PREF_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function setVoiceEnabled(enabled: boolean) {
  try {
    localStorage.setItem(VOICE_PREF_KEY, String(enabled));
  } catch {
    /* ignore */
  }
  if (!enabled) stopSpeaking();
}
