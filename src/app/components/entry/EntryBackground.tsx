/** Light blended background — teal · rose · sky · violet with rehab & care illustrations */

const FEATURE_TAGS = [
  { text: "即時姿態偵測", left: "5%", top: "12%", color: "teal", rotate: -4 },
  { text: "語音引導復健", left: "80%", top: "10%", color: "teal", rotate: 3 },
  { text: "家人遠端關懷", left: "3%", top: "55%", color: "rose", rotate: 2 },
  { text: "進度即時同步", left: "84%", top: "50%", color: "rose", rotate: -4 },
  { text: "醫師遠距處方", left: "8%", top: "82%", color: "sky", rotate: -2 },
  { text: "居家安全陪伴", left: "76%", top: "80%", color: "violet", rotate: 4 },
];

const TAG_STYLES: Record<string, string> = {
  teal: "border-teal-200/60 bg-teal-50/70 text-teal-600",
  rose: "border-rose-200/60 bg-rose-50/70 text-rose-500",
  sky: "border-sky-200/60 bg-sky-50/70 text-sky-600",
  violet: "border-violet-200/60 bg-violet-50/70 text-violet-600",
};

const TAG_DOTS: Record<string, string> = {
  teal: "bg-teal-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
};

/** MoveNet-style skeleton — knee flexion pose */
function RehabPose({ className, color }: { className?: string; color: string }) {
  const nodes = [
    [120, 30], [120, 70], [85, 95], [155, 95],
    [70, 140], [170, 140], [60, 200], [180, 200],
    [100, 200], [140, 200], [90, 270], [150, 270],
    [85, 340], [155, 340],
  ];
  const bones: [number, number][] = [
    [0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7],
    [2, 8], [3, 9], [8, 9], [8, 10], [9, 11], [10, 12], [11, 13],
  ];
  return (
    <svg className={className} viewBox="0 0 240 380" fill="none" aria-hidden>
      {bones.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.35"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 10 : 4.5} fill={color} opacity={i === 0 ? 0.25 : 0.4} />
      ))}
      {/* knee angle arc */}
      <path d="M 100 200 A 28 28 0 0 1 130 185" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="4 3" />
    </svg>
  );
}

/** Family care — two figures + heart */
function CareIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden>
      {/* younger figure */}
      <circle cx="55" cy="38" r="14" stroke="#fda4af" strokeWidth="2" opacity="0.5" />
      <path d="M55 52 L55 95 M55 70 L35 88 M55 70 L75 88 M55 95 L42 130 M55 95 L68 130" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      {/* elderly figure with cane */}
      <circle cx="130" cy="42" r="16" stroke="#fb7185" strokeWidth="2" opacity="0.5" />
      <path d="M130 58 L130 100 M130 72 L110 90 M130 72 L148 85 M130 100 L118 138 M130 100 L142 138" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <line x1="152" y1="80" x2="152" y2="138" stroke="#fb7185" strokeWidth="2" opacity="0.4" />
      {/* connecting hands */}
      <path d="M75 88 Q95 78 110 90" stroke="#fda4af" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
      {/* heart */}
      <path
        d="M95 22 C88 14 74 14 74 26 C74 38 95 48 95 48 C95 48 116 38 116 26 C116 14 102 14 95 22Z"
        fill="#fda4af"
        opacity="0.3"
      />
    </svg>
  );
}

/** Doctor consultation motif */
function DoctorIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 180 140" fill="none" aria-hidden>
      <rect x="30" y="50" width="120" height="70" rx="8" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.4" />
      <path d="M30 68 H150" stroke="#7dd3fc" strokeWidth="1" opacity="0.3" />
      <circle cx="55" cy="59" r="4" fill="#38bdf8" opacity="0.35" />
      <path d="M50 90 L70 75 L90 88 L110 70 L130 85" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="140" cy="40" r="18" stroke="#38bdf8" strokeWidth="2" opacity="0.35" />
      <path d="M140 30 V50 M130 40 H150" stroke="#38bdf8" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
    </svg>
  );
}

/** Bridge connection between roles */
function BridgeArcs() {
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15" />
          <stop offset="33%" stopColor="#f43f5e" stopOpacity="0.12" />
          <stop offset="66%" stopColor="#38bdf8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d="M 0 420 Q 400 300 800 420 T 1600 420" fill="none" stroke="url(#bridgeGrad)" strokeWidth="2" strokeDasharray="10 16" />
      <path d="M 0 480 Q 500 360 1000 480 T 2000 480" fill="none" stroke="url(#bridgeGrad)" strokeWidth="1.5" strokeDasharray="6 20" opacity="0.6" />
    </svg>
  );
}

export function EntryBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Light base — four-role color blend */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 45% at 15% 20%, rgba(204, 251, 241, 0.55) 0%, transparent 55%),
            radial-gradient(ellipse 45% 40% at 85% 18%, rgba(255, 228, 230, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse 40% 38% at 12% 82%, rgba(224, 242, 254, 0.45) 0%, transparent 48%),
            radial-gradient(ellipse 42% 40% at 88% 78%, rgba(237, 233, 254, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255, 255, 255, 0.9) 0%, transparent 70%),
            linear-gradient(135deg, #f0fdfa 0%, #fff1f2 28%, #f0f9ff 55%, #f5f3ff 78%, #fafaf9 100%)
          `,
        }}
      />

      {/* Soft color orbs */}
      <div className="absolute top-[8%] left-[12%] w-72 h-72 rounded-full bg-teal-200/25 blur-3xl" />
      <div className="absolute top-[5%] right-[10%] w-80 h-80 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="absolute bottom-[6%] left-[8%] w-64 h-64 rounded-full bg-sky-200/25 blur-3xl" />
      <div className="absolute bottom-[8%] right-[12%] w-72 h-72 rounded-full bg-violet-200/28 blur-3xl" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <BridgeArcs />

      {/* Rehab poses — teal zone */}
      <RehabPose className="absolute left-[2%] top-[18%] w-36 h-auto hidden md:block" color="#14b8a6" />
      <RehabPose className="absolute right-[3%] top-[22%] w-32 h-auto hidden lg:block scale-x-[-1]" color="#2dd4bf" />

      {/* Knee exercise diagram */}
      <svg className="absolute left-[18%] bottom-[18%] w-28 h-28 hidden lg:block" viewBox="0 0 100 100" fill="none" aria-hidden>
        <path d="M30 80 L30 50 L55 35 L70 50 L70 80" stroke="#14b8a6" strokeWidth="2" fill="none" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M45 50 A 18 18 0 0 0 58 62" stroke="#14b8a6" strokeWidth="1.5" fill="none" opacity="0.35" strokeDasharray="3 2" />
        <text x="62" y="58" fill="#0d9488" fontSize="9" opacity="0.5">90°</text>
      </svg>

      {/* Family care — rose zone */}
      <CareIllustration className="absolute right-[6%] top-[28%] w-44 h-auto hidden md:block" />
      <CareIllustration className="absolute left-[6%] bottom-[22%] w-36 h-auto hidden lg:block opacity-70" />

      {/* Doctor chart — sky zone */}
      <DoctorIllustration className="absolute right-[14%] bottom-[14%] w-40 h-auto hidden md:block" />

      {/* Home with warmth */}
      <svg className="absolute left-[10%] top-[38%] w-24 h-24 hidden xl:block" viewBox="0 0 100 100" fill="none" aria-hidden>
        <path d="M50 18 L82 48 V82 H18 V48 Z" stroke="#fda4af" strokeWidth="1.5" opacity="0.35" fill="#fff1f2" fillOpacity="0.3" />
        <rect x="38" y="58" width="24" height="24" stroke="#fda4af" strokeWidth="1" opacity="0.3" rx="2" />
        <path d="M42 30 Q50 22 58 30" stroke="#fda4af" strokeWidth="1" opacity="0.25" fill="none" />
      </svg>

      {/* Violet tech nodes — blueprint hint */}
      <svg className="absolute right-[20%] top-[14%] w-20 h-20 hidden lg:block" viewBox="0 0 80 80" fill="none" aria-hidden>
        <rect x="10" y="10" width="25" height="25" rx="4" stroke="#a78bfa" strokeWidth="1.5" opacity="0.35" />
        <rect x="45" y="10" width="25" height="25" rx="4" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
        <rect x="10" y="45" width="25" height="25" rx="4" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3" />
        <rect x="45" y="45" width="25" height="25" rx="4" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.4" fill="#ede9fe" fillOpacity="0.4" />
        <line x1="35" y1="22" x2="45" y2="22" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
        <line x1="22" y1="35" x2="22" y2="45" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
        <line x1="57" y1="35" x2="57" y2="45" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
      </svg>

      {/* Heartbeat — multi-color */}
      <svg className="absolute bottom-[24%] left-0 right-0 h-12" viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path
          d="M0 24 H180 L200 8 L220 40 L240 24 H420 L440 14 L460 34 L480 24 H660 L680 4 L700 44 L720 24 H900 L920 16 L940 32 L960 24 H1200"
          fill="none"
          stroke="url(#ecgGrad)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Feature tags */}
      {FEATURE_TAGS.map((tag) => (
        <div
          key={tag.text}
          className={`absolute hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-sm ${TAG_STYLES[tag.color]}`}
          style={{ left: tag.left, top: tag.top, transform: `rotate(${tag.rotate}deg)` }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${TAG_DOTS[tag.color]}`} />
          <span className="text-xs tracking-wide" style={{ fontWeight: 500 }}>{tag.text}</span>
        </div>
      ))}

      {/* Center watermark */}
      <div className="absolute top-[7%] left-1/2 -translate-x-1/2 hidden xl:block">
        <p className="text-slate-400/50 text-xs tracking-[0.3em] uppercase text-center whitespace-nowrap">
          科技守護 · 溫暖陪伴 · 安心復健
        </p>
      </div>

      {/* Soft vignette — light only */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(248,250,252,0.4) 100%)",
        }}
      />
    </div>
  );
}
