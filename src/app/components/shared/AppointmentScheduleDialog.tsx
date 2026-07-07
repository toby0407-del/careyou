import { useState } from "react";
import { motion } from "motion/react";
import { X, Stethoscope, MapPin, Clock, ChevronRight, ArrowLeft } from "lucide-react";
import {
  formatAppointmentLong,
  formatAppointmentShort,
  type PatientAppointment,
} from "../../data/patientAppointments";

interface AppointmentScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  patientName: string;
  appointments: PatientAppointment[];
}

export function AppointmentScheduleDialog({
  open,
  onClose,
  patientName,
  appointments,
}: AppointmentScheduleDialogProps) {
  const [detailAppointment, setDetailAppointment] = useState<PatientAppointment | null>(null);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-sky-400 to-blue-400 px-5 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-white text-xl" style={{ fontWeight: 800 }}>
              各科回診行程
            </h2>
            <p className="text-sky-50 text-sm mt-0.5">{patientName} · 共 {appointments.length} 科待回診</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0"
            aria-label="關閉"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-3">
          {appointments.map((appt, idx) => {
            const isNext = idx === 0;
            return (
              <button
                type="button"
                key={appt.id}
                onClick={() => setDetailAppointment(appt)}
                className={`w-full text-left rounded-2xl border px-4 py-3 ${
                  isNext
                    ? "border-sky-300 bg-sky-50/60 ring-1 ring-sky-100"
                    : "border-slate-100 bg-slate-50/50"
                }`}
                aria-label={`查看${appt.department}回診詳情`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                        {appt.department}
                      </span>
                      {isNext && (
                        <span className="text-[10px] text-sky-600 bg-white border border-sky-200 px-2 py-0.5 rounded-full">
                          最近
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
                      {appt.physician}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sky-600 text-sm" style={{ fontWeight: 700 }}>
                      {formatAppointmentShort(appt.datetime)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100/80">
                  <div
                    className="w-full flex items-center justify-between text-left text-sky-600 text-xs"
                    style={{ fontWeight: 700 }}
                  >
                    <span>查看詳情</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 text-sm hover:opacity-90 transition-opacity"
            style={{ fontWeight: 600 }}
          >
            關閉
          </button>
        </div>

        {detailAppointment && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="bg-gradient-to-r from-sky-400 to-blue-400 px-5 py-4 flex items-start justify-between">
              <div>
                <h3 className="text-white text-xl" style={{ fontWeight: 800 }}>
                  回診詳情
                </h3>
                <p className="text-sky-50 text-sm mt-0.5">
                  {detailAppointment.department} · {detailAppointment.physician}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailAppointment(null)}
                className="px-3 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center gap-1.5 flex-shrink-0 text-white"
                aria-label="返回回診清單"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm" style={{ fontWeight: 700 }}>
                  返回
                </span>
              </button>
            </div>

            <div className="px-5 py-5 space-y-4 overflow-y-auto">
              <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3">
                <p className="text-sky-500 text-xs" style={{ fontWeight: 700 }}>
                  回診時間
                </p>
                <p className="text-slate-800 text-lg mt-1" style={{ fontWeight: 800 }}>
                  {formatAppointmentLong(detailAppointment.datetime)}
                </p>
              </div>

              {detailAppointment.purpose && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <p className="text-[11px] text-slate-400">這次彙整目的</p>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {detailAppointment.purpose}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 space-y-3">
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  回診地點：{detailAppointment.location}
                </p>

                {detailAppointment.clinicNumber && (
                  <p className="text-slate-500 text-sm">
                    診間號碼：{detailAppointment.clinicNumber}
                  </p>
                )}

                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  預計報到時間：{formatAppointmentLong(detailAppointment.datetime)}
                </p>

                {detailAppointment.estimatedVisitTime && (
                  <p className="text-slate-500 text-sm">
                    預計看病時間：{detailAppointment.estimatedVisitTime}
                  </p>
                )}

                {detailAppointment.note && (
                  <p className="text-slate-500 text-sm leading-relaxed">
                    備註：{detailAppointment.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
