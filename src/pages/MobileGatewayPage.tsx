import React, { useCallback, useEffect, useState } from "react";
import { Smartphone, Wifi, WifiOff, RefreshCw, ShieldCheck, Radio, Copy, CheckCircle2, Trash2 } from "lucide-react";
import { API_BASE_URL, getMobileDevices, registerMobileDevice, deleteMobileDevice } from "../services/apiClient";
import { MobileDevice } from "../types/api";

export const MobileGatewayPage: React.FC = () => {
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("SentinelAI Test Phone");

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setDevices(await getMobileDevices()); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  const copyApi = async () => {
    await navigator.clipboard?.writeText(API_BASE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const registerDemo = async () => {
    setLoading(true);
    try {
      const device = await registerMobileDevice({
        name,
        model: "Android / Demo",
        os_version: "Android 13+",
      });
      setDevices(prev => [device, ...prev.filter(d => d.device_id !== device.device_id)]);
    } finally { setLoading(false); }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      await deleteMobileDevice(deviceId);
    } catch {
      // Remove locally anyway
    }
    setDevices((prev) => prev.filter((d) => d.device_id !== deviceId));
  };

  const online = devices.filter(d => d.status === "ONLINE").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-cyan-900/70 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-widest"><Smartphone className="w-4 h-4" /> Mobile Security Gateway</div>
            <h2 className="text-2xl md:text-3xl font-black mt-2">Connected Android Devices</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl">A platform-supported Android gateway can forward incoming SMS events to the same SentinelAI analysis, fusion, policy and audit pipeline used by the web console.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-800 bg-emerald-950/50 text-emerald-300 text-xs font-bold">
            <Wifi className="w-4 h-4" /> {online} ONLINE
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Registered devices" value={String(devices.length)} />
        <Stat label="Connected now" value={String(online)} />
        <Stat label="Gateway" value="READY" />
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="font-bold flex items-center gap-2"><Radio className="w-4 h-4 text-cyan-400" /> Device registry</h3><p className="text-xs text-slate-500 mt-1">The Android client registers and sends heartbeat signals.</p></div>
          <button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs flex items-center gap-2"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>

        {devices.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center text-slate-500">
            <Smartphone className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">No Android device connected yet</p>
            <p className="text-xs mt-1">Install the included mobile/android project, set the backend URL, and register the device.</p>
          </div>
        ) : (
          <div className="space-y-3">{devices.map(d => (
            <div key={d.device_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${d.status === "ONLINE" ? "bg-emerald-950/50 border-emerald-900 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                  {d.status === "ONLINE" ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div><div className="font-bold text-sm">{d.name}</div><div className="text-xs text-slate-500">{d.model} · {d.os_version}</div><div className="text-[10px] font-mono text-slate-600 mt-1">ID {d.device_id}</div></div>
              </div>
              <div className="flex items-center gap-4 justify-between md:justify-end">
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${d.status === "ONLINE" ? "bg-emerald-950 text-emerald-300" : "bg-slate-800 text-slate-500"}`}>{d.status}</span>
                  <div className="text-[10px] text-slate-600 mt-2">last seen {new Date(d.last_seen).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => removeDevice(d.device_id)}
                  title="Delete Device"
                  className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 hover:text-rose-100 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}</div>
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-2">Quick local registration</h3>
          <p className="text-xs text-slate-500 mb-4">Useful for verifying the gateway before installing the Android client.</p>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm mb-3" />
          <button onClick={registerDemo} disabled={loading} className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 font-bold text-sm">Register demo device</button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-2">Android connection URL</h3>
          <p className="text-xs text-slate-500 mb-3">Use your computer's LAN IP when a physical phone connects to the same Wi-Fi network. Do not use localhost on the phone.</p>
          <div className="flex gap-2"><code className="flex-1 rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-cyan-300 overflow-x-auto">{API_BASE_URL}</code><button onClick={copyApi} className="px-3 rounded-xl bg-slate-800 border border-slate-700">{copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button></div>
          <div className="mt-4 text-[11px] text-slate-500 space-y-1"><p>• Android sends message events to <span className="text-slate-300">POST /mobile/events</span>.</p><p>• The server returns ALLOW / WARN / QUARANTINE / BLOCK.</p><p>• The decision is written to the existing SOC audit timeline.</p></div>
        </div>
      </section>

      <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-xs text-amber-200/80">
        <ShieldCheck className="inline w-4 h-4 mr-2" /> This module intentionally does not claim universal interception or blocking of WhatsApp, Telegram, email, or every Android message source. SMS reception uses Android's platform-supported permission path; the backend makes the security decision.
      </div>
    </div>
  );
};

const Stat: React.FC<{label: string; value: string}> = ({label,value}) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div><div className="text-2xl font-black text-slate-200 mt-1">{value}</div></div>
);
