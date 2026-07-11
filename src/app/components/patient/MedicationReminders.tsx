import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  UserRound,
  AlertTriangle,
  Info,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DEFAULT_PATIENT_ID } from "../../data/patientProfiles";
import {
  MED_SLOTS,
  currentSlotHint,
  getMedicationsForSlot,
  getTodayMedProgress,
  getSlotProgress,
  isMedTaken,
  toggleMedTaken,
  subscribeMedications,
  type Medication,
  type MedSlot,
} from "../../data/medications";

function useMedTick() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeMedications(() => setTick((n) => n + 1)), []);
}

function MedDetailDialog({
  med,
  slot,
  open,
  onClose,
}: {
  med: Medication | null;
  slot: MedSlot | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!med) return null;
  const slotLabel = slot
    ? MED_SLOTS.find((s) => s.id === slot)?.label
    : med.slots.map((s) => MED_SLOTS.find((x) => x.id === s)?.label).join("、");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-teal-50 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div
          className="px-6 py-5 text-white"
          style={{
            background: `linear-gradient(135deg, ${med.color} 0%, ${med.color}cc 100%)`,
          }}
        >
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-start gap-3">
              <img
                src={med.image}
                alt={med.name}
                className="w-14 h-14 rounded-2xl object-cover bg-white/20 border border-white/30 flex-shrink-0"
              />
              <div className="min-w-0">
                <DialogTitle className="text-white text-xl" style={{ fontWeight: 800 }}>
                  {med.name}
                </DialogTitle>
                {med.brandName && (
                  <DialogDescription className="text-white/85 text-sm mt-0.5">
                    {med.brandName}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-50 px-3.5 py-3">
              <p className="text-[11px] text-emerald-700/70 mb-0.5" style={{ fontWeight: 700 }}>
                劑量
              </p>
              <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                {med.dose}
              </p>
            </div>
            <div className="rounded-2xl bg-teal-50/80 border border-teal-50 px-3.5 py-3">
              <p className="text-[11px] text-teal-700/70 mb-0.5" style={{ fontWeight: 700 }}>
                時段
              </p>
              <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                {slotLabel}
              </p>
            </div>
          </div>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-teal-500" />
              <h3 className="text-slate-800 text-sm" style={{ fontWeight: 800 }}>
                怎麼吃
              </h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed pl-6">{med.instruction}</p>
            <p className="text-slate-500 text-sm leading-relaxed pl-6 mt-1.5">
              用途：{med.purpose}
            </p>
          </section>

          <section className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <h3 className="text-slate-800 text-sm" style={{ fontWeight: 800 }}>
                誰開的
              </h3>
            </div>
            <div className="flex items-start gap-3 pl-1">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-slate-800 text-sm" style={{ fontWeight: 800 }}>
                  {med.prescribedBy}
                </p>
                {med.department && (
                  <p className="text-slate-500 text-xs mt-0.5">{med.department}</p>
                )}
                {(med.startDate || med.endDate !== undefined) && (
                  <p className="text-slate-400 text-xs mt-1">
                    {med.startDate ? `${med.startDate} 起` : ""}
                    {med.endDate ? ` · 至 ${med.endDate}` : med.endDate === null ? " · 長期使用" : ""}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-slate-800 text-sm" style={{ fontWeight: 800 }}>
                可能副作用
              </h3>
            </div>
            <ul className="space-y-1.5 pl-1">
              {med.sideEffects.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed"
                >
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
                    aria-hidden
                  />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {med.cautions && med.cautions.length > 0 && (
            <section className="rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3.5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h3 className="text-slate-800 text-sm" style={{ fontWeight: 800 }}>
                  注意事項
                </h3>
              </div>
              <ul className="space-y-1.5">
                {med.cautions.map((c) => (
                  <li key={c} className="text-sm text-slate-600 leading-relaxed">
                    · {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed text-center pt-1">
            以上資訊僅供提醒參考，若有不適請立即聯絡醫師或藥師，勿自行停藥或加藥。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 照片 + 藥名對應；只有點藥名才開詳情 */
function MedPhotoCard({
  med,
  taken,
  onToggle,
  onOpenName,
}: {
  med: Medication;
  taken: boolean;
  onToggle: () => void;
  onOpenName: () => void;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border px-1.5 py-1.5 min-h-0 flex-1 ${
        taken
          ? "bg-emerald-50/70 border-emerald-100 opacity-80"
          : "bg-white border-emerald-50 shadow-sm"
      }`}
    >
      <div className="relative w-full flex-1 min-h-0 max-h-[7rem] rounded-xl overflow-hidden bg-slate-100">
        <img
          src={med.image}
          alt=""
          className={`absolute inset-0 w-full h-full object-contain p-1 ${taken ? "grayscale-[35%] opacity-80" : ""}`}
          draggable={false}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/95 shadow flex items-center justify-center"
          aria-label={taken ? `取消已服 ${med.name}` : `標記已服 ${med.name}`}
        >
          {taken ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenName}
        className="mt-1 w-full text-center px-0.5 flex-shrink-0 group"
      >
        <span
          className={`text-[12px] sm:text-[13px] leading-tight underline-offset-2 group-hover:underline decoration-teal-300 ${
            taken ? "text-slate-400 line-through" : "text-teal-700"
          }`}
          style={{ fontWeight: 800 }}
        >
          {med.name}
        </span>
        {med.brandName && (
          <span className="block text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
            {med.brandName}
          </span>
        )}
      </button>
    </div>
  );
}

function SlotColumn({
  slot,
  highlighted,
  onOpenMed,
}: {
  slot: MedSlot;
  highlighted: boolean;
  onOpenMed: (med: Medication, slot: MedSlot) => void;
}) {
  useMedTick();
  const meta = MED_SLOTS.find((s) => s.id === slot)!;
  const meds = getMedicationsForSlot(slot, DEFAULT_PATIENT_ID);
  const progress = getSlotProgress(slot, DEFAULT_PATIENT_ID);

  return (
    <section
      className={`flex flex-col min-h-0 min-w-0 rounded-2xl border overflow-hidden ${
        highlighted
          ? "border-teal-200 bg-gradient-to-b from-teal-50 to-white shadow-md shadow-teal-50/50"
          : "border-emerald-50 bg-white/80"
      }`}
    >
      <header
        className={`flex-shrink-0 flex items-center justify-between gap-1 px-2.5 py-2 border-b ${
          highlighted ? "border-teal-100 bg-teal-50/70" : "border-emerald-50/80 bg-emerald-50/40"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-slate-800 text-sm truncate" style={{ fontWeight: 800 }}>
              {meta.label}
            </h2>
            {highlighted && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-300 text-white flex-shrink-0"
                style={{ fontWeight: 700 }}
              >
                現在
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {meta.defaultTime} · {meta.hint}
          </p>
        </div>
        <span
          className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full flex-shrink-0 ${
            progress.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
          style={{ fontWeight: 700 }}
        >
          {progress.taken}/{progress.total}
        </span>
      </header>

      <div className="flex-1 min-h-0 p-1.5 flex flex-col gap-1.5 overflow-hidden">
        {meds.length === 0 ? (
          <p className="text-center text-xs text-slate-300 py-6">此時段無藥</p>
        ) : (
          meds.map((med) => (
            <MedPhotoCard
              key={`${med.id}-${slot}`}
              med={med}
              taken={isMedTaken(med.id, slot)}
              onToggle={() => toggleMedTaken(med.id, slot)}
              onOpenName={() => onOpenMed(med, slot)}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function MedicationReminders() {
  useMedTick();
  const [detail, setDetail] = useState<{ med: Medication; slot: MedSlot } | null>(null);
  const hint = useMemo(() => currentSlotHint(), []);
  const today = getTodayMedProgress(DEFAULT_PATIENT_ID);

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col gap-2 pb-1">
      <div className="flex-shrink-0 flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50 px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-slate-800 text-base leading-tight" style={{ fontWeight: 800 }}>
            今日用藥
          </h1>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            對照照片認藥 · 點藥名看副作用與開立醫師
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-2 bg-teal-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full transition-all"
              style={{ width: `${today.pct}%` }}
            />
          </div>
          <span className="text-sm text-teal-600 tabular-nums" style={{ fontWeight: 800 }}>
            {today.taken}/{today.total}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-4 gap-2 overflow-hidden">
        {MED_SLOTS.map((s) => (
          <SlotColumn
            key={s.id}
            slot={s.id}
            highlighted={s.id === hint}
            onOpenMed={(med, slot) => setDetail({ med, slot })}
          />
        ))}
      </div>

      <MedDetailDialog
        med={detail?.med ?? null}
        slot={detail?.slot ?? null}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
