import { motion } from "motion/react";
import type { ChapterDef } from "../../data/chapters";

const CLOUD_LAYERS = [
  { w: "72%", h: "22%", left: "-8%", top: "58%", blur: "blur-3xl", opacity: 0.55, drift: 0 },
  { w: "58%", h: "18%", left: "28%", top: "62%", blur: "blur-2xl", opacity: 0.45, drift: 1 },
  { w: "64%", h: "20%", left: "52%", top: "56%", blur: "blur-3xl", opacity: 0.5, drift: 2 },
  { w: "48%", h: "16%", left: "8%", top: "38%", blur: "blur-2xl", opacity: 0.28, drift: 3 },
  { w: "42%", h: "14%", left: "62%", top: "32%", blur: "blur-2xl", opacity: 0.22, drift: 4 },
  { w: "36%", h: "12%", left: "38%", top: "24%", blur: "blur-xl", opacity: 0.18, drift: 5 },
] as const;

/** 張氏群島 — 雲海天空，營造浮島高空的感覺 */
export function ArchipelagoSkyBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 高空漸層：深紫 → 霞光 → 雲海 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #1e0a3c 0%, #4c1d95 18%, #7c3aed 42%, #a78bfa 68%, #ddd6fe 88%, #f5f3ff 100%)",
        }}
      />
      {/* 頂部天光 */}
      <div
        className="absolute inset-x-0 top-0 h-[28%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 70%)",
        }}
      />
      {/* 遠景薄雲 */}
      <div className="absolute inset-0 pointer-events-none">
        {CLOUD_LAYERS.map((c, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-white ${c.blur}`}
            style={{
              width: c.w,
              height: c.h,
              left: c.left,
              top: c.top,
              opacity: c.opacity,
            }}
            animate={{ x: [0, i % 2 === 0 ? 12 : -10, 0] }}
            transition={{ duration: 14 + c.drift * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      {/* 底部雲海 — 浮島下方的厚雲層 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[48%] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.35) 35%, rgba(237,233,254,0.75) 65%, rgba(221,214,254,0.92) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[32%] pointer-events-none">
        {[6, 22, 40, 58, 74, 90].map((left, i) => (
          <motion.div
            key={left}
            className="absolute rounded-full bg-white blur-2xl"
            style={{
              width: "38%",
              height: "55%",
              left: `${left - 19}%`,
              bottom: `${-8 + (i % 3) * 4}%`,
              opacity: 0.55 + (i % 2) * 0.1,
            }}
            animate={{ y: [0, -4, 0], x: [0, i % 2 === 0 ? 6 : -5, 0] }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      {/* 遠方霧氣 */}
      <div className="absolute bottom-[18%] inset-x-0 h-[20%] bg-gradient-to-t from-white/40 via-violet-100/20 to-transparent pointer-events-none" />
    </div>
  );
}

interface ZhangChapterIslandsProps {
  chapter: ChapterDef;
}

function panoramaSrcSet(panorama: string) {
  const [base, query = ""] = panorama.split("?");
  const q = query ? `?${query}` : "";
  const retina = base.replace(/\.png$/, "@2x.png") + q;
  return { src: panorama, srcSet: `${panorama} 1x, ${retina} 2x` };
}

/** 第一章 — 四座浮島連成一幅，疊在雲海天空上 */
export function ZhangChapterIslands({ chapter }: ZhangChapterIslandsProps) {
  const panorama = chapter.islandPanorama;
  const imgSources = panorama ? panoramaSrcSet(panorama) : null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArchipelagoSkyBackdrop />

      {imgSources && (
        <div className="absolute inset-0 flex items-end justify-center px-1 pb-1 pt-10">
          <motion.img
            src={imgSources.src}
            srcSet={imgSources.srcSet}
            sizes="98vw"
            alt={chapter.name}
            draggable={false}
            decoding="async"
            className="w-[98%] max-w-none h-auto max-h-[90%] object-contain object-bottom select-none bg-transparent"
            style={{
              filter: "drop-shadow(0 14px 28px rgba(30,10,60,0.4)) drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
              imageRendering: "auto",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.4 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        </div>
      )}
    </div>
  );
}
