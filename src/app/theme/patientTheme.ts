/**
 * Patient portal — soft pastel teal/green palette.
 * Lighter than default Tailwind teal; doctor (sky) and family (rose) stay unchanged.
 */
export const PATIENT_THEME = {
  /** Solid fills */
  primary: "bg-teal-300",
  primaryHover: "hover:bg-teal-400",
  primaryMuted: "bg-teal-200",
  soft: "bg-teal-50",
  softHover: "hover:bg-teal-50/80",
  tint: "bg-teal-50",
  tintHover: "hover:bg-teal-50",

  /** Text */
  text: "text-teal-400",
  textMuted: "text-teal-300",
  textSoft: "text-teal-200",
  textOnPrimary: "text-teal-50",

  /** Borders */
  border: "border-teal-50",
  borderMuted: "border-teal-50",
  borderAccent: "border-teal-100",

  /** Gradients */
  gradient: "from-teal-300 to-emerald-300",
  gradientStrong: "from-teal-300 via-teal-300 to-emerald-300",
  gradientBg: "from-teal-50/90 to-emerald-50/60",
  progress: "from-teal-200 to-emerald-200",

  /** Rings & shadows */
  ring: "ring-teal-50",
  focusRing: "focus:ring-teal-100",
  shadow: "shadow-teal-50",

  /** Hex accents (inline styles, charts) */
  accentHex: "#5eead4", // teal-300
} as const;

/** Shift teal/emerald Tailwind classes one step lighter for patient-only styling */
export const PATIENT_TEAL_SHIFT: Record<string, string> = {
  "emerald-600": "emerald-400",
  "emerald-500": "emerald-400",
  "emerald-400": "emerald-300",
  "emerald-300": "emerald-200",
  "emerald-200": "emerald-100",
  "emerald-100": "emerald-50",
  "teal-700": "teal-500",
  "teal-600": "teal-400",
  "teal-500": "teal-400",
  "teal-400": "teal-300",
  "teal-300": "teal-200",
  "teal-200": "teal-100",
  "teal-100": "teal-50",
};

export function lightenPatientTeal(className: string): string {
  let result = className;
  const entries = Object.entries(PATIENT_TEAL_SHIFT).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [from, to] of entries) {
    result = result.replaceAll(from, to);
  }
  return result;
}
