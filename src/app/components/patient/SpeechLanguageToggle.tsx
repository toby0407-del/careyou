/**
 * 患者端語音語言切換（中文／台語）
 */
import {
  getPatientSpeechLang,
  PATIENT_SPEECH_LANG_OPTIONS,
  setPatientSpeechLang,
  subscribePatientSpeechLang,
  type PatientSpeechLang,
} from "../../lib/patientLanguage";
import { useEffect, useState } from "react";

type ToggleSize = "sm" | "md";

export function SpeechLanguageToggle({
  size = "md",
  className = "",
  onChanged,
}: {
  size?: ToggleSize;
  className?: string;
  onChanged?: (lang: PatientSpeechLang) => void;
}) {
  const [lang, setLang] = useState<PatientSpeechLang>(() => getPatientSpeechLang());

  useEffect(() => subscribePatientSpeechLang(setLang), []);

  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm";

  return (
    <div
      className={`inline-flex rounded-xl bg-slate-100/90 p-0.5 border border-slate-200/80 ${className}`}
      role="group"
      aria-label="語音語言"
    >
      {PATIENT_SPEECH_LANG_OPTIONS.map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setPatientSpeechLang(opt.id);
              setLang(opt.id);
              onChanged?.(opt.id);
            }}
            className={`${pad} rounded-lg transition-colors min-w-[3.25rem] ${
              active
                ? "bg-teal-500 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/70"
            }`}
            style={{ fontWeight: active ? 700 : 600 }}
            aria-pressed={active}
            title={opt.description}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
