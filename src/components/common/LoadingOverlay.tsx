import React from "react";
import { Loader2, ShieldAlert, Cpu, Network } from "lucide-react";

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-800/80 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-cyan-950/60 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">Live AI Inference in Progress</h3>
          <p className="text-sm text-cyan-300 font-medium font-mono">{message || "Processing request..."}</p>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <Network className="w-3.5 h-3.5 text-cyan-400" /> Ganesh Windows
          </span>
          <span>&rarr;</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" /> Madhav LSTM
          </span>
          <span>&rarr;</span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> K-Step Forecast
          </span>
        </div>
      </div>
    </div>
  );
};
