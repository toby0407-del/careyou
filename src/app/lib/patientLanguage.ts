/**
 * 患者端語音／對話語言偏好：中文（國語）或台語
 * 影響 TTS 音色挑選、語音輸入、語音教練用語與小伴回覆風格
 */

export type PatientSpeechLang = "zh" | "nan";

const LANG_KEY = "rehabbridge_patient_speech_lang";
const CHANGE_EVENT = "rehab-speech-lang-changed";

export const PATIENT_SPEECH_LANG_OPTIONS: {
  id: PatientSpeechLang;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "zh",
    label: "中文",
    shortLabel: "中",
    description: "國語／華語朗讀與對話",
  },
  {
    id: "nan",
    label: "台語",
    shortLabel: "台",
    description: "閩南語：雅婷台語語音朗讀",
  },
];

export function getPatientSpeechLang(): PatientSpeechLang {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw === "nan" || raw === "zh") return raw;
  } catch {
    /* ignore */
  }
  return "zh";
}

export function setPatientSpeechLang(lang: PatientSpeechLang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: lang }));
  }
}

export function subscribePatientSpeechLang(listener: (lang: PatientSpeechLang) => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANG_KEY) listener(getPatientSpeechLang());
  };
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<PatientSpeechLang>).detail;
    listener(detail === "nan" || detail === "zh" ? detail : getPatientSpeechLang());
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onCustom);
  };
}

/** 語音合成 BCP-47 */
export function getSpeechSynthesisLang(): string {
  return getPatientSpeechLang() === "nan" ? "nan-TW" : "zh-TW";
}

/** 語音辨識 BCP-47（多數瀏覽器台語仍用 zh-TW） */
export function getSpeechRecognitionLang(): string {
  return getPatientSpeechLang() === "nan" ? "zh-TW" : "zh-TW";
}

export function patientSpeechLangLabel(lang: PatientSpeechLang = getPatientSpeechLang()): string {
  return lang === "nan" ? "台語" : "中文";
}
