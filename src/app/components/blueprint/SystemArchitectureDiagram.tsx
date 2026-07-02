import type { ComponentType } from "react";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Database,
  Layers,
  Stethoscope,
  Heart,
  Dumbbell,
  Cpu,
  Bell,
  MessageCircle,
  Map,
  FileText,
  Activity,
} from "lucide-react";
import { getAppDisplayName } from "../../brand";

interface ArchNode {
  id: string;
  label: string;
  sub?: string;
  color: string;
  icon?: ComponentType<{ className?: string }>;
}

interface ArchLayer {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  nodes: ArchNode[];
}

const ARCH_LAYERS: ArchLayer[] = [
  {
    id: "users",
    title: "使用者角色層",
    subtitle: "三端入口 · 角色分流",
    color: "#6366f1",
    nodes: [
      { id: "patient", label: "患者端", sub: "復健訓練", color: "#0d9488", icon: Dumbbell },
      { id: "family", label: "家屬端", sub: "進度監護", color: "#f43f5e", icon: Heart },
      { id: "doctor", label: "醫師端", sub: "處方管理", color: "#38bdf8", icon: Stethoscope },
    ],
  },
  {
    id: "ui",
    title: "應用介面層",
    subtitle: "React 頁面與元件",
    color: "#8b5cf6",
    nodes: [
      { id: "entry", label: "全局入口", sub: "EntryPage", color: "#6366f1" },
      { id: "phome", label: "患者首頁", sub: "闖關地圖 / 結果", color: "#0d9488" },
      { id: "prehab", label: "復健執行", sub: "鏡頭 + 骨架", color: "#14b8a6" },
      { id: "fdash", label: "家屬儀表板", sub: "圖表 / 迴廊", color: "#f43f5e" },
      { id: "dportal", label: "醫師後台", sub: "病患 / 處方", color: "#38bdf8" },
    ],
  },
  {
    id: "core",
    title: "核心功能層",
    subtitle: "業務邏輯與互動服務",
    color: "#10b981",
    nodes: [
      { id: "pose", label: "姿勢偵測", sub: "BlazePose / MoveNet", color: "#8b5cf6", icon: Cpu },
      { id: "rx", label: "處方系統", sub: "人偶 + 動作庫", color: "#38bdf8", icon: FileText },
      { id: "map", label: "闖關地圖", sub: "依序解鎖", color: "#0d9488", icon: Map },
      { id: "charts", label: "數據圖表", sub: "Recharts", color: "#f43f5e", icon: Activity },
      { id: "notify", label: "通知中心", sub: "NotificationBell", color: "#f59e0b", icon: Bell },
      { id: "chat", label: "客服系統", sub: "ChatWidget", color: "#ec4899", icon: MessageCircle },
    ],
  },
  {
    id: "data",
    title: "資料層",
    subtitle: "前端狀態與示範資料",
    color: "#f59e0b",
    nodes: [
      { id: "ex", label: "動作資料", sub: "patient / prescription Exercises", color: "#0d9488" },
      { id: "daily", label: "每日結果", sub: "dailyResults", color: "#14b8a6" },
      { id: "mile", label: "里程碑", sub: "milestones", color: "#f59e0b" },
      { id: "corr", label: "時光迴廊", sub: "timeCorridor", color: "#f43f5e" },
      { id: "gallery", label: "相簿", sub: "timeGallery", color: "#ec4899" },
      { id: "notif", label: "通知資料", sub: "notifications", color: "#6366f1" },
    ],
  },
  {
    id: "infra",
    title: "技術基礎層",
    subtitle: "執行環境與框架",
    color: "#3b82f6",
    nodes: [
      { id: "react", label: "React 18 + TS", sub: "Vite 6", color: "#3b82f6" },
      { id: "tf", label: "TensorFlow.js", sub: "WebGL Backend", color: "#8b5cf6" },
      { id: "router", label: "React Router 7", sub: "SPA 路由", color: "#6366f1" },
      { id: "tw", label: "Tailwind CSS 4", sub: "Motion 動畫", color: "#06b6d4" },
      { id: "tts", label: "Web Speech API", sub: "語音回饋", color: "#10b981" },
      { id: "cap", label: "Capacitor", sub: "iOS 原生封裝", color: "#f59e0b" },
    ],
  },
];

const DATA_FLOWS = [
  { from: "醫師開立處方", to: "患者闖關地圖", color: "#38bdf8" },
  { from: "患者完成訓練", to: "每日結果 / 迴廊", color: "#0d9488" },
  { from: "訓練數據同步", to: "家屬儀表板", color: "#f43f5e" },
  { from: "鏡頭影像", to: "姿勢偵測引擎", color: "#8b5cf6" },
  { from: "關節角度", to: "次數計算 / 語音", color: "#10b981" },
];

function ArchNodeBox({ node }: { node: ArchNode }) {
  const Icon = node.icon;
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border px-3 py-3 min-w-[118px] max-w-[152px] text-center bg-slate-900/60"
      style={{ borderColor: node.color + "66" }}
    >
      {Icon && <Icon className="w-5 h-5 mb-1.5" style={{ color: node.color }} />}
      <p className="text-slate-100 text-[14px] leading-tight" style={{ fontWeight: 700 }}>
        {node.label}
      </p>
      {node.sub && <p className="text-slate-500 text-[11px] mt-1 leading-tight">{node.sub}</p>}
    </div>
  );
}

function LayerArrow() {
  return (
    <div className="flex justify-center py-1.5">
      <ArrowDown className="w-5 h-5 text-slate-600" />
    </div>
  );
}

function ArchLayerRow({ layer }: { layer: ArchLayer }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: layer.color }} />
        <div>
          <p className="text-slate-200 text-[18px] leading-none" style={{ fontWeight: 700 }}>
            {layer.title}
          </p>
          <p className="text-slate-500 text-[12px] mt-1">{layer.subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {layer.nodes.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2">
            <ArchNodeBox node={node} />
            {i < layer.nodes.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MlPipeline() {
  const steps = [
    { label: "攝影機", sub: "getUserMedia", icon: Camera, color: "#38bdf8" },
    { label: "影像幀", sub: "HTMLVideoElement", color: "#6366f1" },
    { label: "姿勢模型", sub: "BlazePose 33 / MoveNet 17", icon: Cpu, color: "#8b5cf6" },
    { label: "關鍵點", sub: "骨架繪製", color: "#10b981" },
    { label: "角度分析", sub: "關節角度 / 次數", color: "#f59e0b" },
    { label: "語音回饋", sub: "Web Speech", color: "#ec4899" },
  ];

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
        <Cpu className="w-5 h-5 text-violet-400" />
        <p className="text-violet-200 text-[18px]" style={{ fontWeight: 700 }}>
          復健執行流程
        </p>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label}>
              <div
                className="flex items-center gap-3 rounded-xl border px-3 py-2.5 bg-slate-900/50"
                style={{ borderColor: step.color + "44" }}
              >
                {Icon ? (
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ color: step.color }} />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
                )}
                <div className="min-w-0">
                  <p className="text-slate-200 text-[14px] leading-none" style={{ fontWeight: 600 }}>
                    {step.label}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">{step.sub}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-violet-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SystemArchitectureDiagram() {
  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Title block */}
      <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/50 to-slate-900/50 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <Layers className="w-6 h-6 text-violet-400" />
          <div>
            <p className="text-white text-[18px]" style={{ fontWeight: 800 }}>
              {getAppDisplayName()} 系統架構圖
            </p>
            <p className="text-slate-400 text-[12px] mt-1">分層方塊圖 · 資料流向 · 復健執行管線</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {DATA_FLOWS.map((flow) => (
            <div
              key={flow.from}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700"
            >
              <span style={{ color: flow.color }}>{flow.from}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-400">{flow.to}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        {/* Main layered architecture */}
        <div className="col-span-8 min-h-0 overflow-y-auto pr-1 space-y-0">
          {ARCH_LAYERS.map((layer, i) => (
            <div key={layer.id}>
              <ArchLayerRow layer={layer} />
              {i < ARCH_LAYERS.length - 1 && <LayerArrow />}
            </div>
          ))}
        </div>

        {/* Right: ML pipeline + data sync */}
        <div className="col-span-4 min-h-0 flex flex-col gap-2">
          <div className="flex-1 min-h-0">
            <MlPipeline />
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-3">
              <Database className="w-5 h-5 text-amber-400" />
              <p className="text-slate-200 text-[15px]" style={{ fontWeight: 700 }}>
                跨端資料同步
              </p>
            </div>
            <div className="space-y-2 text-[12px]">
              {[
                { a: "醫師處方", b: "→ 患者訓練項目", c: "#38bdf8" },
                { a: "患者通關", b: "→ 時光迴廊 / 相簿", c: "#0d9488" },
                { a: "訓練紀錄", b: "→ 家屬圖表", c: "#f43f5e" },
                { a: "里程碑", b: "→ 三端成就展示", c: "#f59e0b" },
              ].map((row) => (
                <div key={row.a} className="flex items-center gap-2 rounded-lg bg-slate-900/40 px-3 py-2">
                  <span style={{ color: row.c, fontWeight: 600 }}>{row.a}</span>
                  <span className="text-slate-500">{row.b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
