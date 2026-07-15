/**
 * 語音引擎 — 中文走 Web Speech；台語優先雅婷（Yating）API，失敗再退回瀏覽器語音
 */

import {
  getPatientSpeechLang,
  subscribePatientSpeechLang,
  type PatientSpeechLang,
} from "./patientLanguage";
import { isYatingTtsConfigured, synthesizeYatingTaiwanese } from "./yatingTts";

const VOICE_PREF_KEY = "rehabbridge_voice_enabled";

let cachedVoice: SpeechSynthesisVoice | null = null;
let cachedForLang: PatientSpeechLang | null = null;
let voicesLoaded = false;

/** 雅婷播放中的 Audio（可中斷） */
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
/** 遞增以作廢過期的非同步合成 */
let speakGen = 0;

export function isSpeechSupported(): boolean {
  return (
    (typeof window !== "undefined" && "speechSynthesis" in window) ||
    (typeof window !== "undefined" && typeof Audio !== "undefined")
  );
}

function scoreTaiwaneseVoice(v: SpeechSynthesisVoice): number {
  const name = `${v.name} ${v.lang}`.toLowerCase();
  let score = 0;
  if (/nan|minnan|hokkien|taiwanese|台語|閩南|taiwan.*(hoshi|yating)|^twm/.test(name)) score += 10;
  if (v.lang.toLowerCase().startsWith("nan")) score += 8;
  if (/zh-tw|zh_tw|cmn-tw/.test(name) && /台灣|taiwan|hsiao|yun/.test(name)) score += 2;
  if (v.localService) score += 1;
  return score;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const lang = getPatientSpeechLang();
  if (cachedVoice && cachedForLang === lang) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  voicesLoaded = true;
  cachedForLang = lang;

  if (lang === "nan") {
    const ranked = [...voices]
      .map((v) => ({ v, score: scoreTaiwaneseVoice(v) }))
      .filter((x) => x.score >= 8)
      .sort((a, b) => b.score - a.score);
    if (ranked[0]) {
      cachedVoice = ranked[0].v;
      return cachedVoice;
    }
    cachedVoice =
      voices.find((v) => v.lang === "zh-TW" && v.localService) ??
      voices.find((v) => v.lang === "zh-TW") ??
      voices.find((v) => v.lang.startsWith("zh")) ??
      null;
    return cachedVoice;
  }

  cachedVoice =
    voices.find((v) => v.lang === "zh-TW" && v.localService) ??
    voices.find((v) => v.lang === "zh-TW") ??
    voices.find((v) => v.lang.startsWith("zh")) ??
    null;
  return cachedVoice;
}

function invalidateVoiceCache() {
  cachedVoice = null;
  cachedForLang = null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    invalidateVoiceCache();
    pickVoice();
  };
  subscribePatientSpeechLang(() => {
    invalidateVoiceCache();
    pickVoice();
  });
}

function stopBrowserSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function stopYatingAudio() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.src = "";
    } catch {
      /* ignore */
    }
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

function speakBrowser(text: string, options: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
  const lang = getPatientSpeechLang();
  const {
    interrupt = false,
    rate = lang === "nan" ? 0.9 : 0.95,
    pitch = lang === "nan" ? 1.0 : 1.05,
  } = options;
  if (interrupt) stopBrowserSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  utterance.lang = voice?.lang ?? "zh-TW";
  utterance.rate = rate;
  utterance.pitch = pitch;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  if (!voicesLoaded) pickVoice();
}

async function speakYating(text: string, interrupt: boolean) {
  const gen = interrupt ? ++speakGen : speakGen;
  if (interrupt) {
    stopYatingAudio();
    stopBrowserSpeech();
  }

  try {
    const url = await synthesizeYatingTaiwanese(text, { model: "tai_female_1" });
    if (gen !== speakGen) {
      URL.revokeObjectURL(url);
      return;
    }
    stopYatingAudio();
    activeObjectUrl = url;
    const audio = new Audio(url);
    activeAudio = audio;
    audio.onended = () => {
      if (activeAudio === audio) {
        stopYatingAudio();
      }
    };
    await audio.play();
  } catch (err) {
    // 失敗時退回瀏覽器「國語」嗓會聽起來很怪；打清楚 log 方便排查 key / 主機
    console.error("[yating-tts] 雅婷台語失敗，暫用瀏覽器語音（非台語音色）", err);
    speakBrowser(text, { interrupt: true });
  }
}

export interface SpeakOptions {
  /** 中斷目前語音立即播放（預設 false = 排隊） */
  interrupt?: boolean;
  rate?: number;
  pitch?: number;
}

/** 朗讀文字：台語 → 雅婷 API；中文 → Web Speech */
export function speak(text: string, options: SpeakOptions = {}) {
  const cleaned = text.trim();
  if (!cleaned) return;
  const { interrupt = false } = options;
  const lang = getPatientSpeechLang();

  if (lang === "nan" && isYatingTtsConfigured()) {
    void speakYating(cleaned, interrupt);
    return;
  }

  if (interrupt) {
    speakGen += 1;
    stopYatingAudio();
  }
  speakBrowser(cleaned, options);
}

/** 快速報數：一律本機語音，避免每下都打台語 API */
export function speakCount(n: number) {
  speakBrowser(String(n), { interrupt: true, rate: 1.15 });
}

export function stopSpeaking() {
  speakGen += 1;
  stopYatingAudio();
  stopBrowserSpeech();
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
