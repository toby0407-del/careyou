import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

export function Block({
  label,
  sub,
  color = "#8b5cf6",
  children,
  className = "",
  onClick,
}: {
  label: string;
  sub?: string;
  color?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`blueprint-block rounded-lg border px-3 py-2 text-center min-w-0 shadow-sm shadow-violet-100/40 ${onClick ? "cursor-pointer transition-colors" : ""} ${className}`}
      style={{ borderColor: color + "55" }}
    >
      <p className="text-violet-950 text-[11px] leading-tight truncate" style={{ fontWeight: 700 }}>
        {label}
      </p>
      {sub && (
        <p className="text-violet-600/70 text-[9px] mt-0.5 leading-snug line-clamp-3">{sub}</p>
      )}
      {children}
    </Tag>
  );
}

export function BlockLayer({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle?: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div className="blueprint-layer rounded-xl border p-2.5 shadow-sm shadow-violet-100/30">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <p className="text-violet-950 text-[11px] leading-none" style={{ fontWeight: 700 }}>
            {title}
          </p>
          {subtitle && <p className="text-violet-600/70 text-[9px] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function BlockRow({
  blocks,
  arrow = true,
}: {
  blocks: { key: string; node: ReactNode }[];
  arrow?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {blocks.map((b, i) => (
        <div key={b.key} className="flex items-center gap-1.5">
          {b.node}
          {arrow && i < blocks.length - 1 && (
            <ArrowRight className="w-3 h-3 text-violet-300 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export function BlockStack({
  blocks,
}: {
  blocks: { key: string; node: ReactNode }[];
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {blocks.map((b, i) => (
        <div key={b.key} className="flex flex-col items-center w-full">
          {b.node}
          {i < blocks.length - 1 && <ArrowDown className="w-3 h-3 text-violet-300 my-0.5" />}
        </div>
      ))}
    </div>
  );
}

export function BlockGrid({
  cols = 3,
  children,
}: {
  cols?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}
