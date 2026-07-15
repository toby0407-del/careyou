/**
 * 患者「中文／台語」文案切換 — 小伴規則回覆與語音教練共用
 */
import { getPatientSpeechLang } from "./patientLanguage";

export function isNanSpeech(): boolean {
  return getPatientSpeechLang() === "nan";
}

/** 依目前語言選一句 */
export function L(zh: string, nan: string): string {
  return isNanSpeech() ? nan : zh;
}

/** 依目前語言從兩組文案中各抽一則 */
export function pickL(zhOptions: string[], nanOptions: string[]): string {
  const pool = isNanSpeech() ? nanOptions : zhOptions;
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? "";
}
