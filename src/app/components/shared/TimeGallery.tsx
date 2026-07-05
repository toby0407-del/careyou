/**
 * 時光迴廊 — 每日照片解鎖牆為主軸
 * 當天有幾關就有幾張隨機照片，完成一關解鎖一張（模糊 → 清晰）
 */
import { useRef, useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Upload,
  Trash2,
  Camera,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  galleryCategories,
  isUploadedPhoto,
  removeGalleryPhoto,
  type GalleryCategory,
  type GalleryPhoto,
} from "../../data/timeGallery";
import { useTimeGallery } from "../../hooks/useTimeGallery";
import { useDailyReveal } from "../../hooks/useDailyReveal";
import { fileToCompressedDataUrl } from "../../lib/imageUpload";
import { todayStr } from "../../data/progressStore";

const THEMES = {
  /** 患者端 — 青綠色系，與復健地圖 / 底部導覽一致 */
  patient: {
    accent: "#0d9488",
    filterActive: "bg-teal-600 text-white shadow-md shadow-teal-200",
    filterIdle: "bg-white text-slate-600 border border-teal-100 hover:border-teal-200",
    dot: "bg-teal-400",
    line: "bg-teal-200",
    badge: "bg-teal-50 text-teal-700",
    sync: "text-teal-600",
    gradient: "from-emerald-50 via-green-50 to-teal-50/60",
    panelBorder: "border-emerald-100",
    uploadBtn: "bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-200",
    hero: "bg-white/90 border border-emerald-100/80 shadow-sm",
    heroSub: "text-slate-500",
    heroTitle: "text-slate-800",
    heroStat: "text-teal-700",
    heroProgressTrack: "bg-emerald-100",
    heroProgressFill: "bg-teal-500",
    uploadIcon: "text-teal-600",
    lockRing: "ring-teal-200/70 border-teal-300",
    lockNext: "bg-teal-500",
    cardShadow: "shadow-teal-200/40",
    uploadDashed: "border-teal-200 hover:border-teal-300 hover:bg-teal-50/50",
    uploadIconBg: "bg-teal-100",
    uploadIconColor: "text-teal-500",
    focusRing: "focus:ring-teal-300",
    linkAccent: "text-teal-600",
    uploadedBadge: "bg-teal-500/90",
    deleteBorder: "border-teal-200 text-teal-600 hover:bg-teal-50",
  },
  /** 家屬端 — 柔和玫瑰粉，與監護總覽 header / 打氣對話框一致 */
  family: {
    accent: "#fb7185",
    filterActive: "bg-rose-400 text-white shadow-md shadow-rose-200",
    filterIdle: "bg-white text-slate-600 border border-rose-100 hover:border-rose-200",
    dot: "bg-rose-300",
    line: "bg-rose-200",
    badge: "bg-rose-50 text-rose-500",
    sync: "text-rose-400",
    gradient: "from-rose-50/40 via-stone-50 to-sky-50/20",
    uploadBtn: "bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 shadow-md shadow-rose-200",
    hero: "bg-gradient-to-r from-rose-400 to-pink-400",
    heroSub: "text-white/85",
    heroTitle: "text-white",
    heroStat: "text-white",
    heroProgressTrack: "bg-white/25",
    heroProgressFill: "bg-white",
    uploadIcon: "text-rose-400",
    lockRing: "ring-rose-200/70 border-rose-300",
    lockNext: "bg-rose-400",
    panelBorder: "border-rose-100",
    cardShadow: "shadow-rose-200/40",
    uploadDashed: "border-rose-200 hover:border-rose-300 hover:bg-rose-50/50",
    uploadIconBg: "bg-rose-100",
    uploadIconColor: "text-rose-400",
    focusRing: "focus:ring-rose-300",
    linkAccent: "text-rose-500",
    uploadedBadge: "bg-rose-400/90",
    deleteBorder: "border-rose-200 text-rose-500 hover:bg-rose-50",
  },
};

/** 解鎖卡片 — 3×2 網格，高度填滿容器、整頁不需捲動 */
const REVEAL_LOCK_TOP = 44;

function RevealGridCard({
  photo,
  levelNo,
  levelName,
  unlocked,
  isNext,
  theme,
  onClick,
}: {
  photo: GalleryPhoto;
  levelNo: number;
  levelName: string;
  unlocked: boolean;
  isNext: boolean;
  theme: (typeof THEMES)["patient"];
  onClick: () => void;
}) {
  const hasImage = Boolean(photo.imageUrl);

  return (
    <motion.button
      layout={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: levelNo * 0.04 }}
      whileHover={unlocked ? { y: -4 } : {}}
      onClick={() => unlocked && hasImage && onClick()}
      className={`relative w-full h-full min-h-0 rounded-2xl overflow-hidden text-left border-2 ${
        unlocked
          ? `border-white shadow-lg ${theme.cardShadow} cursor-pointer`
          : isNext
            ? `shadow-md ring-2 ${theme.lockRing}`
            : "border-slate-200/80"
      }`}
      aria-label={
        unlocked
          ? `已解鎖照片，點擊查看內容`
          : `完成第 ${levelNo} 關「${levelName}」解鎖這張照片`
      }
    >
      {hasImage ? (
        <img
          src={photo.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out"
          style={{
            filter: unlocked ? "blur(0px) brightness(1)" : "blur(20px) saturate(0.35) brightness(0.9)",
            transform: unlocked ? "scale(1)" : "scale(1.12)",
          }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400"
          style={{ filter: unlocked ? "none" : "blur(6px)" }}
        />
      )}

      {unlocked ? (
        <>
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] px-2 py-1 rounded-full shadow" style={{ fontWeight: 800 }}>
            <Sparkles className="w-3 h-3" />
            第 {levelNo} 關
          </div>
          <div className="absolute bottom-2 right-2 bg-black/45 text-white text-[10px] px-2 py-1 rounded-full" style={{ fontWeight: 700 }}>
            點擊查看
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-slate-900/30" />
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{ top: REVEAL_LOCK_TOP }}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${
                isNext ? `${theme.lockNext} text-white` : "bg-white/95 text-slate-500"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[52px] px-2 flex flex-col items-center justify-center text-center bg-gradient-to-t from-black/55 to-transparent">
            <p className="text-white text-[11px] drop-shadow leading-none" style={{ fontWeight: 800 }}>
              第 {levelNo} 關
            </p>
            <p className="text-white/85 text-[10px] drop-shadow line-clamp-1 mt-1 w-full">
              {levelName}
            </p>
            {isNext && (
              <span
                className="mt-1 text-[9px] text-white px-2 py-0.5 rounded-full"
                style={{ fontWeight: 700, background: theme.accent }}
              >
                下一張
              </span>
            )}
          </div>
        </>
      )}
    </motion.button>
  );
}

/* ---------- 上傳對話框 ---------- */

function UploadDialog({
  theme,
  onClose,
  onUploaded,
}: {
  theme: (typeof THEMES)["patient"];
  onClose: () => void;
  onUploaded: (photo: Omit<GalleryPhoto, "id" | "syncedAt">) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("family");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 6);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const urls = await Promise.all(files.map((f) => fileToCompressedDataUrl(f)));
      setPreviews((prev) => [...prev, ...urls].slice(0, 6));
    } catch {
      toast.error("讀取照片失敗，請換一張試試");
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (previews.length === 0) return;
    const cat = galleryCategories.find((c) => c.id === category)!;
    previews.forEach((url) => {
      onUploaded({
        category,
        date: todayStr(),
        title: title.trim() || `${cat.label}回憶`,
        caption: title.trim()
          ? `${title.trim()}（自行上傳）`
          : "上傳的珍貴回憶，完成關卡後會出現在解鎖牆上。",
        imageUrl: url,
        tags: ["上傳", cat.label],
      });
    });
    toast.success(`已加入 ${previews.length} 張照片`, {
      description: "新照片會混入每日解鎖牆，完成關卡就能看清！",
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 text-white flex items-center justify-between ${theme.hero}`}>
          <div>
            <h2 className="text-lg" style={{ fontWeight: 800 }}>上傳照片到時光迴廊</h2>
            <p className="text-white/85 text-xs mt-0.5">照片會隨機出現在今日解鎖牆，完成關卡才能看清</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center" aria-label="關閉上傳視窗">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

          {previews.length === 0 ? (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className={`w-full h-44 rounded-2xl border-2 border-dashed ${theme.uploadDashed} flex flex-col items-center justify-center gap-3 text-slate-400 transition-colors`}
            >
              <div className={`w-16 h-16 rounded-2xl ${theme.uploadIconBg} flex items-center justify-center`}>
                <Camera className={`w-8 h-8 ${theme.uploadIconColor}`} />
              </div>
              <span className="text-sm text-slate-600" style={{ fontWeight: 600 }}>
                {busy ? "處理照片中..." : "點擊選擇照片（可多選，最多 6 張）"}
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group">
                  <img src={url} alt={`預覽 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPreviews((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="移除這張照片"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {previews.length < 6 && (
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-300"
                  aria-label="再新增照片"
                >
                  <ImagePlus className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          <div>
            <p className="text-slate-500 text-xs mb-2" style={{ fontWeight: 600 }}>分類</p>
            <div className="flex flex-wrap gap-2">
              {galleryCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition-all ${
                    category === cat.id ? theme.filterActive : theme.filterIdle
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-xs mb-2" style={{ fontWeight: 600 }}>照片標題（選填）</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：全家去公園散步"
              className={`w-full h-11 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 ${theme.focusRing}`}
            />
          </div>

          <button
            onClick={submit}
            disabled={previews.length === 0 || busy}
            className={`w-full h-12 rounded-xl text-white text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${theme.uploadBtn}`}
            style={{ fontWeight: 800 }}
          >
            加入時光迴廊（{previews.length} 張）
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PhotoLightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  onDelete,
  hasPrev,
  hasNext,
  theme,
}: {
  photo: GalleryPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: () => void;
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
          {onDelete && isUploadedPhoto(photo) && (
            <button
              onClick={onDelete}
              className={`mt-4 flex items-center justify-center gap-2 h-10 rounded-xl border ${theme.deleteBorder} text-sm transition-colors`}
              style={{ fontWeight: 700 }}
            >
              <Trash2 className="w-4 h-4" />
              刪除這張上傳照片
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface TimeGalleryProps {
  variant: "patient" | "family";
  patientName?: string;
}

export function TimeGallery({ variant, patientName = "王大明" }: TimeGalleryProps) {
  const theme = THEMES[variant];
  const { appendPhoto, refresh } = useTimeGallery();
  const { slots, unlockedCount, total, hasPhotos } = useDailyReveal();

  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const wallPhotos = slots.map((s) => s.photo).filter((p) => p.imageUrl);
  const selectedIndex = selectedPhoto
    ? wallPhotos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;
  const nextUnlockIdx = unlockedCount;

  return (
    <div className={`h-full min-h-0 flex flex-col gap-2 overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
      {/* 精簡標題列 */}
      <div className={`flex-shrink-0 rounded-2xl ${theme.hero} px-4 py-2.5`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`${theme.heroTitle} text-lg truncate`} style={{ fontWeight: 800 }}>
              今日 {total} 張回憶
            </h1>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm flex-shrink-0 ${
              variant === "patient"
                ? "bg-teal-600 text-white shadow-sm shadow-teal-200/50 hover:bg-teal-700"
                : "bg-white/95 text-slate-800"
            }`}
            style={{ fontWeight: 800 }}
          >
            <Upload className={`w-4 h-4 ${variant === "patient" ? "text-white" : theme.uploadIcon}`} />
            上傳
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className={`flex-1 h-2 ${theme.heroProgressTrack} rounded-full overflow-hidden`}>
            <motion.div
              className={`h-full ${theme.heroProgressFill} rounded-full`}
              animate={{ width: `${total > 0 ? (unlockedCount / total) * 100 : 0}%` }}
            />
          </div>
          <span className={`text-xs tabular-nums ${theme.heroStat}`} style={{ fontWeight: 800 }}>
            {unlockedCount}/{total} 已解鎖
          </span>
        </div>
      </div>

      {/* 今日 6 張 — 3×2 網格，一屏看全、不需捲動 */}
      <div className={`flex-1 min-h-0 rounded-2xl bg-white/80 border ${theme.panelBorder} p-2.5 shadow-sm shadow-emerald-100/20 flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
          <p className="text-slate-800 text-sm flex items-center gap-1.5" style={{ fontWeight: 800 }}>
            <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
            {patientName} 的時光迴廊
          </p>
          {!hasPhotos && (
            <button
              onClick={() => setUploadOpen(true)}
              className={`text-xs ${theme.linkAccent}`}
              style={{ fontWeight: 700 }}
            >
              上傳照片
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1 min-h-0 overflow-hidden">
          {slots.map((slot) => (
            <RevealGridCard
              key={slot.levelId}
              photo={slot.photo}
              levelNo={slot.levelNo}
              levelName={slot.levelName}
              unlocked={slot.unlocked}
              isNext={slot.levelNo - 1 === nextUnlockIdx}
              theme={theme}
              onClick={() => setSelectedPhoto(slot.photo)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {uploadOpen && (
          <UploadDialog theme={theme} onClose={() => setUploadOpen(false)} onUploaded={(p) => appendPhoto(p)} />
        )}
        {selectedPhoto && selectedPhoto.imageUrl && (
          <PhotoLightbox
            photo={selectedPhoto}
            theme={theme}
            onClose={() => setSelectedPhoto(null)}
            onPrev={() => setSelectedPhoto(wallPhotos[selectedIndex - 1] ?? selectedPhoto)}
            onNext={() => setSelectedPhoto(wallPhotos[selectedIndex + 1] ?? selectedPhoto)}
            onDelete={
              isUploadedPhoto(selectedPhoto)
                ? () => {
                    removeGalleryPhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                    refresh();
                    toast.success("已刪除照片");
                  }
                : undefined
            }
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex >= 0 && selectedIndex < wallPhotos.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
