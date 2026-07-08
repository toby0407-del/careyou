import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { chapters, isChapterUnlocked } from "../../data/chapters";
import { ChapterIslandsRow } from "./ChapterIslandsRow";

interface AdventureMapProps {
  onShowSouvenirs?: () => void;
}

export function AdventureMap({ onShowSouvenirs: _onShowSouvenirs }: AdventureMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const page = container.children[0] as HTMLElement | undefined;
    page?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "start" });
  }, []);

  const scrollToPage = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(chapters.length - 1, index));
    const page = container.children[clamped] as HTMLElement | undefined;
    page?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setPageIndex(clamped);
  };

  const currentChapter = chapters[pageIndex];

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden pb-1">
      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <div>
          <p className="text-slate-800 text-lg" style={{ fontWeight: 800 }}>
            復健冒險地圖
          </p>
          <p className="text-slate-500 text-sm">6 個篇章 · 底圖預覽中</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-shrink-0 px-1">
        <button
          type="button"
          disabled={pageIndex <= 0}
          onClick={() => scrollToPage(pageIndex - 1)}
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div className="text-center flex-1 px-3">
          <p className="text-sm text-slate-800" style={{ fontWeight: 800 }}>
            第 {currentChapter?.index} 章 · {currentChapter?.name}
          </p>
          <div className="flex justify-center gap-1.5 mt-1">
            {chapters.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => isChapterUnlocked(ch.id) && scrollToPage(i)}
                disabled={!isChapterUnlocked(ch.id)}
                className={`h-1.5 rounded-full transition-all ${
                  i === pageIndex ? "w-5 bg-teal-300" : "w-1.5 bg-slate-200"
                } ${!isChapterUnlocked(ch.id) ? "opacity-30" : ""}`}
                aria-label={`第 ${ch.index} 章`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={pageIndex >= chapters.length - 1 || !isChapterUnlocked(chapters[pageIndex + 1]?.id)}
          onClick={() => scrollToPage(pageIndex + 1)}
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-2xl"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          if (idx !== pageIndex) setPageIndex(idx);
        }}
      >
        {chapters.map((chapter) => {
          const unlocked = isChapterUnlocked(chapter.id);

          return (
            <div
              key={chapter.id}
              className="flex-shrink-0 w-full h-full snap-start relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner"
            >
              {!unlocked && (
                <div className="absolute inset-0 z-20 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
                  <p className="text-white text-sm bg-black/40 px-4 py-2 rounded-xl">
                    通關上一章後解鎖
                  </p>
                </div>
              )}

              <ChapterIslandsRow chapter={chapter} />
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400 flex-shrink-0">
        第 1 章已放置浮島素材 · 左右滑動預覽其他章底圖
      </p>
    </div>
  );
}
