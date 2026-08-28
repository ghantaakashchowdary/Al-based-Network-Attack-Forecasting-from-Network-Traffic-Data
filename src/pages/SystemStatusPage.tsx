import React from "react";
import { useApi } from "../context/ApiContext";
import {
  ServerCog,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Network,
  Clock,
  ShieldCheck,
  FileCode2,
} from "lucide-react";

export const SystemStatusPage: React.FC = () => {
  const {
    health,
    isBackendOnline,
    healthError,
    lastHealthCheck,
    isHealthLoading,
    refreshHealth,
    apiBaseUrl,
  } = useApi();

  const artifacts = health?.artifacts || {
    "model.pt": false,
    "preprocessor.joblib": false,
    "feature_schema.json": false,
    "label_mapping.json": false,
    "model_config.json": false,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <ServerCog className="w-6 h-6 text-cyan-400" />
            <span>AI Backend Telemetry & Subsystem Health</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status probes from the Python FastAPI server, PyTorch LSTM weights, and Ganesh Ingestion module.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshHealth()}
            disabled={isHealthLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-cyan-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? "animate-spin" : ""}`} />
            <span>{isHealthLoading ? "Probing..." : "Probe Health Now"}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Subsystem Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Python AI Service */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Python AI Service</span>
            <ServerCog className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            {isBackendOnline ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xl font-bold text-emerald-400">CONNECTED</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-xl font-bold text-rose-400">OFFLINE</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate">{apiBaseUrl}</p>
        </div>

        {/* Madhav Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Madhav Model</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            {health?.artifacts_ready ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xl font-bold text-slate-100">READY</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xl font-bold text-amber-400">{isBackendOnline ? "NOT READY" : "OFFLINE"}</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {health?.model_version || "PyTorch LSTM 1.0.0"}
          </p>
        </div>

        {/* Ganesh Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ganesh Pipeline</span>
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            {health?.ganesh_pipeline_available ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xl font-bold text-slate-100">AVAILABLE</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-xl font-bold text-rose-400">UNAVAILABLE</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Raw telemetry & 5s windowing</p>
        </div>

        {/* Overall Backend Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Backend Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            {health?.status === "healthy" ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xl font-bold text-emerald-400">HEALTHY</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-xl font-bold text-rose-400">UNHEALTHY</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {lastHealthCheck ? `Last probe: ${lastHealthCheck.toLocaleTimeString()}` : "Pending probe"}
          </p>
        </div>
      </div>

      {/* Model Artifacts Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Madhav AI Model Artifacts Checklist</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(artifacts).map(([file, isReady]) => (
            <div
              key={file}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isReady
                  ? "bg-slate-950/80 border-slate-800"
                  : "bg-rose-950/40 border-rose-900/60"
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-slate-200">{file}</span>
                <p className="text-[10px] text-slate-500 font-mono">
                  {file.endsWith(".pt")
                    ? "PyTorch Model Weights"
                    : file.endsWith(".joblib")
                    ? "StandardScaler Pipeline"
                    : file.includes("schema")
                    ? "21-Feature Specification"
                    : "Hyperparameter Config"}
                </p>
              </div>

              {isReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Raw JSON Response from /health */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Live Backend Response Payload (GET /health)</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Live API telemetry</span>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800 max-h-72">
          {health ? JSON.stringify(health, null, 2) : healthError ? JSON.stringify({ error: healthError, status: "offline" }, null, 2) : "Loading health probe..."}
        </pre>
      </div>
    </div>
  );
};
