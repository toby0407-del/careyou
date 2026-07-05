import { useMemo, useState } from "react";
import { Dumbbell, Stethoscope } from "lucide-react";
import { RehabExerciseDemo2D, getDetectionInfo, getZoneLabel } from "../patient/RehabExerciseDemo2D";
import { getAppDisplayName } from "../../brand";
import { Block, BlockLayer, BlockGrid } from "./BlueprintBlocks";
import {
  allBlueprintDemoExercises,
  BLUEPRINT_DEMO_GROUPS,
  getBlueprintDemoExerciseById,
} from "../../data/blueprintDemoExercises";
import { getActivePatientId, resolveExercise } from "../../data/patientExercisePlans";
import { getExerciseById } from "../../data/patientExercises";
import { getPatientProfile } from "../../data/patientProfiles";

function resolveDemoExercise(id: string) {
  const base = getExerciseById(id) ?? getBlueprintDemoExerciseById(id);
  if (!base) return undefined;
  if (getExerciseById(id)) {
    return resolveExercise(base, getActivePatientId());
  }
  return base;
}

export function ExerciseDemoShowcase() {
  const [activeId, setActiveId] = useState(allBlueprintDemoExercises[0]?.id ?? "neck-extension-push");
  const exercise = useMemo(() => resolveDemoExercise(activeId), [activeId]);

  const activeGroup = useMemo(
    () => BLUEPRINT_DEMO_GROUPS.find((g) => g.exercises.some((e) => e.id === activeId)),
    [activeId]
  );
  const accent = activeGroup?.accent ?? "#8b5cf6";
  const patientName = getPatientProfile(getActivePatientId())?.name ?? "患者";
  const detection = exercise ? getDetectionInfo(exercise) : null;

  if (!exercise) {
    return null;
  }

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      <div className="rounded-xl border border-violet-200 bg-white/75 px-3 py-2 flex items-center justify-between gap-2 flex-shrink-0 shadow-sm shadow-violet-100/40">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-4 h-4 text-violet-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-violet-950 text-[11px]" style={{ fontWeight: 800 }}>
              {getAppDisplayName()} 2D 動作方塊圖
            </p>
            <p className="text-violet-600/70 text-[9px] truncate">
              共 {allBlueprintDemoExercises.length} 項 · 動作庫完整收錄
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-violet-100 border border-violet-200 px-2 py-0.5 flex-shrink-0">
          <Stethoscope className="w-3 h-3 text-violet-600" />
          <span className="text-violet-800 text-[9px] whitespace-nowrap">{patientName}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2">
        <div className="col-span-4 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1">
          {BLUEPRINT_DEMO_GROUPS.map((group) => (
            <BlockLayer key={group.id} title={group.label} color={group.accent}>
              <div className="flex flex-col gap-1">
                {group.exercises.map((ex) => {
                  const selected = activeId === ex.id;
                  return (
                    <Block
                      key={ex.id}
                      label={ex.name}
                      sub={`#${ex.level} · ${getZoneLabel(ex)}`}
                      color={selected ? group.accent : "#64748b"}
                      className={`w-full text-left ${selected ? "ring-1 ring-violet-400/50" : ""}`}
                      onClick={() => setActiveId(ex.id)}
                    />
                  );
                })}
              </div>
            </BlockLayer>
          ))}
        </div>

        <div className="col-span-5 rounded-xl border border-violet-200 overflow-hidden min-h-0">
          <RehabExerciseDemo2D exercise={exercise} overlay="full" mode="detection" />
        </div>

        <div className="col-span-3 flex flex-col gap-2 min-h-0 overflow-y-auto">
          <BlockLayer
            title={exercise.name}
            subtitle={`${activeGroup?.label ?? ""} · 動作庫`}
            color={accent}
          >
            <p className="text-violet-700/70 text-[9px] mb-2 leading-relaxed">{exercise.instruction}</p>
            <BlockGrid cols={2}>
              <Block
                label="偵測部位"
                sub={detection?.zone ?? getZoneLabel(exercise)}
                color={accent}
              />
              <Block
                label="偵測關節"
                sub={detection ? `${detection.jointLabel} · ${detection.triplet}` : "—"}
                color={accent}
              />
              <Block
                label="組數×次數"
                sub="依醫師處方設定"
                color={accent}
                className="col-span-2"
              />
              <Block
                label="目標角度"
                sub="依醫師處方設定"
                color={accent}
                className="col-span-2"
              />
            </BlockGrid>
          </BlockLayer>

          <BlockLayer title="動作要點" color="#10b981">
            <div className="flex flex-col gap-1">
              {exercise.demoTips.map((tip, i) => (
                <Block
                  key={i}
                  label={`要點 ${i + 1}`}
                  sub={tip}
                  color="#10b981"
                  className="text-left w-full"
                />
              ))}
            </div>
          </BlockLayer>
        </div>
      </div>
    </div>
  );
}
