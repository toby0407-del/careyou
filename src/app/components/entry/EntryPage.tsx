import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Activity,
  Heart,
  Stethoscope,
  Layout,
  ArrowRight,
  Wifi,
} from "lucide-react";
import { EntryBackground } from "./EntryBackground";
import { AppBrandHeader } from "../shared/AppLogo";

const roles = [
  {
    id: "patient",
    path: "/patient",
    label: "患者",
    icon: Activity,
    description: "查看今日訓練計畫，開始復健運動",
    gradient: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50",
    border: "border-teal-300",
    iconBg: "bg-teal-500",
    textColor: "text-teal-700",
    btnGradient: "from-teal-500 to-emerald-500",
    glow: "shadow-teal-200",
  },
  {
    id: "family",
    path: "/family",
    label: "家屬",
    icon: Heart,
    description: "追蹤親人復健進度，查看歷史趨勢",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-500",
    textColor: "text-rose-700",
    btnGradient: "from-rose-500 to-pink-500",
    glow: "shadow-rose-200",
  },
  {
    id: "doctor",
    path: "/doctor",
    label: "醫師",
    icon: Stethoscope,
    description: "管理病患、查看報告、調整復健處方",
    gradient: "from-sky-400 to-blue-400",
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconBg: "bg-sky-400",
    textColor: "text-sky-600",
    btnGradient: "from-sky-400 to-blue-400",
    glow: "shadow-sky-200",
  },
  {
    id: "blueprint",
    path: "/blueprint",
    label: "系統藍圖",
    icon: Layout,
    description: "系統架構、設計語言與技術規格參考",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-500",
    textColor: "text-violet-700",
    btnGradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-200",
  },
];

export function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="rehab-entry-shell w-full relative overflow-hidden bg-gradient-to-br from-teal-50/30 via-rose-50/20 to-violet-50/30">
      <EntryBackground />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-5 overflow-hidden">
        {/* Header */}
        <div className="rehab-entry-header text-center mb-5 flex-shrink-0">
          <div className="flex items-center justify-center mb-2">
            <AppBrandHeader />
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="rehab-entry-grid grid grid-cols-2 gap-3 flex-shrink-0">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(role.path)}
                className={`rehab-entry-card relative cursor-pointer rounded-2xl border-2 ${role.border} ${role.bg} p-4 group transition-all duration-300 hover:shadow-xl ${role.glow} backdrop-blur-md`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`${role.iconBg} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}
                    style={{ width: 64, height: 64 }}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xl ${role.textColor} block mb-1.5`} style={{ fontWeight: 800 }}>
                      {role.label}
                    </span>
                    <p className={`text-sm ${role.textColor} opacity-90 leading-snug`}>
                      {role.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <div
                    className={`flex items-center gap-2 bg-gradient-to-r ${role.btnGradient} text-white text-sm px-5 py-2.5 rounded-xl shadow-md`}
                    style={{ fontWeight: 600 }}
                  >
                    <span>進入</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${role.gradient} opacity-10 rounded-2xl`}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-4 text-slate-400 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span>即時連線</span>
          </div>
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-500" />
            <span>即時姿態偵測</span>
          </div>
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
          <span>v2.1.0</span>
        </div>
      </div>
    </div>
  );
}
