import React from "react";
import { useApi } from "../context/ApiContext";
import { TabType } from "../components/common/Sidebar";
import { NoPredictionState } from "../components/common/NoPredictionState";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  Cpu,
  Hash,
  ArrowRight,
  TrendingUp,
  Table2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface PredictionResultsPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const PredictionResultsPage: React.FC<PredictionResultsPageProps> = ({ setActiveTab }) => {
  const { latestPrediction, lastPredictionTime, lastPredictionType } = useApi();

  if (!latestPrediction) {
    return <NoPredictionState onNavigateToPrediction={() => setActiveTab("prediction")} />;
  }

  const getRiskBadge = (prob: number) => {
    if (prob >= 0.7) {
      return { label: "CRITICAL RISK", bg: "bg-rose-950/80", text: "text-rose-400", border: "border-rose-700" };
    }
    if (prob >= 0.4) {
      return { label: "ELEVATED RISK", bg: "bg-amber-950/80", text: "text-amber-400", border: "border-amber-700" };
    }
    return { label: "NORMAL / LOW RISK", bg: "bg-emerald-950/80", text: "text-emerald-400", border: "border-emerald-700" };
  };

  const riskBadge = getRiskBadge(latestPrediction.attack_probability);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Mode: {lastPredictionType === "raw-flows" ? "Ganesh Raw Flow Pipeline" : "5x21 Pre-Windowed Sequence"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Inferred: {lastPredictionTime ? lastPredictionTime.toLocaleTimeString() : "Recent"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-2 flex items-center gap-3">
            Real Inference Results & Multi-Step Forecast
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("forecast")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-600/30"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Chart</span>
          </button>
          <button
            onClick={() => setActiveTab("network-state")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Predicted State Vector</span>
          </button>
        </div>
      </div>

      {/* Core Prediction Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Attack Probability */}
        <div className={`p-6 rounded-2xl border ${riskBadge.bg} ${riskBadge.border} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attack Probability</span>
            <ShieldAlert className={`w-5 h-5 ${riskBadge.text}`} />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100">
            {(latestPrediction.attack_probability * 100).toFixed(2)}%
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Exact API Value: <span className="font-bold text-white">{latestPrediction.attack_probability}</span>
          </p>
        </div>

        {/* Predicted Stage */}
        <div className={`p-6 rounded-2xl border ${riskBadge.bg} ${riskBadge.border} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Predicted Attack Stage</span>
            <ShieldCheck className={`w-5 h-5 ${riskBadge.text}`} />
          </div>
          <div className={`text-2xl font-black ${riskBadge.text}`}>
            {latestPrediction.predicted_stage}
          </div>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${riskBadge.bg} ${riskBadge.text} border ${riskBadge.border}`}>
            {riskBadge.label}
          </span>
        </div>

        {/* Forecast Horizon */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Forecast Horizon</span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100">
            K = {latestPrediction.forecast_horizon}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {latestPrediction.forecast_horizon * 5} seconds into the future
          </p>
        </div>

        {/* Model & Schema Versions */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Model Version</span>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 truncate">
            {latestPrediction.model_version}
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">
            Schema: {latestPrediction.feature_schema_version}
          </p>
        </div>
      </div>

      {/* Ingestion Pipeline Metadata (if raw flow mode) */}
      {latestPrediction.ingestion_metadata && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-100">Ganesh Ingestion Pipeline Statistics</h4>
              <p className="text-xs text-slate-400">Raw packet flows cleaned, aggregated, and windowed on the backend.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-500">Raw Flows Ingested:</span>{" "}
              <strong className="text-purple-300">{latestPrediction.ingestion_metadata.total_raw_flows}</strong>
            </div>
            <div>
              <span className="text-slate-500">Windows Generated:</span>{" "}
              <strong className="text-purple-300">{latestPrediction.ingestion_metadata.generated_windows}</strong>
            </div>
            <div>
              <span className="text-slate-500">Window Duration:</span>{" "}
              <strong className="text-purple-300">{latestPrediction.ingestion_metadata.window_seconds}s</strong>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Multi-Step Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Step Forecast Trajectory (future_predictions[])</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact predictions generated step-by-step by Madhav's LSTM world model.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Step</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Attack Risk Probability</th>
                <th className="py-3 px-4">Predicted Stage</th>
                <th className="py-3 px-4">Stage Confidence</th>
                <th className="py-3 px-4 text-right">State Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {latestPrediction.future_predictions.map((p) => {
                const stepRisk = getRiskBadge(p.attack_probability);
                return (
                  <tr key={p.step} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-bold text-cyan-400">
                      Step {p.step} (T+{p.step * 5}s)
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {p.time_window}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${stepRisk.text}`}>
                          {(p.attack_probability * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({p.attack_probability.toFixed(6)})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${stepRisk.bg} ${stepRisk.text} ${stepRisk.border}`}>
                        {p.predicted_stage}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-bold">
                      {(p.stage_confidence * 100).toFixed(2)}%
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setActiveTab("network-state")}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-sans transition"
                      >
                        Inspect 21 Feats &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
