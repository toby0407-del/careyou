import { motion } from "motion/react";
import { X, Stethoscope, MapPin, Clock } from "lucide-react";
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
  if (!open) return null;

  const next = appointments[0];

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
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
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

        {next && (
          <div className="mx-5 mt-4 rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3">
            <p className="text-sky-500 text-xs" style={{ fontWeight: 700 }}>
              最近一筆回診
            </p>
            <p className="text-slate-800 text-lg mt-1" style={{ fontWeight: 800 }}>
              {formatAppointmentShort(next.datetime)}
            </p>
            <p className="text-slate-600 text-sm mt-0.5">
              {next.department} · {next.physician}
            </p>
          </div>
        )}

        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-3">
          {appointments.map((appt, idx) => {
            const isNext = idx === 0;
            return (
              <div
                key={appt.id}
                className={`rounded-2xl border px-4 py-3 ${
                  isNext ? "border-sky-300 bg-sky-50/60 ring-1 ring-sky-100" : "border-slate-100 bg-slate-50/50"
                }`}
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

                <div className="mt-2 pt-2 border-t border-slate-100/80 space-y-1">
                  <p className="text-slate-500 text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {appt.location}
                  </p>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatAppointmentLong(appt.datetime)}
                  </p>
                  {appt.note && (
                    <p className="text-slate-500 text-xs leading-relaxed mt-1">{appt.note}</p>
                  )}
                </div>
              </div>
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
      </motion.div>
    </motion.div>
  );
}
