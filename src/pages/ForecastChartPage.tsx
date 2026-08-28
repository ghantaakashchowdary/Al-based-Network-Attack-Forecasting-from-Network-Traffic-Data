import React from "react";
import { useApi } from "../context/ApiContext";
import { TabType } from "../components/common/Sidebar";
import { NoPredictionState } from "../components/common/NoPredictionState";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from "recharts";
import { LineChart as LineChartIcon, TrendingUp, ShieldAlert, Zap, Layers } from "lucide-react";

interface ForecastChartPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const ForecastChartPage: React.FC<ForecastChartPageProps> = ({ setActiveTab }) => {
  const { latestPrediction } = useApi();

  if (!latestPrediction) {
    return <NoPredictionState onNavigateToPrediction={() => setActiveTab("prediction")} />;
  }

  // Format real API response dynamically into chart series
  const chartData = latestPrediction.future_predictions.map((p) => ({
    name: `Step ${p.step} (T+${p.step * 5}s)`,
    step: p.step,
    time: p.time_window,
    riskPercentage: Number((p.attack_probability * 100).toFixed(2)),
    rawProbability: p.attack_probability,
    stage: p.predicted_stage,
    confidencePercentage: Number((p.stage_confidence * 100).toFixed(2)),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl text-xs space-y-1.5 font-mono">
          <p className="font-bold text-cyan-300 text-sm">{label}</p>
          <p className="text-slate-400">Timestamp: {data.time}</p>
          <div className="border-t border-slate-800 pt-1.5 space-y-1">
            <p className="text-rose-400 font-bold">
              Attack Risk: {data.riskPercentage}% ({data.rawProbability.toFixed(6)})
            </p>
            <p className="text-cyan-400 font-bold">
              Predicted Stage: {data.stage}
            </p>
            <p className="text-emerald-400 font-bold">
              Stage Confidence: {data.confidencePercentage}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <span>Dynamic Attack Risk & Trajectory Forecast</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Plotted dynamically from the real <code className="text-slate-300">future_predictions[]</code> array returned by Madhav's LSTM model.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("prediction")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-600/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Run Another Forecast</span>
          </button>
        </div>
      </div>

      {/* Main Area Chart: Risk Trajectory Over Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-cyan-400" />
              <span>Attack Risk Probability Evolution (T+1 to T+{chartData.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live probability curve calculated per future time step.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Attack Risk (%)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-3 rounded bg-cyan-500 inline-block" /> Stage Confidence (%)
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3" label={{ value: "Warning Threshold (50%)", fill: "#eab308", fontSize: 10, position: "insideBottomRight" }} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Critical Threshold (80%)", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }} />
              <Area type="monotone" dataKey="riskPercentage" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#riskGrad)" name="Attack Risk" />
              <Area type="monotone" dataKey="confidencePercentage" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#confGrad)" name="Stage Confidence" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Step Comparison Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Per-Step Probability & Stage Breakdown</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="riskPercentage" fill="#f43f5e" name="Attack Risk %" radius={[6, 6, 0, 0]} />
                <Bar dataKey="confidencePercentage" fill="#06b6d4" name="Stage Confidence %" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step Metadata Details List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Forecast Step Data Summary</span>
            </h3>

            <div className="divide-y divide-slate-800 mt-3 font-mono text-xs">
              {chartData.map((item) => (
                <div key={item.step} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200">Step {item.step} (T+{item.step * 5}s)</span>
                    <p className="text-[11px] text-slate-400">{item.time}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-400 font-bold">{item.stage}</span>
                    <p className="text-rose-400 font-black text-sm">{item.riskPercentage}% Risk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
            Zero Mock Data: Chart points and domain extents adapt dynamically to the length of <code className="text-slate-200">future_predictions</code> in the API response.
          </div>
        </div>
      </div>
    </div>
  );
};
