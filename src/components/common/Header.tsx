import React, { useState } from "react";
import { useApi } from "../../context/ApiContext";
import { Activity, Server, Cpu, RefreshCw, Wifi, WifiOff, MessageSquareWarning, Download, Smartphone, Bell, ShieldAlert, X, ExternalLink } from "lucide-react";

export const Header: React.FC = () => {
  const { health, isBackendOnline, apiBaseUrl, refreshHealth, isHealthLoading, lastHealthCheck, healthError } = useApi();
  const [showDownloadModal, setShowDownloadModal] = useState(false);

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

        {/* Download Mobile App Button */}
        <button
          onClick={() => setShowDownloadModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Get Mobile App</span>
        </button>

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

      {/* Mobile App Download & Install Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">SentinelAI Mobile Security</h3>
                <p className="text-xs text-slate-400">Real-Time Threat Detection on Your Phone</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Feature Highlights */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>WhatsApp & Messenger Notifications:</strong> Live risk inspection for scam & phishing links in messaging notifications.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>SMS Security Gateway:</strong> Automatic SMS attack detection with instant AI quarantine policy.</span>
                </div>
              </div>

              {/* Download Option 1: Native Android APK */}
              <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/30 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-cyan-200">Android App (.APK)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Full protection with SMS & Notification scanning</p>
                </div>
                <a
                  href="/downloads/sentinelai-mobile.apk"
                  download="SentinelAI-Mobile.apk"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK</span>
                </a>
              </div>

              {/* Download Option 2: Web App (PWA) */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Instant Web App (Chrome / Safari)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  In Chrome on mobile, tap the <strong>three dots (⋮)</strong> at the top right and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> to use it as a standalone app!
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
