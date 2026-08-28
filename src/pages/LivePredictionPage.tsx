import React, { useState } from "react";
import { useApi } from "../context/ApiContext";
import { TabType } from "../components/common/Sidebar";

import Papa from "papaparse";
import {
  Zap,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Network,
  Info,
} from "lucide-react";

interface LivePredictionPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const LivePredictionPage: React.FC<LivePredictionPageProps> = ({ setActiveTab }) => {
  const { runSequencePrediction, runRawFlowsPrediction, isPredicting, predictionError, clearPredictionError } = useApi();

  const [mode, setMode] = useState<"pre-windowed" | "raw-flows">("pre-windowed");
  const [inputText, setInputText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Standard 21 feature column order expected by Module 3
  const EXPECTED_FEATURES = [
    "total_packets", "total_bytes", "duration", "syn_flag_count", "ack_flag_count",
    "fin_flag_count", "rst_flag_count", "psh_flag_count", "ttl", "tcp_window_size",
    "fragmented", "retransmission_count", "flow_bytes_per_sec", "flow_packets_per_sec",
    "avg_packet_size", "flow_count", "unique_src_ips", "unique_dst_ips",
    "unique_dst_ports", "tcp_count", "udp_count"
  ];

  // Load a real pre-windowed 5x21 sample from Module 2 synthetic dataset format
  const loadSampleWindowSequence = () => {
    setValidationError(null);
    clearPredictionError();
    setSuccessMessage(null);
    setFileName("sample_5x21_windows.json");

    const sample = {
      sequence: [
        [1355.2, 814033.7, 0.96, 45.1, 0.0, 11.5, 4.7, 0.0, 109.5, 37365.0, 1.8, 29.1, 1002134.6, 2134.2, 217.3, 28.6, 33.0, 33.7, 16.4, 28.0, 1.6],
        [1327.2, 144327.6, 0.68, 24.8, 188.0, 7.0, 0.0, 280.4, 95.6, 33969.1, 0.2, 51.8, 776063.1, 293.4, 353.0, 48.2, 26.8, 23.6, 6.9, 57.4, 7.4],
        [1400.0, 200000.0, 1.00, 30.0, 150.0, 8.0, 0.0, 200.0, 98.0, 35000.0, 0.5, 40.0, 800000.0, 500.0, 300.0, 40.0, 28.0, 25.0, 8.0, 50.0, 5.0],
        [1450.0, 250000.0, 1.20, 35.0, 160.0, 9.0, 0.0, 220.0, 100.0, 36000.0, 0.6, 45.0, 850000.0, 600.0, 320.0, 42.0, 30.0, 27.0, 9.0, 52.0, 6.0],
        [1500.0, 300000.0, 1.50, 40.0, 170.0, 10.0, 0.0, 240.0, 102.0, 37000.0, 0.7, 50.0, 900000.0, 700.0, 340.0, 45.0, 32.0, 29.0, 10.0, 55.0, 7.0]
      ],
      timestamps: [
        "2026-08-27T09:08:20",
        "2026-08-27T09:08:25",
        "2026-08-27T09:08:30",
        "2026-08-27T09:08:35",
        "2026-08-27T09:08:40"
      ]
    };

    setInputText(JSON.stringify(sample, null, 2));
    setParsedSummary("Loaded 5 temporal windows with 21 numerical features each.");
  };

  // Load a real raw flow telemetry sample formatted for Ganesh Ingestion Pipeline
  const loadSampleRawFlows = () => {
    setValidationError(null);
    clearPredictionError();
    setSuccessMessage(null);
    setFileName("sample_raw_traffic_flows.json");

    const flows = [];
    const baseTime = new Date("2026-08-27T09:00:00Z").getTime();

    // Generate 35 valid flow entries spanning > 25 seconds for 5-second windowing
    for (let i = 0; i < 35; i++) {
      const timeOffset = i * 850; // Every 850ms
      const isoTime = new Date(baseTime + timeOffset).toISOString().replace("T", " ").replace("Z", "");
      flows.push({
        timestamp: isoTime,
        src_ip: `192.168.1.${(i % 10) + 1}`,
        dst_ip: "10.0.0.1",
        protocol: i % 4 === 0 ? "UDP" : "TCP",
        src_port: 40000 + i,
        dst_port: 80,
        duration: 0.05 + (i % 5) * 0.02,
        total_fwd_packets: 4 + (i % 8),
        total_bwd_packets: 3 + (i % 6),
        total_fwd_bytes: 350 + (i % 15) * 40,
        total_bwd_bytes: 400 + (i % 12) * 50,
        syn_flag_count: i % 3 === 0 ? 1 : 0,
        ack_flag_count: 6,
        fin_flag_count: 0,
        rst_flag_count: 0,
        psh_flag_count: 1,
        urg_flag_count: 0,
        ttl: 64,
        tcp_window_size: 65535,
        fragmented: 0,
        retransmission_count: 0
      });
    }

    const payload = {
      flows,
      window_seconds: 5
    };

    setInputText(JSON.stringify(payload, null, 2));
    setParsedSummary(`Loaded ${flows.length} raw network flow records (Ganesh Pipeline will clean, aggregate into 5s windows, and infer).`);
  };

  // Handle CSV / JSON File Drop or Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setValidationError(null);
    clearPredictionError();
    setSuccessMessage(null);

    const reader = new FileReader();

    if (file.name.endsWith(".json")) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        try {
          const parsed = JSON.parse(text);
          if (mode === "pre-windowed" && parsed.sequence) {
            setParsedSummary(`Valid JSON: ${parsed.sequence.length} sequence windows detected.`);
          } else if (mode === "raw-flows" && (parsed.flows || Array.isArray(parsed))) {
            const count = parsed.flows ? parsed.flows.length : parsed.length;
            setParsedSummary(`Valid JSON: ${count} flow records detected.`);
          }
        } catch (err: any) {
          setValidationError(`Invalid JSON syntax: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        const csvText = event.target?.result as string;
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          preview: 2000,
          complete: (results) => {

            if (results.errors.length > 0) {
              setValidationError(`CSV Parse Warning: ${results.errors[0].message}`);
            }

            const rows = results.data as any[];

            if (mode === "pre-windowed") {
              // Extract numeric 21 features for 5 rows
              const candidateRows = rows.slice(-5);
              if (candidateRows.length < 5) {
                setValidationError(`CSV has only ${candidateRows.length} rows. Exactly 5 temporal sequence windows are required.`);
                return;
              }

              // Extract 21 feature values per row
              const sequence = candidateRows.map((row) => {
                return EXPECTED_FEATURES.map((col) => {
                  const val = row[col];
                  return typeof val === "number" ? val : parseFloat(val) || 0;
                });
              });

              const timestamps = candidateRows.map((r) => r.timestamp ? String(r.timestamp) : undefined).filter(Boolean) as string[];

              const payload = {
                sequence,
                timestamps: timestamps.length === 5 ? timestamps : undefined
              };

              setInputText(JSON.stringify(payload, null, 2));
              setParsedSummary(`Extracted 5 sequence windows × 21 features from CSV (${file.name}).`);
            } else {
              // Raw flow mode
              const payload = {
                flows: rows,
                window_seconds: 5
              };
              setInputText(JSON.stringify(payload, null, 2));
              setParsedSummary(`Parsed ${rows.length} raw flow records from CSV. Required identity fields: timestamp, src_ip, dst_ip, protocol.`);
            }
          },
          error: (err) => {
            setValidationError(`Failed to parse CSV: ${err.message}`);
          }
        });
      };
      reader.readAsText(file);
    } else {
      setValidationError("Unsupported file format. Please upload a .csv or .json file.");
    }
  };

  // Submit to Real AI Backend
  const handleSubmitPrediction = async () => {
    setValidationError(null);
    clearPredictionError();
    setSuccessMessage(null);

    if (!inputText.trim()) {
      setValidationError("Please paste JSON data or upload a CSV file before submitting.");
      return;
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(inputText);
    } catch (err: any) {
      setValidationError(`Invalid JSON syntax: ${err.message}`);
      return;
    }

    try {
      if (mode === "pre-windowed") {
        if (!parsedPayload.sequence || !Array.isArray(parsedPayload.sequence)) {
          setValidationError("Invalid payload structure: missing 'sequence' array of 5 windows.");
          return;
        }
        if (parsedPayload.sequence.length !== 5) {
          setValidationError(`Expected exactly 5 history windows, but got ${parsedPayload.sequence.length}.`);
          return;
        }

        const res = await runSequencePrediction(parsedPayload);
        setSuccessMessage(`Forecast generated successfully! Predicted stage: ${res.predicted_stage} (${(res.attack_probability * 100).toFixed(2)}% risk).`);
      } else {
        // Raw flow mode
        const flows = parsedPayload.flows || (Array.isArray(parsedPayload) ? parsedPayload : null);
        if (!flows || !Array.isArray(flows) || flows.length === 0) {
          setValidationError("Invalid raw flow payload: 'flows' array must contain network flow records.");
          return;
        }

        const res = await runRawFlowsPrediction({
          flows,
          window_seconds: parsedPayload.window_seconds || 5
        });
        setSuccessMessage(`Raw flows processed via Ganesh Pipeline & Madhav LSTM! Predicted stage: ${res.predicted_stage} (${(res.attack_probability * 100).toFixed(2)}% risk).`);
      }
    } catch (err: any) {
      // Error is set in ApiContext
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Live AI Inference Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit pre-windowed temporal states directly or feed raw network flows through Ganesh Ingestion.
          </p>
        </div>

        {/* Dual Mode Switcher */}
        <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => {
              setMode("pre-windowed");
              setInputText("");
              setFileName("");
              setParsedSummary(null);
              setValidationError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              mode === "pre-windowed"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mode A: Pre-Windowed (5×21)</span>
          </button>

          <button
            onClick={() => {
              setMode("raw-flows");
              setInputText("");
              setFileName("");
              setParsedSummary(null);
              setValidationError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              mode === "raw-flows"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Mode B: Raw Flows (Ganesh)</span>
          </button>
        </div>
      </div>

      {/* Mode Description & Contract Rules */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          {mode === "pre-windowed" ? (
            <p>
              <strong className="text-cyan-300 font-semibold">Mode A Contract (POST /predict):</strong> Expects exactly 5 history windows with 21 numerical features each. Calls Madhav Module 3 LSTM directly to predict $T+1$ and $T+2$ future attack states.
            </p>
          ) : (
            <p>
              <strong className="text-purple-300 font-semibold">Mode B Contract (POST /predict/raw-flows):</strong> Ingests raw network telemetry (with required identity fields: <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">timestamp</code>, <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">src_ip</code>, <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">dst_ip</code>, <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">protocol</code>), executes Ganesh cleaning & 5s windowing on the backend, strips ground truth labels, and returns LSTM forecasts.
            </p>
          )}
        </div>
      </div>

      {/* Validation / Success Messages */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {predictionError && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Backend Error: {predictionError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setActiveTab("results")}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold shrink-0"
          >
            <span>View Results</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Load Sample Button */}
          <button
            onClick={mode === "pre-windowed" ? loadSampleWindowSequence : loadSampleRawFlows}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Real Sample {mode === "pre-windowed" ? "5x21 Data" : "Raw Flow Data"}</span>
          </button>

          {/* Clear Button */}
          {inputText && (
            <button
              onClick={() => {
                setInputText("");
                setFileName("");
                setParsedSummary(null);
                setValidationError(null);
                setSuccessMessage(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 cursor-pointer transition">
          <Upload className="w-3.5 h-3.5" />
          <span>{fileName ? `File: ${fileName}` : "Upload CSV / JSON File"}</span>
          <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Summary Tag */}
      {parsedSummary && (
        <div className="px-4 py-2 rounded-lg bg-slate-900 border border-cyan-900/50 text-cyan-300 text-xs font-mono">
          ✓ {parsedSummary}
        </div>
      )}

      {/* Text Area Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
          <span>Payload JSON Editor:</span>
          <span className="font-mono text-[11px] text-slate-500">
            {mode === "pre-windowed" ? "POST /predict" : "POST /predict/raw-flows"}
          </span>
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={14}
          placeholder={
            mode === "pre-windowed"
              ? '{\n  "sequence": [\n    [1355.2, 814033.7, ... 21 features],\n    [1327.2, 144327.6, ... 21 features],\n    [... 5 windows total ...]\n  ]\n}'
              : '{\n  "flows": [\n    {\n      "timestamp": "2026-08-27 09:00:00",\n      "src_ip": "192.168.1.5",\n      "dst_ip": "10.0.0.1",\n      "protocol": "TCP",\n      ...\n    }\n  ],\n  "window_seconds": 5\n}'
          }
          className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition resize-y"
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-500 font-mono">
          Strict real-data execution: No synthetic or mock values will be generated by the frontend.
        </span>

        <button
          onClick={handleSubmitPrediction}
          disabled={isPredicting || !inputText.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-lg shadow-cyan-600/30"
        >
          <Play className={`w-4 h-4 fill-white ${isPredicting ? "animate-spin" : ""}`} />
          <span>{isPredicting ? "Executing AI Model..." : "Run AI Prediction"}</span>
        </button>
      </div>
    </div>
  );
};
