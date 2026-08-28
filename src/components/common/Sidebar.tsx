import React from "react";
import { LayoutDashboard, Zap, LineChart, Table2, UploadCloud, ServerCog, ShieldCheck } from "lucide-react";

export type TabType = "dashboard" | "prediction" | "results" | "forecast" | "network-state" | "raw-upload" | "system-status";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string } = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "prediction", label: "Live Prediction", icon: <Zap className="w-4 h-4" />, badge: "Dual-Mode" },
    { id: "results", label: "Prediction Results", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "forecast", label: "Forecast Chart", icon: <LineChart className="w-4 h-4" /> },
    { id: "network-state", label: "Predicted State", icon: <Table2 className="w-4 h-4" />, badge: "21 Feats" },
    { id: "raw-upload", label: "Raw Traffic Upload", icon: <UploadCloud className="w-4 h-4" /> },
    { id: "system-status", label: "System Telemetry", icon: <ServerCog className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 p-4 min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? "bg-cyan-800 text-cyan-100"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">Module 3 AI Engine</p>
        <p>Ganesh Pipeline + Madhav LSTM</p>
        <p className="text-[11px] text-cyan-400">Strict Real-Data Mode</p>
      </div>
    </aside>
  );
};
