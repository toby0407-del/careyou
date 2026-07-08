import { useState, useMemo, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  ClipboardList,
  Users,
  Activity,
  Send,
  Stethoscope,
  Calendar,
  Trash2,
  ShoppingCart,
  MonitorSmartphone,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { ChatWidget } from "../shared/ChatWidget";
import { NotificationBell } from "../shared/NotificationBell";
import { PatientProfileDialog } from "../shared/PatientProfileDialog";
import { PatientAnalyticsPanel } from "../shared/PatientAnalyticsPanel";
import { DailyRevealStatusCard } from "../shared/DailyRevealStatusCard";
import { DEFAULT_PATIENT_ID, getPatientProfile } from "../../data/patientProfiles";
import { getPatientAnalytics, getAnalyticsKpiValue } from "../../data/patientAnalytics";
import { getLastSessionLabel } from "../../data/progressStore";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BodyMannequin, REGION_COLORS } from "./BodyMannequin";
import {
  type BodyRegion,
  type PrescriptionExercise,
  BODY_REGION_LABELS,
  exercisesByRegion,
} from "../../data/prescriptionExercises";
import { ExercisePlanEditor } from "./ExercisePlanEditor";
import {
  getActivePatientId,
  setActivePatientId,
  subscribeExercisePlans,
} from "../../data/patientExercisePlans";
import { formatShiftedMonthDayTime } from "../../lib/mockTime";
import { usePatientAnalytics } from "../../hooks/useLiveProgress";

/** 訂閱目前患者端展示的病患 ID */
function useActivePatientId(): string {
  return useSyncExternalStore(
    (listener) => subscribeExercisePlans(listener) as unknown as () => void,
    () => getActivePatientId()
  );
}

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  phase: string;
  compliance: number;
  trend: "up" | "down" | "flat";
  status: "良好" | "注意" | "緊急";
  lastSession: string;
  nextAppt: string;
  progress: number[];
  assignedExerciseIds: string[];
}

interface ReminderSettings {
  enabled: boolean;
  frequency: "每日" | "每週" | "自訂";
  channel: "App 推播" | "Email" | "簡訊";
  remindTime: string;
  complianceAlert: boolean;
  inactivityAlert: boolean;
  appointmentAlert: boolean;
  notes: string;
}

const ALL_PRESCRIPTION_EXERCISES = Object.values(exercisesByRegion).flat();

function exercisesForPatient(ids: string[]): PrescriptionExercise[] {
  return ALL_PRESCRIPTION_EXERCISES.filter((ex) => ids.includes(ex.id));
}

function regionsForPatient(ids: string[]): BodyRegion[] {
  return Array.from(new Set(exercisesForPatient(ids).map((ex) => ex.region)));
}

const PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "王大明",
    age: 65,
    diagnosis: "膝關節置換術後",
    phase: "第二期復健",
    compliance: 87,
    trend: "up",
    status: "良好",
    lastSession: "2小時前",
    nextAppt: formatShiftedMonthDayTime("2026-07-05T14:00:00"),
    progress: [60, 68, 72, 75, 80, 85, 87],
    assignedExerciseIds: ["long-arc-quad", "tke", "sit-to-stand", "seated-dorsiflexion"],
  },
  {
    id: "p2",
    name: "李淑芬",
    age: 58,
    diagnosis: "腰椎間盤突出",
    phase: "第一期復健",
    compliance: 72,
    trend: "up",
    status: "良好",
    lastSession: "昨日",
    nextAppt: formatShiftedMonthDayTime("2026-07-03T10:30:00"),
    progress: [45, 52, 58, 65, 70, 70, 72],
    assignedExerciseIds: ["bridge", "pelvic-tilt", "seated-side-bend", "standing-hip-abduction"],
  },
  {
    id: "p3",
    name: "張文彬",
    age: 72,
    diagnosis: "中風後肢體復健",
    phase: "第三期復健",
    compliance: 45,
    trend: "down",
    status: "注意",
    lastSession: "3天前",
    nextAppt: formatShiftedMonthDayTime("2026-07-02T09:00:00"),
    progress: [70, 65, 60, 58, 50, 48, 45],
    assignedExerciseIds: ["shoulder-press", "long-arc-quad", "standing-hip-abduction-band", "sit-to-stand", "chair-calf-raise"],
  },
  {
    id: "p4",
    name: "陳美玲",
    age: 44,
    diagnosis: "肩袖撕裂修復術後",
    phase: "第一期復健",
    compliance: 95,
    trend: "up",
    status: "良好",
    lastSession: "1小時前",
    nextAppt: formatShiftedMonthDayTime("2026-07-04T15:30:00"),
    progress: [70, 78, 82, 87, 90, 93, 95],
    assignedExerciseIds: ["tube-shoulder-abduction", "lateral-raise", "scapula-squeeze", "bicep-curl"],
  },
  {
    id: "p5",
    name: "黃志宏",
    age: 55,
    diagnosis: "踝關節韌帶損傷",
    phase: "第二期復健",
    compliance: 58,
    trend: "flat",
    status: "注意",
    lastSession: "2天前",
    nextAppt: formatShiftedMonthDayTime("2026-07-06T11:00:00"),
    progress: [55, 58, 56, 60, 57, 59, 58],
    assignedExerciseIds: ["seated-ankle-eversion-fixed", "band-calf-raise", "seated-dorsiflexion", "long-arc-quad"],
  },
];

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  frequency: "每日",
  channel: "App 推播",
  remindTime: "18:30",
  complianceAlert: true,
  inactivityAlert: true,
  appointmentAlert: true,
  notes: "若 2 天未訓練，請主動提醒並轉知家屬。",
};

const STATUS_COLORS: Record<string, string> = {
  良好: "bg-emerald-100 text-emerald-700 border-emerald-200",
  注意: "bg-amber-100 text-amber-700 border-amber-200",
  緊急: "bg-red-100 text-red-700 border-red-200",
};

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TREND_COLORS: Record<string, string> = {
  up: "text-emerald-500",
  down: "text-red-500",
  flat: "text-slate-400",
};

const PREVIEW_EXERCISE_COUNT = 3;

function stopCardClick(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
}

function AssignedExerciseList({
  exercises,
  dense = false,
}: {
  exercises: PrescriptionExercise[];
  dense?: boolean;
}) {
  return (
    <ul className={dense ? "space-y-1" : "space-y-0.5"}>
      {exercises.map((ex) => (
        <li
          key={ex.id}
          className={`${dense ? "text-sm" : "text-xs"} text-slate-700 flex items-start gap-1.5 leading-snug`}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: REGION_COLORS[ex.region] }}
          />
          <span className="min-w-0 break-words">{ex.name}</span>
        </li>
      ))}
    </ul>
  );
}

function PatientAssignedPreview({ patient, embedded = false }: { patient: Patient; embedded?: boolean }) {
  const exercises = exercisesForPatient(patient.assignedExerciseIds);
  const regions = regionsForPatient(patient.assignedExerciseIds);
  const visible = exercises.slice(0, PREVIEW_EXERCISE_COUNT);
  const hiddenCount = Math.max(0, exercises.length - PREVIEW_EXERCISE_COUNT);

  return (
    <div
      className={
        embedded
          ? "flex gap-2 min-h-[96px] max-h-[96px] overflow-hidden"
          : "mt-2 pt-2 border-t border-slate-100 flex gap-2 flex-shrink-0 h-[96px] overflow-hidden"
      }
      onClick={stopCardClick}
      onPointerDown={stopCardClick}
    >
      <div className="flex-shrink-0 w-[92px] h-full flex items-center justify-center bg-sky-50/60 rounded-lg border border-sky-100/80">
        <BodyMannequin assignedRegions={regions} compact showHint={false} size="mini" staticGlow />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 overflow-hidden">
        <p className="text-slate-500 text-[10px] mb-1 flex-shrink-0" style={{ fontWeight: 600 }}>
          已指派 {exercises.length} 項動作
        </p>
        {exercises.length === 0 ? (
          <p className="text-slate-400 text-xs">尚未開立處方</p>
        ) : (
          <div className="min-h-0 overflow-hidden">
            <AssignedExerciseList exercises={visible} />
            {hiddenCount > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={stopCardClick}
                    onPointerDown={stopCardClick}
                    className="text-xs text-sky-600 hover:text-sky-700 hover:underline mt-1 text-left"
                    style={{ fontWeight: 600 }}
                  >
                    +{hiddenCount} 項 · 查看全部
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 max-w-[calc(100vw-2rem)] p-3 z-[70]"
                  align="start"
                  side={embedded ? "left" : "bottom"}
                  onClick={stopCardClick}
                  onPointerDown={stopCardClick}
                >
                  <p className="text-slate-800 text-sm mb-2" style={{ fontWeight: 700 }}>
                    {patient.name} · 全部 {exercises.length} 項復健動作
                  </p>
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <AssignedExerciseList exercises={exercises} dense />
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionModal({
  patient,
  initialExerciseIds,
  onClose,
  onSubmit,
}: {
  patient: Patient;
  initialExerciseIds: string[];
  onClose: () => void;
  onSubmit: (exerciseIds: string[]) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>(initialExerciseIds);
  const [frequency, setFrequency] = useState("每日");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const regionExercises = selectedRegion ? exercisesByRegion[selectedRegion] : [];

  const toggleExercise = (ex: PrescriptionExercise) => {
    setSelectedExercises((prev) =>
      prev.includes(ex.id) ? prev.filter((id) => id !== ex.id) : [...prev, ex.id]
    );
  };

  const removeExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((exId) => exId !== id));
  };

  const selectAllInRegion = () => {
    if (!selectedRegion) return;
    const ids = exercisesByRegion[selectedRegion].map((ex) => ex.id);
    setSelectedExercises((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearRegion = () => {
    if (!selectedRegion) return;
    const ids = new Set(exercisesByRegion[selectedRegion].map((ex) => ex.id));
    setSelectedExercises((prev) => prev.filter((id) => !ids.has(id)));
  };

  const allExercises = Object.values(exercisesByRegion).flat();
  const selectedExerciseItems = allExercises.filter((ex) =>
    selectedExercises.includes(ex.id)
  );

  const assignedRegions = useMemo(() => {
    const regions = new Set<BodyRegion>();
    selectedExerciseItems.forEach((ex) => regions.add(ex.region));
    return Array.from(regions);
  }, [selectedExerciseItems]);

  const regionSelectionCount = selectedRegion
    ? regionExercises.filter((ex) => selectedExercises.includes(ex.id)).length
    : 0;

  const handleSubmit = () => {
    onSubmit(selectedExercises);
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        <div className="bg-gradient-to-r from-sky-400 to-blue-400 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white" style={{ fontWeight: 700 }}>
              開立復健處方
            </h2>
            <p className="text-sky-50 text-sm">{patient.name} · {patient.diagnosis}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          {submitted ? (
            <div className="py-8 flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </motion.div>
              <p className="text-slate-700 text-center" style={{ fontWeight: 600 }}>
                已成功一次開立 {selectedExerciseItems.length} 項復健動作
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {selectedExerciseItems.map((ex) => (
                  <span
                    key={ex.id}
                    className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200"
                  >
                    {ex.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                <ShoppingCart className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  可跨多個身體部位勾選動作，加入右側處方清單後，<strong>最後按一次「開立處方」</strong>即可全部送出。
                </span>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-slate-700 mb-2 block">訓練頻率</label>
                <div className="flex gap-2 flex-wrap">
                  {["每日", "每週3次", "每週5次", "自訂"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                        frequency === f
                          ? "bg-sky-400 text-white border-sky-400"
                          : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body mannequin + exercise picker + cart */}
              <div className="flex gap-4 min-h-[420px]">
                <div className="w-[300px] flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center">
                  <BodyMannequin
                    selectedRegion={selectedRegion}
                    assignedRegions={assignedRegions}
                    onSelectRegion={setSelectedRegion}
                    size="large"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-700">
                        選擇訓練項目
                        {selectedRegion && (
                          <span className="text-slate-400 text-sm ml-1">
                            — {BODY_REGION_LABELS[selectedRegion]}
                          </span>
                        )}
                      </label>
                      {selectedRegion && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAllInRegion}
                            className="text-xs text-sky-600 hover:text-sky-700 px-2 py-1 rounded-lg hover:bg-sky-50"
                          >
                            全選此部位
                          </button>
                          {regionSelectionCount > 0 && (
                            <button
                              type="button"
                              onClick={clearRegion}
                              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100"
                            >
                              清除此部位
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedRegion ? (
                      regionExercises.length > 0 ? (
                      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white max-h-[220px]">
                        <div className="p-2 space-y-2">
                          {regionExercises.map((ex) => {
                            const checked = selectedExercises.includes(ex.id);
                            return (
                              <button
                                key={ex.id}
                                type="button"
                                onClick={() => toggleExercise(ex)}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                                  checked
                                    ? "bg-sky-50 border-sky-200"
                                    : "bg-slate-50 border-slate-200 hover:border-sky-200"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    checked ? "bg-sky-400 border-sky-400" : "border-slate-300"
                                  }`}
                                >
                                  {checked && (
                                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                                    {ex.name}
                                  </p>
                                  <p className="text-slate-500 text-xs">{ex.nameEn}</p>
                                  <p className="text-sky-600 text-xs mt-1">{ex.setsReps}</p>
                                </div>
                                <span className="text-xs text-slate-400 flex-shrink-0">
                                  難度 {ex.difficulty}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      ) : (
                      <div className="flex-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-6 text-center max-h-[220px]">
                        <p className="text-slate-500 text-sm">此部位暫無可開立動作</p>
                      </div>
                      )
                    ) : (
                      <div className="flex-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-6 text-center max-h-[220px]">
                        <div>
                          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">
                            請點選左側人偶的身體部位
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            勾選後可繼續點選其他部位，一次開立全部動作
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prescription cart */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex-shrink-0">
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-sky-500" />
                        <span className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                          處方清單
                        </span>
                        <span className="text-sky-600 text-xs bg-sky-50 px-2 py-0.5 rounded-full">
                          {selectedExercises.length} 項
                        </span>
                      </div>
                      {selectedExercises.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedExercises([])}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          全部清除
                        </button>
                      )}
                    </div>
                    <div className="max-h-[160px] overflow-y-auto p-2">
                      {selectedExerciseItems.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-6">
                          尚未加入任何動作，請從上方勾選
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {assignedRegions.map((region) => {
                            const items = selectedExerciseItems.filter((ex) => ex.region === region);
                            return (
                              <div key={region}>
                                <p
                                  className="text-xs px-2 py-1 mb-1 rounded-lg"
                                  style={{
                                    color: REGION_COLORS[region],
                                    backgroundColor: `${REGION_COLORS[region]}18`,
                                    fontWeight: 600,
                                  }}
                                >
                                  {BODY_REGION_LABELS[region]}（{items.length} 項）
                                </p>
                                {items.map((ex) => (
                                  <div
                                    key={ex.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 group"
                                  >
                                    <span className="text-slate-700 text-sm flex-1">{ex.name}</span>
                                    <span className="text-slate-400 text-xs">{ex.setsReps}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeExercise(ex.id)}
                                      className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                      aria-label={`移除 ${ex.name}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned regions preview */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <p className="text-slate-700 text-sm mb-1" style={{ fontWeight: 600 }}>
                      已指派部位預覽
                    </p>
                    <p className="text-slate-400 text-xs mb-2">
                      {assignedRegions.length > 0
                        ? `共 ${assignedRegions.length} 個部位、${selectedExercises.length} 項動作`
                        : "尚未指派任何部位"}
                    </p>
                    <BodyMannequin
                      assignedRegions={assignedRegions}
                      compact
                      showHint={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {assignedRegions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedRegions.map((region) => {
                          const count = selectedExerciseItems.filter((ex) => ex.region === region).length;
                          return (
                            <button
                              key={region}
                              type="button"
                              onClick={() => setSelectedRegion(region)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:shadow-sm transition-shadow text-left"
                              style={{ borderColor: `${REGION_COLORS[region]}66` }}
                            >
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: REGION_COLORS[region],
                                  boxShadow: `0 0 8px ${REGION_COLORS[region]}`,
                                }}
                              />
                              <span className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                                {BODY_REGION_LABELS[region]}
                              </span>
                              <span className="text-slate-400 text-xs">{count} 項動作</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex items-center text-slate-400 text-sm">
                        勾選復健動作後，對應身體部位會在下方人偶發光顯示
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-700 mb-2 block">備注 / 特殊指示</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="例如：注意疼痛程度，若VAS>4請停止訓練..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {!submitted && (
          <div className="p-5 border-t border-slate-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={selectedExercises.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-400 text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedExercises.length > 0
                  ? `一次開立 ${selectedExercises.length} 項動作`
                  : "開立處方"}
              </span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function FullReportDialog({
  patient,
  open,
  onClose,
}: {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
}) {
  const syncedAnalytics = usePatientAnalytics(DEFAULT_PATIENT_ID);
  if (!patient) return null;

  const assigned = exercisesForPatient(patient.assignedExerciseIds);
  const profile = getPatientProfile(patient.id);
  const analytics =
    patient.id === DEFAULT_PATIENT_ID ? syncedAnalytics : getPatientAnalytics(patient.id);
  const regions = regionsForPatient(patient.assignedExerciseIds);
  const compliance = analytics.kpi.find((item) => item.name === "整體遵從")?.value ?? patient.compliance;
  const todayCompletion =
    analytics.kpi.find((item) => item.name === "今日完成")?.value ??
    (patient.id === DEFAULT_PATIENT_ID ? 0 : patient.compliance);
  const avgProgress = analytics.kpi.find((item) => item.name === "本週均分")?.value ?? compliance;
  const weeklyTrend = analytics.weekly.map((item, idx) => ({
    label: item.day === "今日" ? "今日" : `D${idx + 1}`,
    value: item.completion,
  }));

  const clinicalNotes =
    patient.status === "注意"
      ? [
          "依從率偏低或趨勢下滑，建議主動電話關懷並檢視處方難度。",
          "評估疼痛指數與動作品質是否影響訓練意願。",
          "下次回診前請家屬協助督促每日訓練紀錄。",
        ]
      : compliance >= 90
        ? [
            "訓練表現優異，可逐步增加阻力或進階動作。",
            "維持現有頻率，持續監測各部位恢復雷達弱項。",
            "回診時評估是否可進入下一復健階段。",
          ]
        : [
            "維持現有訓練頻率，優先提升弱項動作品質。",
            "若依從率連續 3 天低於 60%，建議安排主動關懷。",
            "下次回診前確認疼痛與關節活動度變化。",
          ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[1120px] rounded-3xl border-sky-100 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-5 text-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl" style={{ fontWeight: 800 }}>
              {patient.name} 完整報告
            </DialogTitle>
            <DialogDescription className="text-sky-50">
              匯整 KPI、訓練趨勢、疼痛與部位恢復評估 · 與家屬端監護總覽同源資料
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 max-h-[82vh] overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "今日完成率", value: `${todayCompletion}%`, tone: "text-emerald-600" },
              { label: "整體依從率", value: `${compliance}%`, tone: "text-sky-600" },
              { label: "本週平均", value: `${avgProgress}%`, tone: "text-blue-600" },
              {
                label: "動作品質",
                value:
                  analytics.qualityToday != null ? `${analytics.qualityToday} 分` : "尚無",
                tone: "text-emerald-600",
              },
              { label: "下次回診", value: patient.nextAppt, tone: "text-amber-600" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-slate-400 text-xs">{item.label}</p>
                <p className={`text-lg mt-1 ${item.tone}`} style={{ fontWeight: 800 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <PatientAnalyticsPanel analytics={analytics} theme="doctor" layout="compact" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h3 className="text-slate-800 text-sm mb-3" style={{ fontWeight: 700 }}>
                病患摘要
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p className="text-slate-700"><span className="text-slate-400">診斷：</span>{patient.diagnosis}</p>
                <p className="text-slate-700"><span className="text-slate-400">階段：</span>{patient.phase}</p>
                <p className="text-slate-700"><span className="text-slate-400">狀態：</span>{patient.status}</p>
                <p className="text-slate-700"><span className="text-slate-400">最近訓練：</span>{patient.lastSession}</p>
                {profile && (
                  <>
                    <p className="text-slate-700"><span className="text-slate-400">科別：</span>{profile.department}</p>
                    <p className="text-slate-700"><span className="text-slate-400">病歷號：</span>{profile.medicalRecordNo}</p>
                    <p className="text-slate-700 col-span-2"><span className="text-slate-400">過敏史：</span>{profile.allergies ?? "無"}</p>
                  </>
                )}
                <p className="text-slate-700 col-span-2">
                  <span className="text-slate-400">訓練部位：</span>
                  {regions.map((r) => BODY_REGION_LABELS[r]).join("、")}
                </p>
              </div>

              <h4 className="text-slate-600 text-xs mt-4 mb-2" style={{ fontWeight: 700 }}>
                本週依從率走勢
              </h4>
              <div className="space-y-2">
                {weeklyTrend.map((item, idx) => (
                  <div key={`${item.label}-${idx}`}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-800" style={{ fontWeight: 700 }}>{item.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.value >= 80 ? "bg-emerald-400" : item.value >= 60 ? "bg-amber-400" : "bg-rose-400"
                        }`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-slate-800 text-sm mb-3" style={{ fontWeight: 700 }}>
                目前處方與臨床建議
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {assigned.map((exercise) => (
                  <div key={exercise.id} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                        {exercise.name}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{exercise.setsReps}</p>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `${REGION_COLORS[exercise.region]}22`,
                        color: REGION_COLORS[exercise.region],
                        fontWeight: 600,
                      }}
                    >
                      {BODY_REGION_LABELS[exercise.region]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 mt-3">
                <p className="text-sky-700 text-sm" style={{ fontWeight: 700 }}>
                  醫師建議
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                  {clinicalNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReminderSettingsDialog({
  patient,
  open,
  onClose,
  settings,
  onChange,
}: {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  onChange: (settings: ReminderSettings) => void;
}) {
  if (!patient) return null;

  const update = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border-sky-100 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-5 text-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl" style={{ fontWeight: 800 }}>
              設定提醒通知
            </DialogTitle>
            <DialogDescription className="text-sky-50">
              {patient.name} · 自訂通知頻率、條件與提醒內容
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3">
            <div>
              <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                啟用病患提醒
              </p>
              <p className="text-slate-500 text-xs mt-1">關閉後將停止自動推播與醫師端提醒</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(checked) => update("enabled", checked)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs mb-2" style={{ fontWeight: 700 }}>
                提醒頻率
              </p>
              <Select value={settings.frequency} onValueChange={(value: ReminderSettings["frequency"]) => update("frequency", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="每日">每日</SelectItem>
                  <SelectItem value="每週">每週</SelectItem>
                  <SelectItem value="自訂">自訂</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-2" style={{ fontWeight: 700 }}>
                通知方式
              </p>
              <Select value={settings.channel} onValueChange={(value: ReminderSettings["channel"]) => update("channel", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="App 推播">App 推播</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="簡訊">簡訊</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-xs mb-2" style={{ fontWeight: 700 }}>
              每日提醒時間
            </p>
            <Input
              type="time"
              value={settings.remindTime}
              onChange={(e) => update("remindTime", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 space-y-3">
            {[
              {
                key: "complianceAlert" as const,
                title: "依從率偏低提醒",
                desc: "當依從率下降或未達標時提醒醫師與家屬",
              },
              {
                key: "inactivityAlert" as const,
                title: "連續未訓練提醒",
                desc: "超過 2 天未訓練時自動觸發提醒",
              },
              {
                key: "appointmentAlert" as const,
                title: "回診前通知",
                desc: "回診前一天提醒檢查處方與進度",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={(checked) => update(item.key, checked)}
                />
              </div>
            ))}
          </div>

          <div>
            <p className="text-slate-500 text-xs mb-2" style={{ fontWeight: 700 }}>
              提醒備註
            </p>
            <textarea
              value={settings.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-300 resize-none"
              placeholder="例如：若 2 天未訓練，請先電話關心，再通知家屬。"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
              style={{ fontWeight: 700 }}
            >
              儲存設定
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PatientDetailPanel({
  patient,
  onClose,
  onPrescribe,
  onViewProfile,
  onViewReport,
  onConfigureReminder,
}: {
  patient: Patient;
  onClose: () => void;
  onPrescribe: () => void;
  onViewProfile: () => void;
  onViewReport: () => void;
  onConfigureReminder: () => void;
}) {
  const syncedAnalytics = usePatientAnalytics(DEFAULT_PATIENT_ID);
  const analytics =
    patient.id === DEFAULT_PATIENT_ID ? syncedAnalytics : getPatientAnalytics(patient.id);
  const compliance = analytics.kpi.find((item) => item.name === "整體遵從")?.value ?? patient.compliance;
  const todayCompletion =
    analytics.kpi.find((item) => item.name === "今日完成")?.value ??
    (patient.id === DEFAULT_PATIENT_ID ? 0 : patient.compliance);
  const lastSession =
    patient.id === DEFAULT_PATIENT_ID ? getLastSessionLabel() : patient.lastSession;
  const progressData = analytics.weekly.map((item, idx) => ({
    week: item.day === "今日" ? "今日" : `D${idx + 1}`,
    compliance: item.completion,
  }));
  const activePatientId = useActivePatientId();
  const isActiveOnPatientApp = activePatientId === patient.id;

  return (
    <div className="w-[360px] portal-detail-panel flex-shrink-0 flex flex-col bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden self-stretch">
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-4 border-b border-sky-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sky-600 text-sm" style={{ fontWeight: 600 }}>
            病患詳情
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white border border-sky-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <button
          type="button"
          onClick={onViewProfile}
          className="flex items-center gap-3 w-full text-left rounded-xl hover:bg-white/60 transition-colors p-1 -m-1"
          aria-label="查看個人資料"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sky-600 text-lg" style={{ fontWeight: 700 }}>
              {patient.name[0]}
            </span>
          </div>
          <div>
            <h2 className="text-slate-800" style={{ fontWeight: 700 }}>
              {patient.name}
            </h2>
            <p className="text-slate-500 text-sm">
              {patient.age} 歲 · {patient.diagnosis}
            </p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs border ${STATUS_COLORS[patient.status]}`}
            >
              {patient.status}
            </span>
            <p className="text-sky-500 text-[10px] mt-1">點擊查看身高、體重、住址等資料</p>
          </div>
        </button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1 flex flex-col min-h-0">
        {patient.id === DEFAULT_PATIENT_ID && (
          <DailyRevealStatusCard variant="doctor" compact />
        )}

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: patient.id === DEFAULT_PATIENT_ID ? "今日完成率" : "依從率",
              value:
                patient.id === DEFAULT_PATIENT_ID ? `${todayCompletion}%` : `${compliance}%`,
              icon: Activity,
              color: "text-sky-500",
            },
            { label: "復健階段", value: patient.phase, icon: ClipboardList, color: "text-blue-400" },
            { label: "上次訓練", value: lastSession, icon: Clock, color: "text-slate-600" },
            { label: "下次回診", value: patient.nextAppt, icon: Calendar, color: "text-emerald-600" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                  <span className="text-slate-500 text-xs">{metric.label}</span>
                </div>
                <p className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <h3 className="text-slate-700 text-sm mb-2">目前指派動作</h3>
          <PatientAssignedPreview patient={patient} embedded />
        </div>

        <ExercisePlanEditor patientId={patient.id} patientName={patient.name} />

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <h3 className="text-slate-700 text-sm mb-2">本週依從率趨勢</h3>
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 15, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip formatter={(v) => [`${v}%`, "依從率"]} contentStyle={{ borderRadius: 8, fontSize: 18 }} />
              <Area type="monotone" dataKey="compliance" stroke="#38bdf8" strokeWidth={2} fill="url(#patientGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPrescribe}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-400 text-white flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
          >
            <Plus className="w-4 h-4" />
            <span>開立復健處方</span>
          </motion.button>
          <button
            onClick={onViewReport}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>查看完整報告</span>
          </button>
          <button
            onClick={onConfigureReminder}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>設定提醒通知</span>
          </button>
          <button
            onClick={() => {
              if (isActiveOnPatientApp) return;
              setActivePatientId(patient.id);
              toast.success(`已同步至患者端`, {
                description: `患者端現在顯示 ${patient.name} 的個人化處方與訓練參數。`,
              });
            }}
            disabled={isActiveOnPatientApp}
            className={`w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border ${
              isActiveOnPatientApp
                ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            aria-label={isActiveOnPatientApp ? "患者端展示中" : "同步到患者端"}
          >
            <MonitorSmartphone className="w-4 h-4" />
            <span>{isActiveOnPatientApp ? "患者端展示中 ✓" : "同步到患者端"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function DoctorPortal() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"全部" | "良好" | "注意" | "緊急">("全部");
  const [genderFilter, setGenderFilter] = useState<"全部" | "男" | "女">("全部");
  const [ageFilter, setAgeFilter] = useState<"全部" | "40-59" | "60-69" | "70+">("全部");
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [patients, setPatients] = useState(PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderSettingsByPatient, setReminderSettingsByPatient] = useState<Record<string, ReminderSettings>>(
    Object.fromEntries(PATIENTS.map((patient) => [patient.id, DEFAULT_REMINDER_SETTINGS]))
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? null;
  const profilePatient = selectedPatient ? getPatientProfile(selectedPatient.id) : undefined;
  const activePatientId = useActivePatientId();
  const syncedAnalytics = usePatientAnalytics(DEFAULT_PATIENT_ID);
  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set([
          "骨科復健科",
          "復健醫學科",
          "神經復健科",
          "運動醫學科",
          "疼痛門診",
          "職能治療",
          "物理治療",
          ...patients
            .map((p) => getPatientProfile(p.id)?.department)
            .filter((value): value is string => Boolean(value)),
        ])
      ),
    [patients]
  );

  const advancedFilterSummary = [
    genderFilter !== "全部" ? genderFilter : null,
    ageFilter !== "全部" ? `${ageFilter}歲` : null,
    departmentFilter.length > 0 ? `${departmentFilter.length} 科別` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  const filtered = patients.filter((p) => {
    const profile = getPatientProfile(p.id);
    const matchSearch =
      p.name.includes(search) || p.diagnosis.includes(search);
    const matchFilter = filter === "全部" || p.status === filter;
    const matchGender = genderFilter === "全部" || profile?.gender === genderFilter;
    const matchAge =
      ageFilter === "全部" ||
      (ageFilter === "40-59" && p.age >= 40 && p.age <= 59) ||
      (ageFilter === "60-69" && p.age >= 60 && p.age <= 69) ||
      (ageFilter === "70+" && p.age >= 70);
    const matchDepartment =
      departmentFilter.length === 0 ||
      (profile?.department ? departmentFilter.includes(profile.department) : false);
    return matchSearch && matchFilter && matchGender && matchAge && matchDepartment;
  });

  const stats = {
    total: patients.length,
    good: patients.filter((p) => p.status === "良好").length,
    attention: patients.filter((p) => p.status === "注意").length,
    avgCompliance: Math.round(
      patients.reduce((s, p) => s + p.compliance, 0) / patients.length
    ),
  };
  const filterCounts = {
    全部: patients.length,
    良好: patients.filter((p) => p.status === "良好").length,
    注意: patients.filter((p) => p.status === "注意").length,
    緊急: patients.filter((p) => p.status === "緊急").length,
  } as const;

  const handlePrescriptionSubmit = (patientId: string, exerciseIds: string[]) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, assignedExerciseIds: exerciseIds } : p))
    );
  };

  const toggleDepartmentFilter = (department: string) => {
    setDepartmentFilter((prev) =>
      prev.includes(department)
        ? prev.filter((item) => item !== department)
        : [...prev, department]
    );
  };

  const resetAdvancedFilters = () => {
    setGenderFilter("全部");
    setAgeFilter("全部");
    setDepartmentFilter([]);
  };

  return (
    <div className="portal-large-text rehab-app-shell bg-gradient-to-br from-sky-50/40 via-slate-50 to-blue-50/30 flex flex-col overflow-hidden">
      {/* Horizontal Header */}
      <header className="bg-gradient-to-r from-sky-100/90 via-sky-50/90 to-blue-50/80 border-b border-sky-100 px-6 py-3 flex-shrink-0">
        <div className="rehab-content flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-xl bg-white/60 hover:bg-white/80 flex items-center justify-center border border-sky-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-sky-500" />
            </button>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-sky-100">
              <Stethoscope className="w-4 h-4 text-sky-500" />
              <span className="text-sky-600 text-sm" style={{ fontWeight: 600 }}>
                醫師管理後台
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {[
              { label: "總病患", value: stats.total, icon: Users, color: "text-sky-500", bg: "bg-sky-50" },
              { label: "狀況良好", value: stats.good, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "需注意", value: stats.attention, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "平均依從", value: `${stats.avgCompliance}%`, icon: Activity, color: "text-blue-400", bg: "bg-blue-50" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`${s.bg} hidden md:flex items-center gap-2 border border-white rounded-xl px-3 py-2 shadow-sm`}
                >
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <div>
                    <p className={`${s.color} text-sm leading-none`} style={{ fontWeight: 700 }}>
                      {s.value}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
            <NotificationBell variant="doctor" />
          </div>
        </div>
      </header>

      <main className="flex-1 rehab-content w-full px-6 py-3 flex flex-col min-h-0 gap-2 overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-sky-100 p-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋病患姓名或診斷..."
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`relative w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
                    advancedFilterSummary
                      ? "bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-200"
                      : "bg-sky-50 border-sky-100 text-sky-500 hover:bg-sky-100/70"
                  }`}
                  aria-label="開啟進階篩選"
                  title="進階篩選"
                >
                  <Filter className="w-5 h-5 flex-shrink-0" />
                  {(genderFilter !== "全部" || ageFilter !== "全部" || departmentFilter.length > 0) && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-white text-[10px] flex items-center justify-center border-2 border-white">
                      {(genderFilter !== "全部" ? 1 : 0) +
                        (ageFilter !== "全部" ? 1 : 0) +
                        departmentFilter.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[560px] rounded-3xl border-sky-100 p-5 shadow-xl" align="start">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-slate-800 text-base" style={{ fontWeight: 800 }}>
                      篩選病患
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      常見復健 app 會用科別、性別、年齡等條件快速篩選
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAdvancedFilters}
                    className="text-sm text-sky-600 hover:text-sky-700"
                    style={{ fontWeight: 700 }}
                  >
                    清除條件
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3">
                    <p className="text-sky-600 text-sm" style={{ fontWeight: 700 }}>
                      目前結果
                    </p>
                    <p className="text-slate-700 text-base mt-1">
                      {advancedFilterSummary || "未套用進階條件"} · 共 {filtered.length} 位病患
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm mb-3" style={{ fontWeight: 700 }}>
                      性別
                    </p>
                    <div className="flex gap-2">
                      {(["全部", "男", "女"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setGenderFilter(option)}
                          className={`px-4 py-2.5 rounded-2xl text-sm border transition-colors ${
                            genderFilter === option
                              ? "bg-sky-400 text-white border-sky-400"
                              : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                          }`}
                          style={{ fontWeight: 700 }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm mb-3" style={{ fontWeight: 700 }}>
                      年齡
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { id: "全部", label: "全部" },
                        { id: "40-59", label: "40-59歲" },
                        { id: "60-69", label: "60-69歲" },
                        { id: "70+", label: "70歲以上" },
                      ] as const).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setAgeFilter(option.id)}
                          className={`px-4 py-2.5 rounded-2xl text-sm border transition-colors ${
                            ageFilter === option.id
                              ? "bg-sky-400 text-white border-sky-400"
                              : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                          }`}
                          style={{ fontWeight: 700 }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm mb-3" style={{ fontWeight: 700 }}>
                      科別 / 治療類型
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                      {departmentOptions.map((department) => (
                        <label
                          key={department}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={departmentFilter.includes(department)}
                            onCheckedChange={() => toggleDepartmentFilter(department)}
                          />
                          <span className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                            {department}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {(["全部", "良好", "注意", "緊急"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                  filter === f
                    ? "bg-sky-400 text-white border-sky-400"
                    : "text-slate-600 border-slate-200 hover:border-sky-300"
                }`}
              >
                <span>{f}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                    filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {filterCounts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Patient List + Detail Sidebar */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div
              className={`grid gap-2 h-full ${
                selectedPatient ? "grid-cols-2 grid-rows-2" : "grid-cols-3 grid-rows-2"
              }`}
            >
              {filtered.map((patient) => {
                const TrendIcon = TREND_ICONS[patient.trend];
                const isSelected = selectedPatient?.id === patient.id;
                const compliance =
                  patient.id === DEFAULT_PATIENT_ID
                    ? getAnalyticsKpiValue(syncedAnalytics, "今日完成")
                    : patient.compliance;
                const complianceLabel =
                  patient.id === DEFAULT_PATIENT_ID ? "今日完成率" : "依從率";
                const lastSession =
                  patient.id === DEFAULT_PATIENT_ID ? getLastSessionLabel() : patient.lastSession;
                return (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`bg-white rounded-xl shadow-sm border p-3 cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden ${
                      isSelected
                        ? "border-sky-400 ring-2 ring-sky-100"
                        : "border-slate-100 hover:border-sky-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sky-600" style={{ fontWeight: 700 }}>
                          {patient.name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-800 truncate" style={{ fontWeight: 600 }}>
                              {patient.name}
                            </span>
                            <span className="text-slate-400 text-sm flex-shrink-0">{patient.age}歲</span>
                            {patient.id === activePatientId && (
                              <span className="flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ fontWeight: 700 }}>
                                <MonitorSmartphone className="w-3 h-3" />
                                患者端
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-xs border flex-shrink-0 ${STATUS_COLORS[patient.status]}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm mb-2 truncate">{patient.diagnosis}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-600 text-xs">{complianceLabel}</span>
                            <span className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>
                              {compliance}%
                            </span>
                            <TrendIcon className={`w-4 h-4 ${TREND_COLORS[patient.trend]}`} />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{lastSession}</span>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              compliance >= 80
                                ? "bg-emerald-400"
                                : compliance >= 60
                                ? "bg-amber-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${compliance}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                    </div>
                    <PatientAssignedPreview patient={patient} />
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>找不到符合條件的病患</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {selectedPatient && (
              <PatientDetailPanel
                patient={selectedPatient}
                onClose={() => setSelectedPatientId(null)}
                onPrescribe={() => setShowPrescription(true)}
                onViewProfile={() => setProfileOpen(true)}
                onViewReport={() => setReportOpen(true)}
                onConfigureReminder={() => setReminderOpen(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescription && selectedPatient && (
          <PrescriptionModal
            patient={selectedPatient}
            initialExerciseIds={selectedPatient.assignedExerciseIds}
            onClose={() => setShowPrescription(false)}
            onSubmit={(ids) => handlePrescriptionSubmit(selectedPatient.id, ids)}
          />
        )}
      </AnimatePresence>

      <ChatWidget
        portal="doctor"
        accentColor="bg-sky-400"
        accentBg="bg-sky-50"
        doctorPatients={patients.map((p) => ({
          id: p.id,
          name: p.name,
          diagnosis: p.diagnosis,
        }))}
      />

      {profilePatient && (
        <PatientProfileDialog
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          profile={profilePatient}
          variant="doctor"
        />
      )}

      <FullReportDialog
        patient={selectedPatient}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      <ReminderSettingsDialog
        patient={selectedPatient}
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        settings={
          selectedPatient
            ? reminderSettingsByPatient[selectedPatient.id] ?? DEFAULT_REMINDER_SETTINGS
            : DEFAULT_REMINDER_SETTINGS
        }
        onChange={(settings) => {
          if (!selectedPatient) return;
          setReminderSettingsByPatient((prev) => ({
            ...prev,
            [selectedPatient.id]: settings,
          }));
        }}
      />
    </div>
  );
}
