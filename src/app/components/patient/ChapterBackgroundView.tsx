import type { ChapterDef } from "../../data/chapters";
import { SkyChapterBackdrop } from "./SkyChapterBackdrop";

interface ChapterBackgroundViewProps {
  chapter: ChapterDef;
}

/** 篇章地圖 — 僅底層背景，待後續放置浮島／關卡 */
export function ChapterBackgroundView({ chapter }: ChapterBackgroundViewProps) {
  if (chapter.styledMap === "east-archipelago") {
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {[12, 38, 62, 85].map((left) => (
            <div
              key={left}
              className="absolute rounded-full blur-3xl bg-white/25"
              style={{ width: "48%", height: "30%", left: `${left - 24}%`, top: "35%" }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[35%] bg-gradient-to-t from-violet-900/30 to-transparent pointer-events-none" />
      </div>
    );
  }

  return <SkyChapterBackdrop chapter={chapter} />;
}
