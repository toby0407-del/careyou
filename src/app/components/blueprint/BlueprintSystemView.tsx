import { useNavigate } from "react-router";
import {
  Zap,
  Eye,
  Code,
  Package,
  Monitor,
  Smartphone,
  Sparkles,
  Images,
} from "lucide-react";
import { SystemBlockDiagram } from "./SystemBlockDiagram";
import { Block, BlockLayer, BlockRow, BlockGrid } from "./BlueprintBlocks";

const TECH_STACK = [
  { layer: "Frontend", color: "#6366f1", items: ["React 18", "TS", "Tailwind", "Motion"] },
  { layer: "ML", color: "#8b5cf6", items: ["TF.js", "BlazePose", "MoveNet", "WebGL"] },
  { layer: "AI·語音", color: "#a78bfa", items: ["小伴本機", "Speech API", "TTS"] },
  { layer: "資料", color: "#0d9488", items: ["progressStore", "localStorage", "Reveal"] },
  { layer: "圖表", color: "#f43f5e", items: ["Recharts", "Router", "Toast"] },
];

const USER_FLOWS = [
  {
    role: "患者",
    color: "#0d9488",
    steps: ["地圖", "演示", "舉手", "訓練", "解鎖", "迴廊"],
  },
  {
    role: "家屬",
    color: "#f43f5e",
    steps: ["總覽", "迴廊", "打氣", "圖表", "預約", "客服"],
  },
  {
    role: "醫師",
    color: "#38bdf8",
    steps: ["病患", "處方", "同步", "動態", "分析", "提醒"],
  },
];

const DESIGN_TOKENS = [
  { name: "患者淡綠", hex: "#ecfdf5" },
  { name: "家屬玫瑰", hex: "#fff1f2" },
  { name: "藍圖淡紫", hex: "#f5f3ff" },
  { name: "品牌青", hex: "#0d9488" },
  { name: "技術紫", hex: "#8b5cf6" },
  { name: "專業藍", hex: "#38bdf8" },
];

const ML_PIPELINE = [
  { label: "Frame", sub: "640×480", color: "#38bdf8" },
  { label: "BlazePose", sub: "33點", color: "#8b5cf6" },
  { label: "備援", sub: "MoveNet", color: "#6366f1" },
  { label: "角度", sub: "餘弦", color: "#f59e0b" },
  { label: "品質", sub: "評分", color: "#ec4899" },
];

const FEATURES = [
  { label: "小伴 AI", sub: "離線", icon: Sparkles, color: "#a78bfa" },
  { label: "時光迴廊", sub: "6 張", icon: Images, color: "#8b5cf6" },
  { label: "30fps", sub: "即時", icon: Zap, color: "#eab308" },
  { label: "本機", sub: "無需 API", icon: Package, color: "#0d9488" },
];

const PAGES = [
  { path: "/", label: "入口", desc: "角色", color: "#8b5cf6" },
  { path: "/patient", label: "患者", desc: "地圖·小伴", color: "#0d9488" },
  { path: "/patient/rehab/:id", label: "復健", desc: "鏡頭", color: "#10b981" },
  { path: "/family", label: "家屬", desc: "迴廊", color: "#f43f5e" },
  { path: "/doctor", label: "醫師", desc: "處方", color: "#38bdf8" },
  { path: "/blueprint", label: "藍圖", desc: "此頁", color: "#7c3aed" },
];

export function BlueprintSystemView() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col gap-2 min-h-0 overflow-y-auto pr-1">
      <div className="flex-shrink-0 min-h-[42%]">
        <SystemBlockDiagram />
      </div>

      <div className="grid grid-cols-12 gap-2 flex-shrink-0">
        <div className="col-span-12">
          <BlockLayer title="頁面路由 · 使用流程" subtitle="橫向並列" color="#8b5cf6">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <p className="text-violet-600/70 text-[9px] mb-1">路由</p>
                <BlockRow
                  blocks={PAGES.map((page) => ({
                    key: page.path,
                    node: (
                      <Block
                        label={page.label}
                        sub={page.desc}
                        color={page.color}
                        className="min-w-[56px]"
                        onClick={() => navigate(page.path.replace("/:id", "/knee-flexion"))}
                      />
                    ),
                  }))}
                />
              </div>
              <div className="col-span-7 grid grid-cols-3 gap-1.5">
                {USER_FLOWS.map((flow) => (
                  <div key={flow.role}>
                    <p className="text-violet-600/70 text-[9px] mb-1">{flow.role}流程</p>
                    <BlockRow
                      blocks={flow.steps.map((step) => ({
                        key: step,
                        node: <Block label={step} color={flow.color} className="min-w-[44px]" />,
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </BlockLayer>
        </div>

        <div className="col-span-5">
          <BlockLayer title="技術棧" color="#6366f1">
            <div className="space-y-1.5">
              {TECH_STACK.map((layer) => (
                <BlockRow
                  key={layer.layer}
                  blocks={[
                    {
                      key: "title",
                      node: (
                        <Block label={layer.layer} color={layer.color} className="min-w-[52px]" />
                      ),
                    },
                    ...layer.items.map((item) => ({
                      key: item,
                      node: <Block label={item} color={layer.color} className="min-w-[44px]" />,
                    })),
                  ]}
                />
              ))}
            </div>
          </BlockLayer>
        </div>

        <div className="col-span-4">
          <BlockLayer title="姿態偵測 · 新功能" color="#8b5cf6">
            <BlockRow
              blocks={ML_PIPELINE.map((p) => ({
                key: p.label,
                node: <Block label={p.label} sub={p.sub} color={p.color} className="min-w-[52px]" />,
              }))}
            />
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {FEATURES.map((item) => {
                const Icon = item.icon;
                return (
                  <Block key={item.label} label={item.label} sub={item.sub} color={item.color}>
                    <Icon className="w-3 h-3 mx-auto mt-0.5 opacity-70" style={{ color: item.color }} />
                  </Block>
                );
              })}
            </div>
          </BlockLayer>
        </div>

        <div className="col-span-3">
          <BlockLayer title="設計語言" color="#a78bfa">
            <BlockGrid cols={3}>
              {DESIGN_TOKENS.map((token) => (
                <div key={token.name} className="rounded-lg border border-violet-200 overflow-hidden bg-white/60">
                  <div className="h-6 border-b border-violet-100" style={{ backgroundColor: token.hex }} />
                  <p className="text-violet-800 text-[8px] text-center py-0.5 truncate">{token.name}</p>
                </div>
              ))}
            </BlockGrid>
            <div className="grid grid-cols-2 gap-1 mt-1.5">
              <Block label="Web" sub="全功能">
                <Monitor className="w-3 h-3 mx-auto mt-0.5 text-violet-400" />
              </Block>
              <Block label="iOS" sub="Capacitor">
                <Smartphone className="w-3 h-3 mx-auto mt-0.5 text-violet-400" />
              </Block>
            </div>
          </BlockLayer>
        </div>
      </div>
    </div>
  );
}
