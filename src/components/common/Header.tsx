import React from "react";
import { useApi } from "../../context/ApiContext";
import { Activity, Server, Cpu, RefreshCw, Wifi, WifiOff, MessageSquareWarning } from "lucide-react";

export const Header: React.FC = () => {
  const { health, isBackendOnline, apiBaseUrl, refreshHealth, isHealthLoading, lastHealthCheck, healthError } = useApi();

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            SentinelAI <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">SOC AI Hub</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Endpoint: <span className="text-slate-300 select-all">{apiBaseUrl}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Backend Online Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isBackendOnline
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 shadow-sm shadow-emerald-900/30"
              : "bg-rose-950/80 text-rose-300 border-rose-800 shadow-sm shadow-rose-900/30"
          }`}
        >
          {isBackendOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
          <span>{isBackendOnline ? "AI BACKEND ONLINE" : "BACKEND UNAVAILABLE"}</span>
        </div>

        {/* Model Status Pill */}
        {health && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>LSTM: {health.model_version}</span>
          </div>
        )}

        {/* Ganesh Pipeline Status Pill */}
        {health && (
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              health.ganesh_pipeline_available
                ? "bg-cyan-950/50 text-cyan-300 border-cyan-800"
                : "bg-amber-950/50 text-amber-300 border-amber-800"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Ganesh: {health.ganesh_pipeline_available ? "Ready" : "Offline"}</span>
          </div>
        )}

        {health && (
          <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${health.message_model_ready ? "bg-violet-950/50 text-violet-300 border-violet-800" : "bg-amber-950/50 text-amber-300 border-amber-800"}`}>
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>Message AI: {health.message_model_ready ? health.message_model_version : "Offline"}</span>
          </div>
        )}

        {/* Refresh Probe Button */}
        <button
          onClick={() => refreshHealth()}
          disabled={isHealthLoading}
          title="Refresh Health Probe"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? "animate-spin text-cyan-400" : ""}`} />
          <span className="hidden sm:inline">Probe</span>
        </button>
      </div>
    </header>
  );
};
