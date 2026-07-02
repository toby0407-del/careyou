/**
 * 倍伴練 — 諧音「陪伴練」，家人倍伴身邊、邊玩邊復健
 * PlusRep — your plus-one for every rep
 */

export const APP_NAME = "倍伴練";
export const APP_NAME_EN = "PlusRep";
export const APP_TAGLINE = "復健也能好玩";
export const APP_TAGLINE_EN = "Rehab can be fun too";

export type AppLocale = "zh" | "en";

export function getAppLocale(): AppLocale {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
    return "en";
  }
  return "zh";
}

export function getAppDisplayName(locale = getAppLocale()) {
  return locale === "zh" ? APP_NAME : APP_NAME_EN;
}

export function getAppTagline(locale = getAppLocale()) {
  return locale === "zh" ? APP_TAGLINE : APP_TAGLINE_EN;
}
