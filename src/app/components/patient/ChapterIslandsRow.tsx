import type { ChapterDef } from "../../data/chapters";
import { ChapterBackgroundView } from "./ChapterBackgroundView";
import { ZhangChapterIslands } from "./ZhangChapterIslands";

interface ChapterIslandsRowProps {
  chapter: ChapterDef;
  onSelectIsland?: (islandId: string) => void;
}

export function ChapterIslandsRow({ chapter }: ChapterIslandsRowProps) {
  if (chapter.styledMap === "east-archipelago") {
    return <ZhangChapterIslands chapter={chapter} />;
  }

  return (
    <div className="absolute inset-0">
      <ChapterBackgroundView chapter={chapter} />
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
          <p className="text-white text-xs" style={{ fontWeight: 800 }}>
            {chapter.subtitle}
          </p>
          <p className="text-white/60 text-[10px] mt-0.5">第 {chapter.index} 章 · {chapter.name}</p>
        </div>
      </div>
    </div>
  );
}
