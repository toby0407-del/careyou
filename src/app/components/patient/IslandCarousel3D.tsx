/**
 * 患者端關卡選擇 — 3D 浮島轉盤（呈現方式參考 LevelSelect3D）
 * 保留原 IslandWorldMap 全部功能：依序解鎖、三態顯示、星星、
 * 拖曳／點擊切換、進入訓練、完成慶祝彩帶、分類進度條
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Lock, Play, RotateCcw, Star, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { categories, getLevelStatus } from "../../data/patientExercises";
import { useLiveExercises } from "../../hooks/useLiveProgress";
import { islandArtForIndex } from "../../data/islandArt";
import {
  createIslandCarousel,
  type CarouselHandle,
  type CarouselStatus,
} from "../../lib/islandCarouselScene";

function categoryOf(exerciseId: string) {
  return categories.find((c) => c.exercises.some((e) => e.id === exerciseId))!;
}

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`難度 ${level} 級`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i <= level ? "bg-teal-400" : "bg-slate-200"}`}
        />
      ))}
    </span>
  );
}

export function IslandCarousel3D() {
  const navigate = useNavigate();
  const liveExercises = useLiveExercises();
  const statuses: CarouselStatus[] = liveExercises.map((ex, i) =>
    getLevelStatus(ex, i, liveExercises)
  );
  const statusKey = statuses.join("|");

  const initialActive = Math.max(0, statuses.findIndex((s) => s === "active"));
  const [activeIndex, setActiveIndex] = useState(initialActive);
  const [webglFailed, setWebglFailed] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<CarouselHandle | null>(null);
  const activeIndexRef = useRef(initialActive);
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;
  const exercisesRef = useRef(liveExercises);
  exercisesRef.current = liveExercises;

  const enterExercise = useCallback(
    (index: number) => {
      const exercise = exercisesRef.current[index];
      if (exercise && statusesRef.current[index] !== "locked") {
        navigate(`/patient/rehab/${exercise.id}`);
      }
    },
    [navigate]
  );

  // ── 建立 / 重建 3D 場景（解鎖狀態改變時重建，維持目前聚焦） ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || webglFailed) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const islands = exercisesRef.current.map((ex, i) => ({
      artUrl: islandArtForIndex(i),
      status: statusesRef.current[i],
      accent: categoryOf(ex.id).accent,
    }));

    let handle: CarouselHandle;
    try {
      handle = createIslandCarousel(mount, islands, {
        initialIndex: activeIndexRef.current,
        reducedMotion,
        onActiveChange: (idx) => {
          activeIndexRef.current = idx;
          setActiveIndex(idx);
        },
        onIslandTap: (idx, isFocused) => {
          if (isFocused) enterExercise(idx);
          else handleRef.current?.goTo(idx);
        },
      });
    } catch {
      // WebGL 不可用（極少數舊裝置）→ 退回清單模式，功能不中斷
      setWebglFailed(true);
      return;
    }
    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.dispose();
    };
  }, [statusKey, webglFailed, enterExercise]);

  // ── 偵測「剛完成」的關卡 → 彩帶慶祝 ──
  const prevCompletedRef = useRef<Set<string>>(
    new Set(liveExercises.filter((e) => e.completed).map((e) => e.id))
  );
  useEffect(() => {
    const nowCompleted = liveExercises.filter((e) => e.completed).map((e) => e.id);
    const prev = prevCompletedRef.current;
    const justCompleted = nowCompleted.find((id) => !prev.has(id));
    prevCompletedRef.current = new Set(nowCompleted);

    if (justCompleted) {
      const rect = mountRef.current?.getBoundingClientRect();
      confetti({
        particleCount: 110,
        spread: 75,
        origin: {
          x: rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5,
          y: rect ? (rect.top + rect.height * 0.4) / window.innerHeight : 0.4,
        },
        colors: ["#14b8a6", "#34d399", "#fbbf24", "#f472b6"],
        zIndex: 9999,
        disableForReducedMotion: true,
      });
    }
  }, [liveExercises]);

  const exercise = liveExercises[Math.min(activeIndex, liveExercises.length - 1)];
  const status = statuses[Math.min(activeIndex, statuses.length - 1)];
  const category = exercise ? categoryOf(exercise.id) : categories[0];

  // ── WebGL 退回模式：簡易清單（保留全部功能） ──
  if (webglFailed) {
    return (
      <div className="patient-map-ui flex flex-col h-full overflow-hidden min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-teal-50/80 bg-white/70 p-3 space-y-2">
          {liveExercises.map((ex, i) => (
            <button
              key={ex.id}
              type="button"
              disabled={statuses[i] === "locked"}
              onClick={() => enterExercise(i)}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                statuses[i] === "locked"
                  ? "bg-slate-50 border-slate-100 text-slate-400"
                  : "bg-white border-teal-100 hover:bg-teal-50 text-slate-700"
              }`}
            >
              {statuses[i] === "locked" ? (
                <Lock className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Play className="w-5 h-5 text-teal-500 flex-shrink-0" />
              )}
              <span className="flex-1 min-w-0 truncate" style={{ fontWeight: 700 }}>
                第 {ex.level} 關．{ex.name}
              </span>
              <span className="text-sm text-slate-400">{ex.setsReps}</span>
            </button>
          ))}
        </div>
        <CategoryStrip />
      </div>
    );
  }

  return (
    <div className="patient-map-ui flex flex-col h-full overflow-hidden min-h-0">
      <div
        className="flex-1 min-h-[220px] relative rounded-2xl border border-teal-50/80 overflow-hidden shadow-sm shadow-teal-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
        style={{ background: "linear-gradient(180deg, #ccecff 0%, #e3f9f3 48%, #f0fdf4 100%)" }}
        tabIndex={0}
        role="group"
        aria-label="關卡選擇轉盤，使用左右鍵切換，Enter 開始"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            handleRef.current?.step(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            handleRef.current?.step(1);
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            enterExercise(activeIndexRef.current);
          }
        }}
      >
        {/* Three.js 畫布 */}
        <div ref={mountRef} className="absolute inset-0" />

        {/* 頂部：關卡資訊卡 + 開始挑戰（置於島嶼上方，避免遮擋島嶼圖片） */}
        <div className="absolute top-2 inset-x-0 flex flex-col items-center px-3 pointer-events-none z-10">
          <AnimatePresence mode="wait">
            {exercise && (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur border border-teal-50 shadow-lg px-4 py-2.5 max-w-[92%]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ background: category.accent, fontWeight: 700 }}
                    >
                      {category.label}
                    </span>
                    <h2 className="text-slate-800 text-base leading-tight map-text-title truncate" style={{ fontWeight: 800 }}>
                      第 {exercise.level} 關．{exercise.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 map-text-xs flex-wrap">
                    <span style={{ fontWeight: 600 }}>{exercise.setsReps}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exercise.duration}
                    </span>
                    <DifficultyDots level={exercise.difficulty} />
                    {status === "completed" && (
                      <span className="inline-flex items-center gap-px" aria-label={`獲得 ${exercise.stars} 顆星`}>
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= exercise.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                    {status === "locked" && (
                      <span className="inline-flex items-center gap-1 text-slate-400" style={{ fontWeight: 600 }}>
                        <Lock className="w-3.5 h-3.5" /> 完成上一關解鎖
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={status === "locked"}
                  onClick={() => enterExercise(activeIndex)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm transition-all map-text-sm ${
                    status === "locked"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : status === "completed"
                        ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-200"
                        : "bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md shadow-amber-200"
                  }`}
                  style={{ fontWeight: 800 }}
                >
                  {status === "locked" ? (
                    <>
                      <Lock className="w-4 h-4" /> 未解鎖
                    </>
                  ) : status === "completed" ? (
                    <>
                      <RotateCcw className="w-4 h-4" /> 再練一次
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> 開始挑戰
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 左右箭頭（長輩友善大按鈕） */}
        <button
          type="button"
          onClick={() => handleRef.current?.step(-1)}
          aria-label="上一個關卡"
          className="absolute left-3 top-[42%] -translate-y-1/2 w-14 h-14 rounded-full bg-white/80 hover:bg-white border border-teal-100 shadow-md backdrop-blur flex items-center justify-center transition-colors z-10"
        >
          <ChevronLeft className="w-7 h-7 text-teal-600" />
        </button>
        <button
          type="button"
          onClick={() => handleRef.current?.step(1)}
          aria-label="下一個關卡"
          className="absolute right-3 top-[42%] -translate-y-1/2 w-14 h-14 rounded-full bg-white/80 hover:bg-white border border-teal-100 shadow-md backdrop-blur flex items-center justify-center transition-colors z-10"
        >
          <ChevronRight className="w-7 h-7 text-teal-600" />
        </button>

        {/* 底部：拖曳提示 + 指示點 */}
        <div className="absolute bottom-2 inset-x-0 flex flex-col items-center gap-1.5 px-3 pointer-events-none">
          <p
            className="text-center text-slate-500/80 text-xs map-text-xs"
            style={{ fontWeight: 600 }}
          >
            ← 左右拖曳或點箭頭切換島嶼 →
          </p>
          <div className="pointer-events-auto flex gap-2">
            {liveExercises.map((ex, idx) => (
              <button
                key={ex.id}
                type="button"
                aria-label={`前往 ${ex.name}`}
                aria-current={idx === activeIndex}
                onClick={() => handleRef.current?.goTo(idx)}
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  background:
                    idx === activeIndex
                      ? "#14b8a6"
                      : statuses[idx] === "completed"
                        ? "#86efac"
                        : "#cbd5e1",
                  transform: idx === activeIndex ? "scale(1.35)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <CategoryStrip />
    </div>
  );
}

/** 訓練分類進度（沿用原設計） */
function CategoryStrip() {
  const liveExercises = useLiveExercises();
  return (
    <div className="category-strip flex-shrink-0 grid grid-cols-3 gap-3 px-1 pt-1.5 pb-2 mt-auto">
      {categories.map((cat) => {
        const CatIcon = cat.icon;
        const catIds = new Set(cat.exercises.map((e) => e.id));
        const done = liveExercises.filter((e) => catIds.has(e.id) && e.completed).length;
        const pct = Math.round((done / cat.exercises.length) * 100);
        return (
          <div
            key={cat.id}
            className={`category-strip-card ${cat.bg} ${cat.border} border rounded-2xl px-3 py-2.5 flex items-center gap-2.5 min-h-[80px] shadow-md backdrop-blur-sm`}
          >
            <div className="category-strip-icon w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
              <CatIcon className={`category-strip-icon-glyph w-6 h-6 ${cat.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`category-strip-title ${cat.color} truncate leading-tight`} style={{ fontWeight: 700 }}>
                {cat.label}
              </p>
              <div className="category-strip-bar h-3 bg-white/70 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: cat.accent }}
                />
              </div>
            </div>
            <span
              className="category-strip-count text-slate-600 flex-shrink-0 tabular-nums"
              style={{ fontWeight: 700 }}
            >
              {done}/{cat.exercises.length}
            </span>
          </div>
        );
      })}
    </div>
  );
}
