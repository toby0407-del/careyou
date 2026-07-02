/** 完整版時光迴廊 — 設計確認後啟用，目前使用 TimeGalleryComingSoon */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Stethoscope,
  Footprints,
  Flag,
  Layers,
  Award,
  Dumbbell,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  galleryCategories,
  groupPhotosByMonth,
  type GalleryCategory,
  type GalleryPhoto,
} from "../../data/timeGallery";
import type { CorridorEventType, TimeCorridorEvent } from "../../data/timeCorridor";
import { useTimeGallery } from "../../hooks/useTimeGallery";
import { useTimeCorridor } from "../../hooks/useTimeCorridor";

const THEMES = {
  patient: {
    accent: "#7c3aed",
    accentSoft: "#ede9fe",
    filterActive: "bg-violet-600 text-white",
    filterIdle: "bg-white text-slate-600 border border-slate-200",
    dot: "bg-violet-400",
    line: "bg-violet-200",
    badge: "bg-teal-50 text-teal-700",
    sync: "text-teal-500",
    gradient: "from-violet-50/50 to-teal-50/30",
  },
  family: {
    accent: "#fda4af",
    accentSoft: "#fce7f3",
    filterActive: "bg-rose-400 text-white",
    filterIdle: "bg-white text-slate-600 border border-rose-100",
    dot: "bg-rose-300",
    line: "bg-rose-200",
    badge: "bg-rose-50 text-rose-500",
    sync: "text-rose-400",
    gradient: "from-rose-50/50 to-pink-50/30",
  },
};

const TYPE_CONFIG: Record<
  CorridorEventType,
  { icon: typeof Award; color: string; bg: string; border: string }
> = {
  surgery: { icon: Stethoscope, color: "text-violet-400", bg: "bg-violet-50", border: "border-violet-100" },
  first_session: { icon: Footprints, color: "text-sky-400", bg: "bg-sky-50", border: "border-sky-100" },
  milestone: { icon: Flag, color: "text-orange-400", bg: "bg-orange-50", border: "border-orange-100" },
  phase: { icon: Layers, color: "text-indigo-400", bg: "bg-indigo-50", border: "border-indigo-100" },
  achievement: { icon: Award, color: "text-amber-400", bg: "bg-amber-50", border: "border-amber-100" },
  training: { icon: Dumbbell, color: "text-emerald-400", bg: "bg-emerald-50", border: "border-emerald-100" },
  encouragement: { icon: Heart, color: "text-rose-400", bg: "bg-rose-50", border: "border-rose-100" },
};

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function PhotoCard({ photo, onClick }: { photo: GalleryPhoto; onClick: () => void }) {
  const cat = galleryCategories.find((c) => c.id === photo.category);
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden border-2 border-white shadow-md text-left h-full min-h-[160px] group"
    >
      <img
        src={photo.imageUrl}
        alt={photo.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm" style={{ fontWeight: 600 }}>
        {cat?.emoji} {cat?.label}
      </div>
      {photo.syncedAt && (
        <div className="absolute top-3 right-3 bg-emerald-500/80 text-white text-[10px] px-2 py-0.5 rounded-full">
          已同步
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white/80 text-sm">{photo.date}</p>
        <p className="text-white text-base leading-tight mt-0.5" style={{ fontWeight: 700 }}>{photo.title}</p>
      </div>
    </motion.button>
  );
}

function PhotoLightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  theme,
}: {
  photo: GalleryPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  theme: (typeof THEMES)["patient"];
}) {
  const cat = galleryCategories.find((c) => c.id === photo.category);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full flex shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-3/5 relative">
          <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover min-h-[360px]" />
          {hasPrev && (
            <button onClick={onPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button onClick={onNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="w-2/5 p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <span className={`${theme.badge} px-3 py-1 rounded-full text-sm`} style={{ fontWeight: 600 }}>
              {cat?.emoji} {cat?.label}
            </span>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-slate-400 text-base">{photo.date}</p>
          <h2 className="text-2xl text-slate-800 mt-1 mb-3" style={{ fontWeight: 800 }}>{photo.title}</h2>
          <p className="text-slate-600 text-base leading-relaxed flex-1">{photo.caption}</p>
          {photo.location && (
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-4">
              <MapPin className="w-4 h-4" />
              {photo.location}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {photo.tags.map((tag) => (
              <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">#{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CorridorNode({ event, theme }: { event: TimeCorridorEvent; theme: (typeof THEMES)["patient"] }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;
  return (
    <div className="relative flex flex-col items-center w-[200px] flex-shrink-0 px-2">
      <div className={`w-3.5 h-3.5 rounded-full ${cfg.bg} border-2 ${cfg.border} z-10 mb-2 ring-4 ring-white/80`} />
      <div className="w-full bg-white/90 rounded-2xl border border-slate-100 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[9px]">{formatFullDate(event.date)}</p>
            <p className="text-slate-700 text-[11px] truncate" style={{ fontWeight: 600 }}>{event.title}</p>
          </div>
        </div>
        <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-2">{event.description}</p>
        {event.metrics && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {event.metrics.slice(0, 2).map((m) => (
              <span key={m.label} className={`text-[9px] ${cfg.color} ${cfg.bg} px-1.5 py-0.5 rounded`}>
                {m.label} {m.value}{m.unit ?? ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimeGalleryProps {
  variant: "patient" | "family";
  patientName?: string;
}

export function TimeGallery({ variant, patientName = "王大明" }: TimeGalleryProps) {
  const theme = THEMES[variant];
  const scrollRef = useRef<HTMLDivElement>(null);
  const { photos } = useTimeGallery();
  const { events } = useTimeCorridor();

  const [activeCategory, setActiveCategory] = useState<GalleryCategory | "all">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const filtered =
    activeCategory === "all" ? photos : photos.filter((p) => p.category === activeCategory);
  const timeline = groupPhotosByMonth(filtered);
  const selectedIndex = selectedPhoto ? filtered.findIndex((p) => p.id === selectedPhoto.id) : -1;

  const progressData = events
    .filter((e) => e.quality != null)
    .map((e) => ({
      date: e.date.slice(5),
      quality: e.quality ?? 0,
    }));

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <div className={`h-full flex flex-col gap-3 bg-gradient-to-br ${theme.gradient}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7" style={{ color: theme.accent }} />
          <div>
            <p className="text-slate-800 text-xl" style={{ fontWeight: 800 }}>
              {patientName} 的時光迴廊
            </p>
            <p className={`text-sm flex items-center gap-1.5 ${theme.sync}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              與{variant === "patient" ? "家屬端" : "患者端"}即時同步 · {events.length} 個里程碑 · {photos.length} 張回憶
            </p>
          </div>
        </div>
        {progressData.length > 0 && (
          <div className="w-64 bg-white/80 rounded-xl border border-slate-100 p-2 hidden lg:block">
            <p className="text-slate-400 text-[10px] mb-1">品質成長曲線</p>
            <ResponsiveContainer width="100%" height={50}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id={`galleryGrad-${variant}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.accent} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="quality" stroke={theme.accent} fill={`url(#galleryGrad-${variant})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Milestone corridor - horizontal */}
      <div className="flex-shrink-0 bg-white/70 rounded-2xl border border-slate-100 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-slate-600 text-sm flex items-center gap-2" style={{ fontWeight: 600 }}>
            <Clock className="w-4 h-4 text-slate-400" />
            復健里程碑長廊
          </p>
          <div className="flex gap-1">
            <button onClick={() => scroll("left")} className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => scroll("right")} className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          <div className="relative flex items-stretch min-w-max px-2">
            <div className={`absolute top-[18px] left-4 right-4 h-0.5 ${theme.line} rounded-full`} />
            {events.map((event) => (
              <CorridorNode key={event.id} event={event} theme={theme} />
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-shrink-0 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-sm flex-shrink-0 transition-all ${
            activeCategory === "all" ? theme.filterActive : theme.filterIdle
          }`}
          style={{ fontWeight: 700 }}
        >
          全部回憶
        </button>
        {galleryCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm flex-shrink-0 transition-all ${
              activeCategory === cat.id ? theme.filterActive : theme.filterIdle
            }`}
            style={{ fontWeight: 700 }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Photo timeline */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2">
        {timeline.map((group) => (
          <div key={group.month}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${theme.dot}`} />
              <h3 className="text-base text-slate-700" style={{ fontWeight: 700 }}>{group.label}</h3>
              <div className={`flex-1 h-px ${theme.line}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {group.photos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <PhotoLightbox
            photo={selectedPhoto}
            theme={theme}
            onClose={() => setSelectedPhoto(null)}
            onPrev={() => setSelectedPhoto(filtered[selectedIndex - 1] ?? selectedPhoto)}
            onNext={() => setSelectedPhoto(filtered[selectedIndex + 1] ?? selectedPhoto)}
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < filtered.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
