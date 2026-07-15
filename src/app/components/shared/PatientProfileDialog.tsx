import { useEffect, useState } from "react";
import {
  X,
  User,
  Building2,
  Stethoscope,
  MapPin,
  Phone,
  HeartPulse,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { PatientProfile } from "../../data/patientProfiles";
import { SpeechLanguageToggle } from "../patient/SpeechLanguageToggle";
import {
  getPatientSpeechLang,
  patientSpeechLangLabel,
  subscribePatientSpeechLang,
} from "../../lib/patientLanguage";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";

type ProfileVariant = "family" | "doctor" | "patient";

const variantTheme: Record<
  ProfileVariant,
  { accent: string; accentSoft: string; accentBorder: string; gradient: string; iconClass: string }
> = {
  family: {
    accent: "text-rose-500",
    accentSoft: "bg-rose-50",
    accentBorder: "border-rose-100",
    gradient: "from-rose-400 to-pink-400",
    iconClass: "text-rose-500",
  },
  doctor: {
    accent: "text-sky-600",
    accentSoft: "bg-sky-50",
    accentBorder: "border-sky-100",
    gradient: "from-sky-400 to-blue-400",
    iconClass: "text-sky-500",
  },
  patient: {
    accent: "text-teal-300",
    accentSoft: "bg-teal-50",
    accentBorder: "border-teal-50",
    gradient: "from-teal-300 to-emerald-300",
    iconClass: "text-teal-300",
  },
};

interface PatientProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: PatientProfile;
  variant?: ProfileVariant;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  iconClass,
  iconBg,
}: {
  icon: typeof User;
  label: string;
  value: string;
  iconClass: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-slate-400 text-xs leading-none mb-1">{label}</p>
        <p className="text-slate-800 text-sm leading-snug break-words" style={{ fontWeight: 600 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function PatientProfileDialog({
  open,
  onClose,
  profile,
  variant = "family",
}: PatientProfileDialogProps) {
  const theme = variantTheme[variant];
  const [speechLang, setSpeechLang] = useState(() => getPatientSpeechLang());

  useEffect(() => {
    if (variant !== "patient") return;
    return subscribePatientSpeechLang(setSpeechLang);
  }, [variant]);

  const bmi = (profile.weightKg / (profile.heightCm / 100) ** 2).toFixed(1);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-lg rounded-2xl border-0 p-0 overflow-hidden gap-0 sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{profile.name} 個人資料</DialogTitle>
        <DialogDescription className="sr-only">病患基本資料與聯絡資訊</DialogDescription>

        <div className={`bg-gradient-to-r ${theme.gradient} px-5 py-4 flex items-start justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/25 flex items-center justify-center border border-white/30 shadow-sm">
              <span className="text-white text-2xl" style={{ fontWeight: 800 }}>
                {profile.name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-white text-xl" style={{ fontWeight: 800 }}>
                {profile.name}
              </h2>
              <p className="text-white/85 text-sm mt-0.5">
                {profile.gender} · {profile.age} 歲 · {profile.bloodType} 型
              </p>
              <p className="text-white/70 text-xs mt-1">病歷號 {profile.medicalRecordNo}</p>
            </div>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0"
              aria-label="關閉"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </DialogClose>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <div className={`grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl ${theme.accentSoft} border ${theme.accentBorder}`}>
            <div className="text-center">
              <p className="text-slate-400 text-[10px]">身高</p>
              <p className={`${theme.accent} text-lg`} style={{ fontWeight: 700 }}>
                {profile.heightCm}
                <span className="text-xs font-normal ml-0.5">cm</span>
              </p>
            </div>
            <div className="text-center border-x border-white/80">
              <p className="text-slate-400 text-[10px]">體重</p>
              <p className={`${theme.accent} text-lg`} style={{ fontWeight: 700 }}>
                {profile.weightKg}
                <span className="text-xs font-normal ml-0.5">kg</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-[10px]">BMI</p>
              <p className={`${theme.accent} text-lg`} style={{ fontWeight: 700 }}>
                {bmi}
              </p>
            </div>
          </div>

          {variant === "patient" && (
            <div className="mb-4 p-3 rounded-xl border border-teal-100 bg-teal-50/50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                    語音語言
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    小伴朗讀、語音教練用「{patientSpeechLangLabel(speechLang)}」
                  </p>
                </div>
                <SpeechLanguageToggle size="md" />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3">
            <InfoRow icon={Building2} label="就診科別" value={profile.department} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            <InfoRow icon={Stethoscope} label="主治醫師" value={profile.attendingPhysician} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            <InfoRow icon={HeartPulse} label="診斷" value={profile.diagnosis} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            <InfoRow icon={FileText} label="復健階段" value={profile.rehabPhase} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            <InfoRow icon={MapPin} label="住址" value={profile.address} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            <InfoRow icon={Phone} label="聯絡電話" value={profile.phone} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            <InfoRow icon={User} label="緊急聯絡人" value={profile.emergencyContact} iconClass={theme.iconClass} iconBg={theme.accentSoft} />
            {profile.allergies && (
              <div className="flex items-start gap-3 py-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs leading-none mb-1">過敏史</p>
                  <p className="text-amber-700 text-sm" style={{ fontWeight: 600 }}>
                    {profile.allergies}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <DialogClose asChild>
            <button
              type="button"
              className={`w-full py-2.5 rounded-xl ${theme.accentSoft} ${theme.accent} border ${theme.accentBorder} text-sm hover:opacity-90 transition-opacity`}
              style={{ fontWeight: 600 }}
            >
              關閉
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 可點擊的頭像區塊，用於各端 header */
export function ProfileAvatarButton({
  name,
  size = "md",
  gradient = "from-rose-300 to-pink-400",
  onClick,
  showHint = true,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  gradient?: string;
  onClick: () => void;
  showHint?: boolean;
}) {
  const sizeClass =
    size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-10 h-10 text-base" : "w-14 h-14 text-xl";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 text-left rounded-2xl hover:bg-black/5 transition-colors p-1 -m-1"
      aria-label={`查看 ${name} 個人資料`}
    >
      <div
        className={`${sizeClass} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0 ring-2 ring-transparent group-hover:ring-white/60 transition-all`}
      >
        <span className="text-white leading-none" style={{ fontWeight: 800 }}>
          {name[0]}
        </span>
      </div>
      {showHint && (
        <span className="text-slate-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
          點擊查看資料
        </span>
      )}
    </button>
  );
}
