import React, { useState } from "react";
import { useApi } from "../../context/ApiContext";
import { Activity, Server, Cpu, RefreshCw, Wifi, WifiOff, MessageSquareWarning, Download, Smartphone, Bell, ShieldAlert, X, ExternalLink, Settings, Edit3, Check } from "lucide-react";

export const Header: React.FC = () => {
  const { health, isBackendOnline, apiBaseUrl, refreshHealth, isHealthLoading, setApiEndpoint } = useApi();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiBaseUrl);

  const handleSaveEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setApiEndpoint(inputUrl.trim());
      setShowEndpointModal(false);
    }
  };

  const handleResetEndpoint = () => {
    setApiEndpoint("");
    setInputUrl("http://localhost:8000");
    setShowEndpointModal(false);
  };

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
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
            <span>Endpoint:</span>
            <button
              onClick={() => { setInputUrl(apiBaseUrl); setShowEndpointModal(true); }}
              title="Click to configure API Endpoint"
              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-mono transition"
            >
              <span className="truncate max-w-[200px] sm:max-w-xs">{apiBaseUrl}</span>
              <Edit3 className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Backend Online Status Pill */}
        <button
          onClick={() => { if (!isBackendOnline) { setInputUrl(apiBaseUrl); setShowEndpointModal(true); } }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            isBackendOnline
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 shadow-sm shadow-emerald-900/30"
              : "bg-rose-950/80 text-rose-300 border-rose-800 shadow-sm shadow-rose-900/30 hover:bg-rose-900/80 cursor-pointer"
          }`}
          title={isBackendOnline ? "AI Backend is Connected" : "Click to configure Backend URL"}
        >
          {isBackendOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
          <span>{isBackendOnline ? "AI BACKEND ONLINE" : "BACKEND UNAVAILABLE (Configure)"}</span>
        </button>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">SentinelAI Mobile Security</h3>
                <p className="text-xs text-slate-400">Real-Time Threat Detection on Your Phone</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm overflow-y-auto pr-1 flex-1">
              {/* Feature Highlights */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="flex items-start gap-2 text-slate-300">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>WhatsApp & Messenger Notifications:</strong> Live risk inspection for scam & phishing links in messaging notifications.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>SMS Security Gateway:</strong> Automatic SMS attack detection with instant AI quarantine policy.</span>
                </div>
              </div>

              {/* Option 1: Instant Web App (PWA) - Recommended */}
              <div className="p-4 rounded-xl border border-cyan-800/80 bg-cyan-950/40">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-cyan-400" />
                    <span>Instant Mobile Web App (PWA)</span>
                  </h4>
                  <span className="text-[10px] bg-cyan-900/60 text-cyan-200 border border-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                    1-Tap Install
                  </span>
                </div>
                <p className="text-slate-300 text-xs mb-3">
                  Runs like a native full-screen app directly on your phone without needing any APK download!
                </p>
                <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p>👉 In <strong>Chrome on Mobile</strong>: Tap the <strong>three dots (⋮)</strong> at top-right ➔ tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                  <p>👉 In <strong>Safari (iPhone)</strong>: Tap <strong>Share (⎋)</strong> ➔ tap <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>

              {/* Option 2: Native Android App (.APK) */}
              <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/20">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-sm text-emerald-300">Native Android App (.APK)</h4>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    Compiled & Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Full protection with automatic SMS interception & real-time notification threat scanning.
                </p>
                <a
                  href="https://github.com/ghantaakashchowdary/Al-based-Network-Attack-Forecasting-from-Network-Traffic-Data/releases/download/v1.0.0/SentinelAI-Mobile.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Direct Download SentinelAI-Mobile.apk (810 KB)</span>
                </a>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend API Endpoint Configuration Modal */}
      {showEndpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowEndpointModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Backend AI Endpoint Settings</h3>
                <p className="text-xs text-slate-400">Configure your deployed Render or Local API URL</p>
              </div>
            </div>

            <form onSubmit={handleSaveEndpoint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Backend API URL (FastAPI)
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://sentinelai-backend.onrender.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Paste your Render service URL (e.g. <span className="text-cyan-400 font-mono select-all">https://your-service.onrender.com</span>) or local IP.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetEndpoint}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
                >
                  Reset to Default
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEndpointModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Connect</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
