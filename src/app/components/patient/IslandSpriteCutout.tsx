interface IslandSpriteCutoutProps {
  /** 橫向排列的多島精靈圖（去背 PNG） */
  src: string;
  index: number;
  total: number;
  className?: string;
}

/** 從橫向精靈圖裁切單座浮島，等比縮放不爆版 */
export function IslandSpriteCutout({ src, index, total, className = "" }: IslandSpriteCutoutProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute top-0 h-full max-w-none select-none"
        style={{
          width: `${total * 100}%`,
          left: `-${index * 100}%`,
          objectFit: "contain",
          objectPosition: "top center",
        }}
      />
    </div>
  );
}
