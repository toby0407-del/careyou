import { useEffect, useMemo, useState } from "react";
import { Save, Stethoscope } from "lucide-react";
import { allExercises } from "../../data/patientExercises";
import type { ExercisePlanConfig } from "../../data/exercisePlanTypes";
import { formatAngleRange, formatSetsReps } from "../../data/exercisePlanTypes";
import {
  getAllPlansForPatient,
  getExercisePlan,
  setExercisePlans,
} from "../../data/patientExercisePlans";

interface ExercisePlanEditorProps {
  patientId: string;
  patientName: string;
}

function planForExercise(patientId: string, exerciseId: string): ExercisePlanConfig {
  const ex = allExercises.find((e) => e.id === exerciseId)!;
  return getExercisePlan(patientId, exerciseId, ex)!;
}

export function ExercisePlanEditor({ patientId, patientName }: ExercisePlanEditorProps) {
  const [draft, setDraft] = useState<Record<string, ExercisePlanConfig>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const plans: Record<string, ExercisePlanConfig> = {};
    allExercises.forEach((ex) => {
      plans[ex.id] = planForExercise(patientId, ex.id);
    });
    setDraft(plans);
  }, [patientId]);

  const hasChanges = useMemo(() => {
    const current = getAllPlansForPatient(patientId);
    return allExercises.some((ex) => {
      const d = draft[ex.id];
      const c = current[ex.id];
      if (!d || !c) return false;
      return (
        d.sets !== c.sets ||
        d.repsPerSet !== c.repsPerSet ||
        d.flexedAngle !== c.flexedAngle ||
        d.extendedAngle !== c.extendedAngle ||
        d.tolerance !== c.tolerance
      );
    });
  }, [draft, patientId]);

  const update = (exerciseId: string, patch: Partial<ExercisePlanConfig>) => {
    setDraft((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], ...patch },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setExercisePlans(patientId, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Stethoscope className="w-4 h-4 text-sky-500" />
        <h3 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
          個人化訓練參數
        </h3>
      </div>
      <p className="text-slate-500 text-sm mb-2 leading-relaxed">
        依 {patientName} 狀況調整組數、次數與目標角度，患者端將同步顯示。
      </p>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {allExercises.map((ex) => {
          const plan = draft[ex.id];
          if (!plan) return null;
          return (
            <div key={ex.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <p className="text-slate-800 text-sm mb-1.5" style={{ fontWeight: 600 }}>
                {ex.name}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <label className="text-sm text-slate-500">
                  組數
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={plan.sets}
                    onChange={(e) => update(ex.id, { sets: Number(e.target.value) || 1 })}
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-1.5 py-1 text-sm text-slate-800"
                  />
                </label>
                <label className="text-sm text-slate-500">
                  每組次數
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={plan.repsPerSet}
                    onChange={(e) => update(ex.id, { repsPerSet: Number(e.target.value) || 1 })}
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-1.5 py-1 text-sm text-slate-800"
                  />
                </label>
                <label className="text-sm text-slate-500">
                  容許誤差°
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={plan.tolerance}
                    onChange={(e) => update(ex.id, { tolerance: Number(e.target.value) || 10 })}
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-1.5 py-1 text-sm text-slate-800"
                  />
                </label>
                <label className="text-sm text-slate-500">
                  屈曲角度°
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={plan.flexedAngle}
                    onChange={(e) => update(ex.id, { flexedAngle: Number(e.target.value) || 0 })}
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-1.5 py-1 text-sm text-slate-800"
                  />
                </label>
                <label className="text-sm text-slate-500 col-span-2">
                  伸直角度°
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={plan.extendedAngle}
                    onChange={(e) => update(ex.id, { extendedAngle: Number(e.target.value) || 0 })}
                    className="mt-0.5 w-full rounded-md border border-slate-200 px-1.5 py-1 text-sm text-slate-800"
                  />
                </label>
              </div>
              <p className="text-sky-600 text-sm mt-1">
                {formatSetsReps(plan)} · {formatAngleRange(plan)}
              </p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges && !saved}
        className="mt-2 w-full py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saved ? "已儲存" : hasChanges ? "儲存個人化參數" : "參數已是最新"}
      </button>
    </div>
  );
}
