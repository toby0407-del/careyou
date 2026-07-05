import { motion } from "motion/react";
import { Lock, Star, CheckCircle2, Play, Footprints } from "lucide-react";
import { useNavigate } from "react-router";
import {
  categories,
  getLevelStatus,
  type Exercise,
} from "../../data/patientExercises";
import { useLiveExercises } from "../../hooks/useLiveProgress";

/** Zigzag map positions (%, %) — landscape adventure path */
const MAP_POSITIONS: { x: number; y: number }[] = [
  { x: 6, y: 50 },
  { x: 22, y: 28 },
  { x: 38, y: 50 },
  { x: 54, y: 28 },
  { x: 70, y: 50 },
  { x: 86, y: 28 },
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
          className="absolute inset-0 -m-3 rounded-full border-2 border-teal-400"
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 120, height: 120, left: "50%", top: "50%", x: "-50%", y: "-50%" }}
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
        className={`relative flex flex-col items-center gap-2.5 group ${
          status === "locked" ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {/* Island base shadow */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full blur-sm ${
            status === "locked" ? "bg-slate-300/40" : "bg-teal-400/30"
          }`}
        />

        {/* Node circle */}
        <div
          className={`relative w-[104px] h-[104px] rounded-full flex items-center justify-center border-4 transition-all ${
            status === "locked"
              ? "bg-slate-100 border-slate-250 border-slate-200"
              : status === "completed"
              ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-white shadow-lg shadow-emerald-200"
              : "bg-gradient-to-br from-teal-400 to-emerald-500 border-white shadow-xl shadow-teal-300 ring-4 ring-teal-100"
          }`}
        >
          {status === "locked" ? (
            <Lock className="w-10 h-10 text-slate-400" />
          ) : status === "completed" ? (
            <CheckCircle2 className="w-11 h-11 text-white" strokeWidth={2.5} />
          ) : (
            <Play className="w-11 h-11 text-white fill-white ml-0.5" />
          )}

          {/* Level badge */}
          <span
            className="absolute -top-1 -right-1 w-8 h-8 rounded-full text-white map-text-sm flex items-center justify-center shadow-md border-2 border-white"
            style={{ background: accent, fontWeight: 800 }}
          >
            {exercise.level}
          </span>
        </div>

        {/* Label card */}
        <div
          className={`text-center px-3 py-2.5 rounded-xl w-[138px] max-w-[138px] border transition-all ${
            status === "locked"
              ? "bg-slate-50/80 border-slate-100"
              : status === "active"
              ? "bg-white border-teal-200 shadow-md"
              : "bg-white/90 border-emerald-100 shadow-sm"
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
                  className={`w-3.5 h-3.5 ${
                    s <= exercise.stars ? "text-amber-400 fill-amber-400" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          )}
          {status === "active" && (
            <span className="map-text-xs text-teal-600 block mt-0.5" style={{ fontWeight: 700 }}>
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
      <div className="flex-1 min-h-[180px] relative rounded-2xl border border-emerald-100/80 overflow-hidden shadow-sm shadow-emerald-100/30">
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
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden pb-[5.5rem]">
          <div className="relative h-full min-w-[1080px] w-full">
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

            {/* "前往下一關" arrow on active segment */}
            {activeIdx >= 0 && activeIdx < MAP_POSITIONS.length - 1 && (
              <motion.div
                className="absolute z-20 flex items-center gap-1.5 bg-teal-600 text-white map-text-sm px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                style={{
                  left: `${(MAP_POSITIONS[activeIdx].x + MAP_POSITIONS[activeIdx + 1].x) / 2}%`,
                  top: `${(MAP_POSITIONS[activeIdx].y + MAP_POSITIONS[activeIdx + 1].y) / 2 - 8}%`,
                  transform: "translate(-50%, -50%)",
                  fontWeight: 700,
                }}
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Footprints className="w-4 h-4" />
                前往下一關
              </motion.div>
            )}
          </div>
        </div>

        {/* Category progress strip — 疊在地圖底部，節省下方空間 */}
        <div className="category-strip absolute bottom-3 left-3 right-3 z-30 grid grid-cols-3 gap-2.5">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const catIds = new Set(cat.exercises.map((e) => e.id));
            const done = liveExercises.filter((e) => catIds.has(e.id) && e.completed).length;
            const pct = Math.round((done / cat.exercises.length) * 100);
            return (
              <div
                key={cat.id}
                className={`${cat.bg} ${cat.border} border rounded-2xl px-3 py-2.5 flex items-center gap-2.5 h-[68px] shadow-md backdrop-blur-sm`}
              >
                <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CatIcon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${cat.color} truncate leading-tight`} style={{ fontWeight: 700 }}>
                    {cat.label}
                  </p>
                  <div className="h-2.5 bg-white/70 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: cat.accent }}
                    />
                  </div>
                </div>
                <span className="text-sm text-slate-600 flex-shrink-0 tabular-nums" style={{ fontWeight: 700 }}>
                  {done}/{cat.exercises.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
