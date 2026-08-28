import React from "react";
import { ShieldQuestion, ArrowRight, Zap } from "lucide-react";

interface NoPredictionStateProps {
  onNavigateToPrediction?: () => void;
}

export const NoPredictionState: React.FC<NoPredictionStateProps> = ({ onNavigateToPrediction }) => {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8">
      <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400">
        <ShieldQuestion className="w-10 h-10 text-slate-400" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-200">No Prediction Available</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          No live forecast has been executed yet. Submit pre-windowed network state vectors or raw traffic flows to generate real AI inferences.
        </p>
      </div>

      {onNavigateToPrediction && (
        <button
          onClick={onNavigateToPrediction}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/30"
        >
          <Zap className="w-4 h-4" />
          <span>Go to Live Prediction</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
