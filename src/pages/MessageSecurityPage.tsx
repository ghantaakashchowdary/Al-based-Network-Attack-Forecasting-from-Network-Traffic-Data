import React, { useMemo, useState } from "react";
import { useApi } from "../context/ApiContext";
import { SecurityAnalyzeResponse } from "../types/api";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Link2, MessageSquareWarning, ShieldAlert, ShieldCheck, Sparkles, Zap } from "lucide-react";

const scenarios = [
  {
    name: "Safe message",
    text: "Hi team, the project review is moved to 3 PM today. See you there.",
    url: "",
    sender: "Team",
    networkRisk: 0.08,
  },
  {
    name: "Controlled phishing",
    text: "URGENT: Your account is suspended. Verify your password immediately to avoid closure.",
    url: "http://192.0.2.10/verify",
    sender: "Security-Test",
    networkRisk: 0.72,
  },
  {
    name: "Controlled scam",
    text: "You have won a cash award. Pay the processing fee today to release the funds.",
    url: "https://claim.example.test/reward",
    sender: "Prize-Test",
    networkRisk: 0.35,
  },
  {
    name: "Malicious behavior",
    text: "Disable antivirus protection and execute the attached script as administrator.",
    url: "https://files.example.test/setup",
    sender: "Lab-Test",
    networkRisk: 0.64,
  },
];

const actionTone: Record<string, string> = {
  ALLOW: "text-emerald-300 bg-emerald-950/50 border-emerald-800",
  WARN: "text-amber-300 bg-amber-950/50 border-amber-800",
  QUARANTINE: "text-orange-300 bg-orange-950/50 border-orange-800",
  BLOCK: "text-rose-300 bg-rose-950/50 border-rose-800",
};

export const MessageSecurityPage: React.FC = () => {
  const { runSecurityAnalysis, isBackendOnline } = useApi();
  const [text, setText] = useState(scenarios[0].text);
  const [url, setUrl] = useState("");
  const [sender, setSender] = useState("Demo-User");
  const [networkRisk, setNetworkRisk] = useState(0.1);
  const [result, setResult] = useState<SecurityAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const riskPercent = useMemo(() => Math.round((result?.decision.composite_risk ?? networkRisk) * 100), [result, networkRisk]);

  const loadScenario = (scenario: typeof scenarios[number]) => {
    setText(scenario.text);
    setUrl(scenario.url);
    setSender(scenario.sender);
    setNetworkRisk(scenario.networkRisk);
    setResult(null);
    setError("");
  };

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await runSecurityAnalysis({ text, url: url || undefined, sender, network_risk: networkRisk });
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Security analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-cyan-900/70 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-widest"><Sparkles className="w-4 h-4" /> SentinelAI Message Defense</div>
            <h2 className="text-2xl md:text-3xl font-black mt-2">Message Threat Detection & Prevention</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl">Controlled test console for the next-level layer: message AI + URL evidence + network context + deterministic policy + audit.</p>
          </div>
          <div className={`px-4 py-3 rounded-xl border text-xs font-bold ${isBackendOnline ? "border-emerald-800 bg-emerald-950/50 text-emerald-300" : "border-rose-800 bg-rose-950/50 text-rose-300"}`}>
            {isBackendOnline ? "● SECURITY ENGINE READY" : "● BACKEND OFFLINE"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold flex items-center gap-2"><MessageSquareWarning className="w-4 h-4 text-cyan-400" /> Test Console</h3>
            <span className="text-[10px] font-mono text-slate-500">SAFE / CONTROLLED INPUTS</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <button key={scenario.name} onClick={() => loadScenario(scenario)} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-cyan-700 hover:text-cyan-300 text-xs transition">{scenario.name}</button>
            ))}
          </div>

          <label className="block">
            <span className="text-xs text-slate-400 font-semibold">Incoming message</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-600 focus:outline-none p-4 text-sm text-slate-200 resize-none" placeholder="Paste a safe or controlled test message..." />
          </label>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs text-slate-400 font-semibold">Sender / metadata</span><input value={sender} onChange={(e) => setSender(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-600 focus:outline-none p-3 text-sm" /></label>
            <label className="block"><span className="text-xs text-slate-400 font-semibold">URL (optional)</span><div className="relative mt-2"><Link2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-600 focus:outline-none pl-9 pr-3 py-3 text-sm" placeholder="https://example.test/verify" /></div></label>
          </div>

          <label className="block">
            <div className="flex justify-between text-xs text-slate-400"><span>Network context risk</span><span className="font-mono text-cyan-300">{Math.round(networkRisk * 100)}%</span></div>
            <input type="range" min="0" max="1" step="0.01" value={networkRisk} onChange={(e) => setNetworkRisk(Number(e.target.value))} className="w-full mt-3 accent-cyan-500" />
          </label>

          {error && <div className="p-3 rounded-xl border border-rose-800 bg-rose-950/40 text-rose-300 text-xs">{error}</div>}

          <button onClick={analyze} disabled={loading || !isBackendOnline || !text.trim()} className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20">
            {loading ? <Zap className="w-4 h-4 animate-pulse" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? "Analyzing security signal..." : "Run SentinelAI Security Analysis"}
          </button>
        </section>

        <section className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold">Decision</h3><span className="text-xs font-mono text-slate-500">{result ? result.event_id.slice(0, 8) : "waiting"}</span></div>
            {result ? (
              <div className="space-y-5">
                <div className={`rounded-xl border p-5 ${actionTone[result.decision.action] || "border-slate-700 bg-slate-950"}`}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Policy action</div>
                  <div className="text-3xl font-black mt-1">{result.decision.action}</div>
                  <div className="text-xs mt-2 opacity-80">{result.decision.severity} severity · composite risk {Math.round(result.decision.composite_risk * 100)}%</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Metric label="Message" value={`${Math.round(result.decision.message_risk * 100)}%`} />
                  <Metric label="Network" value={`${Math.round((result.decision.network_risk ?? 0) * 100)}%`} />
                  <Metric label="Composite" value={`${riskPercent}%`} />
                </div>
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                  <div className="text-xs text-slate-400 mb-2">Threat classification</div>
                  <div className="flex items-center justify-between"><span className="text-lg font-bold">{result.message.category}</span><span className="text-xs font-mono text-cyan-300">confidence {Math.round(result.message.confidence * 100)}%</span></div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-2">Evidence observed</div>
                  <div className="space-y-2">{result.message.evidence.map((item, i) => <div key={i} className="flex gap-2 text-xs text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />{item}</div>)}</div>
                </div>
                <p className="text-xs text-slate-500 border-t border-slate-800 pt-4">{result.decision.reason}</p>
              </div>
            ) : (
              <div className="min-h-[360px] rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center px-8 text-slate-500"><ShieldAlert className="w-10 h-10 mb-3 text-slate-700" /><p className="text-sm font-semibold text-slate-400">No security decision yet</p><p className="text-xs mt-1">Select a controlled scenario or enter a test message and run analysis.</p></div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3"><ClipboardCheck className="w-4 h-4 text-emerald-400" /> Pipeline executed</div>
            <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-center">
              {['MESSAGE', 'URL', 'NETWORK', 'FUSION', 'POLICY'].map((x) => <div key={x} className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400">{x}</div>)}
            </div>
            <p className="text-[10px] text-slate-500 mt-3">AI produces evidence. The deterministic policy layer chooses the action.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-lg bg-slate-950 border border-slate-800 p-3"><div className="text-[10px] text-slate-500">{label}</div><div className="text-sm font-bold text-slate-200 mt-1">{value}</div></div>;
