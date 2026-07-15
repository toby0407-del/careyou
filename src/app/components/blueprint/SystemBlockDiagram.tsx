import { ArrowRight, Layers } from "lucide-react";
import { getAppDisplayName } from "../../brand";
import { Block, BlockLayer, BlockRow, BlockStack } from "./BlueprintBlocks";

const LAYERS = [
  {
    title: "使用者角色",
    subtitle: "三端入口",
    color: "#8b5cf6",
    blocks: [
      { label: "患者端", sub: "淡綠 UI", color: "#0d9488" },
      { label: "家屬端", sub: "玫瑰 UI", color: "#f43f5e" },
      { label: "醫師端", sub: "專業藍", color: "#38bdf8" },
    ],
  },
  {
    title: "應用介面",
    subtitle: "React 頁面模組",
    color: "#a78bfa",
    blocks: [
      { label: "全局入口", sub: "角色選擇", color: "#8b5cf6" },
      { label: "患者首頁", sub: "地圖·小伴·迴廊", color: "#0d9488" },
      { label: "復健執行", sub: "鏡頭·舉手·TTS", color: "#14b8a6" },
      { label: "家屬端", sub: "總覽·迴廊·訊息", color: "#f43f5e" },
      { label: "醫師後台", sub: "列表·Modal·處方", color: "#38bdf8" },
      { label: "照護訊息", sub: "一對一私訊", color: "#ec4899" },
    ],
  },
  {
    title: "醫師詳情 Modal",
    subtitle: "中央對話框 · 可視 / 調整",
    color: "#38bdf8",
    blocks: [
      { label: "病患列表", sub: "人偶·部位數", color: "#0ea5e9" },
      { label: "優先排序", sub: "狀態·依從率", color: "#0284c7" },
      { label: "可視數據", sub: "圖表總覽", color: "#38bdf8" },
      { label: "調整數據", sub: "參數·處方", color: "#0369a1" },
      { label: "個人資料", sub: "巢狀 Dialog", color: "#7dd3fc" },
      { label: "提醒通知", sub: "頻率·條件", color: "#67e8f9" },
    ],
  },
  {
    title: "核心功能",
    subtitle: "業務服務層",
    color: "#10b981",
    blocks: [
      { label: "小伴 AI", sub: "本機規則", color: "#8b5cf6" },
      { label: "照護訊息", sub: "三端私訊", color: "#ec4899" },
      { label: "時光迴廊", sub: "6 張解鎖", color: "#0d9488" },
      { label: "今日完成率", sub: "三端統一", color: "#10b981" },
      { label: "姿勢偵測", sub: "BlazePose", color: "#6366f1" },
      { label: "家人打氣", sub: "即時橫幅", color: "#f43f5e" },
    ],
  },
  {
    title: "資料層",
    subtitle: "progressStore · analytics · localStorage",
    color: "#f59e0b",
    blocks: [
      { label: "progressStore", sub: "統一進度", color: "#0d9488" },
      { label: "patientAnalytics", sub: "依從·品質", color: "#38bdf8" },
      { label: "careChat", sub: "照護私訊 v2", color: "#ec4899" },
      { label: "timeGallery", sub: "照片牆", color: "#14b8a6" },
      { label: "dailyReveal", sub: "每日 6 張", color: "#8b5cf6" },
      { label: "encouragements", sub: "家人訊息", color: "#f43f5e" },
    ],
  },
  {
    title: "技術基礎",
    subtitle: "執行環境",
    color: "#6366f1",
    blocks: [
      { label: "React + TS", sub: "Vite", color: "#6366f1" },
      { label: "TensorFlow.js", sub: "WebGL/CPU", color: "#8b5cf6" },
      { label: "Radix Dialog", sub: "巢狀 Modal", color: "#38bdf8" },
      { label: "Capacitor", sub: "iPad / iOS", color: "#f59e0b" },
    ],
  },
];

const PIPELINE = [
  { label: "鏡頭", sub: "getUserMedia", color: "#38bdf8" },
  { label: "BlazePose", sub: "33 點", color: "#8b5cf6" },
  { label: "MoveNet", sub: "17 點備援", color: "#6366f1" },
  { label: "舉手確認", sub: "開始訓練", color: "#0d9488" },
  { label: "角度·次數", sub: "品質評分", color: "#f59e0b" },
  { label: "寫入進度", sub: "解鎖迴廊", color: "#10b981" },
];

const SYNC = [
  { from: "訓練完成", to: "progressStore", color: "#0d9488" },
  { from: "通關解鎖", to: "時光迴廊", color: "#8b5cf6" },
  { from: "照護訊息", to: "三端同步", color: "#ec4899" },
  { from: "家人打氣", to: "小伴 AI", color: "#f43f5e" },
  { from: "醫師調整參數", to: "患者端展示", color: "#38bdf8" },
];

export function SystemBlockDiagram() {
  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      <div className="rounded-xl border border-violet-200 bg-white/75 px-3 py-2 flex items-center gap-2 flex-shrink-0 shadow-sm shadow-violet-100/40">
        <Layers className="w-4 h-4 text-violet-600 flex-shrink-0" />
        <div>
          <p className="text-violet-950 text-[11px]" style={{ fontWeight: 800 }}>
            {getAppDisplayName()} 系統架構方塊圖
          </p>
          <p className="text-violet-600/70 text-[9px]">
            分層模組 · 醫師中央 Modal · 照護訊息 · 跨端同步 · iPad
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2">
        <div className="col-span-8 min-h-0 overflow-y-auto pr-1 space-y-1.5">
          {LAYERS.map((layer) => (
            <BlockLayer key={layer.title} title={layer.title} subtitle={layer.subtitle} color={layer.color}>
              <BlockRow
                blocks={layer.blocks.map((b) => ({
                  key: b.label,
                  node: <Block label={b.label} sub={b.sub} color={b.color} className="min-w-[72px]" />,
                }))}
              />
            </BlockLayer>
          ))}
        </div>

        <div className="col-span-4 min-h-0 flex flex-col gap-2">
          <BlockLayer title="復健執行管線" subtitle="鏡頭 → 解鎖" color="#8b5cf6">
            <BlockStack
              blocks={PIPELINE.map((p) => ({
                key: p.label,
                node: <Block label={p.label} sub={p.sub} color={p.color} className="w-full" />,
              }))}
            />
          </BlockLayer>

          <BlockLayer title="跨端資料同步" subtitle="即時流向" color="#f59e0b">
            <div className="space-y-1.5">
              {SYNC.map((row) => (
                <div key={row.from} className="flex items-center gap-1.5">
                  <Block label={row.from} color={row.color} className="flex-1" />
                  <ArrowRight className="w-3 h-3 text-violet-300 flex-shrink-0" />
                  <Block label={row.to} color="#8b5cf6" className="flex-1" />
                </div>
              ))}
            </div>
          </BlockLayer>
        </div>
      </div>
    </div>
  );
}
