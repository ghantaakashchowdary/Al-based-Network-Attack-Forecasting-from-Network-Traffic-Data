import React from "react";
import { AlertCircle, X, WifiOff, AlertTriangle } from "lucide-react";

interface ErrorBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = "Backend Request Error",
  message,
  onDismiss,
}) => {
  if (!message) return null;

  const isOffline = message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("timed out") || message.toLowerCase().includes("failed to connect");

  return (
    <div className="rounded-xl bg-rose-950/80 border border-rose-800 p-4 text-rose-200 shadow-lg shadow-rose-950/40 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-start gap-3">
        {isOffline ? (
          <WifiOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-rose-100">{title}</h4>
          <p className="text-xs text-rose-300 font-mono leading-relaxed break-words">{message}</p>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200 p-1 rounded-lg hover:bg-rose-900/50 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
