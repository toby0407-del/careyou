import { getAppDisplayName } from "../../brand";
import { ArrowLeft, Layers, Activity } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ExerciseDemoShowcase } from "./ExerciseDemoShowcase";
import { BlueprintSystemView } from "./BlueprintSystemView";

export function Blueprint() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "demo">("overview");

  const tabs = [
    { id: "overview" as const, label: "系統總覽", icon: Layers },
    { id: "demo" as const, label: "2D 動作示範", icon: Activity },
  ];

  return (
    <div className="blueprint-large-text blueprint-shell h-screen flex flex-col overflow-hidden">
      <header className="blueprint-shell-header px-6 py-2.5 border-b flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-8 h-8 rounded-lg bg-violet-100 hover:bg-violet-200 flex items-center justify-center transition-colors border border-violet-200"
            >
              <ArrowLeft className="w-4 h-4 text-violet-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-200/80 border border-violet-300 flex items-center justify-center">
                <Layers className="w-4 h-4 text-violet-700" />
              </div>
              <div>
                <h1 className="text-violet-950 text-sm" style={{ fontWeight: 700 }}>
                  {getAppDisplayName()} 系統藍圖
                </h1>
                <p className="text-violet-600/80 text-[10px]">方塊圖 · 架構 · 技術規格 · v2026</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {["React", "TF.js", "BlazePose", "本機 AI", "localStorage"].map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[9px] border border-violet-300/60 text-violet-700 bg-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="blueprint-tab-bar blueprint-shell-tabs flex gap-2 px-6 py-2 border-b flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] transition-colors ${
                activeTab === tab.id
                  ? "bg-violet-200/80 text-violet-900 border border-violet-300 shadow-sm"
                  : "text-violet-600/80 hover:text-violet-900 hover:bg-white/60"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="blueprint-main flex-1 min-h-0 px-6 py-2">
        <div className="max-w-[1440px] mx-auto h-full min-h-0">
          {activeTab === "overview" && <BlueprintSystemView />}
          {activeTab === "demo" && <ExerciseDemoShowcase />}
        </div>
      </main>
    </div>
  );
}
