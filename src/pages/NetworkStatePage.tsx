import React, { useState } from "react";
import { useApi } from "../context/ApiContext";
import { TabType } from "../components/common/Sidebar";
import { NoPredictionState } from "../components/common/NoPredictionState";
import { Table2, Zap, Layers, ArrowUpDown, Filter, Sparkles, Activity } from "lucide-react";

interface NetworkStatePageProps {
  setActiveTab: (tab: TabType) => void;
}

export const NetworkStatePage: React.FC<NetworkStatePageProps> = ({ setActiveTab }) => {
  const { latestPrediction } = useApi();
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>("");

  if (!latestPrediction) {
    return <NoPredictionState onNavigateToPrediction={() => setActiveTab("prediction")} />;
  }

  // 21 Feature metadata with friendly names and descriptions
  const FEATURE_METADATA: Record<string, { label: string; unit: string; category: "Volume" | "TCP Flags" | "Flow Rates" | "Network Topology" }> = {
    total_packets: { label: "Total Packets", unit: "pkts/window", category: "Volume" },
    total_bytes: { label: "Total Volume Bytes", unit: "bytes", category: "Volume" },
    duration: { label: "Average Flow Duration", unit: "seconds", category: "Volume" },
    syn_flag_count: { label: "SYN Flags (Connection Initiation)", unit: "count", category: "TCP Flags" },
    ack_flag_count: { label: "ACK Flags (Acknowledgment)", unit: "count", category: "TCP Flags" },
    fin_flag_count: { label: "FIN Flags (Graceful Termination)", unit: "count", category: "TCP Flags" },
    rst_flag_count: { label: "RST Flags (Reset / Teardown)", unit: "count", category: "TCP Flags" },
    psh_flag_count: { label: "PSH Flags (Data Push)", unit: "count", category: "TCP Flags" },
    ttl: { label: "Time To Live (TTL)", unit: "hops", category: "Volume" },
    tcp_window_size: { label: "TCP Receiver Window Size", unit: "bytes", category: "TCP Flags" },
    fragmented: { label: "Fragmented Packet Count", unit: "count", category: "Volume" },
    retransmission_count: { label: "TCP Retransmissions", unit: "count", category: "TCP Flags" },
    flow_bytes_per_sec: { label: "Flow Bytes Rate", unit: "B/s", category: "Flow Rates" },
    flow_packets_per_sec: { label: "Flow Packets Rate", unit: "pkts/s", category: "Flow Rates" },
    avg_packet_size: { label: "Average Packet Size", unit: "bytes/pkt", category: "Volume" },
    flow_count: { label: "Total Concurrent Flows", unit: "flows", category: "Network Topology" },
    unique_src_ips: { label: "Unique Source IP Count", unit: "endpoints", category: "Network Topology" },
    unique_dst_ips: { label: "Unique Destination IP Count", unit: "endpoints", category: "Network Topology" },
    unique_dst_ports: { label: "Unique Target Ports", unit: "ports", category: "Network Topology" },
    tcp_count: { label: "TCP Protocol Flows", unit: "flows", category: "Network Topology" },
    udp_count: { label: "UDP Protocol Flows", unit: "flows", category: "Network Topology" },
  };

  const currentStepPrediction = latestPrediction.future_predictions.find((p) => p.step === selectedStep) || latestPrediction.future_predictions[0];
  const predictedState = currentStepPrediction?.predicted_state || {};

  const featureEntries = Object.entries(predictedState).filter(([key]) => {
    if (!searchFilter.trim()) return true;
    const meta = FEATURE_METADATA[key];
    return key.toLowerCase().includes(searchFilter.toLowerCase()) || (meta && meta.label.toLowerCase().includes(searchFilter.toLowerCase()));
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              21 Output Dimensions
            </span>
            <span className="text-xs text-slate-400 font-mono">
              LSTM Auto-Regressive State Regression
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-2 flex items-center gap-3">
            <Table2 className="w-6 h-6 text-cyan-400" />
            <span>Predicted 21-Feature Network State Vector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real predicted physical and statistical network indicators forecasted for step T+{selectedStep} ({currentStepPrediction?.time_window}).
          </p>
        </div>

        {/* Step Selector Buttons */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start">
          <span className="text-xs text-slate-400 font-semibold px-2">Step:</span>
          {latestPrediction.future_predictions.map((p) => (
            <button
              key={p.step}
              onClick={() => setSelectedStep(p.step)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                selectedStep === p.step
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              T+{p.step} ({p.predicted_stage})
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter 21 features (e.g. syn, packets, ttl)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {featureEntries.length} of 21 predicted feature variables
        </div>
      </div>

      {/* 21 Features Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">#</th>
                <th className="py-3.5 px-6">Feature Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Predicted Numeric Value</th>
                <th className="py-3.5 px-6">Unit</th>
                <th className="py-3.5 px-6 text-right">Step T+1 vs T+2 Comparison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {featureEntries.map(([key, val], idx) => {
                const meta = FEATURE_METADATA[key] || { label: key, unit: "units", category: "Volume" };
                const numVal = typeof val === "number" ? val : parseFloat(val) || 0;

                // Compare with step 1 and step 2 if available
                const step1Val = latestPrediction.future_predictions[0]?.predicted_state?.[key as keyof typeof predictedState] as number;
                const step2Val = latestPrediction.future_predictions[1]?.predicted_state?.[key as keyof typeof predictedState] as number;
                const diff = (step2Val !== undefined && step1Val !== undefined) ? step2Val - step1Val : null;

                return (
                  <tr key={key} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-200">{meta.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{key}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-sans font-medium">
                        {meta.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-base font-bold text-cyan-400">
                        {numVal.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 font-sans text-[11px]">
                      {meta.unit}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {diff !== null ? (
                        <span className={`text-[11px] font-bold ${diff > 0 ? "text-rose-400" : diff < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                          {diff > 0 ? `+${diff.toFixed(2)} (↑)` : diff < 0 ? `${diff.toFixed(2)} (↓)` : "0.00 (—)"}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
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
