import { getAppDisplayName } from "../../brand";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Layers,
  Cpu,
  Smartphone,
  Globe,
  Database,
  Zap,
  Eye,
  Volume2,
  Users,
  Code,
  Activity,
  Monitor,
  ArrowRight,
  Box,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { SystemArchitectureDiagram } from "./SystemArchitectureDiagram";

const TECH_STACK = [
  { layer: "Frontend", color: "#3b82f6", items: ["React 18", "TypeScript", "Tailwind CSS 4", "Motion (Framer)"] },
  { layer: "ML / Vision", color: "#8b5cf6", items: ["TensorFlow.js", "MoveNet (Thunder)", "17 Keypoints", "30fps Real-time"] },
  { layer: "TTS / Voice", color: "#10b981", items: ["Web Speech API", "Yating TTS", "OpenAI TTS", "Traditional Chinese"] },
  { layer: "Native Bridge", color: "#f59e0b", items: ["Capacitor 5", "iOS WKWebView", "Camera Plugin", "Safe Area"] },
  { layer: "Charts / Data", color: "#ef4444", items: ["Recharts", "React Router 7", "Sonner Toast", "date-fns"] },
];

const USER_FLOWS = [
  {
    role: "患者",
    color: "#0d9488",
    bgColor: "#f0fdfa",
    borderColor: "#99f6e4",
    steps: [
      "進入系統 → 選擇「患者」",
      "查看今日訓練計畫",
      "選擇訓練項目",
      "授權攝影機存取",
      "即時姿勢偵測 + 語音回饋",
      "完成訓練 → 儲存記錄",
    ],
  },
  {
    role: "家屬",
    color: "#f43f5e",
    bgColor: "#fff1f2",
    borderColor: "#fecdd3",
    steps: [
      "進入系統 → 選擇「家屬」",
      "查看親人當日完成率",
      "瀏覽 30 天趨勢圖",
      "查看最近訓練動態",
      "傳送鼓勵訊息",
      "聯繫客服諮詢",
    ],
  },
  {
    role: "醫師",
    color: "#38bdf8",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    steps: [
      "進入系統 → 選擇「醫師」",
      "搜尋 / 篩選病患列表",
      "查看個別病患詳情",
      "分析依從率趨勢",
      "開立復健處方",
      "設定回診提醒",
    ],
  },
];

const DESIGN_TOKENS = [
  { name: "品牌青", hex: "#0d9488", usage: "患者入口、主要互動" },
  { name: "關懷玫瑰", hex: "#f43f5e", usage: "家屬入口、情感連結" },
  { name: "專業藍", hex: "#38bdf8", usage: "醫師入口、信任感" },
  { name: "技術紫", hex: "#7c3aed", usage: "系統藍圖、開發參考" },
  { name: "成功綠", hex: "#10b981", usage: "完成狀態、進度指示" },
  { name: "警示橙", hex: "#f59e0b", usage: "注意事項、難度標示" },
];

const MOVENET_KEYPOINTS = [
  { id: 0, name: "鼻 nose" }, { id: 1, name: "左眼 left_eye" },
  { id: 2, name: "右眼 right_eye" }, { id: 3, name: "左耳 left_ear" },
  { id: 4, name: "右耳 right_ear" }, { id: 5, name: "左肩 left_shoulder" },
  { id: 6, name: "右肩 right_shoulder" }, { id: 7, name: "左肘 left_elbow" },
  { id: 8, name: "右肘 right_elbow" }, { id: 9, name: "左腕 left_wrist" },
  { id: 10, name: "右腕 right_wrist" }, { id: 11, name: "左髖 left_hip" },
  { id: 12, name: "右髖 right_hip" }, { id: 13, name: "左膝 left_knee" },
  { id: 14, name: "右膝 right_knee" }, { id: 15, name: "左踝 left_ankle" },
  { id: 16, name: "右踝 right_ankle" },
];

const PAGES = [
  { path: "/", label: "全局入口", desc: "角色選擇、系統登入", color: "#6366f1" },
  { path: "/patient", label: "患者首頁", desc: "今日訓練計畫列表", color: "#0d9488" },
  { path: "/patient/rehab/:id", label: "復健執行頁", desc: "攝影機 + 骨架偵測", color: "#10b981" },
  { path: "/family", label: "家屬儀表板", desc: "進度追蹤與趨勢圖", color: "#f43f5e" },
  { path: "/doctor", label: "醫師後台", desc: "病患管理與處方開立", color: "#38bdf8" },
  { path: "/blueprint", label: "系統藍圖", desc: "架構文件（此頁）", color: "#7c3aed" },
];

export function Blueprint() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"architecture" | "routes" | "tech" | "flows" | "ml" | "design">("architecture");

  const tabs = [
    { id: "architecture" as const, label: "系統架構", icon: Box },
    { id: "routes" as const, label: "頁面路由", icon: Globe },
    { id: "tech" as const, label: "技術棧", icon: Layers },
    { id: "flows" as const, label: "使用流程", icon: Users },
    { id: "ml" as const, label: "姿態偵測", icon: Cpu },
    { id: "design" as const, label: "設計語言", icon: Database },
  ];

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="bg-gradient-to-r from-violet-900 via-slate-900 to-indigo-900 px-6 py-3 border-b border-slate-700 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                <Layers className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <h1 className="text-white text-base" style={{ fontWeight: 700 }}>
                  {getAppDisplayName()} 系統藍圖
                </h1>
                <p className="text-slate-400 text-xs">架構 · 設計語言 · 技術整合</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["React 18", "TensorFlow.js", "MoveNet", "Capacitor", "繁體 TTS"].map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] border border-violet-500/30 text-violet-300 bg-violet-500/10">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-2 px-6 py-2 border-b border-slate-800 flex-shrink-0 bg-slate-900/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-violet-600/30 text-violet-200 border border-violet-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content — fills viewport, no page scroll */}
      <main className="flex-1 min-h-0 overflow-hidden px-6 py-3">
        <div className="max-w-[1440px] mx-auto h-full overflow-hidden">
          {activeTab === "architecture" && (
            <SystemArchitectureDiagram />
          )}

          {activeTab === "routes" && (
            <div className="h-full grid grid-cols-2 gap-3">
              {PAGES.map((page) => (
                <motion.div
                  key={page.path}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-4 py-3 border border-slate-700 cursor-pointer h-fit"
                  onClick={() => navigate(page.path.replace("/:id", "/knee-flexion"))}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: page.color }} />
                  <code className="text-xs text-slate-400 w-36 truncate">{page.path}</code>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm" style={{ fontWeight: 600 }}>{page.label}</p>
                    <p className="text-slate-500 text-xs">{page.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "tech" && (
            <div className="h-full grid grid-cols-2 grid-rows-3 gap-3">
              {TECH_STACK.map((layer) => (
                <div key={layer.layer} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layer.color }} />
                    <span className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>{layer.layer}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.items.map((item) => (
                      <span key={item} className="px-2 py-0.5 rounded-md text-xs border border-slate-600 text-slate-400">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-violet-400" />
                  <span className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>語音回饋</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Web Speech API", desc: "瀏覽器原生" },
                    { name: "Yating TTS", desc: "繁體中文優化" },
                    { name: "OpenAI TTS", desc: "高品質多音色" },
                  ].map((tts) => (
                    <div key={tts.name} className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                      <p className="text-slate-200 text-xs" style={{ fontWeight: 600 }}>{tts.name}</p>
                      <p className="text-slate-500 text-[10px]">{tts.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "flows" && (
            <div className="h-full grid grid-rows-3 gap-3">
              {USER_FLOWS.map((flow) => (
                <div
                  key={flow.role}
                  className="rounded-xl border p-3 flex flex-col"
                  style={{ backgroundColor: flow.bgColor + "15", borderColor: flow.borderColor + "50" }}
                >
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: flow.color }} />
                    <span className="text-slate-200 text-sm" style={{ fontWeight: 600 }}>{flow.role} 使用流程</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center flex-1">
                    {flow.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: flow.color + "25", color: flow.color }}>
                          {step}
                        </div>
                        {i < flow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "ml" && (
            <div className="h-full grid grid-cols-12 gap-3">
              <div className="col-span-8 bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <span className="text-slate-200 text-sm" style={{ fontWeight: 600 }}>MoveNet 17 關鍵點</span>
                </div>
                <div className="grid grid-cols-3 gap-1 flex-1 min-h-0 content-start">
                  {MOVENET_KEYPOINTS.map((kp) => (
                    <div key={kp.id} className="flex items-center gap-1.5 text-xs">
                      <span className="text-violet-400 w-4 text-right">{kp.id}</span>
                      <code className="text-slate-400 truncate">{kp.name}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-4 grid grid-rows-4 gap-2">
                {[
                  { label: "偵測速度", value: "~30fps", icon: Zap, color: "text-yellow-400" },
                  { label: "模型大小", value: "Thunder 4MB", icon: Box, color: "text-blue-400" },
                  { label: "角度計算", value: "餘弦定理", icon: Code, color: "text-emerald-400" },
                  { label: "信心閾值", value: "≥ 0.3", icon: Eye, color: "text-violet-400" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700 flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <div>
                        <p className="text-slate-400 text-[10px]">{item.label}</p>
                        <p className="text-slate-200 text-sm" style={{ fontWeight: 600 }}>{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "design" && (
            <div className="h-full grid grid-cols-12 gap-3">
              <div className="col-span-7 grid grid-cols-2 gap-2 content-start">
                {DESIGN_TOKENS.map((token) => (
                  <div key={token.name} className="flex items-center gap-2 bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: token.hex }} />
                    <div className="min-w-0">
                      <p className="text-slate-200 text-xs" style={{ fontWeight: 600 }}>{token.name}</p>
                      <code className="text-slate-500 text-[10px]">{token.hex}</code>
                      <p className="text-slate-600 text-[10px] truncate">{token.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="col-span-5 bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                  <Eye className="w-4 h-4 text-violet-400" />
                  <span className="text-slate-200 text-sm" style={{ fontWeight: 600 }}>無障礙設計</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 flex-1">
                  {[
                    "最小觸控目標 44×44pt",
                    "高對比度文字 ≥ 4.5:1",
                    "語音 + 視覺雙重回饋",
                    "大字體模式支援",
                    "iOS 安全區域適配",
                    "鍵盤導航完整支援",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                      <p className="text-slate-400 text-xs">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700 grid grid-cols-2 gap-2 flex-shrink-0">
                  {[
                    { platform: "Web", icon: Monitor, status: "全功能" },
                    { platform: "iOS", icon: Smartphone, status: "Capacitor" },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <div key={p.platform} className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                        <Icon className="w-4 h-4 text-slate-400 mb-1" />
                        <p className="text-slate-200 text-xs" style={{ fontWeight: 600 }}>{p.platform}</p>
                        <p className="text-emerald-400 text-[10px]">{p.status}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
