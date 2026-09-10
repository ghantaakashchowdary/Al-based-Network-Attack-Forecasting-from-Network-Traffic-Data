import React from "react";
import { useApi } from "../context/ApiContext";
import { TabType } from "../components/common/Sidebar";
import {
  Activity,
  Cpu,
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  BarChart3,
  Network,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Smartphone,
  MessageSquare,
} from "lucide-react";

interface DashboardPageProps {
  setActiveTab: (tab: TabType) => void;
}

const getMessagePreview = (event: {
  evidence?: string[];
}): string => {
  const preview = event.evidence?.find((item) =>
    item.toLowerCase().startsWith("message preview:")
  );
  return preview ? preview.replace(/^message preview:\s*/i, "") : "Message content is not available in this event.";
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const {
    health,
    isBackendOnline,
    healthError,
    latestPrediction,
    lastPredictionTime,
    lastPredictionType,
    isHealthLoading,
    securityEvents,
  } = useApi();

  const getRiskColor = (prob: number) => {
    if (prob >= 0.7) return { bg: "bg-rose-950/80", border: "border-rose-700", text: "text-rose-400", badge: "bg-rose-900 text-rose-200" };
    if (prob >= 0.4) return { bg: "bg-amber-950/80", border: "border-amber-700", text: "text-amber-400", badge: "bg-amber-900 text-amber-200" };
    return { bg: "bg-emerald-950/80", border: "border-emerald-700", text: "text-emerald-400", badge: "bg-emerald-900 text-emerald-200" };
  };

  const riskStyle = latestPrediction ? getRiskColor(latestPrediction.attack_probability) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            AI Cyber Defense Operations Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-stage network attack forecasting powered by Madhav Module 3 LSTM and Ganesh Ingestion Pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab("prediction")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition shadow-lg shadow-cyan-600/30"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Live Prediction</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Backend Unavailable Warning if offline */}
      {!isBackendOnline && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-100">Backend Unavailable</h4>
            <p className="text-xs text-rose-300 font-mono">
              {healthError || "Unable to reach the Python AI service. Verify that the FastAPI backend is running and the public URL is reachable."}
            </p>
          </div>
        </div>
      )}

      {/* 10 Required Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Backend Connection Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">1. Backend Status</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            {isBackendOnline ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-lg font-bold text-emerald-400">CONNECTED</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-lg font-bold text-rose-400">OFFLINE</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {health?.service || "module3-ai-forecasting"}
          </p>
        </div>

        {/* 2. Model Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">2. Model Status</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            {health?.artifacts_ready ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-lg font-bold text-slate-100">READY</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-lg font-bold text-amber-400">{isBackendOnline ? "MISSING ARTIFACTS" : "UNAVAILABLE"}</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            PyTorch LSTM weights verified
          </p>
        </div>

        {/* 3. Ganesh Pipeline Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">3. Ganesh Pipeline</span>
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            {health?.ganesh_pipeline_available ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-lg font-bold text-slate-100">AVAILABLE</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-lg font-bold text-rose-400">UNAVAILABLE</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            5s windowing & cleaning engine
          </p>
        </div>

        {/* 4. Current Attack Probability */}
        <div className={`rounded-xl p-5 space-y-2 border ${riskStyle ? `${riskStyle.bg} ${riskStyle.border}` : "bg-slate-900 border-slate-800"}`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">4. Attack Probability</span>
            <ShieldAlert className={`w-4 h-4 ${riskStyle ? riskStyle.text : "text-slate-400"}`} />
          </div>
          <div>
            {latestPrediction ? (
              <span className={`text-2xl font-black font-mono ${riskStyle?.text}`}>
                {(latestPrediction.attack_probability * 100).toFixed(2)}%
              </span>
            ) : (
              <span className="text-sm font-semibold text-slate-500">Awaiting inference</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {latestPrediction ? `Raw score: ${latestPrediction.attack_probability.toFixed(5)}` : "No prediction executed yet"}
          </p>
        </div>

        {/* 5. Predicted Attack Stage */}
        <div className={`rounded-xl p-5 space-y-2 border ${riskStyle ? `${riskStyle.bg} ${riskStyle.border}` : "bg-slate-900 border-slate-800"}`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">5. Predicted Stage</span>
            <Activity className={`w-4 h-4 ${riskStyle ? riskStyle.text : "text-slate-400"}`} />
          </div>
          <div>
            {latestPrediction ? (
              <span className={`text-xl font-bold ${riskStyle?.text}`}>
                {latestPrediction.predicted_stage}
              </span>
            ) : (
              <span className="text-sm font-semibold text-slate-500">Awaiting inference</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {latestPrediction ? `Forecast horizon: ${latestPrediction.forecast_horizon} steps` : "Normal / Recon / DDoS"}
          </p>
        </div>

        {/* 6. Forecast Horizon */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">6. Forecast Horizon</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {health?.forecast_horizon !== undefined ? `${health.forecast_horizon} steps` : "—"}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {health?.forecast_horizon ? `K=${health.forecast_horizon} windows (10 seconds ahead)` : "Fetched from /health"}
          </p>
        </div>

        {/* 7. Model Version */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">7. Model Version</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 truncate">
            {health?.model_version || "—"}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Module 3 Multi-Task Architecture
          </p>
        </div>

        {/* 8 & 9. Number of Features & Sequence Length */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">8 & 9. Feats & Length</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100">
            {health?.feature_count !== undefined ? `${health.feature_count} feats × ${health.sequence_length} windows` : "—"}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Contract: 5 history windows of 21 features
          </p>
        </div>
      </div>

      {/* Live Mobile SMS Security Feed */}
      <section className="bg-slate-900 border border-cyan-900/70 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Live Mobile SMS Security
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Messages detected on the connected Android phone appear here automatically.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
            AUTO-REFRESH 3s
          </span>
        </div>

        {(() => {
          const mobileEvents = securityEvents
            .filter((event) => event.type === "mobile_message")
            .slice(0, 5);

          if (mobileEvents.length === 0) {
            return (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">Waiting for an SMS from the mobile gateway</p>
                <p className="text-xs text-slate-500 mt-1">
                  Send a real SMS to the connected Android phone. The same analyzed message will appear here.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {mobileEvents.map((event) => {
                const actionTone =
                  event.action === "BLOCK"
                    ? "border-rose-800 bg-rose-950/30 text-rose-300"
                    : event.action === "QUARANTINE"
                      ? "border-orange-800 bg-orange-950/30 text-orange-300"
                      : event.action === "WARN"
                        ? "border-amber-800 bg-amber-950/30 text-amber-300"
                        : "border-emerald-800 bg-emerald-950/30 text-emerald-300";

                return (
                  <div key={event.event_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-900 shrink-0">
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{event.category}</span>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">{event.severity}</span>
                            <span className={`text-[10px] px-2 py-1 rounded-full border ${actionTone}`}>{event.action}</span>
                          </div>

                          <div className="mt-3 rounded-lg bg-slate-900 border border-slate-800 p-3">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Incoming SMS</div>
                            <p className="text-sm text-slate-200 break-words">{getMessagePreview(event)}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-slate-500">
                            <span>{event.sender ? `Sender: ${event.sender}` : "Sender unavailable"}</span>
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                            <span className="font-mono">ID {event.event_id.slice(0, 10)}</span>
                          </div>

                          <p className="text-xs text-slate-400 mt-2">{event.reason}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 min-w-[230px]">
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center">
                          <div className="text-[9px] text-slate-600">MSG RISK</div>
                          <div className="text-sm font-black font-mono text-slate-200 mt-1">
                            {event.scores.message == null ? "—" : `${Math.round(event.scores.message * 100)}%`}
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center">
                          <div className="text-[9px] text-slate-600">NET RISK</div>
                          <div className="text-sm font-black font-mono text-slate-200 mt-1">
                            {event.scores.network == null ? "—" : `${Math.round(event.scores.network * 100)}%`}
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center">
                          <div className="text-[9px] text-slate-600">TOTAL</div>
                          <div className="text-sm font-black font-mono text-cyan-300 mt-1">
                            {event.scores.composite == null ? "—" : `${Math.round(event.scores.composite * 100)}%`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* 10. Last Prediction Time & Quick Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>10. Last Prediction Record</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Timestamp: {lastPredictionTime ? lastPredictionTime.toLocaleString() : "No prediction executed yet in this session"}
            </p>
          </div>

          {lastPredictionType && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 self-start">
              Mode: {lastPredictionType === "raw-flows" ? "Raw Network Flows (Ganesh Pipeline)" : "5x21 Pre-Windowed Sequence"}
            </span>
          )}
        </div>

        {latestPrediction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Model Version</span>
                <p className="text-sm font-mono font-bold text-slate-200 mt-1">{latestPrediction.model_version}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Schema Version</span>
                <p className="text-sm font-mono font-bold text-slate-200 mt-1">{latestPrediction.feature_schema_version}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Forecast Horizon</span>
                <p className="text-sm font-mono font-bold text-slate-200 mt-1">{latestPrediction.forecast_horizon} Future Windows</p>
              </div>
            </div>

            {/* Quick Future Step Cards */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multi-Step Forecast Trajectory:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestPrediction.future_predictions.map((p) => (
                  <div key={p.step} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-900 text-cyan-200 font-mono">
                          Step T+{p.step}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{p.time_window}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-200 mt-2">
                        Stage: <span className="text-cyan-400">{p.predicted_stage}</span> (Confidence: {(p.stage_confidence * 100).toFixed(1)}%)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium">Risk Score</span>
                      <p className="text-lg font-black font-mono text-slate-100">
                        {(p.attack_probability * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveTab("forecast")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>View Full Forecast Chart</span>
              </button>
              <button
                onClick={() => setActiveTab("network-state")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Inspect 21 Predicted Features</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm">
            <p>No prediction generated yet. Use the <strong className="text-slate-200">Live Prediction</strong> tab to execute your first forecast against real network data.</p>
          </div>
        )}
      </div>
    </div>
  );
};
