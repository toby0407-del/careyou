import { motion } from "motion/react";
import { Lock, Star, CheckCircle2, Play, Footprints } from "lucide-react";
import { useNavigate } from "react-router";
import {
  categories,
  getLevelStatus,
  type Exercise,
} from "../../data/patientExercises";
import { useLiveExercises } from "../../hooks/useLiveProgress";

/** Zigzag map positions (%, %) — 略偏下，留頂部空間 */
const MAP_POSITIONS: { x: number; y: number }[] = [
  { x: 8, y: 52 },
  { x: 24, y: 36 },
  { x: 40, y: 52 },
  { x: 56, y: 36 },
  { x: 72, y: 52 },
  { x: 88, y: 36 },
];

function buildPathD(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function segmentStatus(
  fromIdx: number,
  statuses: ("locked" | "active" | "completed")[]
): "done" | "current" | "locked" {
  const from = statuses[fromIdx];
  const to = statuses[fromIdx + 1];
  if (from === "completed" && (to === "completed" || to === "active")) return "done";
  if (from === "completed" && to === "locked") return "done";
  if (from === "active" || (from === "completed" && to === "active")) return "current";
  return "locked";
}

function MapPath({
  statuses,
}: {
  statuses: ("locked" | "active" | "completed")[];
}) {
  const fullPath = buildPathD(MAP_POSITIONS);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Base trail (locked / future) */}
      <path
        d={fullPath}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
        opacity="0.6"
      />

      {/* Completed + active segments */}
      {MAP_POSITIONS.slice(0, -1).map((_, i) => {
        const seg = segmentStatus(i, statuses);
        const segPath = buildPathD([MAP_POSITIONS[i], MAP_POSITIONS[i + 1]]);
        const color =
          seg === "done" ? "#10b981" : seg === "current" ? "#14b8a6" : "transparent";
        if (seg === "locked") return null;
        return (
          <path
            key={i}
            d={segPath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={seg === "current" ? 0.9 : 1}
          />
        );
      })}

      {/* Footprints on current segment */}
      {MAP_POSITIONS.slice(0, -1).map((from, i) => {
        if (segmentStatus(i, statuses) !== "current") return null;
        const to = MAP_POSITIONS[i + 1];
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return (
          <g key={`fp-${i}`}>
            <circle cx={mx} cy={my} r="1.8" fill="#14b8a6" opacity="0.3" />
            <circle cx={mx} cy={my} r="0.9" fill="#14b8a6" />
          </g>
        );
      })}
    </svg>
  );
}

function MapNode({
  exercise,
  status,
  accent,
  position,
  index,
}: {
  exercise: Exercise;
  status: "locked" | "active" | "completed";
  accent: string;
  position: { x: number; y: number };
  index: number;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {/* Active pulse ring */}
      {status === "active" && (
        <motion.div
          className="absolute inset-0 -m-3 rounded-full border-2 border-teal-200"
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 97, height: 97, left: "50%", top: "50%", x: "-50%", y: "-50%" }}
        />
      )}

      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.07 }}
        whileHover={status !== "locked" ? { scale: 1.08, y: -4 } : {}}
        whileTap={status !== "locked" ? { scale: 0.95 } : {}}
        disabled={status === "locked"}
        onClick={() => status !== "locked" && navigate(`/patient/rehab/${exercise.id}`)}
        className={`relative flex flex-col items-center gap-2 group ${
          status === "locked" ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {/* Island base shadow */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-[5.25rem] h-3.5 rounded-full blur-sm ${
            status === "locked" ? "bg-slate-300/40" : "bg-teal-200/30"
          }`}
        />

        {/* Node circle */}
        <div
          className={`relative w-[83px] h-[83px] rounded-full flex items-center justify-center border-[3px] transition-all ${
            status === "locked"
              ? "bg-slate-100 border-slate-250 border-slate-200"
              : status === "completed"
              ? "bg-gradient-to-br from-emerald-200 to-teal-300 border-white shadow-lg shadow-emerald-100"
              : "bg-gradient-to-br from-teal-200 to-emerald-300 border-white shadow-lg shadow-teal-100 ring-[3px] ring-teal-50"
          }`}
        >
          {status === "locked" ? (
            <Lock className="w-9 h-9 text-slate-400" />
          ) : status === "completed" ? (
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
          ) : (
            <Play className="w-10 h-10 text-white fill-white ml-0.5" />
          )}

          {/* Level badge */}
          <span
            className="absolute -top-0.5 -right-0.5 w-7 h-7 rounded-full text-white map-text-xs flex items-center justify-center shadow-md border-2 border-white"
            style={{ background: accent, fontWeight: 800 }}
          >
            {exercise.level}
          </span>
        </div>

        {/* Label card */}
        <div
          className={`text-center px-2 py-1.5 rounded-xl w-[115px] max-w-[115px] border transition-all ${
            status === "locked"
              ? "bg-slate-50/80 border-slate-100"
              : status === "active"
              ? "bg-white border-teal-50 shadow-md"
              : "bg-white/90 border-emerald-50 shadow-sm"
          }`}
        >
          <p
            className={`map-text-sm leading-snug line-clamp-2 break-words ${
              status === "locked" ? "text-slate-400" : "text-slate-700"
            }`}
            style={{ fontWeight: 700 }}
          >
            {exercise.name}
          </p>
          <p className="map-text-xs text-slate-400 mt-0.5 leading-tight">{exercise.setsReps}</p>

          {status === "completed" && (
            <div className="flex justify-center gap-px mt-0.5">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    s <= exercise.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          )}
          {status === "active" && (
            <span className="map-text-xs text-teal-300 block mt-0.5" style={{ fontWeight: 700 }}>
              可挑戰 →
            </span>
          )}
          {status === "locked" && (
            <span className="map-text-xs text-slate-400 block mt-0.5">未解鎖</span>
          )}
        </div>
      </motion.button>
    </div>
  );
}

export function LevelMap() {
  const liveExercises = useLiveExercises();
  const statuses = liveExercises.map((ex, i) => getLevelStatus(ex, i, liveExercises));

  const activeIdx = statuses.findIndex((s) => s === "active");

  return (
    <div className="patient-map-ui flex flex-col h-full overflow-hidden min-h-0">
      {/* Adventure map canvas */}
      <div className="flex-1 min-h-[180px] relative rounded-2xl border border-emerald-50/80 overflow-hidden shadow-sm shadow-emerald-50/30">
        {/* Terrain background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 30% 70%, rgba(167, 243, 208, 0.35) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 75% 30%, rgba(153, 246, 228, 0.3) 0%, transparent 55%),
              linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 40%, #f0f9ff 100%)
            `,
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "linear-gradient(#bbf7d0 1px, transparent 1px), linear-gradient(90deg, #bbf7d0 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Decorative trees / landmarks */}
        <div className="absolute left-[3%] bottom-[8%] text-2xl opacity-30 select-none">🌿</div>
        <div className="absolute left-[45%] top-[6%] text-xl opacity-25 select-none">☁️</div>
        <div className="absolute right-[8%] bottom-[12%] text-2xl opacity-30 select-none">🌸</div>

        {/* Path + nodes */}
        <div className="absolute inset-0 map-node-area overflow-x-auto overflow-y-hidden pt-[7%] pb-[4%]">
          <div className="relative h-full w-full min-w-0">
            <MapPath statuses={statuses} />

            {liveExercises.map((exercise, idx) => {
              const cat = categories.find((c) =>
                c.exercises.some((e) => e.id === exercise.id)
              )!;
              return (
                <MapNode
                  key={exercise.id}
                  exercise={exercise}
                  status={statuses[idx]}
                  accent={cat.accent}
                  position={MAP_POSITIONS[idx]}
                  index={idx}
                />
              );
            })}

            {/* 路徑上的腳印提示（僅圖示，不擋關卡文字） */}
            {activeIdx >= 0 && activeIdx < MAP_POSITIONS.length - 1 && (
              <motion.div
                className="absolute z-[5] pointer-events-none flex items-center justify-center w-9 h-9 bg-teal-300/90 text-white rounded-full shadow-md"
                style={{
                  left: `${(MAP_POSITIONS[activeIdx].x + MAP_POSITIONS[activeIdx + 1].x) / 2}%`,
                  top: `${(MAP_POSITIONS[activeIdx].y + MAP_POSITIONS[activeIdx + 1].y) / 2}%`,
                  transform: "translate(-50%, -50%)",
                }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                role="img"
                aria-label="前往下一關"
              >
                <Footprints className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 訓練分類進度 — 地圖下方、貼近底部導覽 */}
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
              <span className="category-strip-count text-slate-600 flex-shrink-0 tabular-nums" style={{ fontWeight: 700 }}>
                {done}/{cat.exercises.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
